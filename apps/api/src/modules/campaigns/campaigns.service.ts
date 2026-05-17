import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../../prisma/prisma.service';
import { CampaignCreateInput, CampaignStatus, CampaignFilters } from '@teletrade/shared';
import { TargetingService } from './targeting.service';
import { OUTBOUND_DIALER_QUEUE } from './dialer.tokens';

@Injectable()
export class CampaignsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly targeting: TargetingService,
    @InjectQueue(OUTBOUND_DIALER_QUEUE) private readonly dialerQueue: Queue
  ) {}

  list(tenantId: string) {
    return this.prisma.campaign.findMany({
      where: { tenantId },
      orderBy: { createdAt: 'desc' },
      include: { _count: { select: { targets: true } } },
    });
  }

  async byId(tenantId: string, id: string) {
    const c = await this.prisma.campaign.findFirst({
      where: { id, tenantId },
      include: {
        _count: { select: { targets: true, calls: true } },
      },
    });
    if (!c) throw new NotFoundException('Campaign not found');
    return c;
  }

  create(tenantId: string, createdById: string, input: CampaignCreateInput) {
    return this.prisma.campaign.create({
      data: {
        tenantId,
        createdById,
        name: input.name,
        type: input.type,
        pitch: input.pitch ?? undefined,
        promoCode: input.promoCode ?? undefined,
        filters: input.filters as any,
        status: CampaignStatus.DRAFT,
      },
    });
  }

  previewTargets(tenantId: string, filters: CampaignFilters) {
    return this.targeting.preview(tenantId, filters);
  }

  async approve(tenantId: string, id: string, approvedById: string) {
    const campaign = await this.byId(tenantId, id);
    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.PENDING_APPROVAL) {
      throw new BadRequestException('Only DRAFT or PENDING_APPROVAL campaigns can be approved');
    }
    const customerIds = await this.targeting.generateTargetList(tenantId, campaign.filters as CampaignFilters);
    if (!customerIds.length) throw new BadRequestException('No customers match the filters');

    await this.prisma.$transaction([
      this.prisma.campaign.update({
        where: { id },
        data: {
          status: CampaignStatus.ACTIVE,
          approvedById,
          approvedAt: new Date(),
          startedAt: new Date(),
        },
      }),
      this.prisma.campaignTarget.createMany({
        data: customerIds.map((customerId) => ({
          tenantId,
          campaignId: id,
          customerId,
        })),
        skipDuplicates: true,
      }),
    ]);

    // queue dialing jobs
    for (const cid of customerIds) {
      await this.dialerQueue.add(
        'dial',
        { tenantId, campaignId: id, customerId: cid },
        { attempts: 3, backoff: { type: 'exponential', delay: 60_000 } }
      );
    }
    return { ok: true, targets: customerIds.length };
  }

  async pause(tenantId: string, id: string) {
    await this.byId(tenantId, id);
    return this.prisma.campaign.update({ where: { id }, data: { status: CampaignStatus.PAUSED } });
  }

  async resume(tenantId: string, id: string) {
    await this.byId(tenantId, id);
    return this.prisma.campaign.update({ where: { id }, data: { status: CampaignStatus.ACTIVE } });
  }

  async complete(tenantId: string, id: string) {
    await this.byId(tenantId, id);
    return this.prisma.campaign.update({
      where: { id },
      data: { status: CampaignStatus.COMPLETED, completedAt: new Date() },
    });
  }

  async myQueue(tenantId: string, agentId: string) {
    // active campaigns' targets that haven't been called yet, prioritised by oldest createdAt
    return this.prisma.campaignTarget.findMany({
      where: {
        tenantId,
        status: { in: ['PENDING', 'IN_PROGRESS'] },
        campaign: { status: CampaignStatus.ACTIVE },
      },
      include: {
        campaign: { select: { id: true, name: true, type: true, pitch: true, promoCode: true } },
        customer: true,
      },
      orderBy: { createdAt: 'asc' },
      take: 25,
    });
  }
}
