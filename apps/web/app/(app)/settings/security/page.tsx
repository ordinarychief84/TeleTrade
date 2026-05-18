'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { formatDate } from '@/lib/utils';
import { Laptop, KeyRound, CheckCircle2 } from 'lucide-react';

interface Session {
  id: string;
  userAgent: string | null;
  ip: string | null;
  createdAt: string;
  expiresAt: string;
}

export default function SecurityPage() {
  const qc = useQueryClient();
  const { data: sessions } = useQuery<Session[]>({
    queryKey: ['account-sessions'],
    queryFn: () => api.get('/account/sessions'),
  });

  const [current, setCurrent] = useState('');
  const [next, setNext] = useState('');
  const [confirm, setConfirm] = useState('');
  const [pwError, setPwError] = useState<string | null>(null);

  const revokeMut = useMutation({
    mutationFn: (id: string) => api.delete(`/account/sessions/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-sessions'] }),
  });

  const passwordMut = useMutation({
    mutationFn: () => api.post('/account/password', { currentPassword: current, newPassword: next }),
    onSuccess: () => {
      setCurrent('');
      setNext('');
      setConfirm('');
      setPwError(null);
      qc.invalidateQueries({ queryKey: ['account-sessions'] });
    },
    onError: (e: any) => setPwError(e.message),
  });

  function submitPassword(e: React.FormEvent) {
    e.preventDefault();
    if (next !== confirm) {
      setPwError("New passwords don’t match.");
      return;
    }
    passwordMut.mutate();
  }

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Security</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Your password and the devices currently signed in to your account.
        </p>
      </div>

      <Card>
        <div className="p-4 border-b text-sm font-medium flex items-center gap-2">
          <KeyRound className="h-4 w-4 text-muted-foreground" />
          Change password
        </div>
        <CardContent className="p-5">
          <form onSubmit={submitPassword} className="space-y-3 max-w-md">
            <div className="space-y-2">
              <Label htmlFor="cur">Current password</Label>
              <Input id="cur" type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="new">New password</Label>
              <Input id="new" type="password" value={next} onChange={(e) => setNext(e.target.value)} minLength={8} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm new password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {pwError && <p className="text-sm text-destructive">{pwError}</p>}
            {passwordMut.isSuccess && (
              <p className="text-sm text-emerald-700 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4" />
                Password updated. All other sessions have been signed out.
              </p>
            )}
            <Button type="submit" disabled={passwordMut.isPending}>
              {passwordMut.isPending ? 'Saving…' : 'Update password'}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Card>
        <div className="p-4 border-b text-sm font-medium flex items-center gap-2">
          <Laptop className="h-4 w-4 text-muted-foreground" />
          Active sessions
        </div>
        <CardContent className="p-0">
          <Table>
            <THead>
              <TR>
                <TH>Device / IP</TH>
                <TH>Signed in</TH>
                <TH>Expires</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {sessions?.map((s) => (
                <TR key={s.id}>
                  <TD className="text-xs">
                    <div className="font-medium text-foreground">{deviceLabel(s.userAgent)}</div>
                    <div className="text-muted-foreground">{s.ip ?? '—'}</div>
                  </TD>
                  <TD className="text-xs">{formatDate(s.createdAt)}</TD>
                  <TD className="text-xs">{formatDate(s.expiresAt)}</TD>
                  <TD>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => revokeMut.mutate(s.id)}
                      disabled={revokeMut.isPending}
                    >
                      Sign out
                    </Button>
                  </TD>
                </TR>
              ))}
              {!sessions?.length && (
                <TR>
                  <TD colSpan={4} className="text-muted-foreground text-center p-6">
                    No active sessions.
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

function deviceLabel(ua: string | null) {
  if (!ua) return 'Unknown device';
  if (/iPhone|iPad/i.test(ua)) return 'iOS';
  if (/Android/i.test(ua)) return 'Android';
  if (/Macintosh/i.test(ua)) return 'macOS';
  if (/Windows/i.test(ua)) return 'Windows';
  if (/Linux/i.test(ua)) return 'Linux';
  return ua.slice(0, 40);
}
