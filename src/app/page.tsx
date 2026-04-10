'use client';

import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import AzanReminder from '@/components/AzanReminder';
import DailyInspiration from '@/components/DailyInspiration';
import PrayerScheduleList from '@/components/PrayerScheduleList';
import UserGreeting from '@/components/UserGreeting';
import HijriDateBanner from '@/components/HijriDateBanner';
import { LocationData, PrayerTimes } from '@/types';
import { calculateQiblaBearing, getNextPrayer } from '@/utils/prayerTimes';

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
  // Track initial minutes when a new prayer window starts (for progress bar %)
  const initialMinsRef = useRef<number | null>(null);
  const lastPrayerNameRef = useRef<string | null>(null);

  const fetchPrayerData = async (latitude: number, longitude: number, timezone: string) => {
    const response = await axios.get('/api/prayer-times', {
      params: {
        latitude,
        longitude,
      },
    });

    setPrayerTimes(response.data);

    if (response.data) {
      const next = getNextPrayer(response.data, timezone);
      setNextPrayer(next);
    }
  };

  // Get user location and fetch prayer times
  useEffect(() => {
    const fetchLocationAndPrayerTimes = async () => {
      setLoading(true);

      if (!('geolocation' in navigator)) {
        setLoading(false);
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
          // Fallback to default location
          const fallbackTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const fallbackLatitude = 40.7128;
          const fallbackLongitude = -74.006;

          setLocation({
            latitude: fallbackLatitude,
            longitude: fallbackLongitude,
            timezone: fallbackTimezone,
          });

          try {
            await fetchPrayerData(fallbackLatitude, fallbackLongitude, fallbackTimezone);
          } catch (fetchError) {
            console.error('Error fetching prayer times with fallback location:', fetchError);
          } finally {
            setLoading(false);
          }
        }
      );
    };

    fetchLocationAndPrayerTimes();
  }, []);

  // Refresh prayer times
  const handleRefresh = async () => {
    if (!location) return;

    setLoading(true);
    try {
      const response = await axios.get('/api/prayer-times', {
        params: {
          latitude: location.latitude,
          longitude: location.longitude,
        },
      });

      setPrayerTimes(response.data);
      
      if (response.data) {
        const next = getNextPrayer(response.data, location.timezone || '');
        setNextPrayer(next);
      }
    } catch (error) {
      console.error('Error refreshing prayer times:', error);
    } finally {
      setLoading(false);
    }
  };

  // Update next prayer every 10 s for live countdown
  useEffect(() => {
    const interval = setInterval(() => {
      if (prayerTimes && location?.timezone) {
        const next = getNextPrayer(prayerTimes, location.timezone);
        setNextPrayer(next);
      }
    }, 10_000);

    return () => clearInterval(interval);
  }, [prayerTimes, location]);

  // Reset progress-bar denominator whenever the next prayer changes
  useEffect(() => {
    if (!nextPrayer) return;
    if (nextPrayer.name !== lastPrayerNameRef.current) {
      lastPrayerNameRef.current = nextPrayer.name;
      initialMinsRef.current = nextPrayer.minutesUntil;
    }
  }, [nextPrayer?.name]); // eslint-disable-line react-hooks/exhaustive-deps

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
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[32rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_24%)]" />
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
              <span className="glass-subtle rounded-full px-3 py-1.5">{location?.timezone ?? 'Timezone not detected'}</span>
              <span className="glass-subtle rounded-full px-3 py-1.5">Qibla {qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : '--'}</span>
            </div>
          </div>

          <div className="grid gap-8 xl:grid-cols-[minmax(0,0.95fr)_minmax(340px,1.05fr)] xl:items-start">
            <div>
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sholat Berikutnya</p>
              <div className="mt-4 flex items-end justify-between gap-4">
                <div>
                  <h3 className="text-4xl font-semibold tracking-tight text-slate-950">{nextPrayer?.name ?? 'Loading'}</h3>
                  <p className="mt-2 text-sm text-slate-600">{nextPrayer ? `Pukul ${nextPrayer.time}` : 'Fetching...'}</p>
                </div>
                <div className="text-right">
                  <div className="text-5xl font-semibold tracking-tight text-teal-700">
                    {nextPrayer ? `${nextPrayer.minutesUntil}` : '--'}
                  </div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">menit lagi</p>
                </div>
              </div>

              {nextPrayer && (
                <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-slate-200">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000"
                    style={{
                      width: `${Math.min(
                        100,
                        Math.max(
                          2,
                          initialMinsRef.current && initialMinsRef.current > 0
                            ? ((initialMinsRef.current - nextPrayer.minutesUntil) / initialMinsRef.current) * 100
                            : 0
                        )
                      )}%`,
                    }}
                  />
                </div>
              )}

              <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                <div className="glass-subtle rounded-2xl p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">Status</p>
                  <p className="mt-2 text-sm font-semibold text-slate-900">{location ? 'Lokasi aktif' : 'Mendeteksi lokasi'}</p>
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
