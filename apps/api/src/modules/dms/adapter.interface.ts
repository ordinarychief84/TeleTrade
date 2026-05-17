/**
 * DmsAdapter — contract every ERP/DMS integration must implement.
 *
 * Four shipped implementations:
 *   - OdooAdapter           (REST + JSON-RPC over /web/session/authenticate)
 *   - SapB1Adapter          (Service Layer)
 *   - Dynamics365Adapter    (OData v4 + bearer)
 *   - CustomApiAdapter      (generic REST behind a bearer token)
 *
 * The adapter is intentionally narrow — orchestration (retries, dead-letter,
 * audit) lives in DmsService and the BullMQ processor.
 */
import { DmsAdapterKind } from '@teletrade/shared';

export interface DmsOrderPayload {
  orderReference: string;
  tenantSlug: string;
  customer: {
    id: string;
    outletName: string;
    contactName: string;
    phone: string;
    address: string;
    routeCode?: string | null;
    territoryCode?: string | null;
  };
  lines: {
    skuCode: string;
    name: string;
    qty: number;
    unitPrice: number;
    lineTotal: number;
  }[];
  subtotal: number;
  discount: number;
  total: number;
  notes?: string | null;
  promoCode?: string | null;
}

export interface DmsPushResult {
  externalRef: string;
  echo?: Record<string, unknown>;
}

export interface DmsAdapter {
  readonly kind: DmsAdapterKind;
  pushOrder(payload: DmsOrderPayload): Promise<DmsPushResult>;
  /** Optional nightly inbound sync — implementations can no-op in MVP. */
  syncCustomers(tenantId: string): Promise<{ upserted: number }>;
  /** Optional webhook verification + parsing. */
  handleWebhook(headers: Record<string, string>, body: unknown): Promise<{ orderRef?: string; event: string }>;
}
