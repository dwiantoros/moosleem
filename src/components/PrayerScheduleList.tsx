'use client';

import React from 'react';
import { PrayerTimes } from '@/types';

const prayerArabicLabels: { [key: string]: string } = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

interface PrayerScheduleListProps {
  prayerTimes: PrayerTimes | null;
  nextPrayer: { name: string; time: string; minutesUntil: number } | null;
  loading: boolean;
  embedded?: boolean;
}

export default function PrayerScheduleList({
  prayerTimes,
  nextPrayer,
  loading,
  embedded = false,
}: PrayerScheduleListProps) {
  const prayers = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
  const prayerIcons: Record<string, React.ReactNode> = {
    Fajr: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 16h14" strokeLinecap="round" />
        <path d="M8 13 12 9l4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Sunrise: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 16h14" strokeLinecap="round" />
        <path d="M12 6v5" strokeLinecap="round" />
        <path d="m8 12 4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    Dhuhr: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="4" />
      </svg>
    ),
    Asr: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="10" cy="10" r="4" />
        <path d="M14 14l4 4" strokeLinecap="round" />
      </svg>
    ),
    Maghrib: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M5 16h14" strokeLinecap="round" />
        <path d="M12 8v7" strokeLinecap="round" />
      </svg>
    ),
    Isha: (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M16.5 6A5.5 5.5 0 1 0 18 17a4.8 4.8 0 1 1-1.5-11Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  };

  if (loading) {
    return (
      <div className={`${embedded ? 'space-y-3' : 'rounded-3xl border border-slate-200 bg-white p-6 space-y-3'}`}>
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-xl animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'overflow-hidden' : 'rounded-3xl border border-slate-200 bg-white overflow-hidden'}`}>
      <div className={`${embedded ? 'pb-4' : 'border-b border-slate-200 p-6'}`}>
        <h3 className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Jadwal Sholat</h3>
      </div>
      <div className="divide-y divide-white/35">
        {prayers.map((prayer) => {
          const time = prayerTimes ? prayerTimes[prayer as keyof PrayerTimes] : null;
          const isNext = nextPrayer?.name === prayer;
          
          return (
            <div
              key={prayer}
              className={`flex items-center justify-between rounded-2xl px-3 py-3 transition ${
                isNext ? 'bg-teal-600/15' : 'hover:bg-white/20'
              }`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div
                  className="flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold"
                  style={
                    isNext
                      ? { backgroundColor: '#0d9488', color: '#fff', boxShadow: '0 8px 24px rgba(13,148,136,0.35)' }
                      : { backgroundColor: 'rgba(148,163,184,0.22)', color: '#94a3b8' }
                  }
                >
                  {prayerIcons[prayer]}
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: isNext ? '#2dd4bf' : 'var(--prayer-text, #e2e8f0)' }}
                  >
                    {prayer}
                  </p>
                  <p className="text-xs font-arabic" style={{ color: '#94a3b8' }}>{prayerArabicLabels[prayer]}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-sm font-semibold ${isNext ? '' : 'text-slate-200'}`}
                  style={isNext ? { color: '#2dd4bf' } : undefined}
                >
                  {time || '--'}
                </p>
                {isNext && nextPrayer && (
                  <p className="text-xs" style={{ color: '#2dd4bf' }}>{nextPrayer.minutesUntil} min</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
