'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { relativeDays } from '@/lib/utils';

interface CustomerRow {
  id: string;
  outletName: string;
  contactName: string;
  phone: string;
  accountTier: string;
  outletType: string;
  status: string;
  lastOrderDate: string | null;
  route?: { code: string; name: string } | null;
  territory?: { code: string; name: string } | null;
}

interface CustomerPage {
  items: CustomerRow[];
  total: number;
}

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery<CustomerPage>({
    queryKey: ['customers', q, status],
    queryFn: () => {
      const p = new URLSearchParams();
      if (q) p.set('q', q);
      if (status) p.set('status', status);
      return api.get(`/customers?${p.toString()}`);
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Customers</h1>
          <p className="text-sm text-muted-foreground">Traditional-trade outlets in this distributor.</p>
        </div>
      </div>
      <Card>
        <CardHeader className="grid gap-4 md:grid-cols-3 md:items-end">
          <div>
            <CardTitle className="text-sm">Search</CardTitle>
            <Input placeholder="Outlet, contact, phone…" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <div>
            <CardTitle className="text-sm">Status</CardTitle>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">All</option>
              <option value="ACTIVE">Active</option>
              <option value="DORMANT">Dormant</option>
              <option value="PHONE_ONLY">Phone-only</option>
              <option value="UNREACHABLE">Unreachable</option>
            </Select>
          </div>
          <div className="text-sm text-muted-foreground">
            {data && <span>{data.total.toLocaleString()} outlets</span>}
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-muted-foreground">Loading…</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Outlet</TH>
                  <TH>Contact</TH>
                  <TH>Phone</TH>
                  <TH>Tier</TH>
                  <TH>Type</TH>
                  <TH>Route</TH>
                  <TH>Status</TH>
                  <TH>Last order</TH>
                </TR>
              </THead>
              <TBody>
                {data?.items.map((c) => (
                  <TR key={c.id}>
                    <TD className="font-medium">
                      <Link href={`/customers/${c.id}`} className="hover:underline">
                        {c.outletName}
                      </Link>
                    </TD>
                    <TD>{c.contactName}</TD>
                    <TD className="font-mono text-xs">{c.phone}</TD>
                    <TD>{c.accountTier}</TD>
                    <TD className="text-xs">{c.outletType.replace('_', ' ').toLowerCase()}</TD>
                    <TD className="text-xs">{c.route?.code ?? '—'}</TD>
                    <TD>
                      <StatusBadge status={c.status} />
                    </TD>
                    <TD className="text-xs">{relativeDays(c.lastOrderDate)}</TD>
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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'default' | 'secondary' | 'warning' | 'destructive' | 'success'> = {
    ACTIVE: 'success',
    DORMANT: 'warning',
    PHONE_ONLY: 'secondary',
    UNREACHABLE: 'destructive',
    SUSPENDED: 'destructive',
  };
  return <Badge variant={map[status] ?? 'default'}>{status.replace('_', ' ').toLowerCase()}</Badge>;
}
