'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import PrayerScheduleList from '@/components/PrayerScheduleList';
import UserGreeting from '@/components/UserGreeting';
import HijriDateBanner from '@/components/HijriDateBanner';
import { LocationData, PrayerTimes } from '@/types';
import { AZAN_REMINDER_EVENT, AzanReminderSnapshot, readAzanReminderSnapshot } from '@/utils/azanReminder';
import { calculateQiblaBearing, getNextPrayer } from '@/utils/prayerTimes';
import { getCached, getLastLocation, prayerCacheKey, safeSet, setLastLocation } from '@/utils/clientCache';
import { LOCATION_PERMISSION_UPDATED_EVENT, LocationPermissionUpdatedDetail } from '@/utils/permissionCenter';

const JAKARTA_FALLBACK = {
  latitude: -6.2088,
  longitude: 106.8456,
  timezone: 'Asia/Jakarta',
} as const;

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

  const remainingSeconds = useMemo(() => {
    if (!nextPrayer || !prayerTimes) return null;

    const parseToMinute = (value: string): number | null => {
      const match = value.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return null;
      return Number(match[1]) * 60 + Number(match[2]);
    };

    const nextMinuteRaw = parseToMinute(nextPrayer.time);
    if (nextMinuteRaw === null) return null;

    const now = new Date(nowTick);
    const target = new Date(now);
    target.setHours(Math.floor(nextMinuteRaw / 60), nextMinuteRaw % 60, 0, 0);

    const nowMinute = now.getHours() * 60 + now.getMinutes();
    const ishaMinute = parseToMinute(prayerTimes.Isha ?? '');
    if (nextPrayer.name === 'Fajr' && ishaMinute !== null && nowMinute >= ishaMinute) {
      target.setDate(target.getDate() + 1);
    } else if (target.getTime() <= now.getTime()) {
      target.setDate(target.getDate() + 1);
    }

    return Math.max(0, Math.ceil((target.getTime() - now.getTime()) / 1000));
  }, [nextPrayer, prayerTimes, nowTick]);

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
    if (!prayerTimes || !nextPrayer || remainingSeconds === null) return null;

    const parseToMinute = (value: string): number | null => {
      const match = value.match(/^(\d{1,2}):(\d{2})/);
      if (!match) return null;
      return Number(match[1]) * 60 + Number(match[2]);
    };

    const schedule = [
      { key: 'Fajr', value: prayerTimes.Fajr },
      { key: 'Dhuhr', value: prayerTimes.Dhuhr },
      { key: 'Asr', value: prayerTimes.Asr },
      { key: 'Maghrib', value: prayerTimes.Maghrib },
      { key: 'Isha', value: prayerTimes.Isha },
    ];

    const nextIndex = schedule.findIndex((item) => item.key === nextPrayer.name);
    if (nextIndex < 0) return null;

    const prevIndex = nextIndex === 0 ? schedule.length - 1 : nextIndex - 1;
    const nextMinuteRaw = parseToMinute(schedule[nextIndex].value);
    const prevMinuteRaw = parseToMinute(schedule[prevIndex].value);
    if (nextMinuteRaw === null || prevMinuteRaw === null) return null;

    const nextMinute = nextIndex === 0 ? nextMinuteRaw + 24 * 60 : nextMinuteRaw;
    const prevMinute = prevIndex === schedule.length - 1 ? prevMinuteRaw - 24 * 60 : prevMinuteRaw;
    const totalWindow = nextMinute - prevMinute;
    if (totalWindow <= 0) return null;

    const elapsed = totalWindow - remainingSeconds / 60;
    return Math.min(100, Math.max(2, (elapsed / totalWindow) * 100));
  }, [nextPrayer, prayerTimes, remainingSeconds]);

  const fetchPrayerData = async (latitude: number, longitude: number, timezone: string) => {
    const cacheKey = prayerCacheKey(latitude, longitude);
    const STALE_MS = 6 * 60 * 60 * 1000; // refresh after 6h

    const doFetch = async () => {
      const response = await fetchJson<PrayerTimes>('/api/prayer-times', { latitude, longitude }, 8000);
      if (response) {
        safeSet(cacheKey, response);
        setPrayerTimes(response);
        setNextPrayer(getNextPrayer(response, timezone));
      }
    };

    const cached = getCached<PrayerTimes>(cacheKey, STALE_MS);
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
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

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
        timezone: detail.timezone,
      };

      setLocation(locationData);
      setUsingFallbackLocation(false);
      setDistrictLabel(null);
      setLoading(true);

      fetchPrayerData(detail.latitude, detail.longitude, detail.timezone)
        .catch(() => {})
        .finally(() => setLoading(false));
    };

    window.addEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    return () => {
      window.removeEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    };
  }, []);

  // Refresh prayer times
  const handleRefresh = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await fetchJson<PrayerTimes>('/api/prayer-times', {
        latitude: location.latitude,
        longitude: location.longitude,
      });

      setPrayerTimes(response);
      
      if (response) {
        const next = getNextPrayer(response, location.timezone || '');
        setNextPrayer(next);
      }
    } catch (error) {
      console.error('Error refreshing prayer times:', error);
    } finally {
      setLoading(false);
    }
  };

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
                <HijriDateBanner />
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

          <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)] xl:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sholat Berikutnya</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{nextPrayer?.name ?? 'Loading'}</h3>
                  <p className="mt-2 text-sm text-slate-600">{nextPrayer ? `Pukul ${nextPrayer.time}` : 'Fetching...'}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold tracking-tight text-teal-700 sm:text-5xl">
                    {remainingMinutesRounded !== null ? `${remainingMinutesRounded}` : '--'}
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">menit lagi</p>
                  <p className="mt-1 text-xs text-slate-500">{remainingLabel}</p>
                </div>
              </div>

              {nextPrayer && (
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000"
                    style={{
                      width: `${prayerWindowProgress ?? 2}%`,
                    }}
                  />
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="glass-subtle rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">
                    {location
                      ? usingFallbackLocation
                        ? 'Jakarta (Default)'
                        : 'Lokasi aktif'
                      : 'Mendeteksi lokasi'}
                  </p>
                </div>
                <div className="glass-subtle rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Reminder</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{reminderEnabled ? 'Aktif' : 'Belum aktif'}</p>
                </div>
                <button
                  onClick={handleRefresh}
                  disabled={loading}
                  className="glass-subtle flex items-center justify-between rounded-2xl p-4 text-left transition hover:bg-white/60 disabled:opacity-60"
                  aria-label="Refresh data"
                >
                  <div>
                    <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Sinkronkan</p>
                    <p className="mt-2 text-sm font-semibold text-slate-900">Perbarui jadwal</p>
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
              />
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
          <p>Muslim Traveler • Tempat Ibadah Tenang • Di Mana Pun Kamu Berada</p>
        </footer>
      </main>
    </div>
  );
}
