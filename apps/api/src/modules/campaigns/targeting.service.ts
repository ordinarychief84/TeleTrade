import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';
import { CampaignFilters, CustomerStatus } from '@teletrade/shared';

/**
 * Builds a target list of customers for a campaign based on the filter spec.
 * Pure-ish service — no side effects, returns customer ids.
 */
@Injectable()
export class TargetingService {
  constructor(private readonly prisma: PrismaService) {}

  async preview(tenantId: string, filters: CampaignFilters) {
    const where = this.buildWhere(tenantId, filters);
    const [count, sample] = await Promise.all([
      this.prisma.customer.count({ where }),
      this.prisma.customer.findMany({
        where,
        take: 25,
        orderBy: { lastOrderDate: 'asc' },
        select: {
          id: true,
          outletName: true,
          contactName: true,
          phone: true,
          accountTier: true,
          status: true,
          lastOrderDate: true,
          outletType: true,
        },
      }),
    ]);
    return { count, sample };
  }

  async generateTargetList(tenantId: string, filters: CampaignFilters) {
    const where = this.buildWhere(tenantId, filters);
    const take = filters.limit ?? 5000;
    const customers = await this.prisma.customer.findMany({
      where,
      select: { id: true },
      take,
    });
    return customers.map((c) => c.id);
  }

  private buildWhere(tenantId: string, filters: CampaignFilters): Prisma.CustomerWhereInput {
    const where: Prisma.CustomerWhereInput = { tenantId };
    if (filters.routeIds?.length) where.routeId = { in: filters.routeIds };
    if (filters.territoryIds?.length) where.territoryId = { in: filters.territoryIds };
    if (filters.accountTiers?.length) where.accountTier = { in: filters.accountTiers };
    if (filters.outletTypes?.length) where.outletType = { in: filters.outletTypes };
    if (filters.skuGap?.length) where.preferredSkus = { hasSome: filters.skuGap };
    if (filters.lastOrderBefore) where.lastOrderDate = { lt: new Date(filters.lastOrderBefore) };
    if (filters.dormantDaysGte != null) {
      const cutoff = new Date(Date.now() - filters.dormantDaysGte * 24 * 3600 * 1000);
      where.OR = [{ lastOrderDate: { lt: cutoff } }, { status: CustomerStatus.DORMANT }];
    }
    return where;
  }
}
