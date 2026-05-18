'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { setTokens, ApiError } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4100';

export default function SignupPage() {
  const router = useRouter();
  const [companyName, setCompanyName] = useState('');
  const [industry, setIndustry] = useState('FMCG');
  const [country, setCountry] = useState('Nigeria');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/api/v1/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, industry, country, fullName, email, password }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new ApiError(res.status, body.message || 'Signup failed', body);
      }
      const data = await res.json();
      setTokens(data.accessToken, data.refreshToken);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Couldn’t create your workspace.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/30 p-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Start your workspace</CardTitle>
          <CardDescription>
            One workspace per company. You become the first admin — invite your team in the next step.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={submit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="Acme Beverages Ltd"
                required
                autoFocus
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="FMCG" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="country">Country</Label>
                <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" />
              </div>
            </div>
            <div className="pt-2 border-t" />
            <div className="space-y-2">
              <Label htmlFor="fullName">Your name</Label>
              <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Work email</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                required
              />
              <p className="text-[11px] text-muted-foreground">8+ characters. You can change this later.</p>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? 'Creating workspace…' : 'Create workspace'}
            </Button>
            <p className="text-xs text-muted-foreground text-center">
              Already have an account?{' '}
              <Link href="/login" className="text-primary underline">
                Sign in
              </Link>
            </p>
            <div className="rounded-md bg-muted p-3 text-[11px] text-muted-foreground space-y-1">
              <div className="font-semibold text-foreground">What happens next</div>
              <div>1. We create your TeleTrade workspace under a unique slug.</div>
              <div>2. You land on the dashboard as the workspace admin.</div>
              <div>3. From Settings → Team you invite agents, managers, and delivery ops.</div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
