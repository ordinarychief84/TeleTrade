import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult, TenantDmsConfig } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * SAP Business One — Service Layer (POST /Orders). Tries a real HTTP call
 * when tenant config supplies a URL + Basic-auth credentials; otherwise
 * simulates a successful push for dev / unconfigured tenants.
 */
@Injectable()
export class SapB1Adapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.SAP_B1;
  private readonly log = new Logger('SapB1Adapter');

  async pushOrder(payload: DmsOrderPayload, config: TenantDmsConfig): Promise<DmsPushResult> {
    const url = config.url ?? process.env.DMS_SAP_URL;
    const username = config.username ?? process.env.DMS_SAP_USERNAME;
    const password = config.apiKey ?? process.env.DMS_SAP_PASSWORD;
    const company = config.database ?? process.env.DMS_SAP_COMPANY;

    const body = {
      CardName: payload.customer.outletName,
      DocNum: payload.orderReference,
      Comments: payload.notes ?? '',
      DocumentLines: payload.lines.map((l) => ({
        ItemCode: l.skuCode,
        ItemDescription: l.name,
        Quantity: l.qty,
        UnitPrice: l.unitPrice,
      })),
    };

    if (url && username && password && company) {
      try {
        const auth = Buffer.from(`${username}:${password}`).toString('base64');
        const res = await fetch(`${url.replace(/\/$/, '')}/b1s/v1/Orders`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Basic ${auth}`,
            CompanyDB: company,
          },
          body: JSON.stringify(body),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`SAP B1 HTTP ${res.status}`);
        const json: any = await res.json().catch(() => ({}));
        return { externalRef: String(json.DocNum ?? json.DocEntry ?? `sap-${Date.now()}`), echo: json };
      } catch (e) {
        const msg = (e as Error).message;
        this.log.warn(`SAP B1 push failed (url=${url}): ${msg}`);
        throw new Error(`SAP B1 push failed: ${msg}`);
      }
    }

    this.log.debug(`SAP B1 simulated push for ${payload.orderReference}`);
    return { externalRef: `sap-sim-${Date.now()}`, echo: body };
  }

  async syncCustomers(_tenantId: string, _config: TenantDmsConfig) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.DocNum, event: body?.event ?? 'unknown' };
  }
}
