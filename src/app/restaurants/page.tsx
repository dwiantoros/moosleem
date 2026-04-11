'use client';

import React from 'react';
import RestaurantFinder from '@/components/RestaurantFinder';
import { LocationData } from '@/types';
import PageHeaderActions from '@/components/PageHeaderActions';
import Link from 'next/link';
import { getCached, getLastLocation, safeSet, setLastLocation } from '@/utils/clientCache';

export default function RestaurantsPage() {
  const [location, setLocation] = React.useState<LocationData | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [districtLabel, setDistrictLabel] = React.useState<string | null>(null);

  React.useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    const cached = getLastLocation(12 * 60 * 60 * 1000);
    if (cached) {
      setLocation({ latitude: cached.latitude, longitude: cached.longitude, timezone: cached.timezone });
      setLoading(false);
    }

    if (!('geolocation' in navigator)) {
      if (!cached) setLocation({ latitude: -6.2, longitude: 106.816, timezone });
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone });
        setLastLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          timezone,
          accuracy: pos.coords.accuracy,
        });
        setLoading(false);
      },
      () => {
        if (!cached) setLocation({ latitude: -6.2, longitude: 106.816, timezone });
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, []);

  React.useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const key = `district-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`;
    const TTL_MS = 24 * 60 * 60 * 1000;

    const hydrate = async () => {
      const cached = getCached<{ district: string | null }>(key, TTL_MS);
      if (cached) {
        setDistrictLabel(cached.data.district ?? null);
        if (!cached.isStale) return;
      }

      try {
        const res = await fetch(
          `/api/location-context?latitude=${location.latitude}&longitude=${location.longitude}`,
          { cache: 'no-store' }
        );
        if (!res.ok) return;
        const json = (await res.json()) as { district?: string | null };
        const district = json.district ?? null;
        setDistrictLabel(district);
        safeSet(key, { district });
      } catch {
        // ignore
      }
    };

    hydrate();
  }, [location?.latitude, location?.longitude]);

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Terdekat</p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Halal Nearby</h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        {/* District badge */}
        {location && (
          <div className="mb-4 flex items-center gap-2 text-xs">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            <span className="rounded-lg border border-teal-300/45 bg-gradient-to-r from-teal-500/12 to-cyan-500/10 px-2.5 py-1 font-semibold text-teal-700 dark:border-teal-700/55 dark:from-teal-400/20 dark:to-cyan-400/16 dark:text-teal-300">
              Distrik: {districtLabel ?? 'Mendeteksi...'}
            </span>
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
          <p>Data lokasi dari OpenStreetMap &middot; Selalu verifikasi status halal secara langsung</p>
        </footer>
      </main>
    </div>
  );
}
