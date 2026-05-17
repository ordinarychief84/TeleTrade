'use client';

import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TerritoryMap, TerritoryMapCustomer } from '@/components/territory-map';

interface MapData {
  territories: Array<{ id: string; name: string; code: string }>;
  routes: Array<{ id: string; name: string; code: string; territoryId: string }>;
  customers: TerritoryMapCustomer[];
}

export default function TerritoryPage() {
  const { data, isLoading } = useQuery<MapData>({
    queryKey: ['territory-map'],
    queryFn: () => api.get('/territories/map'),
  });

  const counts = useCounts(data?.customers ?? []);

  return (
    <div className="space-y-4">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Territory map</h1>
          <p className="text-sm text-muted-foreground">
            Active / dormant / phone-only / unreachable outlets across {data?.territories.length ?? 0} territories.
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(counts).map(([status, n]) => (
            <Badge key={status} variant="outline">
              {status.toLowerCase().replace('_', ' ')}: {n}
            </Badge>
          ))}
        </div>
      </div>
      <Card>
        <CardContent className="p-0">
          {isLoading || !data ? (
            <div className="p-6 text-muted-foreground">Loading map…</div>
          ) : (
            <TerritoryMap customers={data.customers} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function useCounts(customers: TerritoryMapCustomer[]) {
  const out: Record<string, number> = {};
  for (const c of customers) out[c.status] = (out[c.status] ?? 0) + 1;
  return out;
}
