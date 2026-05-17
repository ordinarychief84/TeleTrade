'use client';

import { useQuery } from '@tanstack/react-query';
import { useParams } from 'next/navigation';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

export default function CampaignDetail() {
  const params = useParams<{ id: string }>();
  const { data } = useQuery<any>({
    queryKey: ['campaign', params.id],
    queryFn: () => api.get(`/campaigns/${params.id}`),
    enabled: !!params.id,
  });
  if (!data) return <div className="text-muted-foreground">Loading…</div>;
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">{data.name}</h1>
        <Badge>{data.status}</Badge>
      </div>
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Details</CardTitle>
        </CardHeader>
        <CardContent className="text-sm space-y-1">
          <div>Type: {data.type}</div>
          <div>Promo code: {data.promoCode ?? '—'}</div>
          <div>Targets: {data._count?.targets ?? 0} · Calls so far: {data._count?.calls ?? 0}</div>
          <div className="pt-2 text-muted-foreground">{data.pitch ?? '(no pitch script)'}</div>
        </CardContent>
      </Card>
    </div>
  );
}
