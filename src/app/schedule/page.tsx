'use client';

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Link from 'next/link';
import PrayerScheduleList from '@/components/PrayerScheduleList';
import { LocationData, PrayerTimes } from '@/types';
import { calculateQiblaBearing, getNextPrayer } from '@/utils/prayerTimes';

export default function SchedulePage() {
  const [location, setLocation] = useState<LocationData | null>(null);
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [nextPrayer, setNextPrayer] = useState<{ name: string; time: string; minutesUntil: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async (latitude: number, longitude: number, timezone: string) => {
      const response = await axios.get('/api/prayer-times', {
        params: { latitude, longitude },
      });
      setPrayerTimes(response.data);
      setNextPrayer(getNextPrayer(response.data, timezone));
    };

    const load = async () => {
      setLoading(true);
      if (!('geolocation' in navigator)) {
        setLoading(false);
        return;
      }

      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          setLocation({ latitude, longitude, timezone });
          try {
            await fetchData(latitude, longitude, timezone);
          } finally {
            setLoading(false);
          }
        },
        async () => {
          const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
          const latitude = 40.7128;
          const longitude = -74.006;
          setLocation({ latitude, longitude, timezone });
          try {
            await fetchData(latitude, longitude, timezone);
          } finally {
            setLoading(false);
          }
        }
      );
    };

    load();
  }, []);

  const qiblaBearing = location ? calculateQiblaBearing(location.latitude, location.longitude) : null;
  const todayDate = new Intl.DateTimeFormat('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date());

  return (
    <div className="relative min-h-screen pb-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem] bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.92),transparent_34%),radial-gradient(circle_at_top_right,rgba(45,212,191,0.16),transparent_24%)]" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Jadwal</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Sholat Harian</h1>
          </div>
          <Link href="/" className="glass-subtle rounded-full px-4 py-2 text-sm font-medium text-slate-700">Kembali</Link>
        </div>

        <section className="glass-panel rounded-[1.8rem] p-5 sm:p-7">
          <div className="mb-6 flex flex-col gap-4 border-b border-white/45 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.24em] text-slate-500">Hari ini</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{todayDate}</h2>
            </div>
            <div className="flex flex-wrap gap-2 text-xs text-slate-600">
              <span className="glass-subtle rounded-full px-3 py-1.5">{location?.timezone ?? 'Timezone not detected'}</span>
              <span className="glass-subtle rounded-full px-3 py-1.5">Qibla {qiblaBearing !== null ? `${qiblaBearing.toFixed(1)}°` : '--'}</span>
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-[minmax(0,0.85fr)_minmax(340px,1fr)]">
            <div className="glass-subtle rounded-[1.5rem] p-5">
              <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Sholat Berikutnya</p>
              <div className="mt-4 flex items-end justify-between gap-3">
                <div>
                  <h3 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{nextPrayer?.name ?? 'Loading'}</h3>
                  <p className="mt-2 text-sm text-slate-600">{nextPrayer ? `Pukul ${nextPrayer.time}` : 'Mengambil jadwal...'}</p>
                </div>
                <div className="text-right">
                  <div className="text-4xl font-semibold tracking-tight text-teal-700 sm:text-5xl">{nextPrayer ? nextPrayer.minutesUntil : '--'}</div>
                  <p className="text-xs uppercase tracking-[0.18em] text-slate-500">menit lagi</p>
                </div>
              </div>
            </div>
            <div className="glass-subtle rounded-[1.5rem] p-5">
              <PrayerScheduleList prayerTimes={prayerTimes} nextPrayer={nextPrayer} loading={loading} embedded />
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
