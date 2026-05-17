'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, Truck, Navigation, Phone } from 'lucide-react';

interface Assignment {
  id: string;
  status: string;
  sequence: number;
  scheduledFor: string;
  amountCollected: string | null;
  customer: {
    id: string;
    outletName: string;
    contactName: string;
    phone: string;
    address: string;
    latitude: number | null;
    longitude: number | null;
  };
  order: { orderReference: string; total: string; lines: { skuCode: string; qty: number }[] };
  route: { code: string; name: string };
}

interface MyRoute {
  assignments: Assignment[];
  totals: { value: number; collected: number; delivered: number; failed: number; pending: number };
}

const STATUS_COLOR: Record<string, 'default' | 'success' | 'warning' | 'destructive' | 'secondary' | 'outline'> = {
  PLANNED: 'outline',
  PICKED: 'secondary',
  IN_TRANSIT: 'warning',
  DELIVERED: 'success',
  FAILED: 'destructive',
  RESCHEDULED: 'secondary',
};

const STATUS_LABEL: Record<string, string> = {
  PLANNED: 'Next',
  PICKED: 'Picked',
  IN_TRANSIT: 'On the way',
  DELIVERED: 'Done',
  FAILED: 'Failed',
  RESCHEDULED: 'Rescheduled',
};

export default function RouteHome() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery<MyRoute>({
    queryKey: ['my-route'],
    queryFn: () => api.get('/deliveries/my-route'),
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 space-y-2 text-sm">
          <div className="font-medium">Couldn&apos;t load today&apos;s route.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <Button onClick={() => refetch()} className="mt-2">Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-4">
              <div className="h-4 w-32 bg-muted rounded animate-pulse" />
              <div className="h-3 w-44 bg-muted rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const stops = data.assignments;
  if (!stops.length) {
    return (
      <Card>
        <CardContent className="p-6 text-sm space-y-2 text-center">
          <Truck className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="font-medium">No route assigned yet.</div>
          <div className="text-muted-foreground">Check with dispatch — your run lands here as soon as it&apos;s set.</div>
        </CardContent>
      </Card>
    );
  }

  const nextStop = stops.find((s) => s.status === 'PLANNED' || s.status === 'PICKED' || s.status === 'IN_TRANSIT');
  const routeName = stops[0]!.route;
  const remaining = data.totals.pending;
  const done = data.totals.delivered;
  const failed = data.totals.failed;

  return (
    <div className="space-y-4">
      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground">{routeName.code}</div>
        <h1 className="text-2xl font-semibold">{routeName.name}</h1>
        <p className="text-sm text-muted-foreground">
          {stops.length} stops · {formatCurrency(data.totals.value)} expected today
          {isFetching && <span> · refreshing…</span>}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Card className="border-emerald-300/40">
          <CardContent className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Done</div>
            <div className="text-xl font-semibold text-emerald-600">{done}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Left</div>
            <div className="text-xl font-semibold">{remaining}</div>
          </CardContent>
        </Card>
        <Card className={failed ? 'border-destructive/40' : undefined}>
          <CardContent className="p-3">
            <div className="text-[10px] uppercase text-muted-foreground">Failed</div>
            <div className="text-xl font-semibold">{failed}</div>
          </CardContent>
        </Card>
      </div>

      {nextStop && (
        <Link href={`/route/${nextStop.id}`}>
          <Card className="border-primary/60 hover:bg-accent/30 transition">
            <CardContent className="p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">Next stop · #{nextStop.sequence}</div>
                  <div className="text-lg font-semibold">{nextStop.customer.outletName}</div>
                  <div className="text-xs text-muted-foreground">
                    {nextStop.customer.address} · {nextStop.customer.contactName}
                  </div>
                </div>
                <Badge variant={STATUS_COLOR[nextStop.status]}>{STATUS_LABEL[nextStop.status]}</Badge>
              </div>
              <div className="mt-3 flex items-center justify-between">
                <span className="text-sm font-mono">{nextStop.customer.phone}</span>
                <span className="text-sm font-semibold">{formatCurrency(nextStop.order.total)}</span>
              </div>
              <div className="mt-3 grid grid-cols-2 gap-2">
                <a
                  href={`tel:${nextStop.customer.phone}`}
                  className="inline-flex items-center justify-center gap-2 rounded-md border bg-background px-3 py-2 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Phone className="h-4 w-4" /> Call outlet
                </a>
                <a
                  href={mapsHref(nextStop)}
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center justify-center gap-2 rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm"
                  onClick={(e) => e.stopPropagation()}
                >
                  <Navigation className="h-4 w-4" /> Navigate
                </a>
              </div>
            </CardContent>
          </Card>
        </Link>
      )}

      <div>
        <div className="text-xs uppercase tracking-wide text-muted-foreground mb-1 px-1">All stops</div>
        <div className="space-y-2">
          {stops.map((a) => {
            const isNext = a.id === nextStop?.id;
            const isDone = a.status === 'DELIVERED';
            const isFail = a.status === 'FAILED';
            return (
              <Link key={a.id} href={`/route/${a.id}`}>
                <Card
                  className={
                    isDone
                      ? 'opacity-70 border-emerald-300/40'
                      : isFail
                        ? 'border-destructive/40'
                        : isNext
                          ? 'border-primary/60'
                          : undefined
                  }
                >
                  <CardContent className="p-3 flex items-center gap-3">
                    {isDone ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
                    ) : isFail ? (
                      <AlertTriangle className="h-5 w-5 text-destructive shrink-0" />
                    ) : (
                      <span className="h-7 w-7 rounded-full bg-muted text-xs font-semibold flex items-center justify-center shrink-0">
                        {a.sequence}
                      </span>
                    )}
                    <div className="flex-1 min-w-0">
                      <div className={'text-sm font-medium truncate ' + (isDone ? 'line-through' : '')}>
                        {a.customer.outletName}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {a.customer.address} · {STATUS_LABEL[a.status]}
                      </div>
                    </div>
                    <div className="text-sm text-right shrink-0">
                      <div className="font-semibold">{formatCurrency(a.order.total)}</div>
                      {a.amountCollected && (
                        <div className="text-[11px] text-emerald-600">
                          +{formatCurrency(a.amountCollected)}
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>

      {remaining === 0 && (
        <Link href="/route/summary">
          <Button className="w-full" size="lg">
            End run &amp; close out
          </Button>
        </Link>
      )}
    </div>
  );
}

function mapsHref(a: Assignment) {
  if (a.customer.latitude && a.customer.longitude) {
    return `https://www.google.com/maps/dir/?api=1&destination=${a.customer.latitude},${a.customer.longitude}`;
  }
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(a.customer.address)}`;
}
