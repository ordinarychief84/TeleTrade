import { z } from 'zod';

export const suggestionSchema = z.object({
  skuId: z.string(),
  skuCode: z.string(),
  skuName: z.string(),
  qty: z.number().int().positive(),
  reason: z.string(),
  rule: z.string(),
  score: z.number().min(0).max(1),
});
export type Suggestion = z.infer<typeof suggestionSchema>;
