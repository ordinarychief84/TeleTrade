import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallDirection, CallOutcome, CallStatus, OrderStatus } from '@teletrade/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string) {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const [
      totalCalls,
      inboundCalls,
      outboundCalls,
      answeredCalls,
      missedCalls,
      ordersCreated,
      revenueAgg,
      dormantCustomers,
      duplicates,
    ] = await Promise.all([
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since } } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since }, direction: CallDirection.INBOUND } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since }, direction: CallDirection.OUTBOUND } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since }, status: CallStatus.COMPLETED } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since }, status: CallStatus.MISSED } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: since } } }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: since },
          status: { in: [OrderStatus.SYNCED, OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PENDING_SYNC] },
        },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.customer.count({ where: { tenantId, status: 'DORMANT' } }),
      this.prisma.order.count({ where: { tenantId, duplicateFlag: true, duplicateReviewStatus: 'PENDING' } }),
    ]);

    const orderCreatedCalls = await this.prisma.call.count({
      where: { tenantId, createdAt: { gte: since }, outcome: CallOutcome.ORDER_CREATED },
    });

    const conversionRate = totalCalls === 0 ? 0 : Math.round((orderCreatedCalls / totalCalls) * 1000) / 10;

    return {
      windowDays: 30,
      totals: {
        calls: totalCalls,
        inboundCalls,
        outboundCalls,
        answeredCalls,
        missedCalls,
        ordersCreated,
        revenue: Number(revenueAgg._sum.total ?? 0),
        aov: Number(revenueAgg._avg.total ?? 0),
        dormantCustomers,
        duplicatesPending: duplicates,
        conversionRate,
      },
    };
  }

  async byAgent(tenantId: string) {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const agents = await this.prisma.user.findMany({
      where: { tenantId, role: 'AGENT' },
      select: { id: true, fullName: true, email: true },
    });
    const rows = await Promise.all(
      agents.map(async (a) => {
        const [calls, orders, revenueAgg] = await Promise.all([
          this.prisma.call.count({ where: { tenantId, agentId: a.id, createdAt: { gte: since } } }),
          this.prisma.order.count({ where: { tenantId, agentId: a.id, createdAt: { gte: since } } }),
          this.prisma.order.aggregate({
            where: { tenantId, agentId: a.id, createdAt: { gte: since } },
            _sum: { total: true },
          }),
        ]);
        return { ...a, calls, orders, revenue: Number(revenueAgg._sum.total ?? 0) };
      })
    );
    return rows;
  }

  async byCampaign(tenantId: string) {
    const campaigns = await this.prisma.campaign.findMany({ where: { tenantId } });
    const rows = await Promise.all(
      campaigns.map(async (c) => {
        const [targets, completedTargets, declinedTargets, unreachableTargets, orders, revenueAgg] = await Promise.all([
          this.prisma.campaignTarget.count({ where: { tenantId, campaignId: c.id } }),
          this.prisma.campaignTarget.count({ where: { tenantId, campaignId: c.id, status: 'COMPLETED' } }),
          this.prisma.campaignTarget.count({ where: { tenantId, campaignId: c.id, status: 'DECLINED' } }),
          this.prisma.campaignTarget.count({ where: { tenantId, campaignId: c.id, status: 'UNREACHABLE' } }),
          this.prisma.order.count({ where: { tenantId, campaignId: c.id } }),
          this.prisma.order.aggregate({ where: { tenantId, campaignId: c.id }, _sum: { total: true } }),
        ]);
        return {
          id: c.id,
          name: c.name,
          type: c.type,
          status: c.status,
          targets,
          completedTargets,
          declinedTargets,
          unreachableTargets,
          orders,
          revenue: Number(revenueAgg._sum.total ?? 0),
          conversion: targets === 0 ? 0 : Math.round((orders / targets) * 1000) / 10,
        };
      })
    );
    return rows;
  }

  async byRoute(tenantId: string) {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const routes = await this.prisma.route.findMany({
      where: { tenantId },
      include: { territory: { select: { name: true } } },
    });
    const rows = await Promise.all(
      routes.map(async (r) => {
        const orders = await this.prisma.order.findMany({
          where: { tenantId, routeId: r.id, createdAt: { gte: since } },
          select: { total: true },
        });
        const customers = await this.prisma.customer.count({ where: { tenantId, routeId: r.id } });
        return {
          id: r.id,
          code: r.code,
          name: r.name,
          territory: r.territory?.name,
          customers,
          orders: orders.length,
          revenue: orders.reduce((s, o) => s + Number(o.total), 0),
        };
      })
    );
    return rows;
  }

  async declineReasons(tenantId: string) {
    const rows = await this.prisma.campaignTarget.groupBy({
      by: ['declineReason'],
      where: { tenantId, status: 'DECLINED', declineReason: { not: null } },
      _count: { declineReason: true },
    });
    return rows.map((r) => ({ reason: r.declineReason ?? 'unspecified', count: r._count.declineReason }));
  }

  async skuUptake(tenantId: string) {
    const since = new Date(Date.now() - 30 * 24 * 3600 * 1000);
    const rows = await this.prisma.orderLine.groupBy({
      by: ['skuCode', 'name'],
      where: { order: { tenantId, createdAt: { gte: since } } },
      _sum: { qty: true, lineTotal: true },
      orderBy: { _sum: { lineTotal: 'desc' } },
      take: 15,
    });
    return rows.map((r) => ({
      skuCode: r.skuCode,
      name: r.name,
      qty: r._sum.qty ?? 0,
      revenue: Number(r._sum.lineTotal ?? 0),
    }));
  }
}
