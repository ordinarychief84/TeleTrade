'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/utils';
import { CheckCircle2, Clock, AlertTriangle, ListChecks } from 'lucide-react';

interface MyRoute {
  assignments: any[];
  totals: { value: number; collected: number; delivered: number; failed: number; pending: number };
}

export default function EndOfRun() {
  const router = useRouter();
  const [submitted, setSubmitted] = useState<{ collected: number; delivered: number } | null>(null);

  const { data, isLoading } = useQuery<MyRoute>({
    queryKey: ['my-route'],
    queryFn: () => api.get('/deliveries/my-route'),
  });

  const closeMut = useMutation({
    mutationFn: () => api.get<any>('/deliveries/end-of-run'),
    onSuccess: (res) => setSubmitted({ collected: res.collected, delivered: res.delivered }),
  });

  if (isLoading || !data) {
    return <div className="text-muted-foreground">Loading summary…</div>;
  }

  const { totals, assignments } = data;
  const openCount = totals.pending;

  if (submitted) {
    return (
      <div className="space-y-4 max-w-xl">
        <Card className="border-emerald-300/40">
          <CardContent className="p-6 text-center space-y-2">
            <CheckCircle2 className="h-10 w-10 mx-auto text-emerald-600" />
            <div className="text-xl font-semibold">Run closed. Nice work.</div>
            <div className="text-sm text-muted-foreground">
              {submitted.delivered} stops delivered · {formatCurrency(submitted.collected)} collected.
            </div>
          </CardContent>
        </Card>
        <Button className="w-full" onClick={() => router.push('/dashboard')}>
          Done for today
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 max-w-xl">
      <div>
        <h1 className="text-2xl font-semibold">End of run</h1>
        <p className="text-sm text-muted-foreground">Confirm the numbers before submitting to dispatch.</p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <SummaryCard icon={<CheckCircle2 className="h-4 w-4 text-emerald-600" />} label="Delivered" value={totals.delivered} />
        <SummaryCard icon={<AlertTriangle className="h-4 w-4 text-destructive" />} label="Failed" value={totals.failed} />
        <SummaryCard icon={<Clock className="h-4 w-4 text-amber-500" />} label="Open" value={totals.pending} highlight={totals.pending > 0} />
        <SummaryCard icon={<ListChecks className="h-4 w-4 text-muted-foreground" />} label="Stops" value={assignments.length} />
      </div>

      <Card>
        <CardContent className="p-4 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Expected today</span>
            <span className="font-semibold">{formatCurrency(totals.value)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Collected</span>
            <span className="font-semibold text-emerald-700">{formatCurrency(totals.collected)}</span>
          </div>
          <div className="flex justify-between border-t pt-1 mt-1">
            <span className="text-muted-foreground">Delta</span>
            <span className={'font-semibold ' + (totals.collected < totals.value ? 'text-amber-600' : '')}>
              {formatCurrency(totals.collected - totals.value)}
            </span>
          </div>
        </CardContent>
      </Card>

      {openCount > 0 && (
        <Card className="border-amber-300/40">
          <CardContent className="p-4 text-sm">
            <div className="font-medium text-amber-700">{openCount} stop{openCount === 1 ? '' : 's'} still open.</div>
            <div className="text-muted-foreground">
              Mark each as delivered, failed, or rescheduled before closing the run.
            </div>
          </CardContent>
        </Card>
      )}

      {closeMut.error && (
        <div className="text-sm text-destructive">{(closeMut.error as Error).message}</div>
      )}

      <Button
        size="lg"
        className="w-full"
        disabled={openCount > 0 || closeMut.isPending}
        onClick={() => closeMut.mutate()}
      >
        {closeMut.isPending ? 'Submitting…' : 'Submit to dispatch'}
      </Button>
      <Button variant="outline" className="w-full" onClick={() => router.push('/route')}>
        Back to route
      </Button>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  highlight,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  highlight?: boolean;
}) {
  return (
    <Card className={highlight ? 'border-amber-300/40' : undefined}>
      <CardContent className="p-3">
        <div className="flex items-center gap-2 text-[10px] uppercase tracking-wide text-muted-foreground">
          {icon}
          {label}
        </div>
        <div className="text-2xl font-semibold">{value}</div>
      </CardContent>
    </Card>
  );
}
