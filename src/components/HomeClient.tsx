'use client';

import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import PrayerScheduleList, { PrayerScheduleHero } from '@/components/PrayerScheduleList';
import UserGreeting from '@/components/UserGreeting';
import HijriDateBanner from '@/components/HijriDateBanner';
import { LocationData, PrayerTimes } from '@/types';
import { AZAN_REMINDER_EVENT, AzanReminderSnapshot, readAzanReminderSnapshot } from '@/utils/azanReminder';
import { getKemenagTimezone } from '@/utils/indonesiaTime';
import { calculateQiblaBearing, getNextPrayer, getPrayerWindowProgress, getRemainingSecondsToPrayer } from '@/utils/prayerTimes';
import { getCached, getLastLocation, nearbyCacheKey, prayerCacheKey, safeSet, setLastLocation } from '@/utils/clientCache';
import { LOCATION_PERMISSION_UPDATED_EVENT, LocationPermissionUpdatedDetail } from '@/utils/permissionCenter';

const JAKARTA_FALLBACK = {
  latitude: -6.2088,
  longitude: 106.8456,
  timezone: 'Asia/Jakarta',
} as const;

const LOCATION_MOVE_THRESHOLD_METERS = 120;

function distanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  return R * (2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)));
}

function getPrayerSyncKey(latitude: number, longitude: number, timezone: string): string {
  return [latitude.toFixed(3), longitude.toFixed(3), timezone].join(':');
}

const DailyInspiration = dynamic(() => import('@/components/DailyInspiration'), {
  loading: () => <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6 text-sm text-slate-500">Memuat inspirasi...</div>,
});

const AzanReminder = dynamic(() => import('@/components/AzanReminder'), {
  loading: () => <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6 text-sm text-slate-500">Menyiapkan reminder...</div>,
});

