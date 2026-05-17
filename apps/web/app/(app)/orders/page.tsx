'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { OrderStatus } from '@teletrade/shared';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function OrdersPage() {
  const [status, setStatus] = useState('');
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['orders', status],
    queryFn: () => api.get(`/orders${status ? `?status=${status}` : ''}`),
  });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Orders</h1>
      <Card>
        <CardHeader className="flex flex-row items-end gap-3">
          <div className="flex-1">
            <CardTitle className="text-sm">Status</CardTitle>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              {Object.values(OrderStatus).map((s) => (
                <option key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          {data && <div className="text-sm text-muted-foreground">{data.length} shown</div>}
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
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
                {!data?.length && (
                  <TR>
                    <TD colSpan={6} className="text-muted-foreground text-center">
                      No orders.
                    </TD>
                  </TR>
                )}
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
    <span className="inline-flex items-center gap-1">
      <Badge variant={map[status] ?? 'default'}>{status.replace(/_/g, ' ')}</Badge>
      {duplicate && status !== 'FLAGGED_DUPLICATE' && (
        <Badge variant="destructive" className="text-[10px]">
          dup
        </Badge>
      )}
    </span>
  );
}
