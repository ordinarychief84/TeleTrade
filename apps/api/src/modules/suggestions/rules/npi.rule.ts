import { SuggestionRuleContext, SuggestionResult } from './rule.types';

/**
 * New Product Introduction — any promo flagged as NPI (heuristic: contains
 * 'NPI' or 'Launch' in name) → push to every applicable outlet at score 0.65.
 */
export function npiRule(ctx: SuggestionRuleContext): SuggestionResult[] {
  const out: SuggestionResult[] = [];
  const npiPromos = ctx.activePromos.filter((p) => /npi|launch/i.test(p.name));
  for (const promo of npiPromos) {
    for (const skuCode of promo.applicableSkus) {
      const sku = ctx.skus.find((s) => s.code === skuCode);
      if (!sku) continue;
      out.push({
        skuId: sku.id,
        skuCode: sku.code,
        skuName: sku.name,
        qty: 1,
        reason: `NPI launch: ${promo.name} — pitch 1 trial case of ${sku.name}.`,
        rule: 'npi',
        score: 0.65,
      });
    }
  }
  return out;
}
