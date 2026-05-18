import { Injectable, Logger, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { DmsRegistry } from './dms.registry';
import { DmsAdapterKind, DmsSyncStatus, OrderStatus } from '@teletrade/shared';
import { DMS_SYNC_QUEUE } from './dms.tokens';
import { DmsOrderPayload, TenantDmsConfig } from './adapter.interface';
import { decryptSecret, verifyHmac, webhookSecretFor } from './integrations-crypto';

@Injectable()
export class DmsService {
  private readonly log = new Logger('Dms');

  constructor(
    private readonly prisma: PrismaService,
    private readonly registry: DmsRegistry,
    @InjectQueue(DMS_SYNC_QUEUE) private readonly queue: Queue
  ) {}

  async scheduleSync(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { lines: true, customer: { include: { route: true, territory: true } }, tenant: true },
    });
    if (!order) throw new NotFoundException('Order not found');

    // Tenant-configured adapter wins; platform default is the fallback.
    const adapter = (order.tenant.dmsAdapter as DmsAdapterKind | null) ?? this.registry.defaultKind();

    const payload: DmsOrderPayload = {
      orderReference: order.orderReference,
      tenantSlug: order.tenant.slug,
      customer: {
        id: order.customer.id,
        outletName: order.customer.outletName,
        contactName: order.customer.contactName,
        phone: order.customer.phone,
        address: order.customer.address,
        routeCode: order.customer.route?.code ?? null,
        territoryCode: order.customer.territory?.code ?? null,
      },
      lines: order.lines.map((l) => ({
        skuCode: l.skuCode,
        name: l.name,
        qty: l.qty,
        unitPrice: Number(l.unitPrice),
        lineTotal: Number(l.lineTotal),
      })),
      subtotal: Number(order.subtotal),
      discount: Number(order.discount),
      total: Number(order.total),
      notes: order.notes,
    };

    const job = await this.prisma.dmsSyncJob.create({
      data: {
        tenantId,
        orderId,
        adapter,
        status: DmsSyncStatus.PENDING,
        payload: payload as any,
      },
    });

    await this.queue.add(
      'sync',
      { jobId: job.id },
      { attempts: 5, backoff: { type: 'exponential', delay: 10_000 }, removeOnComplete: 1000 }
    );
    return job;
  }

  async retry(tenantId: string, jobId: string) {
    const job = await this.prisma.dmsSyncJob.findFirst({ where: { id: jobId, tenantId } });
    if (!job) throw new NotFoundException('Sync job not found');
    await this.prisma.dmsSyncJob.update({
      where: { id: jobId },
      data: { status: DmsSyncStatus.PENDING, lastError: null, nextRetryAt: null },
    });
    await this.queue.add('sync', { jobId }, { attempts: 3, backoff: { type: 'exponential', delay: 5_000 } });
    return { ok: true };
  }

  list(tenantId: string, status?: DmsSyncStatus) {
    return this.prisma.dmsSyncJob.findMany({
      where: { tenantId, ...(status && { status }) },
      orderBy: { createdAt: 'desc' },
      include: { order: { select: { orderReference: true, status: true } } },
      take: 200,
    });
  }

  async runSync(jobId: string) {
    const job = await this.prisma.dmsSyncJob.findUnique({ where: { id: jobId } });
    if (!job) return;
    const adapter = this.registry.get(job.adapter as DmsAdapterKind);
    const config = await this.resolveTenantConfig(job.tenantId);

    const updated = await this.prisma.dmsSyncJob.update({
      where: { id: jobId },
      data: { status: DmsSyncStatus.IN_FLIGHT, startedAt: new Date(), attempts: { increment: 1 } },
    });

    try {
      const result = await adapter.pushOrder(job.payload as unknown as DmsOrderPayload, config);
      await this.prisma.$transaction([
        this.prisma.dmsSyncJob.update({
          where: { id: jobId },
          data: { status: DmsSyncStatus.SUCCEEDED, externalRef: result.externalRef, finishedAt: new Date() },
        }),
        this.prisma.order.update({
          where: { id: job.orderId },
          data: { status: OrderStatus.SYNCED, syncedAt: new Date() },
        }),
      ]);
    } catch (e) {
      const msg = (e as Error).message;
      this.log.error(`Sync failed for job ${jobId}: ${msg}`);
      // updated.attempts is the post-increment value; final attempt = 5.
      const finalAttempt = updated.attempts >= 5;
      await this.prisma.dmsSyncJob.update({
        where: { id: jobId },
        data: {
          status: finalAttempt ? DmsSyncStatus.DEAD_LETTER : DmsSyncStatus.FAILED,
          lastError: msg,
          finishedAt: finalAttempt ? new Date() : undefined,
        },
      });
      throw e; // let BullMQ retry
    }
  }

  /**
   * Webhook entrypoint. Verifies the HMAC signature before invoking the
   * adapter. Body must be passed as raw text (the Express raw-body buffer)
   * so the signature matches what the sender computed.
   */
  async receiveWebhook(
    tenantId: string,
    adapterKind: DmsAdapterKind,
    headers: Record<string, string>,
    rawBody: string,
    parsedBody: any
  ) {
    if (!tenantId || tenantId === 'unknown') {
      throw new UnauthorizedException('Missing tenantId');
    }
    const secret = webhookSecretFor(tenantId);
    const sig = headers['x-teletrade-signature'] ?? headers['x-signature'];
    if (!verifyHmac(rawBody, secret, sig)) {
      this.log.warn(`Webhook signature rejected for tenant=${tenantId} adapter=${adapterKind}`);
      throw new UnauthorizedException('Invalid or missing signature');
    }
    const tenant = await this.prisma.tenant.findUnique({ where: { id: tenantId }, select: { id: true } });
    if (!tenant) throw new UnauthorizedException('Unknown tenant');

    const adapter = this.registry.get(adapterKind);
    await this.prisma.webhookEvent.create({
      data: { tenantId, source: adapterKind, payload: parsedBody, signature: sig },
    });
    return adapter.handleWebhook(headers, parsedBody);
  }

  /** Pull the tenant's DMS config and decrypt the API key. */
  private async resolveTenantConfig(tenantId: string): Promise<TenantDmsConfig> {
    const t = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
      select: { dmsConfig: true },
    });
    const raw = (t?.dmsConfig as any) ?? {};
    let apiKey: string | null = null;
    if (typeof raw.apiKeyEnc === 'string' && raw.apiKeyEnc.length > 0) {
      try {
        apiKey = decryptSecret(raw.apiKeyEnc);
      } catch (e) {
        this.log.error(`Failed to decrypt DMS apiKey for tenant=${tenantId}: ${(e as Error).message}`);
      }
    }
    return {
      url: raw.url ?? null,
      apiKey,
      database: raw.database ?? null,
      username: raw.username ?? null,
    };
  }
}
