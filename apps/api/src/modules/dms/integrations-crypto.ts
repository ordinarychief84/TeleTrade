import { createCipheriv, createDecipheriv, createHmac, randomBytes, timingSafeEqual } from 'crypto';

/**
 * Production crypto helpers for the integrations surface.
 *
 * - encryptSecret / decryptSecret: AES-256-GCM, base64-encoded `iv:tag:ct`.
 *   Used to store tenant DMS API keys at rest.
 * - webhookSecretFor: derives a stable per-tenant webhook signing secret from
 *   the platform key + tenantId. Rotating the platform key rotates everyone's
 *   secrets at once — documented for ops.
 * - signHmac / verifyHmac: HMAC-SHA256 over the raw request body, constant-time
 *   compare. The expected header is `X-TeleTrade-Signature: sha256=<hex>`.
 */

function loadKey(): Buffer {
  const raw = process.env.INTEGRATIONS_SIGNING_KEY;
  if (!raw || raw.length < 32) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('INTEGRATIONS_SIGNING_KEY must be set to a 32+ char value in production.');
    }
    // Dev fallback: a stable but loud placeholder. Logged once on first use.
    // eslint-disable-next-line no-console
    console.warn('[integrations-crypto] INTEGRATIONS_SIGNING_KEY not set — using insecure dev fallback. DO NOT use in prod.');
    return Buffer.from('dev-only-insecure-32byte-fallback!'.padEnd(32, '!').slice(0, 32));
  }
  // Accept either raw 32+ ASCII chars or hex. Truncate/pad to 32 bytes.
  if (/^[0-9a-f]{64}$/i.test(raw)) return Buffer.from(raw, 'hex');
  return Buffer.from(raw.padEnd(32, '!').slice(0, 32));
}

export function encryptSecret(plain: string): string {
  const key = loadKey();
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64')}.${tag.toString('base64')}.${ct.toString('base64')}`;
}

export function decryptSecret(blob: string): string {
  const [ivB, tagB, ctB] = blob.split('.');
  if (!ivB || !tagB || !ctB) throw new Error('Malformed encrypted secret');
  const key = loadKey();
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB, 'base64'));
  const pt = Buffer.concat([decipher.update(Buffer.from(ctB, 'base64')), decipher.final()]);
  return pt.toString('utf8');
}

export function maskSecret(plain: string): string {
  if (!plain) return '';
  const last4 = plain.slice(-4);
  return `***${last4}`;
}

export function webhookSecretFor(tenantId: string): string {
  return createHmac('sha256', loadKey()).update(`webhook:${tenantId}`).digest('hex');
}

export function signHmac(body: string, secret: string): string {
  return 'sha256=' + createHmac('sha256', secret).update(body).digest('hex');
}

export function verifyHmac(body: string, secret: string, header: string | undefined): boolean {
  if (!header) return false;
  const expected = signHmac(body, secret);
  if (expected.length !== header.length) return false;
  try {
    return timingSafeEqual(Buffer.from(expected), Buffer.from(header));
  } catch {
    return false;
  }
}
