'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-store';
import { Role } from '@teletrade/shared';
import {
  Building2,
  CreditCard,
  Users,
  ShieldCheck,
  Plug,
  ScrollText,
  AlertOctagon,
  ChevronRight,
} from 'lucide-react';

interface WorkspaceSnapshot {
  name: string;
  industry: string | null;
  country: string | null;
  plan: string;
  seatLimit: number;
  seatsUsed: number;
  stats: { users: number; customers: number; orders: number };
  createdAt: string;
}

const TONE: Record<string, string> = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  violet: 'bg-violet-50 text-violet-600',
  cyan: 'bg-cyan-50 text-cyan-600',
  amber: 'bg-amber-50 text-amber-600',
  rose: 'bg-rose-50 text-rose-600',
  slate: 'bg-slate-100 text-slate-600',
};

export default function SettingsHub() {
  const user = useAuth((s) => s.user);
  const isAdmin = user?.role === Role.ADMIN;
  const isManagerish = isAdmin || user?.role === Role.SALES_MANAGER;

  const { data } = useQuery<WorkspaceSnapshot>({
    queryKey: ['account-workspace'],
    queryFn: () => api.get('/account/workspace'),
    enabled: isManagerish,
  });

  const items = [
    {
      href: '/settings/workspace',
      icon: Building2,
      tone: 'blue',
      title: 'Workspace',
      body: 'Name, branding, industry, timezone, billing email.',
      requires: 'manager',
    },
    {
      href: '/settings/billing',
      icon: CreditCard,
      tone: 'emerald',
      title: 'Plan & billing',
      body: 'Current plan, seat usage, invoices, upgrade or downgrade.',
      requires: 'manager',
    },
    {
      href: '/settings/team',
      icon: Users,
      tone: 'violet',
      title: 'Team & invitations',
      body: 'Invite teammates, change roles, deactivate, manage seats.',
      requires: 'manager',
    },
    {
      href: '/settings/security',
      icon: ShieldCheck,
      tone: 'cyan',
      title: 'Security',
      body: 'Your password, active sessions, sign-out everywhere.',
      requires: 'any',
    },
    {
      href: '/settings/integrations',
      icon: Plug,
      tone: 'amber',
      title: 'Integrations',
      body: 'DMS adapter, telephony, webhook endpoints.',
      requires: 'manager',
    },
    {
      href: '/settings/audit',
      icon: ScrollText,
      tone: 'slate',
      title: 'Audit log',
      body: 'Every mutation in your workspace, with actor + IP.',
      requires: 'manager',
    },
    {
      href: '/settings/danger',
      icon: AlertOctagon,
      tone: 'rose',
      title: 'Close workspace',
      body: 'Permanently deactivate every user and revoke every session.',
      requires: 'admin',
    },
  ] as const;

  const visible = items.filter((i) => {
    if (i.requires === 'any') return true;
    if (i.requires === 'manager') return isManagerish;
    if (i.requires === 'admin') return isAdmin;
    return false;
  });

  return (
    <div className="space-y-5 max-w-4xl">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        {data && (
          <p className="text-xs md:text-sm text-muted-foreground flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="font-medium text-foreground">{data.name}</span>
            <span>·</span>
            <span>{data.industry ?? 'No industry set'}</span>
            <span>·</span>
            <span>{data.country ?? 'No country set'}</span>
            <span>·</span>
            <Badge variant="outline" className="text-[10px]">
              {data.plan}
            </Badge>
            <span>·</span>
            <span>
              {data.seatsUsed} / {data.seatLimit} seats
            </span>
          </p>
        )}
      </div>

      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Members</div>
              <div className="text-xl font-semibold">{data.stats.users}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Customers</div>
              <div className="text-xl font-semibold">{data.stats.customers.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-muted-foreground">Orders all-time</div>
              <div className="text-xl font-semibold">{data.stats.orders.toLocaleString()}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {visible.map((item) => {
          const Icon = item.icon;
          const isDanger = item.tone === 'rose';
          return (
            <Link key={item.href} href={item.href}>
              <Card
                className={
                  'hover:bg-accent/30 transition cursor-pointer ' + (isDanger ? 'border-destructive/30' : '')
                }
              >
                <CardContent className="p-4 flex items-start gap-3">
                  <span className={'h-10 w-10 rounded-lg flex items-center justify-center ' + TONE[item.tone]}>
                    <Icon className="h-5 w-5" />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm">{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.body}</div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
