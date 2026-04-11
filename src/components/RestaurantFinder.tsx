'use client';

import React, { useState, useEffect } from 'react';
import { HalalRestaurant, LocationData } from '@/types';
import axios from 'axios';
import { getCached, nearbyCacheKey, safeSet } from '@/utils/clientCache';

interface RestaurantsProps {
  location: LocationData | null;
  preferredHalalLogoKey?: string;
  countryCode?: string | null;
  countryName?: string | null;
}

type HalalLogoItem = {
  key: string;
  label: string;
  mark: React.ReactNode;
  languageTag: string;
  note: string;
};

const HALAL_LOGOS: HalalLogoItem[] = [
  {
    key: 'id',
    label: 'Indonesia',
    mark: (
      <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#ECFDF5" stroke="#0F766E" strokeWidth="1.7" />
        <text x="20" y="23" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0F766E">HALAL</text>
      </svg>
    ),
    languageTag: 'Indonesia',
    note: 'Label halal umum untuk Indonesia menggunakan teks latin HALAL.',
  },
  {
    key: 'cn',
    label: 'China',
    mark: (
      <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#EFF6FF" stroke="#1D4ED8" strokeWidth="1.7" />
        <text x="20" y="19" textAnchor="middle" fontSize="11" fontWeight="700" fill="#1D4ED8">清真</text>
        <text x="20" y="27" textAnchor="middle" fontSize="4.6" fontWeight="700" fill="#1D4ED8">QINGZHEN</text>
      </svg>
    ),
    languageTag: 'Mandarin (Latin: qingzhen)',
    note: 'Penanda halal umum di China: 清真 (qingzhen).',
  },
  {
    key: 'jp',
    label: 'Jepang',
    mark: (
      <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#FDF2F8" stroke="#BE185D" strokeWidth="1.7" />
        <text x="20" y="19" textAnchor="middle" fontSize="7" fontWeight="700" fill="#BE185D">ハラール</text>
        <text x="20" y="27" textAnchor="middle" fontSize="4.7" fontWeight="700" fill="#BE185D">HARAARU</text>
      </svg>
    ),
    languageTag: 'Jepang (Latin: haraaru)',
    note: 'Istilah halal dalam konteks Jepang: ハラール (haraaru).',
  },
  {
    key: 'kr',
    label: 'Korea',
    mark: (
      <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#EEF2FF" stroke="#4338CA" strokeWidth="1.7" />
        <text x="20" y="19" textAnchor="middle" fontSize="8" fontWeight="700" fill="#4338CA">할랄</text>
        <text x="20" y="27" textAnchor="middle" fontSize="4.9" fontWeight="700" fill="#4338CA">HALLAL</text>
      </svg>
    ),
    languageTag: 'Korea (Latin: hallal)',
    note: 'Istilah halal yang digunakan dalam konteks Korea: 할랄 (hallal).',
  },
  {
    key: 'sa',
    label: 'Saudi',
    mark: (
      <svg className="h-9 w-9" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="20" cy="20" r="17" fill="#ECFDF5" stroke="#166534" strokeWidth="1.7" />
        <text x="20" y="19" textAnchor="middle" fontSize="9" fontWeight="700" fill="#166534">حلال</text>
        <text x="20" y="27" textAnchor="middle" fontSize="5" fontWeight="700" fill="#166534">HALAL</text>
      </svg>
    ),
    languageTag: 'Arab (Latin: halal)',
    note: 'Penulisan halal berbahasa Arab: حلال (halal).',
  },
];

