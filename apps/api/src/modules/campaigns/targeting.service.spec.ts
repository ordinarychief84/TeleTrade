import { TargetingService } from './targeting.service';

describe('TargetingService', () => {
  it('previews matching outlets with count + sample', async () => {
    const prisma = {
      customer: {
        count: jest.fn().mockResolvedValue(42),
        findMany: jest.fn().mockResolvedValue([{ id: 'c1', outletName: 'Mama Foods' }]),
      },
    } as any;
    const svc = new TargetingService(prisma);
    const result = await svc.preview('t1', { accountTiers: ['A'] });
    expect(result.count).toBe(42);
    expect(result.sample[0]!.id).toBe('c1');
    expect(prisma.customer.count).toHaveBeenCalledWith({
      where: expect.objectContaining({ tenantId: 't1', accountTier: { in: ['A'] } }),
    });
  });

  it('translates dormantDaysGte into a lastOrderDate cutoff OR dormant status', async () => {
    const prisma = {
      customer: { count: jest.fn().mockResolvedValue(0), findMany: jest.fn().mockResolvedValue([]) },
    } as any;
    const svc = new TargetingService(prisma);
    await svc.generateTargetList('t1', { dormantDaysGte: 30 });
    const callArgs = (prisma.customer.findMany as jest.Mock).mock.calls[0][0];
    expect(callArgs.where.OR).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ lastOrderDate: expect.any(Object) }),
        expect.objectContaining({ status: 'DORMANT' }),
      ])
    );
  });
});
