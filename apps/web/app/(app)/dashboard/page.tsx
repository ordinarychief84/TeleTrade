'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Phone,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  CheckCircle2,
  PhoneCall,
  ShoppingCart,
  Banknote,
  Wallet,
  Snowflake,
  AlertTriangle,
  TrendingUp,
  Trophy,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import { api } from '@/lib/api';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { StatCard } from '@/components/dashboard/stat-card';
import { useAuth } from '@/lib/auth-store';
import { Role } from '@teletrade/shared';
import { formatCurrency, cn } from '@/lib/utils';

interface Overview {
  windowDays: number;
  totals: {
    calls: number;
    inboundCalls: number;
    outboundCalls: number;
    answeredCalls: number;
    missedCalls: number;
    ordersCreated: number;
    revenue: number;
    aov: number;
    dormantCustomers: number;
    duplicatesPending: number;
    conversionRate: number;
  };
  previous: Overview['totals'];
  dailySeries: { date: string; calls: number; orders: number; revenue: number }[];
  outcomes: { outcome: string; count: number }[];
}

interface AgentReport {
  id: string;
  fullName: string;
  email: string;
  calls: number;
  orders: number;
  revenue: number;
}

interface SkuReport {
  skuCode: string;
  name: string;
  qty: number;
  revenue: number;
}

const PERIODS = [
  { days: 7, label: '7d' },
  { days: 30, label: '30d' },
  { days: 90, label: '90d' },
] as const;

const OUTCOME_COLORS: Record<string, string> = {
  ORDER_CREATED: '#10b981',
  CALLBACK_SCHEDULED: '#3b82f6',
  NO_ORDER: '#94a3b8',
  INFO_REQUEST: '#06b6d4',
  DECLINED: '#f43f5e',
  WRONG_NUMBER: '#a3a3a3',
  UNREACHABLE: '#f59e0b',
  COMPLAINT: '#f43f5e',
};
const OUTCOME_LABEL: Record<string, string> = {
  ORDER_CREATED: 'Order placed',
  CALLBACK_SCHEDULED: 'Callback',
  NO_ORDER: 'No order',
  INFO_REQUEST: 'Info only',
  DECLINED: 'Declined',
  WRONG_NUMBER: 'Wrong number',
  UNREACHABLE: 'Unreachable',
  COMPLAINT: 'Complaint',
};

