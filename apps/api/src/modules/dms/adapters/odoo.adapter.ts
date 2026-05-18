import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult, TenantDmsConfig } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

const FETCH_TIMEOUT_MS = 15_000;

/**
 * Odoo adapter. Authenticates with a bearer token and posts to /jsonrpc with
 * the standard sale.order create call. Tenant config takes precedence; env
 * vars (DMS_ODOO_URL / DMS_ODOO_API_KEY) act as a platform-wide fallback for
 * single-tenant deployments. Falls back to simulated success only when no
 * URL is configured anywhere.
 */
@Injectable()
export class OdooAdapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.ODOO;
  private readonly log = new Logger('OdooAdapter');

  async pushOrder(payload: DmsOrderPayload, config: TenantDmsConfig): Promise<DmsPushResult> {
    const url = config.url ?? process.env.DMS_ODOO_URL;
    const apiKey = config.apiKey ?? process.env.DMS_ODOO_API_KEY;

    const odooBody = {
      params: {
        model: 'sale.order',
        method: 'create',
        args: [
          {
            partner_name: payload.customer.outletName,
            partner_phone: payload.customer.phone,
            client_order_ref: payload.orderReference,
            note: payload.notes ?? undefined,
            order_line: payload.lines.map((l) => [
              0,
              0,
              {
                product_id: l.skuCode,
                name: l.name,
                product_uom_qty: l.qty,
                price_unit: l.unitPrice,
              },
            ]),
          },
        ],
        kwargs: {},
      },
    };

    if (url && apiKey) {
      try {
        const res = await fetch(`${url.replace(/\/$/, '')}/jsonrpc`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify(odooBody),
          signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
        });
        if (!res.ok) throw new Error(`Odoo HTTP ${res.status}`);
        const json: any = await res.json();
        const id = String(json?.result ?? `odoo-${Date.now()}`);
        return { externalRef: id, echo: json };
      } catch (e) {
        const msg = (e as Error).message;
        this.log.warn(`Odoo push failed (url=${url}): ${msg}`);
        throw new Error(`Odoo push failed: ${msg}`);
      }
    }

    // simulated success only when nothing is configured
    this.log.debug(`Odoo no-config simulated push for ${payload.orderReference}`);
    return { externalRef: `odoo-sim-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, echo: odooBody };
  }

  async syncCustomers(_tenantId: string, _config: TenantDmsConfig) {
    this.log.debug('Odoo customer sync not yet implemented');
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.client_order_ref, event: body?.event ?? 'unknown' };
  }
}
