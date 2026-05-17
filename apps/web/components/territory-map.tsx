'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import type { LatLngExpression } from 'leaflet';

// react-leaflet pieces are dynamic-loaded so SSR doesn't choke on `window`.
const MapContainer = dynamic(() => import('react-leaflet').then((m) => m.MapContainer), { ssr: false });
const TileLayer = dynamic(() => import('react-leaflet').then((m) => m.TileLayer), { ssr: false });
const CircleMarker = dynamic(() => import('react-leaflet').then((m) => m.CircleMarker), { ssr: false });
const Tooltip = dynamic(() => import('react-leaflet').then((m) => m.Tooltip), { ssr: false });

const STATUS_COLOR: Record<string, string> = {
  ACTIVE: '#10b981',
  DORMANT: '#f59e0b',
  PHONE_ONLY: '#3b82f6',
  UNREACHABLE: '#ef4444',
  SUSPENDED: '#71717a',
};

export interface TerritoryMapCustomer {
  id: string;
  outletName: string;
  status: string;
  outletType: string;
  accountTier: string;
  latitude: number | string | null;
  longitude: number | string | null;
}

export function TerritoryMap({ customers }: { customers: TerritoryMapCustomer[] }) {
  const center = useMemo<LatLngExpression>(() => {
    if (!customers.length) return [6.5, 3.4];
    const lats = customers.map((c) => Number(c.latitude ?? 0)).filter((n) => !Number.isNaN(n));
    const lngs = customers.map((c) => Number(c.longitude ?? 0)).filter((n) => !Number.isNaN(n));
    const avgLat = lats.reduce((a, b) => a + b, 0) / lats.length;
    const avgLng = lngs.reduce((a, b) => a + b, 0) / lngs.length;
    return [avgLat || 6.5, avgLng || 3.4];
  }, [customers]);

  return (
    <div className="h-[600px] rounded-md overflow-hidden border">
      <MapContainer center={center} zoom={11} className="h-full w-full">
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {customers.map((c) => (
          <CircleMarker
            key={c.id}
            center={[Number(c.latitude ?? 0), Number(c.longitude ?? 0)]}
            radius={5}
            pathOptions={{
              color: STATUS_COLOR[c.status] ?? '#6366f1',
              fillColor: STATUS_COLOR[c.status] ?? '#6366f1',
              fillOpacity: 0.8,
              weight: 1,
            }}
          >
            <Tooltip>
              <div className="text-xs">
                <div className="font-medium">{c.outletName}</div>
                <div>
                  {c.accountTier} · {c.outletType.replace('_', ' ')} · {c.status}
                </div>
              </div>
            </Tooltip>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
