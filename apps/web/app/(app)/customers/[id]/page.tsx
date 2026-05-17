'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { formatCurrency, formatDate, relativeDays } from '@/lib/utils';

interface Customer360 {
  id: string;
  outletName: string;
  contactName: string;
  phone: string;
  languagePreference: string;
  outletType: string;
  address: string;
  latitude: number | null;
  longitude: number | null;
  accountTier: string;
  status: string;
  preferredSkus: string[];
  notes: string | null;
  nextDeliveryDate: string | null;
  lastOrderDate: string | null;
  creditLimit: string | null;
  outstandingBalance: string | null;
  route?: { code: string; name: string } | null;
  territory?: { code: string; name: string } | null;
  orders: Array<{
    id: string;
    orderReference: string;
    status: string;
    total: string;
    createdAt: string;
    lines: Array<{ skuCode: string; name: string; qty: number }>;
  }>;
  calls: Array<{
    id: string;
    direction: string;
    status: string;
    outcome: string | null;
    createdAt: string;
    durationSec: number | null;
  }>;
  activePromos: Array<{ id: string; name: string; description: string; code: string }>;
}

export default function CustomerDetailPage() {
  const params = useParams<{ id: string }>();
  const { data, isLoading } = useQuery<Customer360>({
    queryKey: ['customer-360', params.id],
    queryFn: () => api.get(`/customers/${params.id}/360`),
    enabled: !!params.id,
  });

  if (isLoading || !data) return <div className="text-muted-foreground">Loading…</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{data.outletName}</h1>
          <p className="text-sm text-muted-foreground">
            {data.contactName} · <span className="font-mono">{data.phone}</span> · {data.outletType.replace('_', ' ')}
          </p>
        </div>
        <div className="flex gap-2">
          <Badge>{data.accountTier}</Badge>
          <Badge variant="outline">{data.status}</Badge>
          <Badge variant="secondary">{data.languagePreference}</Badge>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Coverage</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Route: {data.route?.code ?? '—'} {data.route?.name && <span className="text-muted-foreground">— {data.route.name}</span>}</div>
            <div>Territory: {data.territory?.name ?? '—'}</div>
            <div>Address: {data.address}</div>
            <div>Last order: {relativeDays(data.lastOrderDate)}</div>
            <div>Next delivery: {data.nextDeliveryDate ? formatDate(data.nextDeliveryDate, { timeStyle: undefined }) : '—'}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Credit</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <div>Limit: {formatCurrency(data.creditLimit)}</div>
            <div>Outstanding: {formatCurrency(data.outstandingBalance)}</div>
            <div>Preferred SKUs: {data.preferredSkus.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active promotions</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            {data.activePromos.length === 0 && <span className="text-muted-foreground">None applicable.</span>}
            {data.activePromos.map((p) => (
              <div key={p.id}>
                <span className="font-medium">{p.name}</span> — {p.description}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Status</TH>
                <TH>Total</TH>
                <TH>Items</TH>
                <TH>Date</TH>
              </TR>
            </THead>
            <TBody>
              {data.orders.map((o) => (
                <TR key={o.id}>
                  <TD className="font-mono text-xs">{o.orderReference}</TD>
                  <TD>{o.status}</TD>
                  <TD>{formatCurrency(o.total)}</TD>
                  <TD className="text-xs">{o.lines.map((l) => `${l.skuCode}×${l.qty}`).join(', ')}</TD>
                  <TD className="text-xs">{formatDate(o.createdAt)}</TD>
                </TR>
              ))}
              {data.orders.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-muted-foreground text-center">
                    No orders yet.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Call history</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Direction</TH>
                <TH>Status</TH>
                <TH>Outcome</TH>
                <TH>Duration</TH>
                <TH>When</TH>
              </TR>
            </THead>
            <TBody>
              {data.calls.map((c) => (
                <TR key={c.id}>
                  <TD>{c.direction}</TD>
                  <TD>{c.status}</TD>
                  <TD>{c.outcome ?? '—'}</TD>
                  <TD className="text-xs">{c.durationSec ? `${Math.round(c.durationSec)}s` : '—'}</TD>
                  <TD className="text-xs">{formatDate(c.createdAt)}</TD>
                </TR>
              ))}
              {data.calls.length === 0 && (
                <TR>
                  <TD colSpan={5} className="text-muted-foreground text-center">No calls yet.</TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {data.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Notes</CardTitle>
          </CardHeader>
          <CardContent className="text-sm">{data.notes}</CardContent>
        </Card>
      )}
    </div>
  );
}
