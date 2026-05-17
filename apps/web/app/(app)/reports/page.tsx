'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { formatCurrency } from '@/lib/utils';
import { BarChart, Bar, XAxis, YAxis, ResponsiveContainer, Tooltip } from 'recharts';

export default function ReportsPage() {
  const { data: agents } = useQuery<any[]>({ queryKey: ['report-agents'], queryFn: () => api.get('/reports/agents') });
  const { data: routes } = useQuery<any[]>({ queryKey: ['report-routes'], queryFn: () => api.get('/reports/routes') });
  const { data: campaigns } = useQuery<any[]>({
    queryKey: ['report-campaigns'],
    queryFn: () => api.get('/reports/campaigns'),
  });
  const { data: skuUptake } = useQuery<any[]>({
    queryKey: ['report-sku-uptake'],
    queryFn: () => api.get('/reports/sku-uptake'),
  });
  const { data: reasons } = useQuery<any[]>({
    queryKey: ['report-reasons'],
    queryFn: () => api.get('/reports/decline-reasons'),
  });

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Reports</h1>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">SKU uptake (30d)</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={skuUptake ?? []}>
                <XAxis dataKey="skuCode" tick={{ fontSize: 10 }} interval={0} angle={-30} textAnchor="end" height={50} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Bar dataKey="qty" fill="#6366f1" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Decline reasons</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <THead>
                <TR>
                  <TH>Reason</TH>
                  <TH>Count</TH>
                </TR>
              </THead>
              <TBody>
                {reasons?.length ? (
                  reasons.map((r) => (
                    <TR key={r.reason}>
                      <TD>{r.reason}</TD>
                      <TD>{r.count}</TD>
                    </TR>
                  ))
                ) : (
                  <TR>
                    <TD colSpan={2} className="text-muted-foreground text-center">
                      No declines yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Agent performance (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Agent</TH>
                <TH>Calls</TH>
                <TH>Orders</TH>
                <TH>Revenue</TH>
              </TR>
            </THead>
            <TBody>
              {agents?.map((a) => (
                <TR key={a.id}>
                  <TD>{a.fullName}</TD>
                  <TD>{a.calls}</TD>
                  <TD>{a.orders}</TD>
                  <TD>{formatCurrency(a.revenue)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Route coverage (30d)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Route</TH>
                <TH>Territory</TH>
                <TH>Outlets</TH>
                <TH>Orders</TH>
                <TH>Revenue</TH>
              </TR>
            </THead>
            <TBody>
              {routes?.map((r) => (
                <TR key={r.id}>
                  <TD className="font-mono text-xs">{r.code}</TD>
                  <TD>{r.territory}</TD>
                  <TD>{r.customers}</TD>
                  <TD>{r.orders}</TD>
                  <TD>{formatCurrency(r.revenue)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Campaign performance</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Campaign</TH>
                <TH>Status</TH>
                <TH>Targets</TH>
                <TH>Completed</TH>
                <TH>Declined</TH>
                <TH>Unreachable</TH>
                <TH>Orders</TH>
                <TH>Conversion</TH>
                <TH>Revenue</TH>
              </TR>
            </THead>
            <TBody>
              {campaigns?.map((c) => (
                <TR key={c.id}>
                  <TD>{c.name}</TD>
                  <TD>{c.status}</TD>
                  <TD>{c.targets}</TD>
                  <TD>{c.completedTargets}</TD>
                  <TD>{c.declinedTargets}</TD>
                  <TD>{c.unreachableTargets}</TD>
                  <TD>{c.orders}</TD>
                  <TD>{c.conversion}%</TD>
                  <TD>{formatCurrency(c.revenue)}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
