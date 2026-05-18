import { z } from 'zod';
import { PlanTier } from './team';
import { DmsAdapterKind } from '../enums';

export const PLAN_DETAILS: Record<PlanTier, { name: string; seats: number; price: string; perks: string[] }> = {
  FREE: { name: 'Free trial', seats: 3, price: '$0/mo', perks: ['Up to 3 seats', 'Mock telephony', 'Audit log'] },
  STARTER: {
    name: 'Starter',
    seats: 10,
    price: '$199/mo',
    perks: ['10 seats', 'All adapters', 'Email + chat support'],
  },
  GROWTH: {
    name: 'Growth',
    seats: 50,
    price: '$799/mo',
    perks: ['50 seats', 'Priority queues', 'SSO', 'Quarterly business review'],
  },
  ENTERPRISE: {
    name: 'Enterprise',
    seats: 250,
    price: 'Custom',
    perks: ['250+ seats', 'Dedicated infra', 'Custom DMS adapters', '99.95% SLA'],
  },
};

export const workspaceUpdateSchema = z.object({
  name: z.string().min(2).max(120).optional(),
  industry: z.string().max(80).optional().nullable(),
  country: z.string().max(80).optional().nullable(),
  timezone: z.string().max(80).optional().nullable(),
  billingEmail: z.string().email().optional().nullable(),
  logoUrl: z.string().url().optional().nullable(),
});
export type WorkspaceUpdateInput = z.infer<typeof workspaceUpdateSchema>;

export const planChangeSchema = z.object({
  plan: z.enum(['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE']),
});
export type PlanChangeInput = z.infer<typeof planChangeSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(8),
  newPassword: z.string().min(8).max(200),
});
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;

export const dmsConfigSchema = z.object({
  adapter: z.nativeEnum(DmsAdapterKind),
  url: z.string().url().optional().nullable().or(z.literal('')),
  apiKey: z.string().optional().nullable().or(z.literal('')),
  database: z.string().optional().nullable().or(z.literal('')),
  username: z.string().optional().nullable().or(z.literal('')),
});
export type DmsConfigInput = z.infer<typeof dmsConfigSchema>;

export const closeWorkspaceSchema = z.object({
  confirm: z.string(), // user types the workspace name to confirm
  password: z.string().min(8),
});
export type CloseWorkspaceInput = z.infer<typeof closeWorkspaceSchema>;
