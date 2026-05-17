'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Bell, AlertTriangle, AlertCircle, Phone, Truck, RefreshCw } from 'lucide-react';

interface InboxItem {
  id: string;
  kind: 'callback' | 'duplicate' | 'dms_dead_letter' | 'unreachable' | 'route_change';
  title: string;
  body: string;
  href: string;
  createdAt: string;
  severity: 'info' | 'warning' | 'critical';
  badge?: string;
}

function iconFor(kind: InboxItem['kind']) {
  switch (kind) {
    case 'callback':
      return Phone;
    case 'duplicate':
      return AlertTriangle;
    case 'dms_dead_letter':
      return AlertCircle;
    case 'route_change':
      return Truck;
    case 'unreachable':
      return RefreshCw;
    default:
      return Bell;
  }
}

function relative(d: string) {
  const minutes = Math.round((Date.now() - new Date(d).getTime()) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}d`;
}

export default function InboxPage() {
  const { data, isLoading, isError, error, refetch } = useQuery<InboxItem[]>({
    queryKey: ['inbox'],
    queryFn: () => api.get('/inbox'),
    refetchInterval: 30_000,
  });

  if (isError) {
    return (
      <Card>
        <CardContent className="p-6 text-sm space-y-2">
          <div className="font-medium">Couldn&apos;t load your inbox.</div>
          <div className="text-muted-foreground">{(error as Error).message}</div>
          <button onClick={() => refetch()} className="text-primary underline">Try again</button>
        </CardContent>
      </Card>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i}>
            <CardContent className="p-3">
              <div className="h-4 w-44 bg-muted rounded animate-pulse" />
              <div className="h-3 w-64 bg-muted rounded animate-pulse mt-2" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (!data.length) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-sm space-y-2">
          <Bell className="h-8 w-8 mx-auto text-muted-foreground" />
          <div className="font-medium">All quiet. Good.</div>
          <div className="text-muted-foreground">
            Callbacks, flagged duplicates, and stalled syncs will land here.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3 max-w-2xl">
      <div>
        <h1 className="text-2xl font-semibold">Inbox</h1>
        <p className="text-xs text-muted-foreground">
          {data.length} item{data.length === 1 ? '' : 's'} to look at.
        </p>
      </div>
      <div className="space-y-2">
        {data.map((item) => {
          const Icon = iconFor(item.kind);
          const tone =
            item.severity === 'critical'
              ? 'border-destructive/50'
              : item.severity === 'warning'
                ? 'border-amber-300/50'
                : '';
          return (
            <Link key={item.id} href={item.href}>
              <Card className={'hover:bg-accent/40 transition ' + tone}>
                <CardContent className="p-3 flex items-start gap-3">
                  <Icon className="h-5 w-5 mt-0.5 shrink-0 text-muted-foreground" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-sm truncate">{item.title}</div>
                      <div className="flex items-center gap-1 shrink-0">
                        {item.badge && (
                          <Badge variant={item.severity === 'critical' ? 'destructive' : 'warning'}>
                            {item.badge}
                          </Badge>
                        )}
                        <span className="text-[10px] text-muted-foreground">{relative(item.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground line-clamp-2">{item.body}</div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
