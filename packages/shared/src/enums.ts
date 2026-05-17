// Enum literals — kept in sync with packages/db/prisma/schema.prisma.
// Duplicating here lets the web app reference enums without importing Prisma.

export const Role = {
  ADMIN: 'ADMIN',
  SALES_MANAGER: 'SALES_MANAGER',
  AGENT: 'AGENT',
  DELIVERY_OPS: 'DELIVERY_OPS',
} as const;
export type Role = (typeof Role)[keyof typeof Role];

export const CustomerStatus = {
  ACTIVE: 'ACTIVE',
  DORMANT: 'DORMANT',
  UNREACHABLE: 'UNREACHABLE',
  PHONE_ONLY: 'PHONE_ONLY',
  SUSPENDED: 'SUSPENDED',
} as const;
export type CustomerStatus = (typeof CustomerStatus)[keyof typeof CustomerStatus];

export const AccountTier = { A: 'A', B: 'B', C: 'C', D: 'D' } as const;
export type AccountTier = (typeof AccountTier)[keyof typeof AccountTier];

export const OutletType = {
  KIOSK: 'KIOSK',
  MAMA_PUT: 'MAMA_PUT',
  SUPERMARKET: 'SUPERMARKET',
  MINI_MART: 'MINI_MART',
  WHOLESALER: 'WHOLESALER',
  BAR: 'BAR',
  RESTAURANT: 'RESTAURANT',
  PHARMACY: 'PHARMACY',
  TABLE_TOP: 'TABLE_TOP',
} as const;
export type OutletType = (typeof OutletType)[keyof typeof OutletType];

export const LanguagePreference = {
  EN: 'EN', FR: 'FR', PT: 'PT', SW: 'SW', HA: 'HA',
  YO: 'YO', IG: 'IG', AR: 'AR', ZU: 'ZU',
} as const;
export type LanguagePreference = (typeof LanguagePreference)[keyof typeof LanguagePreference];

export const CallDirection = { INBOUND: 'INBOUND', OUTBOUND: 'OUTBOUND' } as const;
export type CallDirection = (typeof CallDirection)[keyof typeof CallDirection];

export const CallStatus = {
  QUEUED: 'QUEUED',
  RINGING: 'RINGING',
  CONNECTED: 'CONNECTED',
  COMPLETED: 'COMPLETED',
  MISSED: 'MISSED',
  DROPPED: 'DROPPED',
  FAILED: 'FAILED',
  CALLBACK_SCHEDULED: 'CALLBACK_SCHEDULED',
} as const;
export type CallStatus = (typeof CallStatus)[keyof typeof CallStatus];

export const CallOutcome = {
  ORDER_CREATED: 'ORDER_CREATED',
  NO_ORDER: 'NO_ORDER',
  CALLBACK_SCHEDULED: 'CALLBACK_SCHEDULED',
  WRONG_NUMBER: 'WRONG_NUMBER',
  DECLINED: 'DECLINED',
  UNREACHABLE: 'UNREACHABLE',
  COMPLAINT: 'COMPLAINT',
  INFO_REQUEST: 'INFO_REQUEST',
} as const;
export type CallOutcome = (typeof CallOutcome)[keyof typeof CallOutcome];

export const CampaignType = {
  NPI_LAUNCH: 'NPI_LAUNCH',
  PROMO_PUSH: 'PROMO_PUSH',
  DORMANT_REACTIVATION: 'DORMANT_REACTIVATION',
  GAP_FILL_REPLENISHMENT: 'GAP_FILL_REPLENISHMENT',
  CREDIT_COLLECTION: 'CREDIT_COLLECTION',
  CUSTOMER_SURVEY: 'CUSTOMER_SURVEY',
  COMPLAINT_FOLLOW_UP: 'COMPLAINT_FOLLOW_UP',
  AFTER_SALES_SUPPORT: 'AFTER_SALES_SUPPORT',
} as const;
export type CampaignType = (typeof CampaignType)[keyof typeof CampaignType];

export const CampaignStatus = {
  DRAFT: 'DRAFT',
  PENDING_APPROVAL: 'PENDING_APPROVAL',
  ACTIVE: 'ACTIVE',
  PAUSED: 'PAUSED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;
export type CampaignStatus = (typeof CampaignStatus)[keyof typeof CampaignStatus];

export const OrderStatus = {
  DRAFT: 'DRAFT',
  CONFIRMED: 'CONFIRMED',
  PENDING_SYNC: 'PENDING_SYNC',
  SYNCED: 'SYNCED',
  FLAGGED_DUPLICATE: 'FLAGGED_DUPLICATE',
  ASSIGNED_TO_ROUTE: 'ASSIGNED_TO_ROUTE',
  OUT_FOR_DELIVERY: 'OUT_FOR_DELIVERY',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED',
  FAILED: 'FAILED',
} as const;
export type OrderStatus = (typeof OrderStatus)[keyof typeof OrderStatus];

export const DmsAdapterKind = {
  ODOO: 'ODOO',
  SAP_B1: 'SAP_B1',
  DYNAMICS_365: 'DYNAMICS_365',
  CUSTOM: 'CUSTOM',
} as const;
export type DmsAdapterKind = (typeof DmsAdapterKind)[keyof typeof DmsAdapterKind];

export const DmsSyncStatus = {
  PENDING: 'PENDING',
  IN_FLIGHT: 'IN_FLIGHT',
  SUCCEEDED: 'SUCCEEDED',
  FAILED: 'FAILED',
  DEAD_LETTER: 'DEAD_LETTER',
} as const;
export type DmsSyncStatus = (typeof DmsSyncStatus)[keyof typeof DmsSyncStatus];

export const DuplicateReviewStatus = {
  PENDING: 'PENDING',
  KEPT_BOTH: 'KEPT_BOTH',
  CANCELLED_DUPLICATE: 'CANCELLED_DUPLICATE',
  MERGED: 'MERGED',
  MARKED_VALID: 'MARKED_VALID',
} as const;
export type DuplicateReviewStatus = (typeof DuplicateReviewStatus)[keyof typeof DuplicateReviewStatus];
