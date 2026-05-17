import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { cadenceRule } from './rules/cadence.rule';
import { overdueRule } from './rules/overdue.rule';
import { promoRule } from './rules/promo.rule';
import { npiRule } from './rules/npi.rule';
import { outletTypeRule } from './rules/outlet-type.rule';
import { SuggestionRuleContext, SuggestionResult } from './rules/rule.types';

@Injectable()
export class SuggestionsService {
  constructor(private readonly prisma: PrismaService) {}

  async forCustomer(tenantId: string, customerId: string): Promise<SuggestionResult[]> {
    const customer = await this.prisma.customer.findFirst({
      where: { id: customerId, tenantId },
      include: {
        route: true,
      },
    });
    if (!customer) throw new NotFoundException('Customer not found');

    const [recentOrders, allSkus, activePromos] = await Promise.all([
      this.prisma.order.findMany({
        where: { tenantId, customerId, status: { in: ['SYNCED', 'DELIVERED', 'CONFIRMED', 'OUT_FOR_DELIVERY'] } },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { lines: true },
      }),
      this.prisma.sku.findMany({ where: { tenantId, active: true } }),
      this.prisma.promotion.findMany({
        where: {
          tenantId,
          active: true,
          startsAt: { lte: new Date() },
          endsAt: { gte: new Date() },
          applicableOutletTypes: { has: customer.outletType },
        },
      }),
    ]);

    const ctx: SuggestionRuleContext = {
      now: new Date(),
      customer,
      recentOrders,
      skus: allSkus,
      activePromos,
    };

    const all = [
      ...cadenceRule(ctx),
      ...overdueRule(ctx),
      ...promoRule(ctx),
      ...npiRule(ctx),
      ...outletTypeRule(ctx),
    ];

    // dedupe by skuId, take top by score
    const bySku = new Map<string, SuggestionResult>();
    for (const s of all) {
      const existing = bySku.get(s.skuId);
      if (!existing || s.score > existing.score) bySku.set(s.skuId, s);
    }
    return [...bySku.values()].sort((a, b) => b.score - a.score).slice(0, 6);
  }
}
