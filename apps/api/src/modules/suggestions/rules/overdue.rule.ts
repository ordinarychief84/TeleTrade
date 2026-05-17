import { SuggestionRuleContext, SuggestionResult } from './rule.types';

/**
 * Preferred SKUs that haven't appeared in the last 6 orders → suggest a single
 * case as a gap-fill nudge.
 */
export function overdueRule(ctx: SuggestionRuleContext): SuggestionResult[] {
  const recent = ctx.recentOrders.slice(0, 6);
  const recentSkus = new Set(recent.flatMap((o) => o.lines.map((l) => l.skuCode)));
  const out: SuggestionResult[] = [];
  for (const skuCode of ctx.customer.preferredSkus) {
    if (recentSkus.has(skuCode)) continue;
    const sku = ctx.skus.find((s) => s.code === skuCode);
    if (!sku) continue;
    out.push({
      skuId: sku.id,
      skuCode: sku.code,
      skuName: sku.name,
      qty: 1,
      reason: `${sku.name} is one of this outlet's preferred SKUs but hasn't been ordered recently. Suggest 1 case.`,
      rule: 'overdue',
      score: 0.55,
    });
  }
  return out;
}
