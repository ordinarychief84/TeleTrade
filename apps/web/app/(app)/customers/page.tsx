'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { relativeDays } from '@/lib/utils';
import { Search, Phone, X } from 'lucide-react';

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
}

interface CustomerPage {
  items: CustomerRow[];
  total: number;
}

const RECENT_KEY = 'tt.recentCustomers';

function useRecentCustomers() {
  const [recent, setRecent] = useState<{ id: string; outletName: string; phone: string }[]>([]);
  useEffect(() => {
    try {
      const raw = localStorage.getItem(RECENT_KEY);
      if (raw) setRecent(JSON.parse(raw));
    } catch {
      /* ignore */
    }
  }, []);
  function track(c: { id: string; outletName: string; phone: string }) {
    setRecent((prev) => {
      const next = [c, ...prev.filter((x) => x.id !== c.id)].slice(0, 5);
      localStorage.setItem(RECENT_KEY, JSON.stringify(next));
      return next;
    });
  }
  return { recent, track };
}

export default function CustomersPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const { recent, track } = useRecentCustomers();

  const { data, isLoading, isError, error, refetch } = useQuery<CustomerPage>({
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
      <div>
        <h1 className="text-2xl font-semibold">Customers</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          {data ? `${data.total.toLocaleString()} outlets in your distributor.` : 'Outlets in your distributor.'}
        </p>
      </div>

      <div className="space-y-2 md:space-y-0 md:grid md:grid-cols-[1fr_220px] md:gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search outlet, contact, or phone…"
            className="pl-9 pr-9 h-11"
            autoFocus
          />
          {q && (
            <button
              type="button"
              onClick={() => setQ('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-accent"
              aria-label="Clear"
            >
              <X className="h-4 w-4 text-muted-foreground" />
            </button>
          )}
        </div>
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="h-11">
          <option value="">All statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="DORMANT">Dormant</option>
          <option value="PHONE_ONLY">Phone-only</option>
          <option value="UNREACHABLE">Unreachable</option>
        </Select>
      </div>

      {recent.length > 0 && !q && (
        <div>
          <div className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1 px-1">Recent</div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recent.map((r) => (
              <Link
                key={r.id}
                href={`/customers/${r.id}`}
                className="shrink-0 rounded-full border bg-card px-3 py-1.5 text-xs hover:bg-accent"
              >
                {r.outletName}
              </Link>
            ))}
          </div>
        </div>
      )}

      {isError && (
        <Card>
          <CardContent className="p-4 text-sm">
            <div className="font-medium">Couldn&apos;t load customers.</div>
            <div className="text-muted-foreground">{(error as Error).message}</div>
            <button onClick={() => refetch()} className="mt-2 text-primary underline">
              Try again
            </button>
          </CardContent>
        </Card>
      )}

      {isLoading && (
        <div className="space-y-2 md:hidden">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-3">
                <div className="h-4 w-44 bg-muted rounded animate-pulse" />
                <div className="h-3 w-32 bg-muted rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Mobile card list */}
      <div className="space-y-2 md:hidden">
        {!isLoading && data?.items.length === 0 && (
          <Card>
            <CardContent className="p-6 text-sm text-center space-y-2">
              <Search className="h-6 w-6 mx-auto text-muted-foreground" />
              <div className="font-medium">No outlets match &ldquo;{q}&rdquo;.</div>
              <div className="text-muted-foreground">Try a different name or phone tail.</div>
            </CardContent>
          </Card>
        )}
        {data?.items.map((c) => (
          <Link
            key={c.id}
            href={`/customers/${c.id}`}
            onClick={() => track({ id: c.id, outletName: c.outletName, phone: c.phone })}
          >
            <Card className="hover:bg-accent/40 transition">
              <CardContent className="p-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-medium text-sm truncate">{c.outletName}</div>
                    <div className="text-xs text-muted-foreground truncate">
                      {c.contactName} · {c.outletType.replace('_', ' ').toLowerCase()}
                    </div>
                  </div>
                  <StatusBadge status={c.status} />
                </div>
                <div className="mt-2 flex items-center justify-between text-xs">
                  <a
                    href={`tel:${c.phone}`}
                    onClick={(e) => e.stopPropagation()}
                    className="inline-flex items-center gap-1 font-mono text-muted-foreground hover:text-foreground"
                  >
                    <Phone className="h-3 w-3" />
                    {c.phone}
                  </a>
                  <div className="text-muted-foreground">
                    {c.accountTier} · {c.route?.code ?? '—'} · {relativeDays(c.lastOrderDate)}
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Desktop table */}
      <Card className="hidden md:block">
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : data?.items.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              No outlets match these filters. Clear the search to see everyone.
            </div>
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
                      <Link
                        href={`/customers/${c.id}`}
                        className="hover:underline"
                        onClick={() => track({ id: c.id, outletName: c.outletName, phone: c.phone })}
                      >
                        {c.outletName}
                      </Link>
                    </TD>
                    <TD>{c.contactName}</TD>
                    <TD className="font-mono text-xs">
                      <a href={`tel:${c.phone}`} className="hover:underline">
                        {c.phone}
                      </a>
                    </TD>
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
