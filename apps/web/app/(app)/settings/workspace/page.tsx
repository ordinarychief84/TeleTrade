'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CheckCircle2 } from 'lucide-react';

interface Workspace {
  id: string;
  name: string;
  slug: string;
  industry: string | null;
  country: string | null;
  timezone: string | null;
  billingEmail: string | null;
  logoUrl: string | null;
}

export default function WorkspacePage() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery<Workspace>({
    queryKey: ['account-workspace'],
    queryFn: () => api.get('/account/workspace'),
  });

  const [name, setName] = useState('');
  const [industry, setIndustry] = useState('');
  const [country, setCountry] = useState('');
  const [timezone, setTimezone] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    if (!data) return;
    setName(data.name);
    setIndustry(data.industry ?? '');
    setCountry(data.country ?? '');
    setTimezone(data.timezone ?? '');
    setBillingEmail(data.billingEmail ?? '');
    setLogoUrl(data.logoUrl ?? '');
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      api.patch('/account/workspace', {
        name,
        industry: industry || null,
        country: country || null,
        timezone: timezone || null,
        billingEmail: billingEmail || null,
        logoUrl: logoUrl || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-workspace'] }),
  });

  return (
    <div className="space-y-5 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Workspace</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          Public-facing details for {data?.name ?? 'your workspace'}. Slug is fixed at creation.
        </p>
      </div>

      <Card>
        <CardContent className="p-5 space-y-4">
          {isLoading && <div className="text-sm text-muted-foreground">Loading…</div>}
          <div className="space-y-2">
            <Label htmlFor="name">Company name</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="slug">Workspace slug</Label>
            <Input id="slug" value={data?.slug ?? ''} readOnly disabled />
            <p className="text-[11px] text-muted-foreground">Used in invitation URLs. Contact support to change it.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" value={industry} onChange={(e) => setIndustry(e.target.value)} placeholder="FMCG" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="country">Country</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder="Nigeria" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="timezone">Timezone</Label>
              <Input
                id="timezone"
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                placeholder="Africa/Lagos"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing">Billing email</Label>
              <Input
                id="billing"
                type="email"
                value={billingEmail}
                onChange={(e) => setBillingEmail(e.target.value)}
                placeholder="finance@yourcompany.com"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              placeholder="https://yourcompany.com/logo.png"
            />
          </div>
          {saveMut.error && <p className="text-sm text-destructive">{(saveMut.error as Error).message}</p>}
          {saveMut.isSuccess && (
            <p className="text-sm text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" />
              Saved.
            </p>
          )}
          <div className="flex gap-2">
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : 'Save changes'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
