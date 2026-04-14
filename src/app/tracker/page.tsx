'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';

const PRAYERS = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'] as const;
type Prayer = (typeof PRAYERS)[number];

const PRAYER_LABELS: Record<Prayer, { arabic: string; time: string; color: string }> = {
  Fajr:    { arabic: 'الفجر',   time: 'Subuh',     color: '#0891b2' },
  Dhuhr:   { arabic: 'الظهر',   time: 'Dzuhur',    color: '#d97706' },
  Asr:     { arabic: 'العصر',   time: 'Ashar',     color: '#ea580c' },
  Maghrib: { arabic: 'المغرب',  time: 'Maghrib',   color: '#9333ea' },
  Isha:    { arabic: 'العشاء',  time: "Isya'",     color: '#1d4ed8' },
};

type PrayerStatus = 'done' | 'qadha' | 'missed' | null;
type DayRecord = Record<Prayer, PrayerStatus>;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function pastDays(n: number): string[] {
  const days: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function dayLabel(dateStr: string): string {
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });
}

function loadRecords(): Record<string, DayRecord> {
  try {
    const raw = localStorage.getItem('prayer-tracker');
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function computeStreak(records: Record<string, DayRecord>): number {
  let streak = 0;
  let date = new Date();
  // if today not complete, start checking from yesterday
  const todayRec = records[todayKey()];
  const todayComplete = todayRec && PRAYERS.every((p) => todayRec[p] === 'done' || todayRec[p] === 'qadha');
  if (!todayComplete) date.setDate(date.getDate() - 1);

  while (true) {
    const key = date.toISOString().slice(0, 10);
    const rec = records[key];
    if (!rec) break;
    const complete = PRAYERS.every((p) => rec[p] === 'done' || rec[p] === 'qadha');
    if (!complete) break;
    streak++;
    date.setDate(date.getDate() - 1);
  }
  return streak;
}

export default function TrackerPage() {
  const [records, setRecords] = useState<Record<string, DayRecord>>({});
  const [selectedDate, setSelectedDate] = useState<string>(todayKey());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setRecords(loadRecords());
    setMounted(true);
  }, []);

  const saveRecords = useCallback((next: Record<string, DayRecord>) => {
    setRecords(next);
    localStorage.setItem('prayer-tracker', JSON.stringify(next));
  }, []);

  const cycleStatus = (prayer: Prayer) => {
    const current = records[selectedDate]?.[prayer] ?? null;
    const next: PrayerStatus =
      current === null ? 'done' : current === 'done' ? 'qadha' : current === 'qadha' ? 'missed' : null;
    const updated: DayRecord = {
      ...((records[selectedDate] ?? {}) as DayRecord),
      [prayer]: next,
    };
    saveRecords({ ...records, [selectedDate]: updated });
  };

  const days = pastDays(14);
  const streak = mounted ? computeStreak(records) : 0;

  const todayRecord = records[todayKey()] ?? {} as DayRecord;
  const doneToday = PRAYERS.filter((p) => todayRecord[p] === 'done' || todayRecord[p] === 'qadha').length;

  const statusColor: Record<NonNullable<PrayerStatus> | 'null', string> = {
    done:   '#0d9488',
    qadha:  '#d97706',
    missed: '#ef4444',
    null:   '#e2e8f0',
  };
  const statusLabel: Record<NonNullable<PrayerStatus> | 'null', string> = {
    done:   '✓ Done',
    qadha:  '↺ Qadha',
    missed: '✗ Missed',
    null:   'Belum',
  };

  const getDayCompletion = (dateKey: string) => {
    const rec = records[dateKey] ?? {};
    return PRAYERS.filter((p) => (rec as DayRecord)[p] === 'done' || (rec as DayRecord)[p] === 'qadha').length;
  };

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-xl font-semibold text-slate-900">Tracker Sholat</h1>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-lg space-y-5">

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-teal-600">{streak}</p>
            <p className="mt-0.5 text-xs text-slate-500">🔥 Hari streak</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{doneToday}<span className="text-base text-slate-400">/5</span></p>
            <p className="mt-0.5 text-xs text-slate-500">Hari ini</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">
              {mounted ? Math.round(
                (Object.values(records).reduce((acc, rec) => acc + PRAYERS.filter((p) => rec[p] === 'done').length, 0) /
                  Math.max(Object.keys(records).length * 5, 1)) * 100
              ) : 0}%
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Konsistensi</p>
          </div>
        </div>

        {/* 14-day mini calendar heatmap */}
        <div className="glass-panel rounded-[1.5rem] p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">14 Hari Terakhir</h3>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {days.map((day) => {
              const done = getDayCompletion(day);
              const isSelected = day === selectedDate;
              const isToday = day === todayKey();
              const opacity = done === 0 ? 0.15 : done === 1 ? 0.3 : done === 2 ? 0.45 : done === 3 ? 0.6 : done === 4 ? 0.8 : 1;
              return (
                <button
                  key={day}
                  onClick={() => setSelectedDate(day)}
                  className="flex flex-shrink-0 flex-col items-center gap-1"
                >
                  <div
                    className="h-8 w-8 rounded-lg transition-transform hover:scale-110"
                    style={{
                      backgroundColor: `rgba(13,148,136,${opacity})`,
                      outline: isSelected ? '2px solid #0d9488' : isToday ? '2px solid #94a3b8' : 'none',
                      outlineOffset: '2px',
                    }}
                  />
                  <span className="text-[10px] text-slate-400">{dayLabel(day)}</span>
                </button>
              );
            })}
          </div>
          <div className="mt-3 flex items-center gap-2 text-[10px] text-slate-400">
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(13,148,136,0.15)' }} /> Kosong
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(13,148,136,0.6)' }} /> Sebagian
            <div className="h-3 w-3 rounded-sm" style={{ backgroundColor: 'rgba(13,148,136,1)' }} /> Lengkap
          </div>
        </div>

        {/* Prayer input for selected date */}
        <div className="glass-panel rounded-[1.5rem] p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-900">
                {selectedDate === todayKey() ? 'Hari Ini' : dayLabel(selectedDate)}
              </h3>
              <p className="text-xs text-slate-500">Ketuk untuk ganti status: Done → Qadha → Missed → Belum</p>
            </div>
          </div>
          <div className="space-y-2">
            {PRAYERS.map((prayer) => {
              const status = records[selectedDate]?.[prayer] ?? null;
              const statusKey = status ?? 'null';
              return (
                <button
                  key={prayer}
                  onClick={() => cycleStatus(prayer)}
                  className="flex w-full items-center justify-between rounded-2xl border px-4 py-3.5 text-left transition hover:scale-[1.01] active:scale-[0.99]"
                  style={{
                    borderColor: status ? statusColor[status] + '55' : '#e2e8f0',
                    backgroundColor: status ? statusColor[status] + '12' : 'white',
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold"
                      style={{ backgroundColor: PRAYER_LABELS[prayer].color }}
                    >
                      {prayer[0]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{PRAYER_LABELS[prayer].time}</p>
                      <p className="text-xs font-arabic text-slate-400">{PRAYER_LABELS[prayer].arabic}</p>
                    </div>
                  </div>
                  <span
                    className="rounded-full px-3 py-1 text-xs font-semibold"
                    style={{
                      backgroundColor: statusColor[statusKey] + '22',
                      color: statusColor[statusKey],
                    }}
                  >
                    {statusLabel[statusKey]}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="glass-subtle rounded-2xl p-4">
          <p className="mb-2 text-xs font-semibold text-slate-600">Keterangan:</p>
          <div className="grid grid-cols-2 gap-y-1.5 text-xs text-slate-500">
            <span><span className="font-semibold text-teal-600">✓ Done</span> — Sholat tepat waktu</span>
            <span><span className="font-semibold text-amber-600">↺ Qadha</span> — Sholat terlambat / ganti</span>
            <span><span className="font-semibold text-red-500">✗ Missed</span> — Terlewat</span>
            <span><span className="text-slate-400">Belum</span> — Belum dicatat</span>
          </div>
        </div>
      </div>
    </div>
  );
}
