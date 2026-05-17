'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DuplicateReviewStatus } from '@teletrade/shared';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle2, AlertTriangle, ArrowRightLeft, X } from 'lucide-react';

interface OrderLine {
  id: string;
  skuCode: string;
  name?: string;
  qty: number;
}
interface DupOrder {
  id: string;
  orderReference: string;
  total: string;
  createdAt: string;
  customer: { outletName: string; phone: string };
  lines: OrderLine[];
  duplicateOf?: {
    orderReference: string;
    createdAt: string;
    lines: OrderLine[];
  };
}

export default function DuplicatesPage() {
  const qc = useQueryClient();
  const { data, isLoading, isError, error, refetch } = useQuery<DupOrder[]>({
    queryKey: ['duplicates'],
    queryFn: () => api.get('/orders/duplicates'),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.post(`/orders/duplicates/${id}/review`, { decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['duplicates'] }),
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm space-y-2">
          <div className="font-medium">Couldn&apos;t load the review queue.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <button onClick={() => refetch()} className="text-primary underline">Try again</button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Duplicate review</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Same outlet + overlapping SKUs within 30 minutes. Never auto-cancelled — you decide.
        </p>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="h-4 w-44 bg-muted rounded animate-pulse" />
                <div className="h-3 w-60 bg-muted rounded animate-pulse mt-2" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!isLoading && !data?.length && (
        <Card className="border-emerald-300/40">
          <CardContent className="p-6 text-sm text-center space-y-2">
            <CheckCircle2 className="h-6 w-6 mx-auto text-emerald-600" />
            <div className="font-medium">No duplicates pending. The 30-minute window&apos;s been clean.</div>
            <div className="text-muted-foreground">Anything we flag will land here as soon as it happens.</div>
          </CardContent>
        </Card>
      )}

      {data?.map((o) => {
        const sharedCodes = new Set(o.lines.map((l) => l.skuCode));
        const dupCodes = new Set(o.duplicateOf?.lines.map((l) => l.skuCode) ?? []);
        const overlap = [...sharedCodes].filter((c) => dupCodes.has(c));
        const ageMin = Math.round((new Date(o.createdAt).getTime() - new Date(o.duplicateOf?.createdAt ?? o.createdAt).getTime()) / 60000);
        return (
          <Card key={o.id} className="border-amber-300/40">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="text-xs uppercase tracking-wide text-muted-foreground">
                    {Math.abs(ageMin)} min apart · {overlap.length} SKU{overlap.length === 1 ? '' : 's'} in common
                  </div>
                  <div className="font-semibold">{o.customer?.outletName}</div>
                  <div className="text-xs text-muted-foreground">{o.customer?.phone}</div>
                </div>
                <Badge variant="warning">review</Badge>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                <div className="rounded-md border p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">New</div>
                    <div className="font-mono text-[11px]">{o.orderReference}</div>
                  </div>
                  <div className="font-semibold">{formatCurrency(o.total)}</div>
                  <ul className="mt-1 space-y-0.5 text-xs">
                    {o.lines.map((l) => (
                      <li key={l.id} className={overlap.includes(l.skuCode) ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                        {l.skuCode} ×{l.qty}
                      </li>
                    ))}
                  </ul>
                  <div className="text-[11px] text-muted-foreground mt-1">{formatDate(o.createdAt)}</div>
                </div>
                {o.duplicateOf && (
                  <div className="rounded-md border p-3">
                    <div className="flex items-center justify-between">
                      <div className="text-xs text-muted-foreground">Existing</div>
                      <div className="font-mono text-[11px]">{o.duplicateOf.orderReference}</div>
                    </div>
                    <div className="font-semibold">conflict</div>
                    <ul className="mt-1 space-y-0.5 text-xs">
                      {o.duplicateOf.lines.map((l) => (
                        <li key={l.id} className={overlap.includes(l.skuCode) ? 'text-foreground font-medium' : 'text-muted-foreground'}>
                          {l.skuCode} ×{l.qty}
                        </li>
                      ))}
                    </ul>
                    <div className="text-[11px] text-muted-foreground mt-1">{formatDate(o.duplicateOf.createdAt)}</div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                <Button
                  variant="outline"
                  onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.KEPT_BOTH })}
                  disabled={reviewMut.isPending}
                >
                  <CheckCircle2 className="h-4 w-4" /> Keep both
                </Button>
                <Button
                  onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.MARKED_VALID })}
                  disabled={reviewMut.isPending}
                >
                  Mark valid
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.MERGED })}
                  disabled={reviewMut.isPending}
                >
                  <ArrowRightLeft className="h-4 w-4" /> Merge
                </Button>
                <Button
                  variant="destructive"
                  onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.CANCELLED_DUPLICATE })}
                  disabled={reviewMut.isPending}
                >
                  <X className="h-4 w-4" /> Cancel
                </Button>
              </div>
              {reviewMut.error && (
                <div className="text-xs text-destructive">
                  <AlertTriangle className="inline h-3 w-3" /> {(reviewMut.error as Error).message}
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
