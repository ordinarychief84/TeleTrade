import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { CallDirection, CallOutcome, CallStatus, OrderStatus } from '@teletrade/shared';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async overview(tenantId: string, windowDays = 30) {
    const days = Math.max(1, Math.min(windowDays, 365));
    const now = new Date();
    const since = new Date(now.getTime() - days * 24 * 3600 * 1000);
    const prevSince = new Date(now.getTime() - 2 * days * 24 * 3600 * 1000);

    const totals = await this.totalsFor(tenantId, since, now);
    const previous = await this.totalsFor(tenantId, prevSince, since);

    // Daily series — calls + orders + revenue per day for sparkline / line chart
    const dailySeries = await this.daily(tenantId, since, now, days);

    // Call outcomes for donut
    const outcomeRows = await this.prisma.call.groupBy({
      by: ['outcome'],
      where: { tenantId, createdAt: { gte: since }, outcome: { not: null } },
      _count: { _all: true },
    });
    const outcomes = outcomeRows.map((r) => ({
      outcome: r.outcome as string,
      count: r._count._all,
    }));

    // Tiny derived bits
    const dormantCustomers = await this.prisma.customer.count({ where: { tenantId, status: 'DORMANT' } });
    const duplicatesPending = await this.prisma.order.count({
      where: { tenantId, duplicateFlag: true, duplicateReviewStatus: 'PENDING' },
    });

    return {
      windowDays: days,
      totals: { ...totals, dormantCustomers, duplicatesPending },
      previous,
      dailySeries,
      outcomes,
    };
  }

  private async totalsFor(tenantId: string, since: Date, until: Date) {
    const [
      totalCalls,
      inboundCalls,
      outboundCalls,
      answeredCalls,
      missedCalls,
      ordersCreated,
      revenueAgg,
      orderCreatedCalls,
    ] = await Promise.all([
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until } } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until }, direction: CallDirection.INBOUND } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until }, direction: CallDirection.OUTBOUND } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until }, status: CallStatus.COMPLETED } }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until }, status: CallStatus.MISSED } }),
      this.prisma.order.count({ where: { tenantId, createdAt: { gte: since, lt: until } } }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          createdAt: { gte: since, lt: until },
          status: { in: [OrderStatus.SYNCED, OrderStatus.DELIVERED, OrderStatus.OUT_FOR_DELIVERY, OrderStatus.PENDING_SYNC] },
        },
        _sum: { total: true },
        _avg: { total: true },
      }),
      this.prisma.call.count({ where: { tenantId, createdAt: { gte: since, lt: until }, outcome: CallOutcome.ORDER_CREATED } }),
    ]);

    const conversionRate = totalCalls === 0 ? 0 : Math.round((orderCreatedCalls / totalCalls) * 1000) / 10;
    return {
      calls: totalCalls,
      inboundCalls,
      outboundCalls,
      answeredCalls,
      missedCalls,
      ordersCreated,
      revenue: Number(revenueAgg._sum.total ?? 0),
      aov: Number(revenueAgg._avg.total ?? 0),
      conversionRate,
    };
  }

  private async daily(tenantId: string, since: Date, until: Date, days: number) {
    // Avoid raw SQL date_trunc — Prisma's TIMESTAMP-without-tz binding can
    // skew across runtime/session timezones. Fetch the timestamps and
    // aggregate in JS using local-time day keys, which matches the axis
    // the chart renders.
    const [calls, orders] = await Promise.all([
      this.prisma.call.findMany({
        where: { tenantId, createdAt: { gte: since, lt: until } },
        select: { createdAt: true },
      }),
      this.prisma.order.findMany({
        where: { tenantId, createdAt: { gte: since, lt: until } },
        select: { createdAt: true, total: true, status: true },
      }),
    ]);

    const dayKey = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    const callsMap = new Map<string, number>();
    for (const c of calls) {
      const k = dayKey(c.createdAt);
      callsMap.set(k, (callsMap.get(k) ?? 0) + 1);
    }
    const ordersMap = new Map<string, number>();
    const revenueMap = new Map<string, number>();
    const revenueStatuses = new Set([
      OrderStatus.SYNCED,
      OrderStatus.DELIVERED,
      OrderStatus.OUT_FOR_DELIVERY,
      OrderStatus.PENDING_SYNC,
    ]);
    for (const o of orders) {
      const k = dayKey(o.createdAt);
      ordersMap.set(k, (ordersMap.get(k) ?? 0) + 1);
      if (revenueStatuses.has(o.status as any)) {
        revenueMap.set(k, (revenueMap.get(k) ?? 0) + Number(o.total));
      }
    }

    const series: { date: string; calls: number; orders: number; revenue: number }[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date(until.getTime() - i * 24 * 3600 * 1000);
      const key = dayKey(d);
      series.push({
        date: key,
        calls: callsMap.get(key) ?? 0,
        orders: ordersMap.get(key) ?? 0,
        revenue: revenueMap.get(key) ?? 0,
      });
    }
    return series;
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
