'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useMutation, useQuery } from '@tanstack/react-query';
import { api, clearTokens } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { AlertOctagon } from 'lucide-react';

interface Workspace {
  name: string;
  stats: { users: number; customers: number; orders: number };
}

export default function DangerPage() {
  const router = useRouter();
  const { data } = useQuery<Workspace>({
    queryKey: ['account-workspace'],
    queryFn: () => api.get('/account/workspace'),
  });

  const [confirm, setConfirm] = useState('');
  const [password, setPassword] = useState('');

  const closeMut = useMutation({
    mutationFn: () => api.post('/account/close', { confirm, password }),
    onSuccess: () => {
      clearTokens();
      router.replace('/login');
    },
  });

  const isMatch = data && confirm.trim() === data.name;

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold flex items-center gap-2">
          <AlertOctagon className="h-5 w-5 text-destructive" />
          Close workspace
        </h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          This deactivates every teammate, revokes every session, and prevents new logins. Your data stays in our
          database for 30 days for audit and recovery before purge.
        </p>
      </div>

      <Card className="border-destructive/40">
        <CardContent className="p-5 space-y-4">
          <div className="rounded-md bg-rose-50 border border-rose-200 p-3 text-sm text-rose-700">
            <div className="font-semibold mb-1">You’re about to close “{data?.name ?? '…'}”</div>
            <ul className="list-disc ml-5 text-xs space-y-0.5">
              <li>{data?.stats.users ?? '—'} member{(data?.stats.users ?? 0) === 1 ? '' : 's'} will be signed out.</li>
              <li>{data?.stats.customers.toLocaleString() ?? '—'} customer records will stop receiving updates.</li>
              <li>{data?.stats.orders.toLocaleString() ?? '—'} order records remain frozen for audit.</li>
              <li>DMS sync jobs in flight will fail and be moved to dead-letter.</li>
            </ul>
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirm">Type the workspace name to confirm</Label>
            <Input
              id="confirm"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder={data?.name ?? ''}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pw">Your password</Label>
            <Input id="pw" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>

          {closeMut.error && <p className="text-sm text-destructive">{(closeMut.error as Error).message}</p>}

          <Button
            variant="destructive"
            disabled={!isMatch || !password || closeMut.isPending}
            onClick={() => closeMut.mutate()}
          >
            {closeMut.isPending ? 'Closing…' : 'Close workspace permanently'}
          </Button>
          <p className="text-[11px] text-muted-foreground">
            Need to hand the workspace to someone else instead? Contact support — admin transfer is on the roadmap.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
