import { z } from 'zod';
import { OrderStatus } from '../enums';

export const orderLineSchema = z.object({
  skuId: z.string(),
  skuCode: z.string(),
  name: z.string(),
  qty: z.number().int().positive(),
  unitPrice: z.number().nonnegative(),
});
export type OrderLineInput = z.infer<typeof orderLineSchema>;

export const orderDraftSchema = z.object({
  id: z.string().optional(),
  customerId: z.string(),
  callId: z.string().optional().nullable(),
  campaignId: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  deliveryPreference: z.string().optional().nullable(),
  routeId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  lines: z.array(orderLineSchema).default([]),
  discount: z.number().nonnegative().default(0),
});
export type OrderDraftInput = z.infer<typeof orderDraftSchema>;

export const orderConfirmSchema = z.object({
  expectedTotal: z.number().nonnegative().optional(),
});

export const orderStatusFilterSchema = z.object({
  status: z.nativeEnum(OrderStatus).optional(),
  customerId: z.string().optional(),
  agentId: z.string().optional(),
  duplicatesOnly: z.coerce.boolean().optional(),
});
