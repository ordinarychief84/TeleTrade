import { z } from 'zod';
import { Role } from '../enums';

export const PlanTier = {
  FREE: 'FREE',
  STARTER: 'STARTER',
  GROWTH: 'GROWTH',
  ENTERPRISE: 'ENTERPRISE',
} as const;
export type PlanTier = (typeof PlanTier)[keyof typeof PlanTier];

export const InvitationStatus = {
  PENDING: 'PENDING',
  ACCEPTED: 'ACCEPTED',
  REVOKED: 'REVOKED',
  EXPIRED: 'EXPIRED',
} as const;
export type InvitationStatus = (typeof InvitationStatus)[keyof typeof InvitationStatus];

/** Public signup — creates a Tenant + first Admin. */
export const signupSchema = z.object({
  companyName: z.string().min(2).max(120),
  industry: z.string().max(80).optional(),
  country: z.string().max(80).optional(),
  fullName: z.string().min(2).max(120),
  email: z.string().email(),
  password: z.string().min(8).max(200),
});
export type SignupInput = z.infer<typeof signupSchema>;

export const inviteSchema = z.object({
  email: z.string().email(),
  fullName: z.string().min(2).max(120),
  role: z.nativeEnum(Role),
});
export type InviteInput = z.infer<typeof inviteSchema>;

export const acceptInviteSchema = z.object({
  token: z.string().min(10),
  password: z.string().min(8).max(200),
});
export type AcceptInviteInput = z.infer<typeof acceptInviteSchema>;

export const updateUserSchema = z.object({
  role: z.nativeEnum(Role).optional(),
  active: z.boolean().optional(),
  fullName: z.string().min(2).max(120).optional(),
});
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
