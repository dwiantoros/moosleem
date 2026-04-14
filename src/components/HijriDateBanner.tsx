'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import { DEFAULT_KEMENAG_TIMEZONE, getDateAtMidnightInTimeZone } from '@/utils/indonesiaTime';

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

interface IslamicEvent {
  hijriMonth: number;
  hijriDay: number;
  name: string;
  color: string;
  description: string;
  emoji: string;
}

const ISLAMIC_EVENTS: IslamicEvent[] = [
  { hijriMonth: 1,  hijriDay: 1,  name: 'Tahun Baru Hijriah',   color: '#0d9488', description: 'Awal tahun baru Islam',                          emoji: '🌙' },
  { hijriMonth: 1,  hijriDay: 9,  name: 'Puasa Tasu\'a',        color: '#7c3aed', description: 'Puasa sunnah Tasu\'a (9 Muharram)',               emoji: '🌿' },
  { hijriMonth: 1,  hijriDay: 10, name: 'Hari Asyura',          color: '#7c3aed', description: 'Puasa sunnah Asyura sangat dianjurkan',           emoji: '🌿' },
  { hijriMonth: 3,  hijriDay: 12, name: 'Maulid Nabi ﷺ',        color: '#b45309', description: 'Peringatan lahirnya Rasulullah ﷺ',               emoji: '⭐' },
  { hijriMonth: 7,  hijriDay: 27, name: "Isra' Mi'raj",         color: '#0369a1', description: "Perjalanan malam Nabi ﷺ ke Sidratul Muntaha",    emoji: '🕌' },
  { hijriMonth: 8,  hijriDay: 15, name: "Nisfu Sya'ban",        color: '#9333ea', description: "Malam pertengahan Sya'ban, perbanyak ibadah",    emoji: '🌕' },
  { hijriMonth: 9,  hijriDay: 1,  name: 'Awal Ramadan',         color: '#0891b2', description: 'Mulai puasa Ramadan — Marhaban ya Ramadan!',     emoji: '🌙' },
  { hijriMonth: 9,  hijriDay: 17, name: 'Nuzulul Quran',        color: '#0d9488', description: 'Peringatan turunnya Al-Quran',                   emoji: '📖' },
  { hijriMonth: 9,  hijriDay: 21, name: 'Lailatul Qadar',       color: '#f59e0b', description: 'Malam ke-21 Ramadan (mungkin Lailatul Qadar)',   emoji: '✨' },
  { hijriMonth: 9,  hijriDay: 23, name: 'Lailatul Qadar',       color: '#f59e0b', description: 'Malam ke-23 Ramadan',                            emoji: '✨' },
  { hijriMonth: 9,  hijriDay: 25, name: 'Lailatul Qadar',       color: '#f59e0b', description: 'Malam ke-25 Ramadan',                            emoji: '✨' },
  { hijriMonth: 9,  hijriDay: 27, name: 'Lailatul Qadar',       color: '#f59e0b', description: 'Malam ke-27 Ramadan — malam paling utama!',     emoji: '✨' },
  { hijriMonth: 9,  hijriDay: 29, name: 'Lailatul Qadar',       color: '#f59e0b', description: 'Malam ke-29 Ramadan',                            emoji: '✨' },
  { hijriMonth: 10, hijriDay: 1,  name: 'Idul Fitri',           color: '#16a34a', description: '1 Syawal — Selamat Hari Raya! Minal Aidin.',     emoji: '🎉' },
  { hijriMonth: 12, hijriDay: 9,  name: 'Hari Arafah',          color: '#ea580c', description: 'Wukuf di Arafah — puasa sunnah terbaik!',        emoji: '🕋' },
  { hijriMonth: 12, hijriDay: 10, name: 'Idul Adha',            color: '#16a34a', description: '10 Dzulhijjah — Hari raya Kurban',               emoji: '🐑' },
  { hijriMonth: 12, hijriDay: 11, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq ke-1 (11 Dzulhijjah)',               emoji: '🔴' },
  { hijriMonth: 12, hijriDay: 12, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq ke-2 (12 Dzulhijjah)',               emoji: '🔴' },
  { hijriMonth: 12, hijriDay: 13, name: 'Hari Tasyriq',         color: '#dc2626', description: 'Hari Tasyriq ke-3 (13 Dzulhijjah)',               emoji: '🔴' },
];

// Ayyamul Bidh — 13, 14, 15 setiap bulan (sunnah puasa)
const AYYAMUL_BIDH_DAYS = [13, 14, 15];

interface HijriDateBannerProps {
  timezone?: string;
}

export default function HijriDateBanner({ timezone = DEFAULT_KEMENAG_TIMEZONE }: HijriDateBannerProps) {
  const { hijri, todayEvents, isTomorrow } = useMemo(() => {
    const today = getDateAtMidnightInTimeZone(new Date(), timezone);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const hijri = gregorianToHijri(today);
    const tomorrowHijri = gregorianToHijri(tomorrow);

    const todayEvents = ISLAMIC_EVENTS.filter(e =>
      e.hijriMonth === hijri.month && e.hijriDay === hijri.day
    );

    // Also flag Ayyamul Bidh
    const isAyyamulBidh = AYYAMUL_BIDH_DAYS.includes(hijri.day);
    if (isAyyamulBidh) {
      todayEvents.push({
        hijriMonth: hijri.month, hijriDay: hijri.day,
        name: 'Ayyamul Bidh', color: '#d97706',
        description: `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1]} — Puasa sunnah Ayyamul Bidh`,
        emoji: '🌼',
      });
    }

    // Check if tomorrow has an event (give heads-up)
    const tomorrowEvents = ISLAMIC_EVENTS.filter(e =>
      e.hijriMonth === tomorrowHijri.month && e.hijriDay === tomorrowHijri.day
    );
    const isTomorrow = tomorrowEvents.length > 0 && todayEvents.length === 0
      ? tomorrowEvents : [];

    return { hijri, todayEvents, isTomorrow };
  }, [timezone]);

  const hijriLabel = `${hijri.day} ${HIJRI_MONTHS[hijri.month - 1]} ${hijri.year} H`;
  const hasEvent = todayEvents.length > 0;
  const hasTomorrow = isTomorrow.length > 0;

  // Pick the primary event color for highlight
  const primaryColor = hasEvent ? todayEvents[0].color : '#0d9488';

  return (
    <Link href="/kalender-hijriah" className="block transition-opacity hover:opacity-90">
      {hasEvent ? (
        /* ── Highlighted: there IS an event today ── */
        <div
          className="relative overflow-hidden rounded-2xl px-4 py-3"
          style={{
            background: `linear-gradient(135deg, ${primaryColor}22 0%, ${primaryColor}10 100%)`,
            border: `1.5px solid ${primaryColor}44`,
          }}
        >
          {/* Subtle glow blob */}
          <div
            className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl"
            style={{ backgroundColor: primaryColor + '33' }}
          />
          <div className="relative flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl text-lg"
                style={{ backgroundColor: primaryColor + '22' }}
              >
                {todayEvents[0].emoji}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em]" style={{ color: primaryColor }}>
                    Hari Ini — {hijriLabel}
                  </p>
                  <span
                    className="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide"
                    style={{ backgroundColor: primaryColor + '22', color: primaryColor }}
                  >
                    Event
                  </span>
                </div>
                <p className="mt-0.5 text-sm font-semibold text-slate-900">
                  {todayEvents.map(e => e.name).join(' • ')}
                </p>
                <p className="mt-0.5 text-xs text-slate-500 leading-relaxed">
                  {todayEvents[0].description}
                </p>
              </div>
            </div>
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 18l6-6-6-6"/>
            </svg>
          </div>
        </div>
      ) : hasTomorrow ? (
        /* ── Soft reminder: event tomorrow ── */
        <div className="flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(148,163,184,0.1)', border: '1px solid rgba(148,163,184,0.2)' }}>
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-slate-100 text-base">
              {isTomorrow[0].emoji}
            </div>
            <div>
              <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                {hijriLabel}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                Besok: <span className="font-semibold">{isTomorrow.map(e => e.name).join(' & ')}</span>
              </p>
            </div>
          </div>
          <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      ) : (
        /* ── Normal day: just show Hijri date ── */
        <div className="flex items-center justify-between rounded-2xl px-4 py-2.5" style={{ backgroundColor: 'rgba(148,163,184,0.08)', border: '1px solid rgba(148,163,184,0.15)' }}>
          <div className="flex items-center gap-2.5">
            <svg className="h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 2v4" />
              <path d="M16 2v4" />
              <rect x="3" y="5" width="18" height="16" rx="2" />
              <path d="M3 10h18" />
            </svg>
            <span className="text-sm font-medium text-slate-600">{hijriLabel}</span>
          </div>
          <span className="ml-4 text-[11px] font-medium text-slate-400">Kalender →</span>
        </div>
      )}
    </Link>
  );
}
