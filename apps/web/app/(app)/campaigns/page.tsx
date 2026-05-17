'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Table, THead, TBody, TR, TH, TD } from '@/components/ui/table';
import { MultiSelect } from '@/components/ui/multi-select';
import { formatDate } from '@/lib/utils';
import { useAuth } from '@/lib/auth-store';
import { CampaignType, OutletType, AccountTier, Role } from '@teletrade/shared';

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  approvedAt: string | null;
  createdAt: string;
  _count?: { targets?: number };
}

interface PreviewResult {
  count: number;
  sample: Array<{ id: string; outletName: string; phone: string; accountTier: string; outletType: string; lastOrderDate: string | null }>;
}

export default function CampaignsPage() {
  const qc = useQueryClient();
  const role = useAuth((s) => s.user?.role);
  const canManageCampaigns = role === Role.SALES_MANAGER || role === Role.ADMIN;

  const { data: campaigns } = useQuery<Campaign[]>({
    queryKey: ['campaigns'],
    queryFn: () => api.get('/campaigns'),
  });

  const { data: agentQueue } = useQuery<any[]>({
    queryKey: ['campaign-queue'],
    queryFn: () => api.get('/campaigns/my-queue'),
    enabled: !canManageCampaigns,
  });

  const [name, setName] = useState('');
  const [type, setType] = useState<string>(CampaignType.PROMO_PUSH);
  const [pitch, setPitch] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [accountTiers, setAccountTiers] = useState<string[]>([]);
  const [outletTypes, setOutletTypes] = useState<string[]>([]);
  const [dormantDays, setDormantDays] = useState<number | ''>('');
  const [limit, setLimit] = useState<number | ''>(100);

  const filters = {
    accountTiers: accountTiers.length ? accountTiers : undefined,
    outletTypes: outletTypes.length ? outletTypes : undefined,
    dormantDaysGte: dormantDays === '' ? undefined : Number(dormantDays),
    limit: limit === '' ? undefined : Number(limit),
  };

  const previewMut = useMutation({
    mutationFn: () => api.post<PreviewResult>('/campaigns/preview-targets', filters),
  });

  const createMut = useMutation({
    mutationFn: () =>
      api.post<Campaign>('/campaigns', {
        name,
        type,
        pitch,
        promoCode: promoCode || undefined,
        filters,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['campaigns'] });
      setName('');
      setPitch('');
      setPromoCode('');
    },
  });

  const approveMut = useMutation({
    mutationFn: (id: string) => api.post(`/campaigns/${id}/approve`, {}),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['campaigns'] }),
  });

  if (!canManageCampaigns) {
    return (
      <div className="space-y-4">
        <div>
          <h1 className="text-2xl font-semibold">My call queue</h1>
          <p className="text-sm text-muted-foreground">
            Pending campaign targets assigned to you. Sales managers create the campaigns.
          </p>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <THead>
                <TR>
                  <TH>Campaign</TH>
                  <TH>Outlet</TH>
                  <TH>Phone</TH>
                  <TH>Pitch</TH>
                  <TH>Attempts</TH>
                </TR>
              </THead>
              <TBody>
                {agentQueue?.map((t: any) => (
                  <TR key={t.id}>
                    <TD>{t.campaign?.name}</TD>
                    <TD>{t.customer?.outletName}</TD>
                    <TD className="font-mono text-xs">{t.customer?.phone}</TD>
                    <TD className="text-xs text-muted-foreground">{t.campaign?.pitch ?? '—'}</TD>
                    <TD>{t.attempts}</TD>
                  </TR>
                ))}
                {!agentQueue?.length && (
                  <TR>
                    <TD colSpan={5} className="text-center text-muted-foreground p-6">
                      No campaign targets in your queue. Inbound calls keep coming through the Softphone.
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

  return (
    <div className="grid gap-4 lg:grid-cols-[420px_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>New campaign</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Name</div>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Q3 Malta Push" />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Type</div>
            <Select value={type} onChange={(e) => setType(e.target.value)}>
              {Object.values(CampaignType).map((t) => (
                <option key={t} value={t}>
                  {t.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Agent pitch (script)</div>
            <Textarea value={pitch} onChange={(e) => setPitch(e.target.value)} rows={2} />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Promo code (optional)</div>
            <Input value={promoCode} onChange={(e) => setPromoCode(e.target.value)} placeholder="PROMO-MALTA-Q2" />
          </div>
          <div className="pt-2 border-t" />
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Account tiers</div>
            <MultiToggle
              options={Object.values(AccountTier)}
              value={accountTiers}
              onChange={setAccountTiers}
            />
          </div>
          <div className="space-y-1">
            <div className="text-xs text-muted-foreground">Outlet types</div>
            <MultiSelect
              options={Object.values(OutletType).map((t) => ({ value: t, label: t.replace(/_/g, ' ') }))}
              value={outletTypes}
              onChange={setOutletTypes}
              placeholder="All outlet types"
            />
          </div>
          <div className="flex gap-3">
            <div className="space-y-1 flex-1">
              <div className="text-xs text-muted-foreground">Dormant ≥ days</div>
              <Input
                type="number"
                value={dormantDays}
                onChange={(e) => setDormantDays(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
            <div className="space-y-1 flex-1">
              <div className="text-xs text-muted-foreground">Max targets</div>
              <Input
                type="number"
                value={limit}
                onChange={(e) => setLimit(e.target.value === '' ? '' : Number(e.target.value))}
              />
            </div>
          </div>
          <div className="flex gap-2 pt-2">
            <Button variant="outline" onClick={() => previewMut.mutate()} disabled={previewMut.isPending}>
              {previewMut.isPending ? 'Previewing…' : 'Preview targets'}
            </Button>
            <Button onClick={() => createMut.mutate()} disabled={!name || createMut.isPending}>
              {createMut.isPending ? 'Saving…' : 'Save as draft'}
            </Button>
          </div>
          {(previewMut.error || createMut.error) && (
            <div className="text-sm text-destructive">
              {((previewMut.error || createMut.error) as Error).message}
            </div>
          )}
          {previewMut.data && (
            <div className="rounded-md bg-muted p-3 text-xs space-y-2">
              <div className="font-medium text-foreground">{previewMut.data.count} matching outlets</div>
              <div className="space-y-1 max-h-48 overflow-auto">
                {previewMut.data.sample.map((s) => (
                  <div key={s.id} className="flex justify-between">
                    <span>{s.outletName}</span>
                    <span className="font-mono text-muted-foreground">{s.phone}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Campaigns</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <THead>
              <TR>
                <TH>Name</TH>
                <TH>Type</TH>
                <TH>Status</TH>
                <TH>Targets</TH>
                <TH>Created</TH>
                <TH></TH>
              </TR>
            </THead>
            <TBody>
              {campaigns?.map((c) => (
                <TR key={c.id}>
                  <TD className="font-medium">
                    <Link href={`/campaigns/${c.id}`} className="hover:underline">
                      {c.name}
                    </Link>
                  </TD>
                  <TD className="text-xs">{c.type.replace(/_/g, ' ')}</TD>
                  <TD>
                    <Badge variant={c.status === 'ACTIVE' ? 'success' : 'outline'}>{c.status}</Badge>
                  </TD>
                  <TD>{c._count?.targets ?? 0}</TD>
                  <TD className="text-xs">{formatDate(c.createdAt)}</TD>
                  <TD>
                    {(c.status === 'DRAFT' || c.status === 'PENDING_APPROVAL') && (
                      <Button size="sm" onClick={() => approveMut.mutate(c.id)} disabled={approveMut.isPending}>
                        Approve & start
                      </Button>
                    )}
                  </TD>
                </TR>
              ))}
              {!campaigns?.length && (
                <TR>
                  <TD colSpan={6} className="text-muted-foreground text-center">
                    No campaigns yet.
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

function MultiToggle({ options, value, onChange }: { options: string[]; value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap gap-1">
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            className={`text-[11px] rounded-md border px-2 py-1 ${
              on ? 'bg-primary text-primary-foreground' : 'bg-background hover:bg-accent'
            }`}
            onClick={() => onChange(on ? value.filter((v) => v !== o) : [...value, o])}
          >
            {o.replace(/_/g, ' ')}
          </button>
        );
      })}
    </div>
  );
}
