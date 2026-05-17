import { DuplicateDetectorService } from './duplicate-detector.service';

describe('DuplicateDetectorService', () => {
  function makeService(orders: any[]) {
    const prisma = {
      order: {
        findMany: jest.fn().mockResolvedValue(orders),
      },
    } as any;
    return { svc: new DuplicateDetectorService(prisma), prisma };
  }

  const baseOrder = (overrides: Partial<any> = {}) => ({
    id: 'o1',
    createdAt: new Date(),
    status: 'PENDING_SYNC',
    lines: [{ skuCode: 'BEV-MLT-33' }],
    ...overrides,
  });

  it('flags duplicate when same outlet + same SKU within 30 minutes', async () => {
    const { svc } = makeService([baseOrder()]);
    const result = await svc.detect({
      tenantId: 't1',
      customerId: 'c1',
      skuCodes: ['BEV-MLT-33', 'SNK-IND-INDOM'],
    });
    expect(result?.id).toBe('o1');
  });

  it('returns null when no SKU overlaps', async () => {
    const { svc } = makeService([baseOrder({ lines: [{ skuCode: 'PC-DET-OMO-1KG' }] })]);
    const result = await svc.detect({
      tenantId: 't1',
      customerId: 'c1',
      skuCodes: ['BEV-MLT-33'],
    });
    expect(result).toBeNull();
  });

  it('returns null when no recent orders exist', async () => {
    const { svc } = makeService([]);
    const result = await svc.detect({
      tenantId: 't1',
      customerId: 'c1',
      skuCodes: ['BEV-MLT-33'],
    });
    expect(result).toBeNull();
  });

  it('skips empty SKU list without querying', async () => {
    const { svc, prisma } = makeService([]);
    const result = await svc.detect({ tenantId: 't1', customerId: 'c1', skuCodes: [] });
    expect(result).toBeNull();
    expect(prisma.order.findMany).not.toHaveBeenCalled();
  });

  it('uses the 30-minute window', () => {
    expect(DuplicateDetectorService.WINDOW_MINUTES).toBe(30);
  });
});
