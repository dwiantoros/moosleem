'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import RestaurantFinder from '@/components/RestaurantFinder';
import MosqueFinder from '@/components/MosqueFinder';
import { LocationData } from '@/types';
import PageHeaderActions from '@/components/PageHeaderActions';

type Tab = 'restaurant' | 'mosque';

export default function RestaurantsPage() {
  const router = useRouter();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>('restaurant');
  const watchIdRef = useRef<number | null>(null);

  useEffect(() => {
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

    if (!('geolocation' in navigator)) {
      setLocation({ latitude: -6.2, longitude: 106.816, timezone });
      setLoading(false);
      return;
    }

    // Get initial fix quickly
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone });
        setLoading(false);
      },
      () => {
        setLocation({ latitude: -6.2, longitude: 106.816, timezone });
        setLoading(false);
      },
      { timeout: 8000, maximumAge: 30000 }
    );

    // Then watch for position updates
    watchIdRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude, timezone });
        setLoading(false);
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 20000 }
    );

    return () => {
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
    };
  }, []);

  return (
    <div className="min-h-screen pb-8">
      <main className="mx-auto max-w-3xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => router.back()}
              className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300"
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 18l-6-6 6-6"/>
              </svg>
            </button>
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Terdekat</p>
              <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">
                {tab === 'restaurant' ? 'Halal Nearby' : 'Masjid Terdekat'}
              </h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        {/* GPS status badge */}
        {location && (
          <div className="mb-4 flex items-center gap-1.5 text-xs text-slate-500">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-teal-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-teal-500" />
            </span>
            GPS aktif · {location.latitude.toFixed(4)}, {location.longitude.toFixed(4)}
          </div>
        )}

        {/* Tabs */}
        <div className="mb-5 flex gap-2 glass-subtle rounded-2xl p-1.5">
          <button
            onClick={() => setTab('restaurant')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
              tab === 'restaurant'
                ? 'bg-white shadow-sm text-teal-700 dark:bg-slate-700 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
            </svg>
            Restoran Halal
          </button>
          <button
            onClick={() => setTab('mosque')}
            className={`flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-medium transition-all ${
              tab === 'mosque'
                ? 'bg-white shadow-sm text-teal-700 dark:bg-slate-700 dark:text-teal-400'
                : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5a3 3 0 0 1 6 0v5"/>
            </svg>
            Masjid Terdekat
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
            <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse" />
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 bg-slate-100/80 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : tab === 'restaurant' ? (
          <RestaurantFinder location={location} />
        ) : (
          <MosqueFinder location={location} />
        )}

        <footer className="mt-10 border-t border-slate-200 dark:border-slate-700 pt-6 text-center text-sm text-slate-500">
          <p>Data lokasi dari OpenStreetMap · Selalu verifikasi status halal secara langsung</p>
        </footer>
      </main>
    </div>
  );
}

