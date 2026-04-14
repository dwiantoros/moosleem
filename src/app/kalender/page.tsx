'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';

// ── Hijri conversion (Umm al-Qura algorithm approximation) ──────────────────
function gregorianToHijri(gDate: Date): { year: number; month: number; day: number } {
  const jd = Math.floor(
    (1461 * (gDate.getFullYear() + 4800 + Math.floor((gDate.getMonth() + 1 - 14) / 12))) / 4 +
    Math.floor((367 * (gDate.getMonth() + 1 - 2 - 12 * Math.floor((gDate.getMonth() + 1 - 14) / 12))) / 12) -
    Math.floor((3 * Math.floor((gDate.getFullYear() + 4900 + Math.floor((gDate.getMonth() + 1 - 14) / 12)) / 100)) / 4) +
    gDate.getDate() - 32075
  );
  let l = jd - 1948440 + 10632;
  const n = Math.floor((l - 1) / 10631);
  l = l - 10631 * n + 354;
  const j =
    Math.floor((10985 - l) / 5316) * Math.floor((50 * l) / 17719) +
    Math.floor(l / 5670) * Math.floor((43 * l) / 15238);
  l =
    l -
    Math.floor((30 - j) / 15) * Math.floor((17719 * j) / 50) -
    Math.floor(j / 16) * Math.floor((15238 * j) / 43) +
    29;
  const month = Math.floor((24 * l) / 709);
  const day = l - Math.floor((709 * month) / 24);
  const year = 30 * n + j - 30;
  return { year, month, day };
}

const HIJRI_MONTHS = [
  'Muharram', 'Safar', "Rabi'ul Awwal", "Rabi'ul Akhir",
  'Jumadal Ula', 'Jumadal Akhirah', 'Rajab', "Sya'ban",
  'Ramadan', 'Syawal', "Dzulqa'dah", 'Dzulhijjah',
];

const HIJRI_MONTHS_AR = [
  'مُحَرَّم', 'صَفَر', 'رَبِيع ٱلْأَوَّل', 'رَبِيع ٱلثَّانِي',
  'جُمَادَى ٱلْأُولَىٰ', 'جُمَادَى ٱلثَّانِيَة', 'رَجَب', 'شَعْبَان',
  'رَمَضَان', 'شَوَّال', 'ذُو ٱلْقَعْدَة', 'ذُو ٱلْحِجَّة',
];

// Important Islamic events per Hijri month/day
interface IslamicEvent {
  hijriMonth: number; // 1-indexed
  hijriDay: number;
  name: string;
  color: string;
  description: string;
}

