'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatCurrency } from '@/lib/utils';

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

export default function DashboardPage() {
  const { data, isLoading } = useQuery<Overview>({
    queryKey: ['overview'],
    queryFn: () => api.get('/reports/overview'),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-muted-foreground">Last {data?.windowDays ?? 30} days</p>
      </div>
      {isLoading || !data ? (
        <div className="text-muted-foreground">Loading…</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard label="Total calls" value={data.totals.calls} />
          <KpiCard label="Inbound" value={data.totals.inboundCalls} />
          <KpiCard label="Outbound" value={data.totals.outboundCalls} />
          <KpiCard label="Answered" value={data.totals.answeredCalls} />
          <KpiCard label="Missed" value={data.totals.missedCalls} />
          <KpiCard label="Conversion" value={`${data.totals.conversionRate}%`} />
          <KpiCard label="Orders created" value={data.totals.ordersCreated} />
          <KpiCard label="Revenue (30d)" value={formatCurrency(data.totals.revenue)} />
          <KpiCard label="AOV" value={formatCurrency(data.totals.aov)} />
          <KpiCard label="Dormant outlets" value={data.totals.dormantCustomers} />
          <KpiCard label="Duplicates pending" value={data.totals.duplicatesPending} highlight={data.totals.duplicatesPending > 0} />
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, highlight }: { label: string; value: string | number; highlight?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs text-muted-foreground uppercase tracking-wide font-medium">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-semibold">
        {value}
        {highlight && <Badge variant="destructive" className="ml-2">review</Badge>}
      </CardContent>
    </Card>
  );
}
