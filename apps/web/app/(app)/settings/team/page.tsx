'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Role, InvitationStatus } from '@teletrade/shared';
import { useAuth } from '@/lib/auth-store';
import { formatDate } from '@/lib/utils';
import { UserPlus, Copy, Mail, Users, Shield, RefreshCw } from 'lucide-react';

interface TeamData {
  tenant: {
    id: string;
    name: string;
    slug: string;
    plan: string;
    seatLimit: number;
    seatsUsed: number;
    seatsAvailable: number;
    industry: string | null;
    country: string | null;
    billingEmail: string | null;
  };
  users: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    active: boolean;
    lastLoginAt: string | null;
    createdAt: string;
  }[];
  invitations: {
    id: string;
    email: string;
    fullName: string;
    role: string;
    status: string;
    invitedBy: string;
    expiresAt: string;
    createdAt: string;
  }[];
}

const ROLE_LABEL: Record<string, string> = {
  ADMIN: 'Admin',
  SALES_MANAGER: 'Sales manager',
  AGENT: 'Telesales agent',
  DELIVERY_OPS: 'Delivery ops',
};

export default function TeamPage() {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === Role.ADMIN;

  const { data, isLoading, isError, error, refetch } = useQuery<TeamData>({
    queryKey: ['team'],
    queryFn: () => api.get('/team'),
  });

  const [inviteOpen, setInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteName, setInviteName] = useState('');
  const [inviteRole, setInviteRole] = useState<string>(Role.AGENT);
  const [acceptUrl, setAcceptUrl] = useState<string | null>(null);

  const inviteMut = useMutation({
    mutationFn: () =>
      api.post<{ acceptUrl: string }>('/team/invite', {
        email: inviteEmail,
        fullName: inviteName,
        role: inviteRole,
      }),
    onSuccess: (res) => {
      setAcceptUrl(res.acceptUrl);
      setInviteEmail('');
      setInviteName('');
      qc.invalidateQueries({ queryKey: ['team'] });
    },
  });

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/team/invitations/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  const userMut = useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: any }) => api.patch(`/team/users/${id}`, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['team'] }),
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 space-y-2 text-sm">
          <div className="font-medium">Couldn’t load your team.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <Button size="sm" variant="outline" onClick={() => refetch()}>Try again</Button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return <div className="text-muted-foreground text-sm">Loading…</div>;
  }

  const seatPct = (data.tenant.seatsUsed / data.tenant.seatLimit) * 100;
  const seatTone =
    seatPct >= 100 ? 'bg-rose-500' : seatPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';

  return (
    <div className="space-y-5 max-w-4xl">
      <div className="flex items-start justify-between gap-3 flex-col md:flex-row">
        <div>
          <h1 className="text-2xl font-semibold">Team & workspace</h1>
          <p className="text-xs md:text-sm text-muted-foreground">
            {data.tenant.name} · {data.tenant.industry ?? '—'} · {data.tenant.country ?? '—'} ·{' '}
            <Badge variant="outline" className="ml-1">{data.tenant.plan}</Badge>
          </p>
        </div>
        <Sheet open={inviteOpen} onOpenChange={setInviteOpen}>
          <SheetTrigger asChild>
            <Button onClick={() => setAcceptUrl(null)}>
              <UserPlus className="h-4 w-4" /> Invite teammate
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-96 p-0">
            <div className="p-5 border-b">
              <div className="text-lg font-semibold">Invite teammate</div>
              <div className="text-xs text-muted-foreground">
                They’ll get a link to set their password and join {data.tenant.name}.
              </div>
            </div>
            <div className="p-5 space-y-4">
              <div className="space-y-2">
                <Label htmlFor="inv-email">Email</Label>
                <Input
                  id="inv-email"
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="teammate@yourcompany.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-name">Full name</Label>
                <Input
                  id="inv-name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="Yemi Salesrep"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="inv-role">Role</Label>
                <Select id="inv-role" value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}>
                  {Object.values(Role).map((r) => (
                    <option key={r} value={r}>
                      {ROLE_LABEL[r]}
                    </option>
                  ))}
                </Select>
                <p className="text-[11px] text-muted-foreground">
                  Roles can be changed later from the team list.
                </p>
              </div>

              {inviteMut.error && (
                <p className="text-sm text-destructive">{(inviteMut.error as Error).message}</p>
              )}

              {acceptUrl ? (
                <div className="rounded-lg border bg-emerald-50 p-3 text-xs space-y-2">
                  <div className="font-medium text-emerald-700 flex items-center gap-1.5">
                    <Mail className="h-4 w-4" /> Invite sent
                  </div>
                  <p className="text-emerald-700/80">
                    For the demo, share this link directly. Production deployments hand it to email.
                  </p>
                  <div className="flex items-center gap-2">
                    <Input value={acceptUrl} readOnly className="text-[11px] font-mono" />
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard?.writeText(acceptUrl);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    size="sm"
                    onClick={() => {
                      setAcceptUrl(null);
                    }}
                  >
                    Invite another
                  </Button>
                </div>
              ) : (
                <Button
                  className="w-full"
                  disabled={!inviteEmail || !inviteName || inviteMut.isPending}
                  onClick={() => inviteMut.mutate()}
                >
                  {inviteMut.isPending ? 'Sending…' : 'Send invite'}
                </Button>
              )}
              <div className="text-[11px] text-muted-foreground">
                {data.tenant.seatsAvailable} of {data.tenant.seatLimit} seats remaining.
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Seat usage */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="font-medium">Seats used</span>
            </div>
            <span className="font-mono">
              {data.tenant.seatsUsed} / {data.tenant.seatLimit}
            </span>
          </div>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div className={'h-full rounded-full ' + seatTone} style={{ width: `${Math.min(100, seatPct)}%` }} />
          </div>
          <p className="text-[11px] text-muted-foreground mt-1.5">
            {data.tenant.seatsAvailable > 0
              ? `${data.tenant.seatsAvailable} seat${data.tenant.seatsAvailable === 1 ? '' : 's'} available — invite away.`
              : 'No seats left. Deactivate someone or upgrade the plan.'}
          </p>
        </CardContent>
      </Card>

      {/* Pending invitations */}
      {data.invitations.length > 0 && (
        <Card>
          <div className="p-4 border-b text-sm font-medium flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Pending invitations
          </div>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Person</TH>
                  <TH>Role</TH>
                  <TH>Invited by</TH>
                  <TH>Expires</TH>
                  <TH>Status</TH>
                  <TH></TH>
                </TR>
              </THead>
              <TBody>
                {data.invitations.map((inv) => (
                  <TR key={inv.id}>
                    <TD>
                      <div className="font-medium text-sm">{inv.fullName}</div>
                      <div className="text-[11px] text-muted-foreground">{inv.email}</div>
                    </TD>
                    <TD className="text-xs">{ROLE_LABEL[inv.role] ?? inv.role}</TD>
                    <TD className="text-xs">{inv.invitedBy}</TD>
                    <TD className="text-xs">{formatDate(inv.expiresAt)}</TD>
                    <TD>
                      <Badge variant={inv.status === InvitationStatus.PENDING ? 'warning' : 'destructive'}>
                        {inv.status.toLowerCase()}
                      </Badge>
                    </TD>
                    <TD>
                      {inv.status === InvitationStatus.PENDING && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => revokeMut.mutate(inv.id)}
                          disabled={revokeMut.isPending}
                        >
                          Revoke
                        </Button>
                      )}
                    </TD>
                  </TR>
                ))}
              </TBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Members */}
      <Card>
        <div className="p-4 border-b text-sm font-medium flex items-center gap-2">
          <Shield className="h-4 w-4 text-muted-foreground" />
          Members
        </div>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Person</TH>
                <TH>Role</TH>
                <TH>Status</TH>
                <TH>Last login</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {data.users.map((u) => {
                const isSelf = u.id === me?.id;
                return (
                  <TR key={u.id} className={!u.active ? 'opacity-60' : ''}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-full bg-violet-50 text-violet-700 flex items-center justify-center text-xs font-semibold">
                          {initials(u.fullName)}
                        </div>
                        <div>
                          <div className="font-medium text-sm">
                            {u.fullName}
                            {isSelf && <span className="ml-2 text-[10px] text-muted-foreground">you</span>}
                          </div>
                          <div className="text-[11px] text-muted-foreground">{u.email}</div>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      {isAdmin && !isSelf ? (
                        <Select
                          value={u.role}
                          className="h-8 text-xs w-36"
                          onChange={(e) => userMut.mutate({ id: u.id, patch: { role: e.target.value } })}
                          disabled={userMut.isPending}
                        >
                          {Object.values(Role).map((r) => (
                            <option key={r} value={r}>
                              {ROLE_LABEL[r] ?? r}
                            </option>
                          ))}
                        </Select>
                      ) : (
                        <Badge variant="outline">{ROLE_LABEL[u.role] ?? u.role}</Badge>
                      )}
                    </TD>
                    <TD>
                      <Badge variant={u.active ? 'success' : 'destructive'}>
                        {u.active ? 'active' : 'deactivated'}
                      </Badge>
                    </TD>
                    <TD className="text-xs">{u.lastLoginAt ? formatDate(u.lastLoginAt) : '—'}</TD>
                    <TD>
                      {isAdmin && !isSelf && (
                        <Button
                          size="sm"
                          variant={u.active ? 'outline' : 'default'}
                          onClick={() =>
                            userMut.mutate({ id: u.id, patch: { active: !u.active } })
                          }
                          disabled={userMut.isPending}
                        >
                          {u.active ? 'Deactivate' : 'Reactivate'}
                        </Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
            </TBody>
          </Table>
        </CardContent>
      </Card>

      {userMut.error && (
        <p className="text-sm text-destructive">{(userMut.error as Error).message}</p>
      )}
    </div>
  );
}

function initials(name: string) {
  return name
    .split(' ')
    .slice(0, 2)
    .map((s) => s[0]?.toUpperCase())
    .join('');
}
