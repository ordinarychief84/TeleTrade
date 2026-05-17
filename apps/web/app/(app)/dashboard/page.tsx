'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import { Role } from '@teletrade/shared';

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
}

const GREETINGS = ['Welcome back', 'Good to see you', "Here's where we are"];
function greet(name: string) {
  return `${GREETINGS[new Date().getDate() % GREETINGS.length]}, ${name.split(' ')[0]}.`;
}

export default function DashboardPage() {
  const user = useAuth((s) => s.user);
  const { data, isLoading, isError, error, refetch, isFetching, dataUpdatedAt } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: () => api.get('/reports/overview'),
    refetchInterval: 60_000,
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 space-y-2 text-sm">
          <div className="font-medium">Couldn&apos;t load today&apos;s numbers.</div>
          <div className="text-muted-foreground">
            {(error as Error)?.message ?? "Reports service isn't answering right now."}
          </div>
          <button onClick={() => refetch()} className="text-primary underline">
            Try again
          </button>
        </CardContent>
      </Card>
    );
  }

  const lastUpdated = dataUpdatedAt
    ? new Date(dataUpdatedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  return (
    <div className="space-y-4 md:space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">{user ? greet(user.fullName) : 'Dashboard'}</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Last {data?.windowDays ?? 30} days
          {lastUpdated && (
            <span className="ml-2">
              · refreshed {lastUpdated}
              {isFetching ? ' (refreshing…)' : ''}
            </span>
          )}
        </p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {isLoading || !data ? (
          Array.from({ length: 8 }).map((_, i) => <SkeletonKpi key={i} />)
        ) : (
          <>
            <KpiCard label="Total calls" value={data.totals.calls} />
            <KpiCard label="Inbound" value={data.totals.inboundCalls} />
            <KpiCard label="Outbound" value={data.totals.outboundCalls} />
            <KpiCard label="Answered" value={data.totals.answeredCalls} />
            <KpiCard label="Missed" value={data.totals.missedCalls} />
            <KpiCard label="Conversion" value={`${data.totals.conversionRate}%`} />
            <KpiCard label="Orders" value={data.totals.ordersCreated} />
            <KpiCard label="Revenue" value={formatCurrency(data.totals.revenue)} />
            <KpiCard label="AOV" value={formatCurrency(data.totals.aov)} />
            <KpiCard label="Dormant" value={data.totals.dormantCustomers} />
            {user?.role !== Role.AGENT && (
              <KpiCard
                label="Duplicates"
                value={data.totals.duplicatesPending}
                highlight={data.totals.duplicatesPending > 0}
                href="/duplicates"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  highlight,
  href,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
  href?: string;
}) {
  const inner = (
    <Card className={highlight ? 'border-destructive/40' : undefined}>
      <CardHeader className="pb-1">
        <CardTitle className="text-[10px] md:text-xs text-muted-foreground uppercase tracking-wide font-medium">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent className="text-xl md:text-2xl font-semibold flex items-center gap-2">
        {value}
        {highlight && (
          <Badge variant="destructive" className="text-[10px]">
            review
          </Badge>
        )}
      </CardContent>
    </Card>
  );
  return href ? <a href={href}>{inner}</a> : inner;
}

function SkeletonKpi() {
  return (
    <Card>
      <CardHeader className="pb-1">
        <div className="h-3 w-16 rounded bg-muted animate-pulse" />
      </CardHeader>
      <CardContent>
        <div className="h-6 w-20 rounded bg-muted animate-pulse" />
      </CardContent>
    </Card>
  );
}
