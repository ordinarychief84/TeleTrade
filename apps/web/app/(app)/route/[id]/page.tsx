'use client';

import { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { formatCurrency } from '@/lib/utils';
import {
  Phone,
  Navigation,
  Truck,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
} from 'lucide-react';
import { DeliveryStatus, DeliveryFailureReason, PaymentMethod } from '@teletrade/shared';

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Planned',
  PICKED: 'Picked from depot',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Delivered',
  FAILED: 'Failed',
  RESCHEDULED: 'Rescheduled',
};

export default function StopDetail() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const qc = useQueryClient();
  const [view, setView] = useState<'main' | 'cash' | 'fail'>('main');

  const { data: stop, isError, error, refetch, isLoading } = useQuery<any>({
    queryKey: ['delivery', params.id],
    queryFn: () => api.get(`/deliveries/${params.id}`),
  });

  const statusMut = useMutation({
    mutationFn: (body: { status: string; failureReason?: string; rescheduledFor?: string; notes?: string }) =>
      api.patch(`/deliveries/${params.id}/status`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery', params.id] });
      qc.invalidateQueries({ queryKey: ['my-route'] });
    },
  });

  const cashMut = useMutation({
    mutationFn: (body: { amount: number; method: string }) => api.post(`/deliveries/${params.id}/cash`, body),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['delivery', params.id] });
      qc.invalidateQueries({ queryKey: ['my-route'] });
    },
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm space-y-2">
          <div className="font-medium">Couldn&apos;t load this stop.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <Button onClick={() => refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !stop) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="h-5 w-40 bg-muted rounded animate-pulse" />
          <div className="h-3 w-60 bg-muted rounded animate-pulse mt-2" />
        </CardContent>
      </Card>
    );
  }

  const isFinal = stop.status === 'DELIVERED' || stop.status === 'FAILED' || stop.status === 'RESCHEDULED';

  if (view === 'fail') {
    return <FailFlow stop={stop} onCancel={() => setView('main')} onDone={() => router.push('/route')} mut={statusMut} />;
  }
  if (view === 'cash') {
    return (
      <CashFlow
        stop={stop}
        onCancel={() => setView('main')}
        onDone={() => {
          statusMut.mutate({ status: DeliveryStatus.DELIVERED });
          router.push('/route');
        }}
        mut={cashMut}
      />
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <button onClick={() => router.push('/route')} className="text-sm text-muted-foreground">
        ← Back to route
      </button>

      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div>
              <div className="text-xs uppercase tracking-wide text-muted-foreground">Stop #{stop.sequence}</div>
              <div className="text-xl font-semibold">{stop.customer.outletName}</div>
              <div className="text-xs text-muted-foreground">{stop.customer.contactName}</div>
            </div>
            <Badge variant={isFinal ? 'success' : 'outline'}>{STATUS_LABEL[stop.status]}</Badge>
          </div>
          <div className="text-sm">{stop.customer.address}</div>
          <div className="grid grid-cols-2 gap-2 pt-2">
            <a
              href={`tel:${stop.customer.phone}`}
              className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
            >
              <Phone className="h-4 w-4" />
              Call
            </a>
            <a
              href={mapsHref(stop)}
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
            >
              <Navigation className="h-4 w-4" />
              Navigate
            </a>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">
              Order {stop.order.orderReference}
            </div>
            <div className="text-sm font-semibold">{formatCurrency(stop.order.total)}</div>
          </div>
          <ul className="text-sm divide-y">
            {stop.order.lines.map((l: any) => (
              <li key={l.id} className="flex items-center justify-between py-1.5">
                <div>
                  <div className="font-medium">{l.name}</div>
                  <div className="text-[11px] text-muted-foreground font-mono">{l.skuCode}</div>
                </div>
                <div className="text-right">
                  <div>×{l.qty}</div>
                  <div className="text-[11px] text-muted-foreground">{formatCurrency(l.unitPrice)} ea</div>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      {!isFinal && (
        <>
          {stop.status === 'PLANNED' && (
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => statusMut.mutate({ status: DeliveryStatus.PICKED })}
              disabled={statusMut.isPending}
            >
              <Truck className="h-5 w-5" />
              Pick up from depot
            </Button>
          )}
          {(stop.status === 'PICKED') && (
            <Button
              size="lg"
              variant="outline"
              className="w-full"
              onClick={() => statusMut.mutate({ status: DeliveryStatus.IN_TRANSIT })}
              disabled={statusMut.isPending}
            >
              <Navigation className="h-5 w-5" />
              On the way
            </Button>
          )}
          <Button size="lg" className="w-full" onClick={() => setView('cash')}>
            <CheckCircle2 className="h-5 w-5" />
            Mark delivered &amp; collect
          </Button>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="destructive" onClick={() => setView('fail')}>
              <AlertTriangle className="h-4 w-4" />
              Mark failed
            </Button>
            <Button
              variant="secondary"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                tomorrow.setHours(9, 0, 0, 0);
                statusMut.mutate({ status: DeliveryStatus.RESCHEDULED, rescheduledFor: tomorrow.toISOString() });
              }}
            >
              <RotateCcw className="h-4 w-4" />
              Reschedule
            </Button>
          </div>
          {statusMut.error && (
            <div className="text-sm text-destructive">{(statusMut.error as Error).message}</div>
          )}
        </>
      )}

      {stop.status === 'DELIVERED' && (
        <Card className="border-emerald-300/40">
          <CardContent className="p-4 text-sm">
            <div className="font-medium text-emerald-700">
              Delivered{stop.deliveredAt && ' at ' + new Date(stop.deliveredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.
            </div>
            <div className="text-muted-foreground mt-1">
              {stop.amountCollected
                ? `${formatCurrency(stop.amountCollected)} collected (${stop.paymentMethod ?? 'CASH'}). Thank ${stop.customer.contactName.split(' ')[0]}.`
                : 'No cash recorded for this stop.'}
            </div>
          </CardContent>
        </Card>
      )}
      {stop.status === 'FAILED' && (
        <Card className="border-destructive/40">
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Marked failed — {stop.failureReason?.replace(/_/g, ' ').toLowerCase()}.</div>
            <div className="text-muted-foreground mt-1">{stop.notes ?? "We'll let dispatch know."}</div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function CashFlow({ stop, onCancel, onDone, mut }: any) {
  const [amount, setAmount] = useState<number>(Number(stop.order.total));
  const [method, setMethod] = useState(PaymentMethod.CASH);
  const expected = Number(stop.order.total);
  const delta = amount - expected;

  async function submit() {
    if (mut.isPending) return;
    await mut.mutateAsync({ amount, method });
    onDone();
  }

  return (
    <div className="space-y-4 max-w-xl">
      <button onClick={onCancel} className="text-sm text-muted-foreground">← Cancel</button>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="text-xs uppercase tracking-wide text-muted-foreground">Cash from {stop.customer.outletName}</div>
          <div className="text-3xl font-semibold">{formatCurrency(amount)}</div>
          <Input
            type="number"
            inputMode="numeric"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="text-2xl h-14"
          />
          <Select value={method} onChange={(e) => setMethod(e.target.value as any)}>
            {Object.values(PaymentMethod).map((m) => (
              <option key={m} value={m}>{m.replace('_', ' ')}</option>
            ))}
          </Select>
          {Math.abs(delta) > 0 && (
            <div className={'text-sm ' + (delta < 0 ? 'text-amber-600' : 'text-emerald-600')}>
              {delta < 0
                ? `Short by ${formatCurrency(-delta)} — dispatch will reconcile.`
                : `Surplus ${formatCurrency(delta)} — confirm before submitting.`}
            </div>
          )}
          {mut.error && <div className="text-sm text-destructive">{(mut.error as Error).message}</div>}
          <Button size="lg" className="w-full" onClick={submit} disabled={mut.isPending || amount < 0}>
            {mut.isPending ? 'Submitting…' : `Confirm ${formatCurrency(amount)} & finish`}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function FailFlow({ stop, onCancel, onDone, mut }: any) {
  const [reason, setReason] = useState<string>(DeliveryFailureReason.OUTLET_CLOSED);
  const [notes, setNotes] = useState('');
  const [reschedule, setReschedule] = useState(false);

  async function submit() {
    const payload: any = { status: DeliveryStatus.FAILED, failureReason: reason, notes };
    if (reschedule) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      payload.status = DeliveryStatus.RESCHEDULED;
      payload.rescheduledFor = tomorrow.toISOString();
    }
    await mut.mutateAsync(payload);
    onDone();
  }

  return (
    <div className="space-y-4 max-w-xl">
      <button onClick={onCancel} className="text-sm text-muted-foreground">← Cancel</button>
      <Card>
        <CardContent className="p-4 space-y-3">
          <div>
            <div className="text-xs uppercase tracking-wide text-muted-foreground">Why couldn&apos;t you deliver?</div>
            <div className="text-base font-semibold">{stop.customer.outletName}</div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {Object.values(DeliveryFailureReason).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={
                  'rounded-md border px-3 py-2 text-sm text-left ' +
                  (reason === r ? 'bg-primary text-primary-foreground border-primary' : 'bg-background hover:bg-accent')
                }
              >
                {r.replace(/_/g, ' ').toLowerCase()}
              </button>
            ))}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Anything dispatch should know?"
          />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={reschedule} onChange={(e) => setReschedule(e.target.checked)} />
            Reschedule for tomorrow 9 AM
          </label>
          {mut.error && <div className="text-sm text-destructive">{(mut.error as Error).message}</div>}
          <Button size="lg" className="w-full" variant="destructive" onClick={submit} disabled={mut.isPending}>
            {mut.isPending ? 'Saving…' : reschedule ? 'Reschedule stop' : 'Mark failed'}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function mapsHref(stop: any) {
  if (stop.customer.latitude && stop.customer.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${stop.customer.latitude},${stop.customer.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(stop.customer.address)}`;
}
