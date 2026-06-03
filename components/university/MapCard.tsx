'use client';

import dynamic from 'next/dynamic';

// Leaflet touches `window`, so load it only on the client.
const LocationMap = dynamic(() => import('./LocationMap'), {
  ssr: false,
  loading: () => <div className="h-full w-full animate-pulse bg-muted" />,
});

export function MapCard({
  lat,
  lng,
  label,
}: {
  lat: number;
  lng: number;
  label: string;
}) {
  return (
    <div className="h-64 w-full overflow-hidden rounded-lg border border-border">
      <LocationMap lat={lat} lng={lng} label={label} />
    </div>
  );
}
