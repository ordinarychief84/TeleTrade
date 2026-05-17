import { z } from 'zod';
import { CallOutcome, LanguagePreference } from '../enums';

export const inboundSimulateSchema = z.object({
  fromNumber: z.string().min(7),
  language: z.nativeEnum(LanguagePreference).optional(),
  productMenu: z.string().optional(),
});

export const outboundDialSchema = z.object({
  customerId: z.string(),
  campaignTargetId: z.string().optional().nullable(),
});

export const callOutcomeSchema = z.object({
  outcome: z.nativeEnum(CallOutcome),
  notes: z.string().max(2000).optional(),
});

export const callbackSchema = z.object({
  scheduledFor: z.string().datetime(),
  notes: z.string().max(500).optional(),
});
