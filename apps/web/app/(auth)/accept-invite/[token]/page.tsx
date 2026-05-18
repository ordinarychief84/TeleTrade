'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { setTokens, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setError("Passwords don't match.");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/auth/accept-invite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: params.token, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.message || 'Could not accept invite', body);
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">You’re invited</CardTitle>
          <CardDescription>
            Set a password to join the workspace. Your admin chose your role.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm">Confirm password</Label>
              <Input
                id="confirm"
                type="password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                minLength={8}
                required
              />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Joining workspace…' : 'Accept invite & sign in'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Wrong account?{' '}
              <Link href="/login" className="text-primary underline">
                Sign in instead
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
