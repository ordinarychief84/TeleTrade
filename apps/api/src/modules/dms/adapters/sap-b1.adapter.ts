import { Injectable, Logger } from '@nestjs/common';
import { DmsAdapter, DmsOrderPayload, DmsPushResult } from '../adapter.interface';
import { DmsAdapterKind } from '@teletrade/shared';

/**
 * SAP Business One — Service Layer (POST /Orders).
 * MVP skeleton: shapes the payload, simulates success.
 */
@Injectable()
export class SapB1Adapter implements DmsAdapter {
  readonly kind = DmsAdapterKind.SAP_B1;
  private readonly log = new Logger('SapB1Adapter');

  async pushOrder(payload: DmsOrderPayload): Promise<DmsPushResult> {
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
    this.log.debug(`SAP B1 simulated push for ${payload.orderReference}`);
    return { externalRef: `sap-sim-${Date.now()}`, echo: body };
  }

  async syncCustomers(_tenantId: string) {
    return { upserted: 0 };
  }

  async handleWebhook(_headers: Record<string, string>, body: any) {
    return { orderRef: body?.DocNum, event: body?.event ?? 'unknown' };
  }
}
