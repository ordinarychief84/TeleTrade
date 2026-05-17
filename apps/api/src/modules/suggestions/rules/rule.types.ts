import { Customer, Order, OrderLine, Promotion, Sku } from '@prisma/client';

export interface SuggestionRuleContext {
  now: Date;
  customer: Customer & { route: { scheduleDow: number[] } | null };
  recentOrders: (Order & { lines: OrderLine[] })[];
  skus: Sku[];
  activePromos: Promotion[];
}

export interface SuggestionResult {
  skuId: string;
  skuCode: string;
  skuName: string;
  qty: number;
  reason: string;
  rule: string;
  score: number; // 0..1
}
