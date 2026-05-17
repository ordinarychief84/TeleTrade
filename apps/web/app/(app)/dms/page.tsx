'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate } from '@/lib/utils';

interface SyncJob {
  id: string;
  adapter: string;
  status: string;
  attempts: number;
  lastError: string | null;
  externalRef: string | null;
  createdAt: string;
  order: { orderReference: string; status: string };
}

export default function DmsPage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<SyncJob[]>({
    queryKey: ['dms-sync-jobs'],
    queryFn: () => api.get('/dms/sync-jobs'),
    refetchInterval: 5000,
  });

  const retryMut = useMutation({
    mutationFn: (id: string) => api.post(`/dms/sync-jobs/${id}/retry`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['dms-sync-jobs'] }),
  });

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-semibold">DMS sync</h1>
        <p className="text-sm text-muted-foreground">
          Outbound order sync queue. Failed jobs auto-retry with exponential backoff; after 5 attempts they go to
          dead-letter for manual retry.
        </p>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-muted-foreground">Loading…</div>
          ) : !data?.length ? (
            <div className="p-6 text-muted-foreground">No sync jobs yet.</div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>Order</TH>
                  <TH>Adapter</TH>
                  <TH>Status</TH>
                  <TH>Attempts</TH>
                  <TH>External ref</TH>
                  <TH>Last error</TH>
                  <TH>When</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {data.map((j) => (
                  <TR key={j.id}>
                    <TD className="font-mono text-xs">{j.order?.orderReference}</TD>
                    <TD>{j.adapter}</TD>
                    <TD>
                      <Badge
                        variant={
                          j.status === 'SUCCEEDED' ? 'success' : j.status === 'FAILED' || j.status === 'DEAD_LETTER' ? 'destructive' : 'warning'
                        }
                      >
                        {j.status}
                      </Badge>
                    </TD>
                    <TD>{j.attempts}</TD>
                    <TD className="font-mono text-xs">{j.externalRef ?? '—'}</TD>
                    <TD className="text-xs text-muted-foreground max-w-[280px] truncate">{j.lastError ?? '—'}</TD>
                    <TD className="text-xs">{formatDate(j.createdAt)}</TD>
                    <TD>
                      {(j.status === 'FAILED' || j.status === 'DEAD_LETTER') && (
                        <Button size="sm" onClick={() => retryMut.mutate(j.id)} disabled={retryMut.isPending}>
                          Retry
                        </Button>
                      )}
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
