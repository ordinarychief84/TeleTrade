'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';
import { Users, History } from 'lucide-react';

export default function SettingsPage() {
  const { data: audit } = useQuery<any[]>({ queryKey: ['audit'], queryFn: () => api.get('/audit') });

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-xs md:text-sm text-muted-foreground">Admin-only controls for this workspace.</p>
      </div>

      <Link href="/settings/team">
        <Card className="hover:bg-accent/30 transition cursor-pointer">
          <CardContent className="p-4 flex items-center gap-3">
            <span className="h-10 w-10 rounded-lg bg-violet-50 text-violet-600 flex items-center justify-center">
              <Users className="h-5 w-5" />
            </span>
            <div className="flex-1">
              <div className="font-medium text-sm">Team & workspace</div>
              <div className="text-[11px] text-muted-foreground">
                Invite agents, managers, and delivery ops; manage roles and seats.
              </div>
            </div>
            <span className="text-xs text-muted-foreground">→</span>
          </CardContent>
        </Card>
      </Link>

      <Card>
        <div className="p-4 border-b text-sm font-medium flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          Recent audit events
        </div>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>When</TH>
                <TH>Actor</TH>
                <TH>Action</TH>
                <TH>Entity</TH>
              </TR>
            </THead>
            <TBody>
              {audit?.slice(0, 25).map((a) => (
                <TR key={a.id}>
                  <TD className="text-xs">{formatDate(a.createdAt)}</TD>
                  <TD className="text-xs">{a.actor?.email ?? '—'}</TD>
                  <TD className="text-xs">
                    <Badge variant="outline">{a.action}</Badge>
                  </TD>
                  <TD className="text-xs">{a.entity}</TD>
                </TR>
              ))}
              {!audit?.length && (
                <TR>
                  <TD colSpan={4} className="text-muted-foreground text-center p-6">
                    No audit events yet.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
