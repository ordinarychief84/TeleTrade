import { z } from 'zod';
import {
  AccountTier,
  CampaignStatus,
  CampaignType,
  OutletType,
} from '../enums';

export const campaignFiltersSchema = z.object({
  routeIds: z.array(z.string()).optional(),
  territoryIds: z.array(z.string()).optional(),
  accountTiers: z.array(z.nativeEnum(AccountTier)).optional(),
  outletTypes: z.array(z.nativeEnum(OutletType)).optional(),
  dormantDaysGte: z.number().int().min(0).optional(),
  skuGap: z.array(z.string()).optional(),
  geoCluster: z
    .object({
      centerLat: z.number(),
      centerLng: z.number(),
      radiusKm: z.number(),
    })
    .optional(),
  lastOrderBefore: z.string().datetime().optional(),
  purchaseFrequencyLte: z.number().int().min(0).optional(),
  limit: z.number().int().min(1).max(5000).optional(),
});
export type CampaignFilters = z.infer<typeof campaignFiltersSchema>;

export const campaignCreateSchema = z.object({
  name: z.string().min(2),
  type: z.nativeEnum(CampaignType),
  pitch: z.string().optional().nullable(),
  promoCode: z.string().optional().nullable(),
  filters: campaignFiltersSchema.default({}),
});
export type CampaignCreateInput = z.infer<typeof campaignCreateSchema>;

export const campaignUpdateSchema = campaignCreateSchema.partial().extend({
  status: z.nativeEnum(CampaignStatus).optional(),
});
