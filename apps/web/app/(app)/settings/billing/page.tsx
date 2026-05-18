'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { useAuth } from '@/lib/auth-store';
import { Role, PLAN_DETAILS, PlanTier } from '@teletrade/shared';
import { Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Billing {
  plan: PlanTier;
  seatLimit: number;
  seatsUsed: number;
  billingEmail: string | null;
  monthlyTotal: number;
  invoices: {
    id: string;
    period: string;
    amount: number;
    status: 'PAID' | 'DUE';
    issuedAt: string;
  }[];
}

const PLAN_ORDER: PlanTier[] = ['FREE', 'STARTER', 'GROWTH', 'ENTERPRISE'];

export default function BillingPage() {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === Role.ADMIN;

  const { data, isLoading } = useQuery<Billing>({
    queryKey: ['account-billing'],
    queryFn: () => api.get('/account/billing'),
  });

  const planMut = useMutation({
    mutationFn: (plan: PlanTier) => api.post('/account/billing/plan', { plan }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['account-billing'] });
      qc.invalidateQueries({ queryKey: ['account-workspace'] });
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });

  if (isLoading || !data) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const currentIdx = PLAN_ORDER.indexOf(data.plan);
  const seatPct = (data.seatsUsed / data.seatLimit) * 100;

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Plan & billing</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          You’re on the <Badge variant="outline" className="mx-1 text-[10px]">{data.plan}</Badge>plan,
          billed to {data.billingEmail ?? '—'}.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 flex flex-wrap items-end justify-between gap-4">
          <div>
            <div className="text-[10px] uppercase tracking-wide text-muted-foreground">This month</div>
            <div className="text-3xl font-semibold">
              ${data.monthlyTotal.toLocaleString()}
              <span className="text-sm text-muted-foreground font-normal ml-1">/mo</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {data.seatsUsed} of {data.seatLimit} seats in use
            </div>
          </div>
          <div className="flex-1 min-w-[200px]">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={cn(
                  'h-full rounded-full',
                  seatPct >= 100 ? 'bg-rose-500' : seatPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500'
                )}
                style={{ width: `${Math.min(100, seatPct)}%` }}
              />
            </div>
            <div className="text-[11px] text-muted-foreground mt-1">
              {Math.max(0, data.seatLimit - data.seatsUsed)} seat
              {data.seatLimit - data.seatsUsed === 1 ? '' : 's'} available
            </div>
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="text-sm font-medium mb-2">Plans</div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {PLAN_ORDER.map((tier, idx) => {
            const details = PLAN_DETAILS[tier];
            const isCurrent = tier === data.plan;
            const isUpgrade = idx > currentIdx;
            return (
              <Card
                key={tier}
                className={cn(
                  isCurrent ? 'border-primary/60 ring-1 ring-primary/30' : ''
                )}
              >
                <CardContent className="p-4 flex flex-col h-full">
                  <div className="text-[10px] uppercase tracking-wide text-muted-foreground">{tier}</div>
                  <div className="text-lg font-semibold">{details.name}</div>
                  <div className="text-2xl font-semibold mt-2">{details.price}</div>
                  <ul className="text-xs text-muted-foreground space-y-1 mt-3 flex-1">
                    {details.perks.map((p) => (
                      <li key={p} className="flex gap-1.5">
                        <Check className="h-3 w-3 mt-[3px] text-emerald-600 shrink-0" />
                        {p}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-4">
                    {isCurrent ? (
                      <Badge className="w-full justify-center" variant="default">
                        <Sparkles className="h-3 w-3" /> Current plan
                      </Badge>
                    ) : (
                      <Button
                        size="sm"
                        variant={isUpgrade ? 'default' : 'outline'}
                        className="w-full"
                        disabled={!isAdmin || planMut.isPending}
                        onClick={() => planMut.mutate(tier)}
                      >
                        {isUpgrade ? 'Upgrade to ' + details.name : 'Switch to ' + details.name}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
        {planMut.error && (
          <p className="text-sm text-destructive mt-2">{(planMut.error as Error).message}</p>
        )}
        {!isAdmin && (
          <p className="text-[11px] text-muted-foreground mt-2">Only an admin can change the plan.</p>
        )}
      </div>

      <Card>
        <div className="p-4 border-b text-sm font-medium">Invoices</div>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Reference</TH>
                <TH>Period</TH>
                <TH>Amount</TH>
                <TH>Status</TH>
              </TR>
            </THead>
            <TBody>
              {data.invoices.map((inv) => (
                <TR key={inv.id}>
                  <TD className="font-mono text-xs">{inv.id}</TD>
                  <TD>{inv.period}</TD>
                  <TD>${inv.amount.toLocaleString()}</TD>
                  <TD>
                    <Badge variant={inv.status === 'PAID' ? 'success' : 'warning'}>{inv.status.toLowerCase()}</Badge>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
