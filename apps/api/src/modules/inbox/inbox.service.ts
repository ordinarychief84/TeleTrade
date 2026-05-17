import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Role } from '@teletrade/shared';

export type InboxKind =
  | 'callback'
  | 'duplicate'
  | 'dms_dead_letter'
  | 'unreachable'
  | 'route_change';

export interface InboxItem {
  id: string;
  kind: InboxKind;
  title: string;
  body: string;
  href: string;
  createdAt: Date;
  severity: 'info' | 'warning' | 'critical';
  badge?: string;
}

@Injectable()
export class InboxService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Aggregate "things you should pay attention to" across modules.
   * Keep this server-side so a single GET feeds the bell badge + the inbox.
   * Filtered by role so agents don't see manager-only items.
   */
  async list(tenantId: string, role: string, userId: string): Promise<InboxItem[]> {
    const items: InboxItem[] = [];

    // Callbacks — scheduled for me or unowned
    const callbacks = await this.prisma.call.findMany({
      where: {
        tenantId,
        status: 'CALLBACK_SCHEDULED',
        scheduledCallbackAt: { not: null },
        OR: [{ agentId: userId }, { agentId: null }],
      },
      orderBy: { scheduledCallbackAt: 'asc' },
      take: 20,
      include: { customer: { select: { outletName: true, phone: true } } },
    });
    for (const c of callbacks) {
      items.push({
        id: `cb-${c.id}`,
        kind: 'callback',
        title: `Callback: ${c.customer?.outletName ?? c.fromNumber ?? 'unknown outlet'}`,
        body: `Scheduled for ${formatTime(c.scheduledCallbackAt!)} · ${c.customer?.phone ?? ''}`,
        href: `/call?callId=${c.id}`,
        createdAt: c.scheduledCallbackAt!,
        severity: c.scheduledCallbackAt && c.scheduledCallbackAt < new Date() ? 'warning' : 'info',
      });
    }

    if (role === Role.SALES_MANAGER || role === Role.ADMIN) {
      const duplicates = await this.prisma.order.findMany({
        where: { tenantId, duplicateFlag: true, duplicateReviewStatus: 'PENDING' },
        orderBy: { createdAt: 'desc' },
        take: 20,
        include: { customer: { select: { outletName: true } } },
      });
      for (const o of duplicates) {
        items.push({
          id: `dup-${o.id}`,
          kind: 'duplicate',
          title: `Duplicate order: ${o.customer?.outletName ?? 'unknown'}`,
          body: `Order ${o.orderReference} — review before it ships.`,
          href: `/duplicates`,
          createdAt: o.createdAt,
          severity: 'warning',
          badge: 'review',
        });
      }

      const deadLetters = await this.prisma.dmsSyncJob.findMany({
        where: { tenantId, status: 'DEAD_LETTER' },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { order: { select: { orderReference: true } } },
      });
      for (const j of deadLetters) {
        items.push({
          id: `dms-${j.id}`,
          kind: 'dms_dead_letter',
          title: `DMS sync stalled: ${j.order?.orderReference ?? j.orderId}`,
          body: j.lastError?.slice(0, 140) ?? 'Sync exhausted retries.',
          href: '/dms',
          createdAt: j.createdAt,
          severity: 'critical',
          badge: 'retry',
        });
      }
    }

    // Unreachable customers I touched recently — opportunity to flag
    if (role === Role.AGENT) {
      const unreachable = await this.prisma.call.findMany({
        where: {
          tenantId,
          agentId: userId,
          status: { in: ['MISSED', 'DROPPED'] },
          createdAt: { gte: new Date(Date.now() - 24 * 3600 * 1000) },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: { customer: { select: { outletName: true } } },
      });
      for (const c of unreachable) {
        items.push({
          id: `un-${c.id}`,
          kind: 'unreachable',
          title: `No-answer: ${c.customer?.outletName ?? c.toNumber ?? 'unknown'}`,
          body: `Try again later or mark as unreachable.`,
          href: c.customer ? `/customers/${c.customerId}` : '/call',
          createdAt: c.createdAt,
          severity: 'info',
        });
      }
    }

    if (role === Role.DELIVERY_OPS) {
      const newToday = await this.prisma.deliveryAssignment.findMany({
        where: {
          tenantId,
          driverId: userId,
          scheduledFor: { gte: startOfDay(new Date()), lte: endOfDay(new Date()) },
          createdAt: { gte: new Date(Date.now() - 4 * 3600 * 1000) },
        },
        take: 5,
        include: { customer: { select: { outletName: true } } },
      });
      for (const d of newToday) {
        items.push({
          id: `rt-${d.id}`,
          kind: 'route_change',
          title: `Stop added to today's route`,
          body: `${d.customer?.outletName} — sequence ${d.sequence}`,
          href: '/route',
          createdAt: d.createdAt,
          severity: 'info',
        });
      }
    }

    return items.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 50);
  }
}

function formatTime(d: Date) {
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}
