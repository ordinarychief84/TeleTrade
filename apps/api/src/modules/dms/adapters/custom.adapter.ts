import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult, TenantDmsConfig } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Custom REST adapter — POSTs the payload as-is to `${url}/orders` with a
 * bearer token. Useful for in-house ERPs. Honours tenant config first, then
 * falls back to platform env (DMS_CUSTOM_URL / DMS_CUSTOM_TOKEN), then
 * simulates success for fully unconfigured tenants.
 */
@Injectable()
export class CustomApiAdapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.CUSTOM;
  private readonly log = new Logger('CustomApiAdapter');

  async pushOrder(payload: DmsOrderPayload, config: TenantDmsConfig): Promise<DmsPushResult> {
    const url = config.url ?? process.env.DMS_CUSTOM_URL;
    const token = config.apiKey ?? process.env.DMS_CUSTOM_TOKEN;

    if (url && token) {
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Custom DMS HTTP ${res.status}`);
        const json: any = await res.json().catch(() => ({}));
        return { externalRef: String(json.id ?? json.externalRef ?? `custom-${Date.now()}`), echo: json };
      } catch (e) {
        const msg = (e as Error).message;
        this.log.warn(`Custom adapter push failed (url=${url}): ${msg}`);
        throw new Error(`Custom DMS push failed: ${msg}`);
      }
    }
    this.log.debug(`Custom adapter simulated push for ${payload.orderReference}`);
    return { externalRef: `custom-sim-${Date.now()}` };
  }

  async syncCustomers(_tenantId: string, _config: TenantDmsConfig) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.orderRef, event: body?.event ?? 'unknown' };
  }
}