const ISLAMIC_EVENTS: IslamicEvent[] = [
  { hijriMonth: 1,  hijriDay: 1,  name: 'Tahun Baru Hijriah',   color: '#0d9488', description: 'Awal tahun baru Islam' },
  { hijriMonth: 1,  hijriDay: 10, name: 'Hari Asyura',          color: '#7c3aed', description: 'Puasa sunnah Asyura' },
  { hijriMonth: 3,  hijriDay: 12, name: 'Maulid Nabi ﷺ',        color: '#b45309', description: 'Peringatan lahirnya Rasulullah ﷺ' },
  { hijriMonth: 7,  hijriDay: 27, name: "Isra' Mi'raj",         color: '#0369a1', description: "Perjalanan malam Nabi ﷺ" },
  { hijriMonth: 8,  hijriDay: 15, name: "Nisfu Sya'ban",        color: '#9333ea', description: "Malam nisfu Sya'ban" },
  { hijriMonth: 9,  hijriDay: 1,  name: 'Awal Ramadan',         color: '#0891b2', description: 'Mulai puasa Ramadan' },
  { hijriMonth: 9,  hijriDay: 17, name: 'Nuzulul Quran',        color: '#0d9488', description: 'Turunnya Al-Quran' },
  { hijriMonth: 9,  hijriDay: 21, name: 'Lailatul Qadar*',      color: '#f59e0b', description: 'Malam ke-21 (kemungkinan Lailatul Qadar)' },
  { hijriMonth: 9,  hijriDay: 23, name: 'Lailatul Qadar*',      color: '#f59e0b', description: 'Malam ke-23' },
  { hijriMonth: 9,  hijriDay: 25, name: 'Lailatul Qadar*',      color: '#f59e0b', description: 'Malam ke-25' },
  { hijriMonth: 9,  hijriDay: 27, name: 'Lailatul Qadar*',      color: '#f597e0b', description: 'Malam ke-27 (paling utama)' },
  { hijriMonth: 9,  hijriDay: 29, name: 'Lailatul Qadar*',      color: '#f59e0b', description: 'Malam ke-29' },
  { hijriMonth: 10, hijriDay: 1,  name: 'Idul Fitri 🎉',         color: '#16a34a', description: '1 Syawal — Lebaran!' },
  { hijriMonth: 12, hijriDay: 9,  name: 'Hari Arafah',          color: '#ea580c', description: 'Wukuf di Arafah, puasa sunnah' },
  { hijriMonth: 12, hijriDay: 10, name: 'Idul Adha 🐑',          color: '#16a34a', description: '10 Dzulhijjah — Hari raya Kurban' },
  { hijriMonth: 12, hijriDay: 11, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq (11 Dzulhijjah)' },
  { hijriMonth: 12, hijriDay: 12, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq (12 Dzulhijjah)' },
  { hijriMonth: 12, hijriDay: 13, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq (13 Dzulhijjah)' },
];

// Fix color typo
ISLAMIC_EVENTS.find(e => e.hijriDay === 27 && e.hijriMonth === 9)!.color = '#f59e0b';

const DAYS_ID = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
const MONTHS_ID = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay();
}

export default function KalenderPage() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(today.getFullYear());
  const [viewMonth, setViewMonth] = useState(today.getMonth());
  const [selectedDate, setSelectedDate] = useState<Date | null>(today);

  const todayHijri = gregorianToHijri(today);

  const daysInMonth = getDaysInMonth(viewYear, viewMonth);
  const firstDay = getFirstDayOfMonth(viewYear, viewMonth);

  // Build calendar grid
  const cells = useMemo(() => {
    const result: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) result.push(null);
    for (let d = 1; d <= daysInMonth; d++) result.push(new Date(viewYear, viewMonth, d));
    return result;
  }, [viewYear, viewMonth, daysInMonth, firstDay]);

  function getEventsForDate(date: Date): IslamicEvent[] {
    const h = gregorianToHijri(date);
    return ISLAMIC_EVENTS.filter(e => e.hijriMonth === h.month && e.hijriDay === h.day);
  }

  function prevMonth() {
    if (viewMonth === 0) { setViewYear(y => y - 1); setViewMonth(11); }
    else setViewMonth(m => m - 1);
  }
  function nextMonth() {
    if (viewMonth === 11) { setViewYear(y => y + 1); setViewMonth(0); }
    else setViewMonth(m => m + 1);
  }
  function goToday() { setViewYear(today.getFullYear()); setViewMonth(today.getMonth()); setSelectedDate(today); }

  const selectedHijri = selectedDate ? gregorianToHijri(selectedDate) : null;
  const selectedEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  // All events this month across Gregorian days
  const monthEvents = cells
    .filter((d): d is Date => d !== null)
    .flatMap(d => getEventsForDate(d).map(e => ({ date: d, event: e })));

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-xl font-semibold text-slate-900">Kalender Hijriah</h1>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-2xl space-y-5">
        {/* Today's Hijri date */}
        <div className="glass-panel rounded-[1.5rem] p-5 flex items-center justify-between">
          <div>
            <p className="text-xs text-slate-500 uppercase tracking-widest">Hari ini</p>
            <p className="mt-1 text-lg font-bold text-slate-900">
              {todayHijri.day} {HIJRI_MONTHS[todayHijri.month - 1]} {todayHijri.year} H
            </p>
            <p className="font-arabic text-right text-xl mt-0.5 text-teal-600" dir="rtl">
              {todayHijri.day} {HIJRI_MONTHS_AR[todayHijri.month - 1]} {todayHijri.year}
            </p>
          </div>
          <button onClick={goToday} className="glass-subtle rounded-2xl px-4 py-2 text-sm font-medium text-teal-600 hover:bg-teal-50/60 transition">
            Hari ini
          </button>
        </div>

        {/* Calendar */}
        <div className="glass-panel rounded-[1.5rem] p-5">
          {/* Nav */}
          <div className="mb-5 flex items-center justify-between">
            <button onClick={prevMonth} className="glass-subtle flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-white/60 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </button>
            <div className="text-center">
              <p className="text-base font-semibold text-slate-900">{MONTHS_ID[viewMonth]} {viewYear}</p>
            </div>
            <button onClick={nextMonth} className="glass-subtle flex h-9 w-9 items-center justify-center rounded-xl text-slate-600 hover:bg-white/60 transition">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
            </button>
          </div>

          {/* Day headers */}
          <div className="mb-2 grid grid-cols-7 text-center">
            {DAYS_ID.map(d => (
              <p key={d} className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">{d}</p>
            ))}
          </div>

          {/* Cells */}
          <div className="grid grid-cols-7 gap-1">
            {cells.map((date, i) => {
              if (!date) return <div key={`e-${i}`} />;
              const events = getEventsForDate(date);
              const isToday = date.toDateString() === today.toDateString();
              const isSelected = selectedDate?.toDateString() === date.toDateString();
              const h = gregorianToHijri(date);
              return (
                <button
                  key={date.toISOString()}
                  onClick={() => setSelectedDate(date)}
                  className={`relative flex flex-col items-center rounded-xl py-1.5 transition hover:scale-105 ${
                    isSelected ? 'bg-teal-600 text-white' :
                    isToday ? 'bg-teal-100/60 text-teal-700' :
                    'text-slate-700 hover:bg-white/50'
                  }`}
                >
                  <span className={`text-sm font-semibold leading-tight ${isSelected ? 'text-white' : ''}`}>{date.getDate()}</span>
                  <span className={`text-[9px] leading-tight ${isSelected ? 'text-teal-200' : 'text-slate-400'}`}>{h.day}</span>
                  {/* Event dots */}
                  {events.length > 0 && (
                    <div className="mt-0.5 flex gap-0.5">
                      {events.slice(0, 3).map((ev, ei) => (
                        <span
                          key={ei}
                          className="h-1 w-1 rounded-full"
                          style={{ backgroundColor: isSelected ? '#fff' : ev.color }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected date detail */}
        {selectedDate && (
          <div className="glass-panel rounded-[1.5rem] p-5">
            <div className="mb-3 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  {selectedDate.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                {selectedHijri && (
                  <p className="text-xs text-teal-600 mt-0.5">
                    {selectedHijri.day} {HIJRI_MONTHS[selectedHijri.month - 1]} {selectedHijri.year} H
                  </p>
                )}
              </div>
            </div>
            {selectedEvents.length > 0 ? (
              <div className="space-y-2">
                {selectedEvents.map((ev, i) => (
                  <div key={i} className="flex items-start gap-3 rounded-xl p-3" style={{ backgroundColor: ev.color + '18' }}>
                    <div className="mt-0.5 h-3 w-3 flex-shrink-0 rounded-full" style={{ backgroundColor: ev.color }} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: ev.color }}>{ev.name}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{ev.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-400">Tidak ada hari penting</p>
            )}
          </div>
        )}

        {/* Events this month */}
        {monthEvents.length > 0 && (
          <div className="glass-panel rounded-[1.5rem] p-5">
            <h3 className="mb-3 text-sm font-semibold text-slate-700">Hari Penting Bulan Ini</h3>
            <div className="space-y-2">
              {monthEvents.map(({ date, event }, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedDate(date)}
                  className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-white/50"
                >
                  <div
                    className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
                    style={{ backgroundColor: event.color }}
                  >
                    {date.getDate()}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{event.name}</p>
                    <p className="text-xs text-slate-500">
                      {date.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'short' })}
                    </p>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Legend */}
        <div className="glass-subtle rounded-2xl px-4 py-3 text-xs text-slate-400">
          * Tanggal Hijriah bersifat perkiraan berdasarkan kalkulasi astronomis. Penetapan resmi bergantung pada ru'yatul hilal.
        </div>
      </div>
    </div>
  );
}
