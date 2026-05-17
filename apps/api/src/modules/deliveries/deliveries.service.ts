import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';
import {
  DeliveryStatus,
  DeliveryFailureReason,
  DeliveryStatusPatch,
  CashCollectionInput,
  OrderStatus,
} from '@teletrade/shared';

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  /** Pick a driver for today's deliveries. Round-robin by tenant + DOW. */
  async pickDriverForRoute(tenantId: string, routeId: string): Promise<string | null> {
    const drivers = await this.prisma.user.findMany({
      where: { tenantId, role: 'DELIVERY_OPS', active: true },
      orderBy: { createdAt: 'asc' },
      select: { id: true },
    });
    if (!drivers.length) return null;
    // Deterministic based on routeId hash so the same route prefers the same driver.
    const hash = Array.from(routeId).reduce((acc, c) => (acc * 31 + c.charCodeAt(0)) >>> 0, 0);
    return drivers[hash % drivers.length]!.id;
  }

  /**
   * Create or attach a DeliveryAssignment for an order. Called from
   * OrdersService.confirm so every confirmed order automatically lands
   * on a driver's route for the customer's next route day.
   */
  async assignForOrder(tenantId: string, orderId: string) {
    const order = await this.prisma.order.findFirst({
      where: { id: orderId, tenantId },
      include: { customer: { include: { route: true } } },
    });
    if (!order) throw new NotFoundException('Order not found');
    const routeId = order.routeId ?? order.customer.routeId;
    if (!routeId) {
      // No route — order will be flagged for ops to assign manually.
      return null;
    }
    const route = await this.prisma.route.findUnique({ where: { id: routeId } });
    if (!route) return null;

    const scheduledFor = nextRouteDay(route.scheduleDow);
    const driverId = await this.pickDriverForRoute(tenantId, routeId);
    const sequence = await this.prisma.deliveryAssignment.count({
      where: { tenantId, routeId, scheduledFor: sameDay(scheduledFor) },
    });

    return this.prisma.deliveryAssignment.upsert({
      where: { orderId },
      create: {
        tenantId,
        orderId,
        customerId: order.customerId,
        routeId,
        driverId,
        status: DeliveryStatus.PLANNED,
        scheduledFor,
        sequence: sequence + 1,
      },
      update: {
        // refresh schedule / driver if the order is reconfirmed
        routeId,
        driverId,
        scheduledFor,
      },
    });
  }

  async myRoute(tenantId: string, driverId: string) {
    const start = startOfDay(new Date());
    const end = endOfDay(new Date());

    // Drivers see today + any leftover unfinished from yesterday.
    const assignments = await this.prisma.deliveryAssignment.findMany({
      where: {
        tenantId,
        driverId,
        OR: [
          { scheduledFor: { gte: start, lte: end } },
          { status: { in: [DeliveryStatus.PLANNED, DeliveryStatus.PICKED, DeliveryStatus.IN_TRANSIT] } },
        ],
      },
      orderBy: [{ scheduledFor: 'asc' }, { sequence: 'asc' }],
      include: {
        order: { include: { lines: true } },
        customer: { select: { id: true, outletName: true, contactName: true, phone: true, address: true, latitude: true, longitude: true } },
        route: { select: { id: true, code: true, name: true } },
      },
    });

    const totals = assignments.reduce(
      (acc, a) => {
        acc.value += Number(a.order.total);
        acc.collected += Number(a.amountCollected ?? 0);
        if (a.status === DeliveryStatus.DELIVERED) acc.delivered += 1;
        else if (a.status === DeliveryStatus.FAILED) acc.failed += 1;
        else acc.pending += 1;
        return acc;
      },
      { value: 0, collected: 0, delivered: 0, failed: 0, pending: 0 }
    );

    return { assignments, totals, driverId };
  }

  async byId(tenantId: string, id: string) {
    const a = await this.prisma.deliveryAssignment.findFirst({
      where: { id, tenantId },
      include: {
        order: { include: { lines: true } },
        customer: true,
        route: true,
      },
    });
    if (!a) throw new NotFoundException('Delivery not found');
    return a;
  }

  async updateStatus(tenantId: string, id: string, patch: DeliveryStatusPatch) {
    const a = await this.byId(tenantId, id);
    const update: Prisma.DeliveryAssignmentUpdateInput = { status: patch.status, notes: patch.notes };

    switch (patch.status) {
      case DeliveryStatus.PICKED:
      case DeliveryStatus.IN_TRANSIT:
        update.startedAt = a.startedAt ?? new Date();
        break;
      case DeliveryStatus.DELIVERED:
        update.deliveredAt = new Date();
        // Cascade order status.
        await this.prisma.order.update({
          where: { id: a.orderId },
          data: { status: OrderStatus.DELIVERED },
        });
        break;
      case DeliveryStatus.FAILED:
        update.attempts = { increment: 1 };
        update.failureReason = (patch.failureReason ?? DeliveryFailureReason.OTHER) as any;
        break;
      case DeliveryStatus.RESCHEDULED:
        if (!patch.rescheduledFor) throw new BadRequestException('rescheduledFor required');
        update.rescheduledFor = new Date(patch.rescheduledFor);
        update.attempts = { increment: 1 };
        break;
      default:
        break;
    }

    return this.prisma.deliveryAssignment.update({
      where: { id },
      data: update,
      include: { order: true, customer: { select: { outletName: true } } },
    });
  }

  async recordCash(tenantId: string, id: string, input: CashCollectionInput) {
    const a = await this.byId(tenantId, id);
    const expected = Number(a.order.total);
    if (input.amount > expected * 1.1) {
      throw new BadRequestException('Collected amount exceeds order total by >10%, please double-check');
    }
    return this.prisma.deliveryAssignment.update({
      where: { id },
      data: {
        amountCollected: input.amount,
        paymentMethod: input.method,
        notes: input.notes ?? a.notes,
      },
    });
  }

  async endOfRun(tenantId: string, driverId: string) {
    const { assignments, totals } = await this.myRoute(tenantId, driverId);
    const open: string[] = [DeliveryStatus.PLANNED, DeliveryStatus.PICKED, DeliveryStatus.IN_TRANSIT];
    const stopsRemaining = assignments.filter((a) => open.includes(a.status));
    if (stopsRemaining.length) {
      throw new BadRequestException(`${stopsRemaining.length} stops still open — mark them delivered, failed, or rescheduled first.`);
    }
    return { ...totals, completedAt: new Date().toISOString() };
  }
}

// ---------- helpers ----------

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
function sameDay(d: Date) {
  return { gte: startOfDay(d), lte: endOfDay(d) };
}
function nextRouteDay(scheduleDow: number[]): Date {
  if (!scheduleDow.length) return new Date();
  const today = new Date();
  for (let offset = 0; offset < 7; offset++) {
    const candidate = new Date(today.getTime() + offset * 24 * 3600 * 1000);
    if (scheduleDow.includes(candidate.getDay())) {
      candidate.setHours(9, 0, 0, 0);
      return candidate;
    }
  }
  return today;
}