export default function RestaurantFinder({ location, preferredHalalLogoKey = 'id', countryCode, countryName }: RestaurantsProps) {
  const [restaurants, setRestaurants] = useState<HalalRestaurant[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedRestaurant, setSelectedRestaurant] = useState<HalalRestaurant | null>(null);
  const [selectedLogoKey, setSelectedLogoKey] = useState<string>(preferredHalalLogoKey);

  useEffect(() => {
    setSelectedLogoKey(preferredHalalLogoKey);
  }, [preferredHalalLogoKey]);

  const sortedLogos = React.useMemo(() => {
    const priority = preferredHalalLogoKey;
    const fallbackByCountryCode =
      countryCode === 'CN' ? 'cn' :
      countryCode === 'JP' ? 'jp' :
      countryCode === 'KR' ? 'kr' :
      countryCode === 'SA' ? 'sa' :
      'id';
    const top = HALAL_LOGOS.find((item) => item.key === priority) ?? HALAL_LOGOS.find((item) => item.key === fallbackByCountryCode) ?? HALAL_LOGOS[0];
    return [
      top,
      ...HALAL_LOGOS.filter((item) => item.key !== top.key),
    ];
  }, [countryCode, preferredHalalLogoKey]);

  const activeLogo = sortedLogos.find((item) => item.key === selectedLogoKey) ?? sortedLogos[0];

  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const cacheKey = nearbyCacheKey('restaurants', location.latitude, location.longitude);
    const TTL_MS = 10 * 60 * 1000;

    const cached = getCached<HalalRestaurant[]>(cacheKey, TTL_MS);
    if (cached) {
      setRestaurants(cached.data);
      if (!cached.isStale) return;
    }

    const fetchRestaurants = async () => {
      setLoading(true);
      try {
        const response = await axios.get('/api/restaurants', {
          params: {
            latitude: location.latitude,
            longitude: location.longitude,
            radius: 5000,
          },
          timeout: 15000,
        });
        const data = response.data.data || [];
        setRestaurants(data);
        safeSet(cacheKey, data);
      } catch (error) {
        console.error('Error fetching restaurants:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchRestaurants();
  }, [location]);

  if (loading) {
    return (
      <div className="glass-panel rounded-[1.75rem] p-6 space-y-4">
        <div className="h-6 bg-slate-200/80 rounded-lg w-1/3 animate-pulse"></div>
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-24 bg-slate-100/80 rounded-2xl animate-pulse"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-[1.75rem] p-6">
      <div className="mb-5 rounded-2xl border border-teal-200/50 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 p-4 dark:border-teal-700/40 dark:from-teal-500/15 dark:to-cyan-500/12">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-300">Logo Halal Negara</p>
        <p className="mt-1 text-xs text-slate-600 dark:text-slate-300">
          Urutan diprioritaskan dari lokasi Anda{countryName ? ` (${countryName})` : ''}. Klik tombol negara untuk melihat label halal yang umum digunakan.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {sortedLogos.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setSelectedLogoKey(item.key)}
              className={`rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
                item.key === activeLogo.key
                  ? 'border-teal-500 bg-teal-500/15 text-teal-700 dark:text-teal-300'
                  : 'border-slate-200 bg-white/70 text-slate-600 hover:border-teal-300 hover:text-teal-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-300'
              }`}
            >
              <span className="flex items-center gap-2">
                {item.mark}
                {item.label}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-3 rounded-xl border border-slate-200/70 bg-white/70 px-3 py-2 dark:border-slate-700 dark:bg-slate-800/55">
          <div className="mt-1 flex items-center justify-between gap-3">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{activeLogo.label}</p>
            <span className="rounded-full bg-teal-100 px-3 py-2 dark:bg-teal-900/40">{activeLogo.mark}</span>
          </div>
          <p className="mt-1 text-[11px] uppercase tracking-[0.15em] text-teal-700 dark:text-teal-300">Bahasa: {activeLogo.languageTag}</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{activeLogo.note}</p>
        </div>
      </div>

      <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-5">Restoran Halal Terdekat</h2>

      {restaurants.length === 0 ? (
        <div className="py-12 text-center text-slate-500">
          <svg className="mx-auto mb-3 h-10 w-10 text-slate-300" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>
          <p className="text-sm">Tidak ada restoran halal ditemukan di sekitar Anda.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {restaurants.map((restaurant) => {
            const isSelected = selectedRestaurant?.id === restaurant.id;
            const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(restaurant.name)}&ll=${restaurant.latitude},${restaurant.longitude}`;

            return (
              <div
                key={restaurant.id}
                onClick={() => setSelectedRestaurant(isSelected ? null : restaurant)}
                className={`rounded-2xl cursor-pointer transition-all border ${
                  isSelected
                    ? 'border-teal-200 bg-teal-50/60 dark:border-teal-700/60 dark:bg-teal-900/20'
                    : 'border-slate-200/60 bg-white/60 hover:bg-white/80 hover:border-slate-300/60 dark:border-slate-700/50 dark:bg-slate-800/40 dark:hover:bg-slate-800/60'
                } p-4`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      {restaurant.halalLikely && (
                        <span className="flex-shrink-0 rounded-full bg-teal-100 px-2 py-0.5 text-[10px] font-bold text-teal-700 dark:bg-teal-900/40 dark:text-teal-400">HALAL</span>
                      )}
                      <h3 className="font-semibold text-slate-900 text-sm truncate dark:text-slate-100">{restaurant.name}</h3>
                    </div>
                    <p className="text-slate-500 text-xs mt-1 line-clamp-1">{restaurant.address}</p>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {restaurant.rating > 0 && (
                      <div className="flex items-center gap-1 justify-end">
                        <span className="text-yellow-400 text-xs">&#9733;</span>
                        <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">{restaurant.rating.toFixed(1)}</span>
                      </div>
                    )}
                    <p className="text-xs text-slate-400">{restaurant.distance.toFixed(1)} km</p>
                  </div>
                </div>

                {isSelected && (
                  <div className="mt-4 pt-4 border-t border-teal-200/60 dark:border-teal-700/40 space-y-3">
                    {restaurant.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span>{restaurant.phone}</span>
                      </div>
                    )}
                    <div className="flex gap-2">
                      {restaurant.phone && (
                        <a
                          href={`tel:${restaurant.phone}`}
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-700 active:scale-95"
                        >
                          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.36 11.5a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.47 2h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.29 6.29l1.27-1.27a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z" strokeLinecap="round" strokeLinejoin="round"/></svg>
                          Call
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
                    {restaurant.website && (
                      <a
                        href={restaurant.website}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        className="flex items-center gap-1.5 text-xs text-teal-600 hover:underline dark:text-teal-400"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                        {restaurant.website}
                      </a>
                    )}
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
