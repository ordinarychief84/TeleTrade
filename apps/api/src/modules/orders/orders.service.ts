import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { DuplicateDetectorService } from './duplicate-detector.service';
import { DmsService } from '../dms/dms.service';
import { OrderDraftInput, OrderStatus, DuplicateReviewStatus } from '@teletrade/shared';
import { Prisma } from '@prisma/client';

@Injectable()
export class OrdersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly duplicateDetector: DuplicateDetectorService,
    private readonly dms: DmsService
  ) {}

  list(tenantId: string, filters: { status?: OrderStatus; customerId?: string; agentId?: string; duplicatesOnly?: boolean }) {
    return this.prisma.order.findMany({
      where: {
        tenantId,
        ...(filters.status && { status: filters.status }),
        ...(filters.customerId && { customerId: filters.customerId }),
        ...(filters.agentId && { agentId: filters.agentId }),
        ...(filters.duplicatesOnly && { duplicateFlag: true }),
      },
      orderBy: { createdAt: 'desc' },
      include: {
        customer: { select: { id: true, outletName: true, contactName: true } },
        lines: true,
      },
      take: 200,
    });
  }

  async byId(tenantId: string, id: string) {
    const o = await this.prisma.order.findFirst({
      where: { id, tenantId },
      include: { lines: true, customer: true, duplicateOf: { include: { lines: true } } },
    });
    if (!o) throw new NotFoundException('Order not found');
    return o;
  }

  async upsertDraft(tenantId: string, agentId: string, input: OrderDraftInput) {
    const customer = await this.prisma.customer.findFirst({ where: { id: input.customerId, tenantId } });
    if (!customer) throw new BadRequestException('Customer not found');

    const subtotal = input.lines.reduce((sum, l) => sum + l.qty * l.unitPrice, 0);
    const total = Math.max(0, subtotal - input.discount);

    if (input.id) {
      const existing = await this.prisma.order.findFirst({ where: { id: input.id, tenantId } });
      if (!existing) throw new NotFoundException('Order not found');
      if (existing.status !== OrderStatus.DRAFT) {
        throw new BadRequestException('Only DRAFT orders can be edited');
      }
      return this.prisma.$transaction(async (tx) => {
        await tx.orderLine.deleteMany({ where: { orderId: existing.id } });
        return tx.order.update({
          where: { id: existing.id },
          data: {
            customerId: input.customerId,
            callId: input.callId ?? null,
            campaignId: input.campaignId ?? null,
            deliveryPreference: input.deliveryPreference ?? null,
            routeId: input.routeId ?? null,
            notes: input.notes ?? null,
            discount: input.discount,
            subtotal,
            total,
            lines: {
              create: input.lines.map((l) => ({
                skuId: l.skuId,
                skuCode: l.skuCode,
                name: l.name,
                qty: l.qty,
                unitPrice: l.unitPrice,
                lineTotal: l.qty * l.unitPrice,
              })),
            },
          },
          include: { lines: true },
        });
      });
    }

    const reference = await this.generateReference(tenantId);
    return this.prisma.order.create({
      data: {
        tenantId,
        orderReference: reference,
        customerId: input.customerId,
        agentId,
        callId: input.callId ?? null,
        campaignId: input.campaignId ?? null,
        deliveryPreference: input.deliveryPreference ?? null,
        routeId: input.routeId ?? customer.routeId ?? null,
        notes: input.notes ?? null,
        status: OrderStatus.DRAFT,
        subtotal,
        discount: input.discount,
        total,
        lines: {
          create: input.lines.map((l) => ({
            skuId: l.skuId,
            skuCode: l.skuCode,
            name: l.name,
            qty: l.qty,
            unitPrice: l.unitPrice,
            lineTotal: l.qty * l.unitPrice,
          })),
        },
      },
      include: { lines: true },
    });
  }

  async confirm(tenantId: string, id: string) {
    const order = await this.byId(tenantId, id);
    if (order.status !== OrderStatus.DRAFT) {
      throw new BadRequestException(`Cannot confirm order in status ${order.status}`);
    }
    if (!order.lines.length) throw new BadRequestException('Order has no lines');

    // 1. Duplicate detection — same outlet + same SKU within 30 min
    const dup = await this.duplicateDetector.detect({
      tenantId,
      customerId: order.customerId,
      skuCodes: order.lines.map((l) => l.skuCode),
      excludeOrderId: order.id,
    });

    const status: OrderStatus = dup ? OrderStatus.FLAGGED_DUPLICATE : OrderStatus.PENDING_SYNC;

    const updated = await this.prisma.order.update({
      where: { id: order.id },
      data: {
        status,
        confirmedAt: new Date(),
        duplicateFlag: !!dup,
        duplicateOfId: dup?.id ?? null,
        duplicateReviewStatus: dup ? DuplicateReviewStatus.PENDING : null,
      },
      include: { lines: true, customer: true },
    });

    // Update customer.lastOrderDate optimistically (even if duplicate — the
    // customer still placed an order; the manager will reconcile).
    await this.prisma.customer.update({
      where: { id: order.customerId },
      data: { lastOrderDate: new Date() },
    });

    // 2. Schedule DMS sync regardless — manager can cancel later if dup
    await this.dms.scheduleSync(tenantId, updated.id);

    return updated;
  }

  duplicates(tenantId: string) {
    return this.prisma.order.findMany({
      where: { tenantId, duplicateFlag: true, duplicateReviewStatus: DuplicateReviewStatus.PENDING },
      include: { customer: true, lines: true, duplicateOf: { include: { lines: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async reviewDuplicate(tenantId: string, id: string, decision: DuplicateReviewStatus) {
    const order = await this.byId(tenantId, id);
    if (!order.duplicateFlag) throw new BadRequestException('Order is not flagged as duplicate');

    const updates: Prisma.OrderUpdateInput = { duplicateReviewStatus: decision };
    switch (decision) {
      case DuplicateReviewStatus.CANCELLED_DUPLICATE:
        updates.status = OrderStatus.CANCELLED;
        break;
      case DuplicateReviewStatus.MARKED_VALID:
      case DuplicateReviewStatus.KEPT_BOTH:
        updates.duplicateFlag = false;
        if (order.status === OrderStatus.FLAGGED_DUPLICATE) updates.status = OrderStatus.PENDING_SYNC;
        break;
      case DuplicateReviewStatus.MERGED:
        updates.status = OrderStatus.CANCELLED;
        // (real merging logic would combine quantities into the original)
        break;
    }
    return this.prisma.order.update({ where: { id: order.id }, data: updates });
  }

  private async generateReference(tenantId: string): Promise<string> {
    const date = new Date();
    const ymd = date.toISOString().slice(0, 10).replace(/-/g, '');
    const tail = Math.random().toString(36).slice(2, 7).toUpperCase();
    return `ORD-${ymd}-${tail}`;
  }
}
