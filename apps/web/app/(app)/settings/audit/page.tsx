'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { formatDate } from '@/lib/utils';
import { ScrollText } from 'lucide-react';

interface AuditRow {
  id: string;
  createdAt: string;
  action: string;
  entity: string;
  entityId: string | null;
  ip: string | null;
  userAgent: string | null;
  actor?: { fullName: string; email: string; role: string } | null;
}

export default function AuditPage() {
  const [entity, setEntity] = useState('');
  const [actor, setActor] = useState('');

  const { data, isLoading } = useQuery<AuditRow[]>({
    queryKey: ['audit', entity, actor],
    queryFn: () => {
      const p = new URLSearchParams();
      if (entity) p.set('entity', entity);
      if (actor) p.set('actorId', actor);
      return api.get(`/audit${p.toString() ? '?' + p.toString() : ''}`);
    },
  });

  const filtered = (data ?? []).filter((r) => {
    if (entity && r.entity !== entity) return false;
    return true;
  });

  return (
    <div className="space-y-5 max-w-5xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <ScrollText className="h-5 w-5 text-muted-foreground" />
          Audit log
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Every mutation in this workspace — who, what, when, from where.
        </p>
      </div>

      <Card>
        <CardContent className="p-3 grid grid-cols-1 sm:grid-cols-[1fr_220px] gap-2">
          <Input placeholder="Search…" value={actor} onChange={(e) => setActor(e.target.value)} />
          <Select value={entity} onChange={(e) => setEntity(e.target.value)}>
            <option value="">All entities</option>
            <option value="Tenant">Tenant</option>
            <option value="User">User</option>
            <option value="Invitation">Invitation</option>
            <option value="Customer">Customer</option>
            <option value="Order">Order</option>
            <option value="Campaign">Campaign</option>
            <option value="Call">Call</option>
            <option value="DmsSyncJob">DMS sync job</option>
            <option value="DeliveryAssignment">Delivery</option>
            <option value="RefreshToken">Session</option>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Loading…</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">
              Nothing here yet — actions like inviting teammates, confirming orders, or changing plan land in this log.
            </div>
          ) : (
            <Table>
              <THead>
                <TR>
                  <TH>When</TH>
                  <TH>Actor</TH>
                  <TH>Action</TH>
                  <TH>Entity</TH>
                  <TH>IP</TH>
                </TR>
              </THead>
              <TBody>
                {filtered.map((r) => (
                  <TR key={r.id}>
                    <TD className="text-xs whitespace-nowrap">{formatDate(r.createdAt)}</TD>
                    <TD className="text-xs">
                      <div className="font-medium">{r.actor?.fullName ?? 'system'}</div>
                      <div className="text-muted-foreground">{r.actor?.email ?? '—'}</div>
                    </TD>
                    <TD>
                      <Badge variant="outline" className="font-mono text-[10px]">
                        {r.action}
                      </Badge>
                    </TD>
                    <TD className="text-xs">
                      {r.entity}
                      {r.entityId && <span className="text-muted-foreground"> · {r.entityId.slice(-6)}</span>}
                    </TD>
                    <TD className="text-xs text-muted-foreground">{r.ip ?? '—'}</TD>
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