const GREETINGS = ['Welcome back', 'Good to see you', 'Here’s where we are'];
function greet(name: string) {
  return `${GREETINGS[new Date().getDate() % GREETINGS.length]}, ${name.split(' ')[0]}.`;
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const isManagerish = user?.role === Role.ADMIN || user?.role === Role.SALES_MANAGER;
  const [period, setPeriod] = useState<7 | 30 | 90>(30);

  const overview = useQuery<Overview>({
    queryKey: ['overview', period],
    queryFn: () => api.get(`/reports/overview?windowDays=${period}`),
    refetchInterval: 60_000,
  });

  const agentsQ = useQuery<AgentReport[]>({
    queryKey: ['report-agents'],
    queryFn: () => api.get('/reports/agents'),
    enabled: isManagerish,
  });

  const skusQ = useQuery<SkuReport[]>({
    queryKey: ['report-sku-uptake'],
    queryFn: () => api.get('/reports/sku-uptake'),
  });

  const lastUpdated = overview.dataUpdatedAt
    ? new Date(overview.dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const seriesFor = (key: 'calls' | 'orders' | 'revenue') =>
    overview.data?.dailySeries.map((d) => ({ date: d.date, value: d[key] })) ?? [];

  const totals = overview.data?.totals;
  const prev = overview.data?.previous;

  const totalCallsSeries = seriesFor('calls');
  const ordersSeries = seriesFor('orders');
  const revenueSeries = seriesFor('revenue');
  const inboundShare = totals && totals.calls > 0 ? totals.inboundCalls / totals.calls : 0;
  const outboundShare = totals && totals.calls > 0 ? totals.outboundCalls / totals.calls : 0;
  const inboundSeries = totalCallsSeries.map((p) => ({ date: p.date, value: Math.round(p.value * inboundShare) }));
  const outboundSeries = totalCallsSeries.map((p) => ({ date: p.date, value: Math.round(p.value * outboundShare) }));

  if (overview.isError) {
    return (
      <Card>
        <div className="p-6 space-y-2 text-sm">
          <div className="font-medium">Couldn’t load today’s numbers.</div>
          <div className="text-muted-foreground">
            {(overview.error as Error)?.message ?? 'Reports service isn’t answering.'}
          </div>
          <Button onClick={() => overview.refetch()} size="sm" variant="outline">
            Try again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6">
      {/* Header */}
      <div className="flex items-start md:items-center justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">
            {user ? greet(user.fullName) : 'Dashboard'}
          </h1>
          <p className="text-xs md:text-sm text-muted-foreground flex items-center gap-2">
            Last {overview.data?.windowDays ?? period} days
            {lastUpdated && (
              <span className="inline-flex items-center gap-1">
                · refreshed {lastUpdated}
                {overview.isFetching && <RefreshCw className="h-3 w-3 animate-spin" />}
              </span>
            )}
          </p>
        </div>
        <div className="inline-flex rounded-lg border bg-card p-0.5 shadow-sm">
          {PERIODS.map((p) => (
            <button
              key={p.days}
              type="button"
              onClick={() => setPeriod(p.days as any)}
              className={cn(
                'px-3 py-1.5 text-xs font-medium rounded-md transition',
                period === p.days
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Hero KPI row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Revenue"
          value={totals ? formatCurrency(totals.revenue) : '—'}
          previous={prev?.revenue}
          icon={Banknote}
          tone="emerald"
          series={revenueSeries}
          hint={totals ? `AOV ${formatCurrency(totals.aov)}` : ''}
          emphasize
        />
        <StatCard
          label="Orders"
          value={totals?.ordersCreated ?? '—'}
          previous={prev?.ordersCreated}
          icon={ShoppingCart}
          tone="violet"
          series={ordersSeries}
        />
        <StatCard
          label="Total calls"
          value={totals?.calls ?? '—'}
          previous={prev?.calls}
          icon={Phone}
          tone="blue"
          series={totalCallsSeries}
        />
        <StatCard
          label="Conversion"
          value={totals != null ? `${totals.conversionRate}%` : '—'}
          deltaLabel={totals && prev ? deltaPp(totals.conversionRate, prev.conversionRate) : undefined}
          icon={TrendingUp}
          tone="cyan"
          hint="Calls that became orders"
        />
      </div>

      {/* Secondary KPI row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="Inbound"
          value={totals?.inboundCalls ?? '—'}
          previous={prev?.inboundCalls}
          icon={PhoneIncoming}
          tone="blue"
          series={inboundSeries}
        />
        <StatCard
          label="Outbound"
          value={totals?.outboundCalls ?? '—'}
          previous={prev?.outboundCalls}
          icon={PhoneOutgoing}
          tone="violet"
          series={outboundSeries}
        />
        <StatCard
          label="Answered"
          value={totals?.answeredCalls ?? '—'}
          previous={prev?.answeredCalls}
          icon={CheckCircle2}
          tone="emerald"
        />
        <StatCard
          label="Missed"
          value={totals?.missedCalls ?? '—'}
          previous={prev?.missedCalls}
          icon={PhoneMissed}
          tone="rose"
          higherIsBetter={false}
        />
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-[2fr_1fr] gap-4">
        <Card className="overflow-hidden">
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Calls & orders</div>
              <div className="text-[11px] text-muted-foreground">
                Daily trend — last {overview.data?.windowDays ?? period} days
              </div>
            </div>
            <div className="text-[11px] flex items-center gap-3">
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-blue-500" /> Calls
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-2 w-2 rounded-full bg-violet-500" /> Orders
              </span>
            </div>
          </div>
          <div className="h-64 w-full px-2 pt-2">
            {overview.isLoading ? (
              <SkeletonChart />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={overview.data?.dailySeries ?? []} margin={{ top: 10, right: 12, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="g-calls" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                    <linearGradient id="g-orders" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#8b5cf6" stopOpacity={0.4} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickFormatter={(v) => v.slice(5)}
                    interval="preserveStartEnd"
                  />
                  <YAxis tick={{ fontSize: 10 }} width={28} />
                  <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8 }} labelFormatter={(l) => `Day ${l}`} />
                  <Area type="monotone" dataKey="calls" stroke="#3b82f6" strokeWidth={2} fill="url(#g-calls)" />
                  <Area type="monotone" dataKey="orders" stroke="#8b5cf6" strokeWidth={2} fill="url(#g-orders)" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>

        <Card>
          <div className="p-4 border-b">
            <div className="text-sm font-medium">Call outcomes</div>
            <div className="text-[11px] text-muted-foreground">Where calls land</div>
          </div>
          <div className="h-64 w-full">
            {overview.isLoading ? (
              <SkeletonChart />
            ) : (overview.data?.outcomes ?? []).length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-xs text-muted-foreground gap-2">
                <Sparkles className="h-5 w-5" />
                No outcomes yet for this window.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={overview.data?.outcomes ?? []}
                    dataKey="count"
                    nameKey="outcome"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={2}
                    stroke="none"
                  >
                    {overview.data?.outcomes.map((o) => (
                      <Cell key={o.outcome} fill={OUTCOME_COLORS[o.outcome] ?? '#94a3b8'} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any, _name, item: any) => [v, OUTCOME_LABEL[item.payload.outcome] ?? item.payload.outcome]}
                    contentStyle={{ fontSize: 12, borderRadius: 8 }}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={48}
                    iconType="circle"
                    formatter={(v) => <span className="text-[11px]">{OUTCOME_LABEL[v] ?? v}</span>}
                  />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Card>
      </div>

      {/* Health metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard
          label="AOV"
          value={totals ? formatCurrency(totals.aov) : '—'}
          previous={prev?.aov}
          icon={Wallet}
          tone="emerald"
        />
        <StatCard
          label="Dormant outlets"
          value={totals?.dormantCustomers ?? '—'}
          icon={Snowflake}
          tone="amber"
          higherIsBetter={false}
          hint="No order in 30+ days"
          href={isManagerish ? '/customers?status=DORMANT' : undefined}
        />
        {isManagerish ? (
          <StatCard
            label="Duplicates pending"
            value={totals?.duplicatesPending ?? '—'}
            icon={AlertTriangle}
            tone="rose"
            higherIsBetter={false}
            hint="Same outlet + SKU within 30 min"
            href="/duplicates"
            emphasize={(totals?.duplicatesPending ?? 0) > 0}
          />
        ) : (
          <StatCard
            label="My calls"
            value={totals?.calls ?? '—'}
            icon={PhoneCall}
            tone="blue"
          />
        )}
        <StatCard
          label="Window"
          value={`${period}d`}
          icon={RefreshCw}
          tone="slate"
          hint={lastUpdated ? `refreshed ${lastUpdated}` : 'auto every 60s'}
        />
      </div>

      {/* Top performers / movers */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <div className="p-4 border-b flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Top SKUs</div>
              <div className="text-[11px] text-muted-foreground">By revenue, last 30d</div>
            </div>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <div className="p-2">
            {skusQ.isLoading ? (
              <SkeletonRows />
            ) : !skusQ.data?.length ? (
              <div className="p-4 text-xs text-muted-foreground">No SKU movement yet.</div>
            ) : (
              <ul className="divide-y">
                {skusQ.data.slice(0, 6).map((s, i) => {
                  const max = Math.max(...skusQ.data!.map((r) => r.revenue));
                  const pct = max > 0 ? (s.revenue / max) * 100 : 0;
                  return (
                    <li key={s.skuCode} className="px-2 py-2.5 flex items-center gap-3">
                      <div className="text-xs font-mono w-5 text-right text-muted-foreground">{i + 1}</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-medium truncate">{s.name}</div>
                        <div className="text-[11px] text-muted-foreground font-mono">{s.skuCode}</div>
                        <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500/80 rounded-full" style={{ width: `${pct}%` }} />
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-sm font-semibold">{formatCurrency(s.revenue)}</div>
                        <div className="text-[11px] text-muted-foreground">×{s.qty} units</div>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        </Card>

        {isManagerish ? (
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Agent performance</div>
                <div className="text-[11px] text-muted-foreground">By revenue, last 30d</div>
              </div>
              <Trophy className="h-4 w-4 text-amber-500" />
            </div>
            <div className="p-2">
              {agentsQ.isLoading ? (
                <SkeletonRows />
              ) : !agentsQ.data?.length ? (
                <div className="p-4 text-xs text-muted-foreground">No agents found.</div>
              ) : (
                <ul className="divide-y">
                  {agentsQ.data.map((a, i) => {
                    const max = Math.max(1, ...agentsQ.data!.map((r) => r.revenue));
                    const pct = (a.revenue / max) * 100;
                    return (
                      <li key={a.id} className="px-2 py-2.5 flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center text-xs font-semibold">
                          {initials(a.fullName)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium truncate">{a.fullName}</div>
                          <div className="text-[11px] text-muted-foreground">
                            {a.calls} calls · {a.orders} orders
                          </div>
                          <div className="mt-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-violet-500/80 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                        </div>
                        <div className="text-right shrink-0">
                          <div className="text-sm font-semibold">{formatCurrency(a.revenue)}</div>
                          <Badge variant="outline" className="mt-0.5 text-[9px]">
                            #{i + 1}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        ) : (
          <Card>
            <div className="p-4 border-b flex items-center justify-between">
              <div>
                <div className="text-sm font-medium">Your streak</div>
                <div className="text-[11px] text-muted-foreground">Stay above 12% conversion to keep it.</div>
              </div>
              <Sparkles className="h-4 w-4 text-emerald-500" />
            </div>
            <div className="p-4 text-sm">
              {(totals?.conversionRate ?? 0) >= 12 ? (
                <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <div className="text-2xl font-semibold text-emerald-700">
                    {totals?.conversionRate}% conversion 🔥
                  </div>
                  <div className="text-emerald-700/80 mt-1">Nice run — keep pitching the active promos.</div>
                </div>
              ) : (
                <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
                  <div className="text-2xl font-semibold text-amber-700">{totals?.conversionRate ?? 0}% conversion</div>
                  <div className="text-amber-700/80 mt-1">Lead with the Q2 Malta promo — it converts ~3× better.</div>
                </div>
              )}
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

function deltaPp(curr: number, prev: number) {
  if (prev === 0 && curr === 0) return '—';
  const diff = Math.round((curr - prev) * 10) / 10;
  if (diff === 0) return '0pp';
  return `${diff > 0 ? '+' : '−'}${Math.abs(diff)}pp`;
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}

function SkeletonChart() {
  return <div className="h-full w-full rounded bg-muted/60 animate-pulse" />;
}
function SkeletonRows() {
  return (
    <ul className="divide-y">
      {Array.from({ length: 4 }).map((_, i) => (
        <li key={i} className="px-2 py-3 flex gap-3">
          <div className="h-8 w-8 rounded-full bg-muted animate-pulse" />
          <div className="flex-1 space-y-1">
            <div className="h-3 w-32 bg-muted rounded animate-pulse" />
            <div className="h-2 w-24 bg-muted rounded animate-pulse" />
          </div>
        </li>
      ))}
    </ul>
  );
}
