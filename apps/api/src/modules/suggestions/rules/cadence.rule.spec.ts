import { cadenceRule } from './cadence.rule';
import { SuggestionRuleContext } from './rule.types';

describe('cadenceRule', () => {
  function makeCtx(daysGaps: number[], daysSinceLast: number): SuggestionRuleContext {
    const now = new Date('2026-05-01T00:00:00Z');
    const lastDate = new Date(now.getTime() - daysSinceLast * 24 * 3600 * 1000);
    const dates: Date[] = [];
    let cur = lastDate;
    dates.push(cur);
    for (let i = daysGaps.length - 1; i >= 0; i--) {
      cur = new Date(cur.getTime() - daysGaps[i]! * 24 * 3600 * 1000);
      dates.unshift(cur);
    }
    const sku = { id: 'sku-1', code: 'BEV-MLT-33', name: 'Malta 33cl' } as any;
    const recentOrders = dates.map((d, i) => ({
      id: `o${i}`,
      createdAt: d,
      lines: [{ skuId: 'sku-1', skuCode: 'BEV-MLT-33', qty: 3 }],
    })) as any;
    return {
      now,
      customer: { outletType: 'KIOSK', preferredSkus: [], route: { scheduleDow: [1, 3, 5] } } as any,
      recentOrders,
      skus: [sku],
      activePromos: [],
    };
  }

  it('suggests a reorder when overdue past the cadence', () => {
    const out = cadenceRule(makeCtx([10, 10, 10], 14));
    expect(out).toHaveLength(1);
    expect(out[0]!.skuCode).toBe('BEV-MLT-33');
    expect(out[0]!.qty).toBe(3);
    expect(out[0]!.reason).toMatch(/every 10 days/);
    expect(out[0]!.score).toBeGreaterThan(0.5);
  });

  it('returns nothing while still within the cadence window', () => {
    const out = cadenceRule(makeCtx([10, 10, 10], 5));
    expect(out).toHaveLength(0);
  });

  it('skips when there is only one historical order', () => {
    const ctx = makeCtx([10], 14);
    ctx.recentOrders = [ctx.recentOrders[0]!] as any;
    const out = cadenceRule(ctx);
    expect(out).toHaveLength(0);
  });
});
