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
  showHero?: boolean;
}

interface PrayerScheduleHeroProps {
  nextPrayer: { name: string; time: string; minutesUntil: number } | null;
  remainingMinutes?: number | null;
  remainingLabel?: string;
  progressPercent?: number | null;
}

const prayerLabels: Record<string, string> = {
  Fajr: 'Subuh',
  Sunrise: 'Terbit',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: 'Isya',
};

export function PrayerScheduleHero({
  nextPrayer,
  remainingMinutes = null,
  remainingLabel = '--',
  progressPercent = null,
}: PrayerScheduleHeroProps) {
  return (
    <div className="relative overflow-hidden rounded-[1.45rem] border border-teal-200/60 bg-[radial-gradient(circle_at_top_left,_rgba(20,184,166,0.22),_transparent_34%),linear-gradient(145deg,_rgba(240,253,250,0.98),_rgba(242,252,255,0.92)_42%,_rgba(255,255,255,0.92))] px-4 py-3.5 shadow-[0_14px_28px_rgba(13,148,136,0.1)] dark:border-teal-700/40 dark:bg-[radial-gradient(circle_at_top_left,_rgba(45,212,191,0.18),_transparent_34%),linear-gradient(145deg,_rgba(13,23,38,0.96),_rgba(11,28,37,0.92)_42%,_rgba(12,20,34,0.94))] dark:shadow-[0_18px_34px_rgba(2,6,23,0.34)]">
      <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-teal-400/18 blur-3xl dark:bg-teal-400/12" />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-white/84 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500 shadow-sm dark:bg-white/8 dark:text-slate-300 dark:shadow-none">
              Jadwal Sholat
            </span>
          </div>
          <h3 className="mt-3 text-[1.9rem] font-semibold tracking-tight text-slate-950 dark:text-slate-50">
            {nextPrayer ? prayerLabels[nextPrayer.name] ?? nextPrayer.name : 'Memuat jadwal'}
          </h3>
          <p className="mt-1 text-[13px] text-slate-600 dark:text-slate-300">
            {nextPrayer ? `Sholat berikutnya pukul ${nextPrayer.time}` : 'Sedang menyelaraskan waktu sholat'}
          </p>
          <p className="mt-2 font-arabic text-base text-teal-700 dark:text-teal-300" dir="rtl">
            {nextPrayer ? prayerArabicLabels[nextPrayer.name] : 'الصلاة'}
          </p>
        </div>
        <div className="rounded-[1.1rem] border border-white/70 bg-white/72 px-2.5 py-2 text-right shadow-[0_10px_20px_rgba(15,23,42,0.05)] dark:border-white/10 dark:bg-white/6 dark:shadow-none sm:rounded-[1.2rem] sm:px-3 sm:py-2">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">Tersisa</p>
          <p className="mt-1 text-base font-semibold tracking-tight text-teal-700 dark:text-teal-300 sm:text-lg">
            {remainingMinutes !== null ? `${remainingMinutes}m` : '--'}
          </p>
          <p className="mt-0.5 text-[10px] text-slate-400 dark:text-slate-500">{remainingLabel}</p>
        </div>
      </div>

      <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-slate-200/90 dark:bg-slate-800/90">
        <div
          className="h-full rounded-full bg-gradient-to-r from-teal-500 to-teal-600 transition-all duration-1000"
          style={{ width: `${progressPercent ?? 2}%` }}
        />
      </div>
    </div>
  );
}

export default function PrayerScheduleList({
  prayerTimes,
  nextPrayer,
  loading,
  embedded = false,
  showHero = true,
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
      <div className={`${embedded ? 'space-y-3' : 'rounded-[1.8rem] border border-slate-200 bg-white p-5 space-y-3'}`}>
        {showHero && <div className="h-24 rounded-[1.5rem] bg-slate-100/80 animate-pulse dark:bg-slate-800/80" />}
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-12 bg-slate-100 rounded-[1.2rem] animate-pulse dark:bg-slate-800/80" />
        ))}
      </div>
    );
  }

  return (
    <div className={`${embedded ? 'overflow-hidden' : 'rounded-[1.8rem] border border-slate-200 bg-white overflow-hidden dark:border-white/10 dark:bg-slate-950/60'}`}>
      {showHero && <PrayerScheduleHero nextPrayer={nextPrayer} />}

      <div className={`${showHero ? 'mt-3' : ''} space-y-2.5`}>
        {prayers.map((prayer) => {
          const time = prayerTimes ? prayerTimes[prayer as keyof PrayerTimes] : null;
          const isNext = nextPrayer?.name === prayer;
          
          return (
            <div
              key={prayer}
              className={`group flex items-center justify-between rounded-[1.15rem] border px-3.5 py-3 transition-all duration-300 ${
                isNext
                  ? 'border-teal-200 bg-[linear-gradient(135deg,rgba(20,184,166,0.14),rgba(255,255,255,0.96))] shadow-[0_14px_24px_rgba(13,148,136,0.1)] dark:border-teal-700/40 dark:bg-[linear-gradient(135deg,rgba(20,184,166,0.16),rgba(15,23,42,0.92))] dark:shadow-[0_12px_22px_rgba(2,6,23,0.28)]'
                  : 'border-white/70 bg-white/72 hover:-translate-y-0.5 hover:bg-white/90 hover:shadow-[0_12px_22px_rgba(15,23,42,0.06)] dark:border-white/10 dark:bg-white/4 dark:hover:bg-white/8 dark:hover:shadow-[0_12px_22px_rgba(2,6,23,0.22)]'
              }`}
            >
              <div className="flex flex-1 items-center gap-3">
                <div
                  className="flex h-10 w-10 items-center justify-center rounded-[1rem] text-sm font-semibold"
                  style={
                    isNext
                      ? { background: 'linear-gradient(145deg, #0f766e, #14b8a6)', color: '#fff', boxShadow: '0 10px 20px rgba(13,148,136,0.22)' }
                      : { backgroundColor: 'rgba(226,232,240,0.9)', color: '#64748b' }
                  }
                >
                  {prayerIcons[prayer]}
                </div>
                <div>
                  <p
                    className={`text-[14px] font-semibold ${isNext ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-slate-100'}`}
                  >
                    {prayerLabels[prayer]}
                  </p>
                  <p className="text-[10px] text-slate-400 dark:text-slate-500">{prayer}</p>
                  <p className={`text-[11px] font-arabic ${isNext ? 'text-teal-700 dark:text-teal-300' : 'text-slate-400 dark:text-slate-500'}`}>{prayerArabicLabels[prayer]}</p>
                </div>
              </div>
              <div className="text-right">
                <p
                  className={`text-[1.05rem] font-semibold ${isNext ? 'text-teal-700 dark:text-teal-300' : 'text-slate-900 dark:text-slate-100'}`}
                >
                  {time || '--'}
                </p>
                <p className="text-[10px] text-slate-400 dark:text-slate-500">{isNext ? 'Berikutnya' : 'Jadwal'}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
