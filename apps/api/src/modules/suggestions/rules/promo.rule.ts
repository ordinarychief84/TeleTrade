import { SuggestionRuleContext, SuggestionResult } from './rule.types';

/**
 * Each active promo applicable to the outlet → suggest 2 cases of the
 * promoted SKU with the promo as the pitch.
 */
export function promoRule(ctx: SuggestionRuleContext): SuggestionResult[] {
  const out: SuggestionResult[] = [];
  for (const promo of ctx.activePromos) {
    for (const skuCode of promo.applicableSkus) {
      const sku = ctx.skus.find((s) => s.code === skuCode);
      if (!sku) continue;
      out.push({
        skuId: sku.id,
        skuCode: sku.code,
        skuName: sku.name,
        qty: 2,
        reason: `Active promo "${promo.name}": ${promo.description}. Suggest 2 cases.`,
        rule: 'promo',
        score: 0.7,
      });
    }
  }
  return out;
}
