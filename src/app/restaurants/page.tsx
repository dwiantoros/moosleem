'use client';

import React from 'react';
import RestaurantFinder from '@/components/RestaurantFinder';
import { LocationData } from '@/types';
import PageHeaderActions from '@/components/PageHeaderActions';
import Link from 'next/link';

export default function RestaurantsPage() {
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!('geolocation' in navigator)) {
      setLocation({ latitude: -6.2, longitude: 106.816, timezone });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone });
        setLoading(false);
      },
      () => {
        setLocation({ latitude: -6.2, longitude: 106.816, timezone });
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 60000 }
    );
  }, []);

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Terdekat</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Halal Nearby</h1>
          </div>
          <div className="flex items-center gap-3">
            <PageHeaderActions />
            <Link href="/" className="glass-subtle rounded-full px-4 py-2 text-sm font-medium text-slate-700 dark:text-slate-300">Kembali</Link>
          </div>
        </div>

        {/* GPS badge */}
        {location && (
          <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            GPS aktif Â· {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        )}

        {loading ? (
          <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
            <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : (
          <RestaurantFinder location={location} />
        )}

        <footer className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-6 text-center text-sm text-slate-500">
          <p>Data lokasi dari OpenStreetMap Â· Selalu verifikasi status halal secara langsung</p>
        </footer>
      </main>
    </div>
  );
}