async function fetchJson<T>(url: string, params: Record<string, string | number>, timeoutMs = 9000): Promise<T> {
  const query = new URLSearchParams(
    Object.entries(params).map(([key, value]) => [key, String(value)])
  );
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(`${url}?${query.toString()}`, {
      method: 'GET',
      signal: controller.signal,
    });

    if (!response.ok) {
      throw new Error(`Request failed (${response.status})`);
    }

    return (await response.json()) as T;
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export default function Home() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{
    name: string;
    time: string;
    minutesUntil: number;
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [districtLabel, setDistrictLabel] = useState<string | null>(null);
  const [usingFallbackLocation, setUsingFallbackLocation] = useState(false);
  const [nowTick, setNowTick] = useState(Date.now());
  const activeTimezone = location?.timezone || JAKARTA_FALLBACK.timezone;
  const lastPrayerSyncRef = useRef<string | null>(null);

  const remainingSeconds = useMemo(() => {
    void nowTick;
    return getRemainingSecondsToPrayer(nextPrayer, prayerTimes, activeTimezone);
  }, [nextPrayer, prayerTimes, activeTimezone, nowTick]);

  const remainingLabel = useMemo(() => {
    if (remainingSeconds === null) return '--';
    const hours = Math.floor(remainingSeconds / 3600);
    const minutes = Math.floor((remainingSeconds % 3600) / 60);
    const seconds = remainingSeconds % 60;

    if (hours > 0) return `${hours}j ${minutes}m ${seconds}d`;
    return `${minutes}m ${seconds}d`;
  }, [remainingSeconds]);

  const remainingMinutesRounded = useMemo(() => {
    if (remainingSeconds === null) return null;
    return Math.floor(remainingSeconds / 60);
  }, [remainingSeconds]);

  const prayerWindowProgress = useMemo(() => {
    void nowTick;
    return getPrayerWindowProgress(prayerTimes, nextPrayer, activeTimezone, remainingSeconds);
  }, [nextPrayer, prayerTimes, activeTimezone, remainingSeconds, nowTick]);

  const fetchPrayerData = async (latitude: number, longitude: number, timezone: string, forceRefresh = false) => {
    const cacheKey = prayerCacheKey(latitude, longitude);
    const STALE_MS = 6 * 60 * 60 * 1000; // refresh after 6h
    lastPrayerSyncRef.current = getPrayerSyncKey(latitude, longitude, timezone);

    const doFetch = async () => {
      const response = await fetchJson<PrayerTimes>('/api/prayer-times', { latitude, longitude, timezone }, 8000);
      if (response) {
        safeSet(cacheKey, response);
        setPrayerTimes(response);
        setNextPrayer(getNextPrayer(response, timezone));
      }
    };

    const cached = forceRefresh ? null : getCached<PrayerTimes>(cacheKey, STALE_MS);
    if (cached) {
      setPrayerTimes(cached.data);
      setNextPrayer(getNextPrayer(cached.data, timezone));
      // Background refresh only when stale
      if (cached.isStale) doFetch().catch(() => {});
      return;
    }

    await doFetch();
  };

  // Get user location and fetch prayer times
  useEffect(() => {
    const applyJakartaFallback = async () => {
      setUsingFallbackLocation(true);
      setDistrictLabel('Lokasi tidak terdeteksi');

      setLocation({
        latitude: JAKARTA_FALLBACK.latitude,
        longitude: JAKARTA_FALLBACK.longitude,
        timezone: JAKARTA_FALLBACK.timezone,
      });

      // Persist fallback so reminder subscription can still use a stable location.
      setLastLocation({
        latitude: JAKARTA_FALLBACK.latitude,
        longitude: JAKARTA_FALLBACK.longitude,
        timezone: JAKARTA_FALLBACK.timezone,
        accuracy: 0,
      });

      try {
        await fetchPrayerData(
          JAKARTA_FALLBACK.latitude,
          JAKARTA_FALLBACK.longitude,
          JAKARTA_FALLBACK.timezone,
        );
      } catch (fetchError) {
        console.error('Error fetching prayer times with Jakarta fallback:', fetchError);
      } finally {
        setLoading(false);
      }
    };

    const fetchLocationAndPrayerTimes = async () => {
      setLoading(true);
      let hasWarmStart = false;

      // Fast boot: use last successful location immediately if available
      const cachedLoc = getLastLocation(24 * 60 * 60 * 1000);
      if (cachedLoc) {
        hasWarmStart = true;
        const locationData: LocationData = {
          latitude: cachedLoc.latitude,
          longitude: cachedLoc.longitude,
          timezone: cachedLoc.timezone,
        };
        setLocation(locationData);
        setUsingFallbackLocation(false);
        setLoading(false);
        fetchPrayerData(cachedLoc.latitude, cachedLoc.longitude, cachedLoc.timezone).catch(() => {});
      }

      if (!('geolocation' in navigator)) {
        void applyJakartaFallback();
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const timezone = getKemenagTimezone(latitude, longitude, Intl.DateTimeFormat().resolvedOptions().timeZone);

          const locationData: LocationData = {
            latitude,
            longitude,
            timezone,
          };

          setLocation(locationData);
          setUsingFallbackLocation(false);
          setLastLocation({
            latitude,
            longitude,
            timezone,
            accuracy: position.coords.accuracy,
          });

          try {
            await fetchPrayerData(latitude, longitude, timezone);
          } catch (error) {
            console.error('Error fetching prayer times:', error);
          } finally {
            setLoading(false);
          }
        },
        async (error) => {
          console.error('Geolocation error:', error);
          await applyJakartaFallback();
        },
        {
          // Prioritize fast first fix instead of high-accuracy cold starts.
          enableHighAccuracy: false,
          timeout: hasWarmStart ? 8000 : 10000,
          maximumAge: 5 * 60 * 1000,
        }
      );
    };

    fetchLocationAndPrayerTimes();
  }, []);

  // Keep district badge in sync when user moves without requiring manual refresh.
  useEffect(() => {
    if (!('geolocation' in navigator)) return;
    if (usingFallbackLocation) return;

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const nextLat = position.coords.latitude;
        const nextLon = position.coords.longitude;
        const accuracy = position.coords.accuracy;
        const timezone = getKemenagTimezone(nextLat, nextLon, Intl.DateTimeFormat().resolvedOptions().timeZone);

        setLocation((prev) => {
          if (!prev) {
            setLastLocation({ latitude: nextLat, longitude: nextLon, timezone, accuracy });
            return { latitude: nextLat, longitude: nextLon, timezone };
          }

          const movedMeters = distanceMeters(prev.latitude, prev.longitude, nextLat, nextLon);
          const timezoneChanged = prev.timezone !== timezone;

          if (movedMeters < LOCATION_MOVE_THRESHOLD_METERS && !timezoneChanged) {
            return prev;
          }

          setLastLocation({ latitude: nextLat, longitude: nextLon, timezone, accuracy });
          return { latitude: nextLat, longitude: nextLon, timezone };
        });

        setUsingFallbackLocation(false);
      },
      () => {
        // Keep existing location when watch updates fail intermittently.
      },
      {
        enableHighAccuracy: false,
        timeout: 20000,
        maximumAge: 60 * 1000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [usingFallbackLocation]);

  // Sync reminder state when toggled from NotificationBell popup
  useEffect(() => {
    const syncFromStorage = () => {
      setReminderEnabled(readAzanReminderSnapshot().enabled);
    };

    syncFromStorage();

    const onReminderChanged = (event: Event) => {
      const custom = event as CustomEvent<AzanReminderSnapshot>;
      if (typeof custom.detail?.enabled === 'boolean') {
        setReminderEnabled(custom.detail.enabled);
        return;
      }
      syncFromStorage();
    };

    window.addEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
    return () => {
      window.removeEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
    };
  }, []);

  // When user activates permissions from another surface, immediately refresh location-based data.
  useEffect(() => {
    const onLocationPermissionUpdated = (event: Event) => {
      const custom = event as CustomEvent<LocationPermissionUpdatedDetail>;
      const detail = custom.detail;
      if (!detail) return;

      const locationData: LocationData = {
        latitude: detail.latitude,
        longitude: detail.longitude,
        timezone: getKemenagTimezone(detail.latitude, detail.longitude, detail.timezone),
      };

      setLocation(locationData);
      setUsingFallbackLocation(false);
      setDistrictLabel(null);
      setLoading(true);

      fetchPrayerData(
        detail.latitude,
        detail.longitude,
        getKemenagTimezone(detail.latitude, detail.longitude, detail.timezone),
      )
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    window.addEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    return () => {
      window.removeEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    };
  }, []);

  const refreshDistrictLabel = useCallback(async (latitude: number, longitude: number, useFallbackLabel: boolean) => {
    try {
      const res = await fetchJson<{ district?: string | null }>('/api/location-context', {
        latitude,
        longitude,
      }, 10000);
      const district = res?.district ?? null;
      const key = `district-${latitude.toFixed(3)}-${longitude.toFixed(3)}`;
      safeSet(key, { district });
      setDistrictLabel(district ?? (useFallbackLabel ? 'Lokasi tidak terdeteksi' : null));
    } catch {
      if (useFallbackLabel) {
        setDistrictLabel('Lokasi tidak terdeteksi');
      }
    }
  }, []);

  const refreshNearbyCaches = useCallback(async (latitude: number, longitude: number) => {
    const tasks = [
      fetchJson<{ data?: unknown[] }>('/api/restaurants', { latitude, longitude, radius: 5000 }, 15000)
        .then((res) => safeSet(nearbyCacheKey('restaurants', latitude, longitude), res?.data ?? [])),
      fetchJson<{ data?: unknown[] }>('/api/mosques', { latitude, longitude, radius: 5000 }, 15000)
        .then((res) => safeSet(nearbyCacheKey('mosques', latitude, longitude), res?.data ?? [])),
    ];

    await Promise.allSettled(tasks);
  }, []);

  // Sync location badge + prayer schedule + nearby caches for halal and mosques.
  const handleRefresh = useCallback(async () => {
    let targetLocation = location;

    setLoading(true);
    try {
      if ('geolocation' in navigator) {
        const preciseLocation = await new Promise<LocationData | null>((resolve) => {
          navigator.geolocation.getCurrentPosition(
            (position) => {
              const timezone = getKemenagTimezone(
                position.coords.latitude,
                position.coords.longitude,
                Intl.DateTimeFormat().resolvedOptions().timeZone,
              );
              resolve({
                latitude: position.coords.latitude,
                longitude: position.coords.longitude,
                timezone,
              });
            },
            () => resolve(null),
            { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
          );
        });

        if (preciseLocation) {
          const preciseTimezone = getKemenagTimezone(
            preciseLocation.latitude,
            preciseLocation.longitude,
            preciseLocation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || JAKARTA_FALLBACK.timezone,
          );
          targetLocation = preciseLocation;
          setLocation({
            latitude: preciseLocation.latitude,
            longitude: preciseLocation.longitude,
            timezone: preciseTimezone,
          });
          setUsingFallbackLocation(false);
          setLastLocation({
            latitude: preciseLocation.latitude,
            longitude: preciseLocation.longitude,
            timezone: preciseTimezone,
            accuracy: 0,
          });
        }
      }

      if (!targetLocation) return;
      const syncTimezone = getKemenagTimezone(
        targetLocation.latitude,
        targetLocation.longitude,
        targetLocation.timezone || Intl.DateTimeFormat().resolvedOptions().timeZone || JAKARTA_FALLBACK.timezone,
      );

      await Promise.allSettled([
        fetchPrayerData(targetLocation.latitude, targetLocation.longitude, syncTimezone, true),
        refreshDistrictLabel(targetLocation.latitude, targetLocation.longitude, usingFallbackLocation),
        refreshNearbyCaches(targetLocation.latitude, targetLocation.longitude),
      ]);
    } finally {
      setLoading(false);
    }
  }, [location, usingFallbackLocation, fetchPrayerData, refreshDistrictLabel, refreshNearbyCaches]);

  // Tick every second for realtime countdown and progress animation
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTick(Date.now());
    }, 1_000);

    return () => clearInterval(timer);
  }, []);

  // Update next prayer every second so transition at prayer boundary feels realtime
  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerTimes && location?.timezone) {
        const next = getNextPrayer(prayerTimes, location.timezone);
        setNextPrayer(next);
      }
    }, 1_000);

    return () => clearInterval(interval);
  }, [prayerTimes, location]);

  // Keep prayer times aligned with the freshest accepted location from watchPosition/getCurrentPosition.
  useEffect(() => {
    if (!location?.latitude || !location?.longitude || !location?.timezone) return;

    const syncKey = [
      location.latitude.toFixed(3),
      location.longitude.toFixed(3),
      location.timezone,
    ].join(':');

    if (lastPrayerSyncRef.current === syncKey) {
      return;
    }

    lastPrayerSyncRef.current = syncKey;

    fetchPrayerData(location.latitude, location.longitude, location.timezone).catch(() => {});
  }, [location?.latitude, location?.longitude, location?.timezone]);

  // Resolve district/kecamatan for homepage nearby shortcuts with local cache
  useEffect(() => {
    if (!location?.latitude || !location?.longitude) return;

    const key = `district-${location.latitude.toFixed(3)}-${location.longitude.toFixed(3)}`;
    const TTL_MS = 24 * 60 * 60 * 1000;

    const hydrate = async () => {
      const cached = getCached<{ district: string | null }>(key, TTL_MS);
      if (cached) {
        setDistrictLabel(cached.data.district ?? (usingFallbackLocation ? 'Lokasi tidak terdeteksi' : null));
        if (!cached.isStale) return;
      }

      try {
        const res = await fetchJson<{ district?: string | null }>('/api/location-context', {
          latitude: location.latitude,
          longitude: location.longitude,
        }, 10000);
        const district = res?.district ?? null;
        setDistrictLabel(district ?? (usingFallbackLocation ? 'Lokasi tidak terdeteksi' : null));
        safeSet(key, { district });
      } catch {
        // ignore reverse geocode failures
        if (usingFallbackLocation) {
          setDistrictLabel('Lokasi tidak terdeteksi');
        }
      }
    };

    hydrate();
  }, [location?.latitude, location?.longitude, usingFallbackLocation]);

  // Handle azan reminder notifications — now managed entirely in AzanReminder component

  const handleReminderToggle = async () => {
    if (!('Notification' in window)) return;
    if (Notification.permission === 'default') {
      const result = await Notification.requestPermission();
      if (result === 'granted') {
        setReminderEnabled(true);
        localStorage.setItem('azanReminderEnabled', 'true');
      }
      return;
    }
    const next = !reminderEnabled;
    setReminderEnabled(next);
    localStorage.setItem('azanReminderEnabled', String(next));
  };

  const qiblaBearing = location
    ? calculateQiblaBearing(location.latitude, location.longitude)
    : null;

  const todayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: activeTimezone,
  }).format(new Date());

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        {/* User Header */}
        <UserGreeting reminderEnabled={reminderEnabled} onReminderToggle={handleReminderToggle} />

        <section className="glass-panel rounded-[1.9rem] p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/45 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Hari ini</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{todayDate}</h2>
              <div className="mt-2">
                <HijriDateBanner timezone={activeTimezone} />
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
              <span className="rounded-xl border border-teal-300/45 bg-gradient-to-r from-teal-500/12 to-cyan-500/10 px-3 py-1.5 text-[11px] font-semibold text-teal-700 dark:border-teal-700/55 dark:from-teal-400/20 dark:to-cyan-400/16 dark:text-teal-300">
                {usingFallbackLocation
                  ? 'Lokasi tidak terdeteksi'
                  : districtLabel
                    ? `Anda sedang berada di '${districtLabel}'`
                    : 'Mencari distrik...'}
              </span>
              <span className="glass-subtle rounded-full px-3 py-1.5">Qibla {qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : '--'}</span>
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,0.92fr)_minmax(320px,1.08fr)] xl:items-start">
            <div>
              <PrayerScheduleHero
                nextPrayer={nextPrayer}
                remainingMinutes={remainingMinutesRounded}
                remainingLabel={remainingLabel}
                progressPercent={prayerWindowProgress}
              />

              <div className="mt-4 hidden grid-cols-2 gap-3 sm:grid-cols-3 xl:grid">
                <div className="glass-subtle rounded-2xl p-3.5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">
                    {location
                      ? usingFallbackLocation
                        ? 'Jakarta (Default)'
                        : 'Lokasi aktif'
                      : 'Mendeteksi lokasi'}
                  </p>
                </div>
                <div className="glass-subtle rounded-2xl p-3.5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reminder</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{reminderEnabled ? 'Aktif' : 'Belum aktif'}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="glass-subtle flex items-center justify-between rounded-2xl p-3.5 text-left transition hover:bg-white/60 disabled:opacity-60"
                  aria-label="Refresh data"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sinkronkan</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">Perbarui jadwal</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>

            </div>

            <div className="glass-subtle rounded-[1.5rem] p-5">
              <PrayerScheduleList
                prayerTimes={prayerTimes}
                nextPrayer={nextPrayer}
                loading={loading}
                embedded
                showHero={false}
              />

              <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:hidden">
                <div className="glass-subtle rounded-2xl p-3.5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">
                    {location
                      ? usingFallbackLocation
                        ? 'Jakarta (Default)'
                        : 'Lokasi aktif'
                      : 'Mendeteksi lokasi'}
                  </p>
                </div>
                <div className="glass-subtle rounded-2xl p-3.5">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reminder</p>
                  <p className="mt-1.5 text-sm font-semibold text-slate-900">{reminderEnabled ? 'Aktif' : 'Belum aktif'}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="glass-subtle col-span-2 flex items-center justify-between rounded-2xl p-3.5 text-left transition hover:bg-white/60 disabled:opacity-60 sm:col-span-1"
                  aria-label="Refresh data"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sinkronkan</p>
                    <p className="mt-1.5 text-sm font-semibold text-slate-900">Perbarui jadwal</p>
                  </div>
                  <svg className="h-4 w-4 text-slate-700" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                    <path d="M20 12a8 8 0 1 1-2.34-5.66" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M20 4v6h-6" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-6">
          <DailyInspiration />
        </section>

        {/* Azan Reminder */}
        <section className="mt-6">
          <AzanReminder
            prayerTimes={prayerTimes}
            nextPrayer={nextPrayer}
            enabled={reminderEnabled}
            onToggle={setReminderEnabled}
          />
        </section>

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>Moosleem • Tempat Ibadah Tenang • Di Mana Pun Kamu Berada</p>
        </footer>
      </main>
    </div>
  );
}
