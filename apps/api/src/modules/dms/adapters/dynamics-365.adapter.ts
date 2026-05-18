import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult, TenantDmsConfig } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Microsoft Dynamics 365 — OData v4 (POST salesorders). Real HTTP call when
 * tenant config provides URL + bearer token; otherwise simulated success.
 */
@Injectable()
export class Dynamics365Adapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.DYNAMICS_365;
  private readonly log = new Logger('Dynamics365Adapter');

  async pushOrder(payload: DmsOrderPayload, config: TenantDmsConfig): Promise<DmsPushResult> {
    const url = config.url ?? process.env.DMS_D365_URL;
    const token = config.apiKey ?? process.env.DMS_D365_TOKEN;

    const body = {
      name: payload.orderReference,
      customerid_account: payload.customer.outletName,
      description: payload.notes,
      salesorder_details: payload.lines.map((l) => ({
        productdescription: l.name,
        productid: l.skuCode,
        quantity: l.qty,
        priceperunit: l.unitPrice,
      })),
    };

    if (url && token) {
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/api/data/v9.2/salesorders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'OData-MaxVersion': '4.0',
            'OData-Version': '4.0',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Dynamics365 HTTP ${res.status}`);
        const json: any = await res.json().catch(() => ({}));
        return { externalRef: String(json.salesorderid ?? json.id ?? `d365-${Date.now()}`), echo: json };
      } catch (e) {
        const msg = (e as Error).message;
        this.log.warn(`Dynamics365 push failed (url=${url}): ${msg}`);
        throw new Error(`Dynamics365 push failed: ${msg}`);
      }
    }

    this.log.debug(`Dynamics365 simulated push for ${payload.orderReference}`);
    return { externalRef: `d365-sim-${Date.now()}`, echo: body };
  }

  async syncCustomers(_tenantId: string, _config: TenantDmsConfig) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.name, event: body?.event ?? 'unknown' };
  }
}
