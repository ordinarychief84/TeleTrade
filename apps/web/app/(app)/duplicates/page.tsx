'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { DuplicateReviewStatus } from '@teletrade/shared';
import { formatCurrency, formatDate } from '@/lib/utils';

export default function DuplicatesPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<any[]>({
    queryKey: ['duplicates'],
    queryFn: () => api.get('/orders/duplicates'),
  });

  const reviewMut = useMutation({
    mutationFn: ({ id, decision }: { id: string; decision: string }) =>
      api.post(`/orders/duplicates/${id}/review`, { decision }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['duplicates'] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">Duplicate review</h1>
        <p className="text-sm text-muted-foreground">
          Same outlet + overlapping SKUs within 30 minutes. Never auto-cancelled — your call.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : !data?.length ? (
            <div className="p-6 text-muted-foreground">No pending duplicates.</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>New order</TH>
                  <TH>Customer</TH>
                  <TH>Total</TH>
                  <TH>Lines</TH>
                  <TH>Conflicts with</TH>
                  <TH>Decision</TH>
                </TR>
              </THead>
              <TBody>
                {data.map((o) => (
                  <TR key={o.id}>
                    <TD className="font-mono text-xs">
                      {o.orderReference}
                      <div className="text-[11px] text-muted-foreground">{formatDate(o.createdAt)}</div>
                    </TD>
                    <TD>{o.customer?.outletName}</TD>
                    <TD>{formatCurrency(o.total)}</TD>
                    <TD className="text-xs">{o.lines.map((l: any) => `${l.skuCode}×${l.qty}`).join(', ')}</TD>
                    <TD className="text-xs">
                      {o.duplicateOf ? (
                        <>
                          <div className="font-mono">{o.duplicateOf.orderReference}</div>
                          <div className="text-muted-foreground">
                            {o.duplicateOf.lines.map((l: any) => `${l.skuCode}×${l.qty}`).join(', ')}
                          </div>
                        </>
                      ) : (
                        '—'
                      )}
                    </TD>
                    <TD className="space-y-1">
                      <div className="flex flex-wrap gap-1">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.KEPT_BOTH })}
                        >
                          Keep both
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() =>
                            reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.CANCELLED_DUPLICATE })
                          }
                        >
                          Cancel this
                        </Button>
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.MERGED })}
                        >
                          Merge
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => reviewMut.mutate({ id: o.id, decision: DuplicateReviewStatus.MARKED_VALID })}
                        >
                          Mark valid
                        </Button>
                      </div>
                    </TD>
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
