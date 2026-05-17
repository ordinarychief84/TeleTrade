import { SuggestionRuleContext, SuggestionResult } from './rule.types';
import { OutletType } from '@teletrade/shared';

const OUTLET_FAVOURITES: Record<string, string[]> = {
  [OutletType.BAR]: ['BEV-MLT-33', 'BEV-COKE-50'],
  [OutletType.RESTAURANT]: ['BEV-MLT-50', 'BEV-CHV-30', 'STP-OIL-VEG-5L'],
  [OutletType.KIOSK]: ['SNK-IND-INDOM', 'SNK-GAL-CRK', 'BEV-WAT-75'],
  [OutletType.MINI_MART]: ['PC-DET-OMO-1KG', 'BEV-WAT-75', 'SNK-BIS-CABIN'],
  [OutletType.SUPERMARKET]: ['PC-DET-OMO-1KG', 'STP-OIL-VEG-5L', 'STP-FLR-2KG'],
  [OutletType.WHOLESALER]: ['STP-RICE-50KG', 'STP-OIL-VEG-5L', 'PC-DET-OMO-1KG'],
  [OutletType.PHARMACY]: ['PC-TP-CLG-150', 'PC-DEO-RXN-150'],
  [OutletType.MAMA_PUT]: ['STP-OIL-PALM-5L', 'STP-SUG-1KG', 'STP-SAL-500'],
  [OutletType.TABLE_TOP]: ['SNK-IND-INDOM', 'BEV-COKE-50', 'SNK-GAL-CRK'],
};

/**
 * Anchor SKUs by outlet type — low-confidence fallback when no other signal
 * triggers. Helps cold/new outlets get plausible suggestions.
 */
export function outletTypeRule(ctx: SuggestionRuleContext): SuggestionResult[] {
  const codes = OUTLET_FAVOURITES[ctx.customer.outletType] ?? [];
  const out: SuggestionResult[] = [];
  for (const code of codes) {
    const sku = ctx.skus.find((s) => s.code === code);
    if (!sku) continue;
    out.push({
      skuId: sku.id,
      skuCode: sku.code,
      skuName: sku.name,
      qty: 1,
      reason: `Typical SKU for ${ctx.customer.outletType.toLowerCase().replace('_', ' ')} outlets.`,
      rule: 'outlet-type',
      score: 0.4,
    });
  }
  return out;
}
