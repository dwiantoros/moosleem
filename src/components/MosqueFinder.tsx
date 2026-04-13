'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { LocationData } from '@/types';
import axios from 'axios';
import { getCached, nearbyCacheKey, safeSet } from '@/utils/clientCache';

interface Mosque {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  distance: number;
  phone?: string;
  website?: string;
  isMusholla?: boolean;
}

interface MosqueFinderProps {
  location: LocationData | null;
}

export default function MosqueFinder({ location }: MosqueFinderProps) {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState<Mosque | null>(null);

  const fetchMosques = useCallback(async (coords?: { latitude: number; longitude: number }) => {
    const latitude = coords?.latitude ?? location?.latitude;
    const longitude = coords?.longitude ?? location?.longitude;

    if (!latitude || !longitude) return;

    setLoading(true);
    try {
      const res = await axios.get('/api/mosques', {
        params: { latitude, longitude, radius: 5000 },
        timeout: 20000,
      });
      const data = res.data.data || [];
      setMosques(data);
      const cacheKey = nearbyCacheKey('mosques', latitude, longitude);
      safeSet(cacheKey, data);
    } catch (e) {
      console.error('Mosque fetch error:', e);
    } finally {
      setLoading(false);
    }
  }, [location]);

  const handleRefresh = useCallback(() => {
    if (!('geolocation' in navigator)) {
      void fetchMosques();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        void fetchMosques({ latitude: pos.coords.latitude, longitude: pos.coords.longitude });
      },
      () => {
        void fetchMosques();
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  }, [fetchMosques]);

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;
    setSelected(null);

    const cacheKey = nearbyCacheKey('mosques', location.latitude, location.longitude);
    const TTL_MS = 10 * 60 * 1000;

    const cached = getCached<Mosque[]>(cacheKey, TTL_MS);
    if (cached) {
      setMosques(cached.data);
      if (!cached.isStale) return;
    }

    fetchMosques();
  }, [location, fetchMosques]);

  if (loading) {
    return (
      <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
        <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse" />
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-20 bg-slate-100/80 rounded-2xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[1.75rem] p-6">
      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5 flex items-center justify-between gap-3">
        Masjid &amp; Musholla Terdekat
        <button
          onClick={handleRefresh}
          disabled={loading}
          className="flex items-center gap-1.5 rounded-lg bg-teal-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
          title="Perbarui data masjid"
        >
          <svg className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36M20.49 15a9 9 0 0 1-14.85 3.36"/>
          </svg>
          Perbarui
        </button>
      </h2>

      {mosques.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5a3 3 0 0 1 6 0v5"/>
          </svg>
          <p className="text-sm">Tidak ada masjid ditemukan di sekitar Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {mosques.map((mosque) => {
            const isActive = selected?.id === mosque.id;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(mosque.name)}&ll=${mosque.latitude},${mosque.longitude}`;

            return (
              <div
                key={mosque.id}
                onClick={() => setSelected(isActive ? null : mosque)}
                className={`rounded-2xl cursor-pointer transition-all border p-4 ${
                  isActive
                    ? 'border-teal-200 bg-teal-50/60 dark:border-teal-700/60 dark:bg-teal-900/20'
                    : 'border-slate-200/60 bg-white/60 hover:bg-white/80 dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        mosque.isMusholla
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400'
                          : 'bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-400'
                      }`}>
                        {mosque.isMusholla ? 'MUSHOLLA' : 'MASJID'}
                      </span>
                      <h3 className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">{mosque.name}</h3>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{mosque.address}</p>
                  </div>
                  <p className="flex-shrink-0 text-xs text-slate-400">{mosque.distance.toFixed(1)} km</p>
                </div>

                {isActive && (
                  <div className="mt-4 pt-4 border-t border-teal-200/60 dark:border-teal-700/40 space-y-3">
                    {mosque.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.91-6.91 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                        <span>{mosque.phone}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {mosque.phone && (
                        <a
                          href={`tel:${mosque.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-95"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6.91-6.91 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>
                          Telepon
                        </a>
                      )}
                      <a
                        href={mapsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-slate-200 bg-white/80 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 active:scale-95 dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-200 dark:hover:bg-slate-600/70"
                      >
                        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
                        Buka Maps
                      </a>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
