'use client';

import React, { useState, useEffect } from 'react';
import { PrayerTimes } from '@/types';
import { formatPrayerTime } from '@/utils/prayerTimes';

interface PrayerTimesCardProps {
  prayerTimes: PrayerTimes | null;
  loading: boolean;
  nextPrayer?: { name: string; time: string; minutesUntil: number } | null;
}

const PrayersIcon = ({ name }: { name: string }) => {
  const iconMap: { [key: string]: string } = {
    Fajr: '🌅',
    Sunrise: '☀️',
    Dhuhr: '☀️',
    Asr: '🌤️',
    Sunset: '🌆',
    Maghrib: '🌅',
    Isha: '🌙',
  };
  return <span className="text-2xl">{iconMap[name] || '🕌'}</span>;
};

const prayerArabicLabels: Record<string, string> = {
  Fajr: 'الفجر',
  Sunrise: 'الشروق',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Sunset: 'الغروب',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export default function PrayerTimesCard({
  prayerTimes,
  loading,
  nextPrayer,
}: PrayerTimesCardProps) {
  const prayerList = ['Fajr', 'Sunrise', 'Dhuhr', 'Asr', 'Sunset', 'Maghrib', 'Isha'];

  if (loading) {
    return (
      <div className="glass-panel rounded-[2rem] p-8">
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-1/2 rounded-lg bg-slate-200"></div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-slate-200"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="glass-panel rounded-[2rem] p-8">
      <div className="mb-6 flex items-center justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Prayer Schedule</p>
          <h2 className="text-2xl font-semibold text-slate-900">Prayer Times</h2>
        </div>
        {nextPrayer && (
          <div className="rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-medium text-blue-700">
            Next: {nextPrayer.name} in {nextPrayer.minutesUntil}m
          </div>
        )}
      </div>

      {prayerTimes ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {prayerList.map((prayer) => {
            const time = prayerTimes[prayer as keyof PrayerTimes];
            const isNext = nextPrayer?.name === prayer;
            
            return (
              <div
                key={prayer}
                className={`p-4 rounded-2xl text-center transition-all ${
                  isNext
                    ? 'border border-blue-300 bg-blue-50'
                    : 'border border-slate-200 bg-white'
                }`}
              >
                <div className="mb-2 flex justify-center">
                  <PrayersIcon name={prayer} />
                </div>
                <p className={`text-sm font-medium ${isNext ? 'text-blue-700' : 'text-slate-700'}`}>
                  {prayer}
                </p>
                <p className="font-arabic mt-1 text-lg text-slate-700" dir="rtl">
                  {prayerArabicLabels[prayer]}
                </p>
                <p className={`text-lg font-semibold ${isNext ? 'text-blue-900' : 'text-slate-900'}`}>
                  {time ? formatPrayerTime(time) : '--:--'}
                </p>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-8 text-center text-slate-500">
          Unable to load prayer times. Please enable location services.
        </div>
      )}
    </section>
  );
}
