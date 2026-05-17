import { z } from 'zod';

export const DeliveryStatus = {
  PLANNED: 'PLANNED',
  PICKED: 'PICKED',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  FAILED: 'FAILED',
  RESCHEDULED: 'RESCHEDULED',
} as const;
export type DeliveryStatus = (typeof DeliveryStatus)[keyof typeof DeliveryStatus];

export const DeliveryFailureReason = {
  OUTLET_CLOSED: 'OUTLET_CLOSED',
  NOT_ENOUGH_CASH: 'NOT_ENOUGH_CASH',
  WRONG_SKU: 'WRONG_SKU',
  DAMAGED: 'DAMAGED',
  NO_ANSWER: 'NO_ANSWER',
  OTHER: 'OTHER',
} as const;
export type DeliveryFailureReason = (typeof DeliveryFailureReason)[keyof typeof DeliveryFailureReason];

export const PaymentMethod = {
  CASH: 'CASH',
  TRANSFER: 'TRANSFER',
  POS: 'POS',
  CREDIT: 'CREDIT',
} as const;
export type PaymentMethod = (typeof PaymentMethod)[keyof typeof PaymentMethod];

export const deliveryStatusPatchSchema = z.object({
  status: z.enum([
    DeliveryStatus.PLANNED,
    DeliveryStatus.PICKED,
    DeliveryStatus.IN_TRANSIT,
    DeliveryStatus.DELIVERED,
    DeliveryStatus.FAILED,
    DeliveryStatus.RESCHEDULED,
  ]),
  notes: z.string().max(1000).optional(),
  failureReason: z.nativeEnum(DeliveryFailureReason).optional(),
  rescheduledFor: z.string().datetime().optional(),
});
export type DeliveryStatusPatch = z.infer<typeof deliveryStatusPatchSchema>;

export const cashCollectionSchema = z.object({
  amount: z.number().nonnegative(),
  method: z.nativeEnum(PaymentMethod).default(PaymentMethod.CASH),
  notes: z.string().max(500).optional(),
});
export type CashCollectionInput = z.infer<typeof cashCollectionSchema>;
