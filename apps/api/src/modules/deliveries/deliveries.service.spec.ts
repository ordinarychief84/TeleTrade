import { DeliveriesService } from './deliveries.service';
import { DeliveryStatus, DeliveryFailureReason, PaymentMethod } from '@teletrade/shared';

function makeService(extra: any = {}) {
  const prisma = {
    user: { findMany: jest.fn().mockResolvedValue([{ id: 'd1' }, { id: 'd2' }]) },
    route: { findUnique: jest.fn().mockResolvedValue({ id: 'r1', scheduleDow: [1, 3, 5] }) },
    order: {
      findFirst: jest.fn().mockResolvedValue({
        id: 'o1',
        customerId: 'c1',
        customer: { routeId: 'r1', route: { id: 'r1', scheduleDow: [1, 3, 5] } },
        routeId: 'r1',
        total: 10000,
      }),
      update: jest.fn().mockResolvedValue({}),
    },
    deliveryAssignment: {
      count: jest.fn().mockResolvedValue(0),
      upsert: jest.fn().mockResolvedValue({ id: 'da1' }),
      findFirst: jest.fn(),
      findMany: jest.fn().mockResolvedValue([]),
      update: jest.fn().mockResolvedValue({}),
    },
    ...extra,
  } as any;
  return { svc: new DeliveriesService(prisma), prisma };
}

describe('DeliveriesService', () => {
  it('round-robins drivers deterministically by routeId hash', async () => {
    const { svc } = makeService();
    const a = await svc.pickDriverForRoute('t1', 'route-A');
    const b = await svc.pickDriverForRoute('t1', 'route-A');
    expect(a).toBe(b); // same route → same driver
    expect(['d1', 'd2']).toContain(a);
  });

  it('returns null when no drivers configured', async () => {
    const { svc } = makeService({
      user: { findMany: jest.fn().mockResolvedValue([]) },
    });
    expect(await svc.pickDriverForRoute('t1', 'r1')).toBeNull();
  });

  it('assignForOrder creates a DeliveryAssignment on the next route day', async () => {
    const { svc, prisma } = makeService();
    const result = await svc.assignForOrder('t1', 'o1');
    expect(result).not.toBeNull();
    expect(prisma.deliveryAssignment.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { orderId: 'o1' },
        create: expect.objectContaining({
          tenantId: 't1',
          orderId: 'o1',
          customerId: 'c1',
          routeId: 'r1',
          sequence: 1,
          status: DeliveryStatus.PLANNED,
        }),
      })
    );
  });

  it('assignForOrder no-ops when the customer has no route', async () => {
    const { svc, prisma } = makeService({
      order: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'o2',
          customerId: 'c2',
          customer: { routeId: null, route: null },
          routeId: null,
        }),
      },
    });
    const result = await svc.assignForOrder('t1', 'o2');
    expect(result).toBeNull();
    expect(prisma.deliveryAssignment.upsert).not.toHaveBeenCalled();
  });

  describe('cash collection guardrails', () => {
    const findFirst = jest.fn().mockResolvedValue({
      id: 'da1',
      tenantId: 't1',
      orderId: 'o1',
      order: { total: 10000 },
      notes: null,
    });
    function fixt() {
      return makeService({ deliveryAssignment: { findFirst, update: jest.fn().mockResolvedValue({}) } });
    }

    it('records cash when within tolerance', async () => {
      const { svc, prisma } = fixt();
      await svc.recordCash('t1', 'da1', { amount: 10500, method: PaymentMethod.CASH });
      expect(prisma.deliveryAssignment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'da1' },
          data: expect.objectContaining({ amountCollected: 10500, paymentMethod: 'CASH' }),
        })
      );
    });

    it('rejects collected amounts more than 10% over the order total', async () => {
      const { svc } = fixt();
      await expect(svc.recordCash('t1', 'da1', { amount: 12000, method: PaymentMethod.CASH })).rejects.toThrow(
        /exceeds order total/
      );
    });
  });

  describe('endOfRun', () => {
    it('refuses to close while stops are still open', async () => {
      const { svc } = makeService({
        deliveryAssignment: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'a', status: DeliveryStatus.PLANNED, order: { total: 1000 }, amountCollected: null, customer: {}, route: {} },
            { id: 'b', status: DeliveryStatus.DELIVERED, order: { total: 1000 }, amountCollected: 1000, customer: {}, route: {} },
          ]),
        },
      });
      await expect(svc.endOfRun('t1', 'driver-x')).rejects.toThrow(/still open/);
    });

    it('returns aggregated totals when every stop is closed', async () => {
      const { svc } = makeService({
        deliveryAssignment: {
          findMany: jest.fn().mockResolvedValue([
            { id: 'a', status: DeliveryStatus.DELIVERED, order: { total: 1000 }, amountCollected: 1000, customer: {}, route: {} },
            { id: 'b', status: DeliveryStatus.FAILED, order: { total: 500 }, amountCollected: null, customer: {}, route: {} },
          ]),
        },
      });
      const out = await svc.endOfRun('t1', 'driver-x');
      expect(out.delivered).toBe(1);
      expect(out.failed).toBe(1);
      expect(out.collected).toBe(1000);
      expect(out.value).toBe(1500);
    });
  });

  it('updateStatus FAILED bumps attempts and stores reason', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'da1', tenantId: 't1', orderId: 'o1', startedAt: null });
    const update = jest.fn().mockResolvedValue({});
    const { svc } = makeService({ deliveryAssignment: { findFirst, update } });
    await svc.updateStatus('t1', 'da1', {
      status: DeliveryStatus.FAILED,
      failureReason: DeliveryFailureReason.OUTLET_CLOSED,
    });
    expect(update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: DeliveryStatus.FAILED,
          attempts: { increment: 1 },
          failureReason: DeliveryFailureReason.OUTLET_CLOSED,
        }),
      })
    );
  });

  it('updateStatus RESCHEDULED requires rescheduledFor', async () => {
    const findFirst = jest.fn().mockResolvedValue({ id: 'da1', tenantId: 't1', startedAt: null });
    const { svc } = makeService({ deliveryAssignment: { findFirst, update: jest.fn() } });
    await expect(svc.updateStatus('t1', 'da1', { status: DeliveryStatus.RESCHEDULED } as any)).rejects.toThrow(
      /rescheduledFor/
    );
  });
});
