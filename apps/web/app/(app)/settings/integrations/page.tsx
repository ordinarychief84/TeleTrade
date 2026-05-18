'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-store';
import { DmsAdapterKind, Role } from '@teletrade/shared';
import { formatDate } from '@/lib/utils';
import { Database, Phone, Webhook, CheckCircle2 } from 'lucide-react';

interface Integrations {
  dms: {
    adapter: string;
    config: { url?: string; database?: string; username?: string; apiKey?: string } | null;
    health: { pending: number; failed: number; deadLetter: number; succeeded24h: number };
  };
  telephony: { provider: string };
  webhooks: { endpoint: string; lastReceived: string | null };
}

const ADAPTER_LABEL: Record<string, string> = {
  ODOO: 'Odoo',
  SAP_B1: 'SAP Business One',
  DYNAMICS_365: 'Microsoft Dynamics 365',
  CUSTOM: 'Custom REST API',
};

export default function IntegrationsPage() {
  const qc = useQueryClient();
  const me = useAuth((s) => s.user);
  const isAdmin = me?.role === Role.ADMIN;

  const { data, isLoading } = useQuery<Integrations>({
    queryKey: ['account-integrations'],
    queryFn: () => api.get('/account/integrations'),
  });

  const [adapter, setAdapter] = useState<string>(DmsAdapterKind.ODOO);
  const [url, setUrl] = useState('');
  const [database, setDatabase] = useState('');
  const [username, setUsername] = useState('');
  const [apiKey, setApiKey] = useState('');

  useEffect(() => {
    if (!data) return;
    setAdapter(data.dms.adapter);
    setUrl(data.dms.config?.url ?? '');
    setDatabase(data.dms.config?.database ?? '');
    setUsername(data.dms.config?.username ?? '');
    setApiKey(''); // never echo back stored key
  }, [data]);

  const saveMut = useMutation({
    mutationFn: () =>
      api.patch('/account/integrations/dms', {
        adapter,
        url: url || null,
        database: database || null,
        username: username || null,
        apiKey: apiKey || null,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['account-integrations'] }),
  });

  if (isLoading || !data) return <div className="text-muted-foreground text-sm">Loading…</div>;

  const h = data.dms.health;
  const healthOk = h.deadLetter === 0 && h.failed === 0;

  return (
    <div className="space-y-5 max-w-3xl">
      <div>
        <h1 className="text-2xl font-semibold">Integrations</h1>
        <p className="text-xs md:text-sm text-muted-foreground">
          How TeleTrade talks to your DMS, telephony, and external services.
        </p>
      </div>

      {/* DMS */}
      <Card>
        <div className="p-4 border-b flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm font-medium">DMS / ERP adapter</span>
          </div>
          <Badge variant={healthOk ? 'success' : 'destructive'}>
            {healthOk ? 'healthy' : `${h.deadLetter + h.failed} need attention`}
          </Badge>
        </div>
        <CardContent className="p-5 space-y-4">
          <div className="grid grid-cols-4 gap-3 text-xs">
            <HealthTile label="Pending" value={h.pending} />
            <HealthTile label="Failed" value={h.failed} tone={h.failed ? 'amber' : 'slate'} />
            <HealthTile label="Dead letter" value={h.deadLetter} tone={h.deadLetter ? 'rose' : 'slate'} />
            <HealthTile label="Succeeded (24h)" value={h.succeeded24h} tone="emerald" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="adapter">Adapter</Label>
            <Select id="adapter" value={adapter} onChange={(e) => setAdapter(e.target.value)} disabled={!isAdmin}>
              {Object.values(DmsAdapterKind).map((a) => (
                <option key={a} value={a}>
                  {ADAPTER_LABEL[a] ?? a}
                </option>
              ))}
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="url">Base URL</Label>
            <Input
              id="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://erp.yourcompany.com"
              disabled={!isAdmin}
            />
          </div>
          {(adapter === DmsAdapterKind.ODOO || adapter === DmsAdapterKind.SAP_B1) && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="db">Database</Label>
                <Input id="db" value={database} onChange={(e) => setDatabase(e.target.value)} disabled={!isAdmin} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="user">Username</Label>
                <Input id="user" value={username} onChange={(e) => setUsername(e.target.value)} disabled={!isAdmin} />
              </div>
            </div>
          )}
          <div className="space-y-2">
            <Label htmlFor="api">API key / token</Label>
            <Input
              id="api"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={
                data.dms.config?.apiKey ? `Stored as ${data.dms.config.apiKey}` : 'Leave blank to keep current key'
              }
              disabled={!isAdmin}
            />
            <p className="text-[11px] text-muted-foreground">
              Only the last 4 characters are echoed back. Enter a new value to rotate.
            </p>
          </div>
          {saveMut.error && <p className="text-sm text-destructive">{(saveMut.error as Error).message}</p>}
          {saveMut.isSuccess && (
            <p className="text-sm text-emerald-700 flex items-center gap-1">
              <CheckCircle2 className="h-4 w-4" /> Saved.
            </p>
          )}
          {isAdmin && (
            <Button onClick={() => saveMut.mutate()} disabled={saveMut.isPending}>
              {saveMut.isPending ? 'Saving…' : 'Save DMS settings'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Telephony */}
      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <Phone className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Telephony</span>
        </div>
        <CardContent className="p-5 text-sm space-y-2">
          <div>
            Provider: <Badge variant="outline">{data.telephony.provider}</Badge>
          </div>
          <p className="text-xs text-muted-foreground">
            Telephony is configured at the platform level. To switch from the mock provider to Twilio, Africa’s
            Talking, or SIP, ask your TeleTrade contact — provider switches require a restart and credential
            handshake.
          </p>
        </CardContent>
      </Card>

      {/* Webhooks */}
      <Card>
        <div className="p-4 border-b flex items-center gap-2">
          <Webhook className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">Webhook receiver</span>
        </div>
        <CardContent className="p-5 text-sm space-y-2">
          <div>
            <div className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Inbound endpoint</div>
            <Input value={data.webhooks.endpoint} readOnly className="font-mono text-xs" />
          </div>
          <p className="text-xs text-muted-foreground">
            Configure your DMS to POST status updates here. Replace <code>{'{adapter}'}</code> with{' '}
            <code>odoo</code>, <code>sap_b1</code>, <code>dynamics_365</code>, or <code>custom</code>.
          </p>
          <div className="text-xs text-muted-foreground">
            Last event: {data.webhooks.lastReceived ? formatDate(data.webhooks.lastReceived) : 'none yet'}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function HealthTile({ label, value, tone = 'slate' }: { label: string; value: number; tone?: 'slate' | 'amber' | 'rose' | 'emerald' }) {
  const cls = {
    slate: 'bg-slate-50 text-slate-700',
    amber: 'bg-amber-50 text-amber-700',
    rose: 'bg-rose-50 text-rose-700',
    emerald: 'bg-emerald-50 text-emerald-700',
  }[tone];
  return (
    <div className={'rounded-md p-2 ' + cls}>
      <div className="text-[10px] uppercase tracking-wide">{label}</div>
      <div className="text-base font-semibold">{value}</div>
    </div>
  );
}
