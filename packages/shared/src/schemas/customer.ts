import { z } from 'zod';
import {
  AccountTier,
  CustomerStatus,
  LanguagePreference,
  OutletType,
} from '../enums';

export const customerCreateSchema = z.object({
  outletName: z.string().min(2),
  contactName: z.string().min(2),
  phone: z.string().min(7),
  altPhone: z.string().optional().nullable(),
  languagePreference: z.nativeEnum(LanguagePreference),
  outletType: z.nativeEnum(OutletType),
  address: z.string().min(2),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  routeId: z.string().optional().nullable(),
  territoryId: z.string().optional().nullable(),
  accountTier: z.nativeEnum(AccountTier).default(AccountTier.C),
  status: z.nativeEnum(CustomerStatus).default(CustomerStatus.ACTIVE),
  preferredSkus: z.array(z.string()).default([]),
  notes: z.string().optional().nullable(),
  creditLimit: z.number().nonnegative().optional().nullable(),
});
export type CustomerCreateInput = z.infer<typeof customerCreateSchema>;

export const customerUpdateSchema = customerCreateSchema.partial();
export type CustomerUpdateInput = z.infer<typeof customerUpdateSchema>;

export const customerFiltersSchema = z.object({
  q: z.string().optional(),
  status: z.nativeEnum(CustomerStatus).optional(),
  outletType: z.nativeEnum(OutletType).optional(),
  tier: z.nativeEnum(AccountTier).optional(),
  routeId: z.string().optional(),
  territoryId: z.string().optional(),
});
export type CustomerFilters = z.infer<typeof customerFiltersSchema>;
