import { z } from 'zod';

export const configValidationSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
    DATABASE_URL: z.string().url(),
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.coerce.number().default(6379),
    API_PORT: z.coerce.number().default(4000),
    WEB_ORIGIN: z.string().default('http://localhost:3000'),
    JWT_ACCESS_SECRET: z.string().min(16),
    JWT_REFRESH_SECRET: z.string().min(16),
    JWT_ACCESS_TTL: z.coerce.number().default(900),
    JWT_REFRESH_TTL: z.coerce.number().default(2592000),
    TELEPHONY_PROVIDER: z.enum(['mock', 'twilio', 'africastalking', 'sip']).default('mock'),
    DMS_DEFAULT_ADAPTER: z.enum(['odoo', 'sap_b1', 'dynamics_365', 'custom']).default('odoo'),
    DMS_ODOO_URL: z.string().url().optional().or(z.literal('')),
    DMS_ODOO_DB: z.string().optional(),
    DMS_ODOO_USERNAME: z.string().optional(),
    DMS_ODOO_API_KEY: z.string().optional(),
    DMS_CUSTOM_URL: z.string().url().optional().or(z.literal('')),
    DMS_CUSTOM_TOKEN: z.string().optional(),
  })
  .passthrough();

export type EnvConfig = z.infer<typeof configValidationSchema>;
