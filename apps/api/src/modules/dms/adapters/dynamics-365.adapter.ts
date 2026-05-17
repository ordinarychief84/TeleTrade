import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

/**
 * Microsoft Dynamics 365 — OData v4 (POST salesorders).
 * MVP skeleton.
 */
@Injectable()
export class Dynamics365Adapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.DYNAMICS_365;
  private readonly log = new Logger('Dynamics365Adapter');

  async pushOrder(payload: DmsOrderPayload): Promise<DmsPushResult> {
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
    this.log.debug(`Dynamics365 simulated push for ${payload.orderReference}`);
    return { externalRef: `d365-sim-${Date.now()}`, echo: body };
  }

  async syncCustomers(_tenantId: string) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.name, event: body?.event ?? 'unknown' };
  }
}
