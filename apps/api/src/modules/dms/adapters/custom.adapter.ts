import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

/**
 * Custom REST adapter — POSTs the payload as-is to DMS_CUSTOM_URL with a
 * bearer token. Useful for in-house ERPs.
 */
@Injectable()
export class CustomApiAdapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.CUSTOM;
  private readonly log = new Logger('CustomApiAdapter');

  async pushOrder(payload: DmsOrderPayload): Promise<DmsPushResult> {
    if (process.env.DMS_CUSTOM_URL && process.env.DMS_CUSTOM_TOKEN) {
      const res = await fetch(`${process.env.DMS_CUSTOM_URL}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.DMS_CUSTOM_TOKEN}`,
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`Custom DMS HTTP ${res.status}`);
      const json: any = await res.json().catch(() => ({}));
      return { externalRef: String(json.id ?? json.externalRef ?? `custom-${Date.now()}`), echo: json };
    }
    this.log.debug(`Custom adapter simulated push for ${payload.orderReference}`);
    return { externalRef: `custom-sim-${Date.now()}` };
  }

  async syncCustomers(_tenantId: string) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.orderRef, event: body?.event ?? 'unknown' };
  }
}
