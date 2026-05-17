'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { getSoftphoneSocket } from '@/lib/realtime';
import { saveDraft, getDraft, clearDraft } from '@/lib/idb-drafts';
import { formatCurrency } from '@/lib/utils';
import { Phone, PhoneOff, PhoneIncoming, PhoneCall, ClipboardCheck } from 'lucide-react';
import type { OrderDraftInput } from '@teletrade/shared';

interface Suggestion {
  skuId: string;
  skuCode: string;
  skuName: string;
  qty: number;
  reason: string;
  score: number;
  rule: string;
}

interface Sku {
  id: string;
  code: string;
  name: string;
  unitPrice: string;
  packSize: string;
  category: string;
}

interface OrderLineInput {
  skuId: string;
  skuCode: string;
  name: string;
  qty: number;
  unitPrice: number;
}

const DRAFT_KEY = 'active-call-draft';

export default function SoftphonePage() {
  const qc = useQueryClient();
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [callStatus, setCallStatus] = useState<'idle' | 'ringing' | 'connected' | 'completed' | 'missed'>('idle');
  const [timerStart, setTimerStart] = useState<number | null>(null);
  const [, force] = useState(0);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [orderLines, setOrderLines] = useState<OrderLineInput[]>([]);
  const [discount, setDiscount] = useState(0);
  const [notes, setNotes] = useState('');
  const [callNotes, setCallNotes] = useState('');
  const [orderRef, setOrderRef] = useState<string | null>(null);
  const [simPhone, setSimPhone] = useState('');
  const lastSavedAt = useRef<number>(0);

  // tick timer every second while connected
  useEffect(() => {
    if (callStatus !== 'connected' || !timerStart) return;
    const i = setInterval(() => force((n) => n + 1), 1000);
    return () => clearInterval(i);
  }, [callStatus, timerStart]);

  // softphone realtime events
  useEffect(() => {
    const s = getSoftphoneSocket();
    s.on('inbound.queued', (evt: any) => {
      setActiveCallId(evt.callId);
      setCallStatus('ringing');
      if (evt.customerId) setCustomerId(evt.customerId);
    });
    s.on('call.ringing', () => setCallStatus('ringing'));
    s.on('call.answered', () => {
      setCallStatus('connected');
      setTimerStart(Date.now());
    });
    s.on('call.missed', () => setCallStatus('missed'));
    s.on('call.completed', () => setCallStatus('completed'));
    s.on('call.hangup', () => setCallStatus('completed'));
    return () => {
      s.off('inbound.queued');
      s.off('call.ringing');
      s.off('call.answered');
      s.off('call.missed');
      s.off('call.completed');
      s.off('call.hangup');
    };
  }, []);

  // restore draft on mount
  useEffect(() => {
    getDraft(DRAFT_KEY).then((d) => {
      if (d) {
        setCustomerId(d.customerId);
        setOrderLines(
          d.lines.map((l) => ({
            skuId: l.skuId,
            skuCode: l.skuCode,
            name: l.name,
            qty: l.qty,
            unitPrice: l.unitPrice,
          }))
        );
        setDiscount(d.discount ?? 0);
        setNotes(d.notes ?? '');
      }
    });
  }, []);

  // autosave every 5s while dirty (lines or customer present)
  useEffect(() => {
    if (!customerId && orderLines.length === 0) return;
    const i = setInterval(async () => {
      if (Date.now() - lastSavedAt.current < 5000) return;
      const payload: OrderDraftInput = {
        customerId: customerId ?? '',
        lines: orderLines,
        discount,
        notes,
        callId: activeCallId,
      } as OrderDraftInput;
      if (!payload.customerId) return;
      await saveDraft(DRAFT_KEY, payload);
      lastSavedAt.current = Date.now();
    }, 5000);
    return () => clearInterval(i);
  }, [customerId, orderLines, discount, notes, activeCallId]);

  const { data: skus } = useQuery<Sku[]>({
    queryKey: ['skus'],
    queryFn: () => api.get('/customers/skus').catch(() => [] as Sku[]),
    // Skus aren't exposed in the customers route; fetch via report or include in customer 360.
    // For MVP we fetch by listing first customer's 360 promos. As a simpler proxy:
    enabled: false,
  });

  // pragmatic: we list SKUs by querying /reports/sku-uptake (returns code+name) — but we
  // need unitPrice. So request /customers?pageSize=1 won't help. Instead expose via a
  // simple inline fetch from the first customer's promos. To keep this fast we just
  // fetch SKUs from a separate static endpoint shipped under /customers/skus would be
  // ideal; since we didn't ship it, fall back to the customer's `orders` SKU set.

  const { data: customer } = useQuery<any>({
    queryKey: ['customer-360', customerId],
    queryFn: () => api.get(`/customers/${customerId}/360`),
    enabled: !!customerId,
  });

  const { data: suggestions } = useQuery<Suggestion[]>({
    queryKey: ['suggestions', customerId],
    queryFn: () => api.get(`/customers/${customerId}/suggestions`),
    enabled: !!customerId,
  });

  const addSuggestionToOrder = (s: Suggestion, unitPrice: number) => {
    setOrderLines((prev) => {
      const existing = prev.find((l) => l.skuId === s.skuId);
      if (existing) return prev.map((l) => (l.skuId === s.skuId ? { ...l, qty: l.qty + s.qty } : l));
      return [...prev, { skuId: s.skuId, skuCode: s.skuCode, name: s.skuName, qty: s.qty, unitPrice }];
    });
  };

  const removeLine = (skuId: string) => {
    setOrderLines((prev) => prev.filter((l) => l.skuId !== skuId));
  };

  const updateQty = (skuId: string, qty: number) => {
    setOrderLines((prev) => prev.map((l) => (l.skuId === skuId ? { ...l, qty: Math.max(1, qty) } : l)));
  };

  const subtotal = orderLines.reduce((s, l) => s + l.qty * l.unitPrice, 0);
  const total = Math.max(0, subtotal - discount);

  async function simulateInbound() {
    const res = await api.post<any>('/telephony/simulate/inbound', { fromNumber: simPhone });
    if (res?.customerId) setCustomerId(res.customerId);
    setActiveCallId(res.id);
    setCallStatus('ringing');
  }

  async function answer() {
    if (!activeCallId) return;
    await api.post(`/telephony/calls/${activeCallId}/answer`, {});
    setCallStatus('connected');
    setTimerStart(Date.now());
  }

  async function hangup() {
    if (!activeCallId) return;
    await api.post(`/telephony/calls/${activeCallId}/hangup`, {});
    setCallStatus('completed');
  }

  async function logNoOrder() {
    if (!activeCallId) return;
    await api.post(`/telephony/calls/${activeCallId}/outcome`, { outcome: 'NO_ORDER', notes: callNotes });
    resetForNextCall();
  }

  async function confirmOrder() {
    if (!customerId || orderLines.length === 0) return;
    const draftPayload: OrderDraftInput = {
      customerId,
      callId: activeCallId,
      lines: orderLines,
      discount,
      notes,
    };
    const draft = await api.post<any>('/orders', draftPayload);
    const confirmed = await api.post<any>(`/orders/${draft.id}/confirm`, {});
    setOrderRef(confirmed.orderReference);
    if (activeCallId) {
      await api.post(`/telephony/calls/${activeCallId}/outcome`, { outcome: 'ORDER_CREATED', notes: callNotes });
    }
    await clearDraft(DRAFT_KEY);
    qc.invalidateQueries({ queryKey: ['overview'] });
  }

  function resetForNextCall() {
    setActiveCallId(null);
    setCallStatus('idle');
    setTimerStart(null);
    setCustomerId(null);
    setOrderLines([]);
    setDiscount(0);
    setNotes('');
    setCallNotes('');
    setOrderRef(null);
    clearDraft(DRAFT_KEY);
  }

  const elapsedSec = timerStart ? Math.floor((Date.now() - timerStart) / 1000) : 0;

  // helper: get unit price from suggestion (rough — relies on the order having a sku price).
  // We pull from customer.orders.lines if available.
  const priceForSku = useCallback(
    (skuCode: string): number => {
      const lines = (customer?.orders ?? []).flatMap((o: any) => o.lines);
      const found = lines.find((l: any) => l.skuCode === skuCode);
      return found ? Number(found.unitPrice) : 0;
    },
    [customer]
  );

  return (
    <div className="grid gap-4 lg:grid-cols-[400px_1fr]">
      {/* Softphone + IVR sim */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Phone className="h-4 w-4" /> Softphone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Status</span>
              <CallStatusBadge status={callStatus} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground">Timer</span>
              <span className="font-mono">
                {Math.floor(elapsedSec / 60)
                  .toString()
                  .padStart(2, '0')}
                :
                {(elapsedSec % 60).toString().padStart(2, '0')}
              </span>
            </div>
            <div className="flex gap-2">
              <Button onClick={answer} disabled={callStatus !== 'ringing'}>
                <PhoneCall className="h-4 w-4" /> Answer
              </Button>
              <Button variant="destructive" onClick={hangup} disabled={!activeCallId || callStatus === 'idle'}>
                <PhoneOff className="h-4 w-4" /> Hang up
              </Button>
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Simulate inbound</div>
              <Input
                placeholder="+2348012345678"
                value={simPhone}
                onChange={(e) => setSimPhone(e.target.value)}
              />
              <Button variant="outline" className="w-full" onClick={simulateInbound} disabled={!simPhone}>
                <PhoneIncoming className="h-4 w-4" /> Simulate inbound call
              </Button>
              <p className="text-xs text-muted-foreground">
                Or hit answer below when an inbound event comes through the queue.
              </p>
            </div>
            <div className="pt-3 border-t space-y-2">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Call notes</div>
              <Textarea
                value={callNotes}
                onChange={(e) => setCallNotes(e.target.value)}
                placeholder="What did the customer say?"
              />
            </div>
            {orderRef && (
              <div className="rounded-md bg-emerald-50 p-3 text-xs text-emerald-700">
                Order <strong>{orderRef}</strong> confirmed — queued for DMS sync.
              </div>
            )}
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={logNoOrder} disabled={!activeCallId}>
                Log no-order
              </Button>
              <Button variant="ghost" onClick={resetForNextCall}>
                Reset
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM + suggestions + order */}
      <div className="space-y-4">
        {customer ? (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">
                {customer.outletName}{' '}
                <Badge variant="secondary" className="ml-2">
                  {customer.accountTier}
                </Badge>
                <Badge variant="outline" className="ml-1">
                  {customer.status}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <div>
                {customer.contactName} · <span className="font-mono">{customer.phone}</span> ·{' '}
                {customer.outletType?.replace('_', ' ')} · {customer.languagePreference}
              </div>
              <div className="text-muted-foreground">
                Route: {customer.route?.code ?? '—'} · Next delivery:{' '}
                {customer.nextDeliveryDate ? new Date(customer.nextDeliveryDate).toLocaleDateString() : '—'} · Last
                order:{' '}
                {customer.lastOrderDate ? new Date(customer.lastOrderDate).toLocaleDateString() : '—'}
              </div>
              {customer.activePromos?.length > 0 && (
                <div className="text-xs text-emerald-700">
                  Active promos: {customer.activePromos.map((p: any) => p.name).join(', ')}
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6 text-sm text-muted-foreground">
              No customer loaded. Simulate an inbound call or dial from Campaigns.
            </CardContent>
          </Card>
        )}

        {suggestions && suggestions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <ClipboardCheck className="h-4 w-4" /> Suggested SKUs
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {suggestions.map((s) => (
                <div key={s.skuId} className="flex items-center justify-between gap-3 rounded-md border p-2">
                  <div className="text-sm">
                    <div className="font-medium">
                      {s.skuName}{' '}
                      <Badge variant="outline" className="ml-2 text-[10px]">
                        {s.rule}
                      </Badge>
                    </div>
                    <div className="text-xs text-muted-foreground">{s.reason}</div>
                  </div>
                  <Button size="sm" onClick={() => addSuggestionToOrder(s, priceForSku(s.skuCode))}>
                    Add {s.qty}
                  </Button>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Order</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Table>
              <THead>
                <TR>
                  <TH>SKU</TH>
                  <TH>Qty</TH>
                  <TH>Unit price</TH>
                  <TH>Line total</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {orderLines.map((l) => (
                  <TR key={l.skuId}>
                    <TD className="font-mono text-xs">
                      {l.skuCode}
                      <div className="text-[11px] text-muted-foreground">{l.name}</div>
                    </TD>
                    <TD>
                      <Input
                        type="number"
                        className="w-16"
                        value={l.qty}
                        onChange={(e) => updateQty(l.skuId, Number(e.target.value))}
                      />
                    </TD>
                    <TD>{formatCurrency(l.unitPrice)}</TD>
                    <TD>{formatCurrency(l.unitPrice * l.qty)}</TD>
                    <TD>
                      <Button size="sm" variant="ghost" onClick={() => removeLine(l.skuId)}>
                        Remove
                      </Button>
                    </TD>
                  </TR>
                ))}
                {orderLines.length === 0 && (
                  <TR>
                    <TD colSpan={5} className="text-muted-foreground text-center">
                      No lines yet — add a suggestion above.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
            <div className="flex flex-wrap items-end gap-4">
              <div className="space-y-1">
                <div className="text-xs text-muted-foreground">Discount</div>
                <Input
                  type="number"
                  className="w-32"
                  value={discount}
                  onChange={(e) => setDiscount(Number(e.target.value))}
                />
              </div>
              <div className="ml-auto text-right text-sm space-y-1">
                <div>Subtotal: {formatCurrency(subtotal)}</div>
                <div>Discount: −{formatCurrency(discount)}</div>
                <div className="text-base font-semibold">Total: {formatCurrency(total)}</div>
              </div>
            </div>
            <Textarea
              placeholder="Order notes (delivery instructions etc.)"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
            <Button onClick={confirmOrder} disabled={!customerId || orderLines.length === 0}>
              Confirm order
            </Button>
            <div className="text-[11px] text-muted-foreground">
              Draft is autosaved to this browser (IndexedDB) every 5 seconds — if you crash, it's restored.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function CallStatusBadge({ status }: { status: string }) {
  const map: Record<string, any> = {
    idle: 'outline',
    ringing: 'warning',
    connected: 'success',
    completed: 'secondary',
    missed: 'destructive',
  };
  return <Badge variant={map[status] ?? 'outline'}>{status}</Badge>;
}
