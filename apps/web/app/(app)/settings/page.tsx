'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

export default function SettingsPage() {
  const { data: users } = useQuery<any[]>({ queryKey: ['users'], queryFn: () => api.get('/users') });
  const { data: audit } = useQuery<any[]>({ queryKey: ['audit'], queryFn: () => api.get('/audit') });

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-semibold">Settings</h1>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Users</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Email</TH>
                <TH>Name</TH>
                <TH>Role</TH>
                <TH>Active</TH>
                <TH>Last login</TH>
              </TR>
            </THead>
            <TBody>
              {users?.map((u) => (
                <TR key={u.id}>
                  <TD>{u.email}</TD>
                  <TD>{u.fullName}</TD>
                  <TD>
                    <Badge variant="outline">{u.role}</Badge>
                  </TD>
                  <TD>{u.active ? 'yes' : 'no'}</TD>
                  <TD className="text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Recent audit events</CardTitle>
        </CardHeader>
        <CardContent>
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
                  <TD className="text-xs">{a.action}</TD>
                  <TD className="text-xs">{a.entity}</TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
