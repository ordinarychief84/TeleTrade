import { SuggestionRuleContext, SuggestionResult } from './rule.types';

/**
 * For each SKU the outlet bought recently, compute the average gap between
 * orders. If we're past the average gap, suggest the typical reorder qty.
 *
 * "This outlet usually buys Malta 33cl every 10 days. Last order was 14 days
 * ago. Suggest 3 cases."
 */
export function cadenceRule(ctx: SuggestionRuleContext): SuggestionResult[] {
  const { recentOrders, skus, now } = ctx;
  const skuById = new Map(skus.map((s) => [s.id, s]));
  const skuOrderHistory = new Map<string, { date: Date; qty: number }[]>();

  for (const order of recentOrders) {
    for (const line of order.lines) {
      if (!skuOrderHistory.has(line.skuId)) skuOrderHistory.set(line.skuId, []);
      skuOrderHistory.get(line.skuId)!.push({ date: order.createdAt, qty: line.qty });
    }
  }

  const out: SuggestionResult[] = [];
  for (const [skuId, history] of skuOrderHistory) {
    if (history.length < 2) continue;
    history.sort((a, b) => a.date.getTime() - b.date.getTime());
    const gaps: number[] = [];
    for (let i = 1; i < history.length; i++) {
      gaps.push((history[i]!.date.getTime() - history[i - 1]!.date.getTime()) / (24 * 3600 * 1000));
    }
    const avgGap = gaps.reduce((a, b) => a + b, 0) / gaps.length;
    if (avgGap < 1 || avgGap > 120) continue;
    const last = history[history.length - 1]!;
    const daysSinceLast = (now.getTime() - last.date.getTime()) / (24 * 3600 * 1000);
    if (daysSinceLast < avgGap * 0.85) continue;

    const avgQty = Math.max(1, Math.round(history.reduce((a, b) => a + b.qty, 0) / history.length));
    const sku = skuById.get(skuId);
    if (!sku) continue;

    const overdueRatio = Math.min(2, daysSinceLast / avgGap);
    const score = Math.min(1, 0.5 + (overdueRatio - 1) * 0.4);
    out.push({
      skuId,
      skuCode: sku.code,
      skuName: sku.name,
      qty: avgQty,
      reason: `Outlet usually buys ${sku.name} every ${Math.round(avgGap)} days. Last order was ${Math.round(
        daysSinceLast
      )} days ago. Suggest ${avgQty} ${avgQty === 1 ? 'case' : 'cases'}.`,
      rule: 'cadence',
      score,
    });
  }
  return out;
}
