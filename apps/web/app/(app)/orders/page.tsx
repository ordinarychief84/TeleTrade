'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { OrderStatus } from '@teletrade/shared';
import { formatCurrency, formatDate, relativeDays } from '@/lib/utils';
import { ShoppingCart } from 'lucide-react';

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading, isError, error, refetch } = useQuery<any[]>({
    queryKey: ['orders', status],
    queryFn: () => api.get(`/orders${status ? `?status=${status}` : ''}`),
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm space-y-2">
          <div className="font-medium">Couldn&apos;t load orders.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <button onClick={() => refetch()} className="text-primary underline">Try again</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Orders</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {data ? `${data.length} order${data.length === 1 ? '' : 's'} shown.` : ''}
        </p>
      </div>

      <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11 md:max-w-xs">
        <option value="">All statuses</option>
        {Object.values(OrderStatus).map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, ' ').toLowerCase()}
          </option>
        ))}
      </Select>

      {isLoading && (
        <div className="space-y-2 md:hidden">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="h-4 w-32 bg-muted rounded animate-pulse" />
                <div className="h-3 w-44 bg-muted rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <Card>
          <CardContent className="p-6 text-sm text-center space-y-2">
            <ShoppingCart className="h-6 w-6 mx-auto text-muted-foreground" />
            <div className="font-medium">No orders here yet.</div>
            <div className="text-muted-foreground">
              Once an order is confirmed in the softphone or DMS, it lands in this list.
            </div>
          </CardContent>
        </Card>
      )}

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {data?.map((o: any) => (
          <Card key={o.id}>
            <CardContent className="p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="font-mono text-xs text-muted-foreground truncate">{o.orderReference}</div>
                  <div className="font-medium text-sm truncate">{o.customer?.outletName ?? 'Unknown outlet'}</div>
                </div>
                <OrderStatusBadge status={o.status} duplicate={o.duplicateFlag} />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{relativeDays(o.createdAt)} · {o.lines?.length ?? 0} line{o.lines?.length === 1 ? '' : 's'}</span>
                <span className="font-semibold text-sm">{formatCurrency(o.total)}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Reference</TH>
                  <TH>Customer</TH>
                  <TH>Status</TH>
                  <TH>Total</TH>
                  <TH>Lines</TH>
                  <TH>Created</TH>
                </TR>
              </THead>
              <TBody>
                {data?.map((o: any) => (
                  <TR key={o.id}>
                    <TD className="font-mono text-xs">{o.orderReference}</TD>
                    <TD>{o.customer?.outletName ?? '—'}</TD>
                    <TD>
                      <OrderStatusBadge status={o.status} duplicate={o.duplicateFlag} />
                    </TD>
                    <TD>{formatCurrency(o.total)}</TD>
                    <TD className="text-xs">{o.lines?.length ?? 0}</TD>
                    <TD className="text-xs">{formatDate(o.createdAt)}</TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function OrderStatusBadge({ status, duplicate }: { status: string; duplicate?: boolean }) {
  const map: Record<string, any> = {
    DRAFT: 'outline',
    CONFIRMED: 'secondary',
    PENDING_SYNC: 'warning',
    SYNCED: 'success',
    FLAGGED_DUPLICATE: 'destructive',
    DELIVERED: 'success',
    CANCELLED: 'destructive',
  };
  return (
    <span className="inline-flex items-center gap-1 shrink-0">
      <Badge variant={map[status] ?? 'default'}>{status.replace(/_/g, ' ').toLowerCase()}</Badge>
      {duplicate && status !== 'FLAGGED_DUPLICATE' && (
        <Badge variant="destructive" className="text-[10px]">
          dup
        </Badge>
      )}
    </span>
  );
}
