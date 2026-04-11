'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';

// ── Hijri conversion (same algorithm as AzanReminder) ───────────────────────
function gregorianToHijri(gDate: Date): { month: number; day: number } {
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
  return { month, day };
}

const EVENTS = [
  { hijriMonth: 1,  hijriDay: 1,  name: 'Tahun Baru Hijriah 🌙',  desc: 'Selamat Tahun Baru Islam! Semoga tahun ini penuh berkah.' },
  { hijriMonth: 1,  hijriDay: 10, name: 'Hari Asyura',             desc: 'Hari Asyura — puasa sunnah hari ini sangat dianjurkan.' },
  { hijriMonth: 3,  hijriDay: 12, name: 'Maulid Nabi ﷺ',           desc: 'Peringatan hari lahir Rasulullah ﷺ. Perbanyak shalawat.' },
  { hijriMonth: 7,  hijriDay: 27, name: "Isra' Mi'raj 🕌",          desc: "Peringatan perjalanan malam Nabi ﷺ ke Sidratul Muntaha." },
  { hijriMonth: 8,  hijriDay: 15, name: "Nisfu Sya'ban 🌕",         desc: "Malam nisfu Sya'ban — perbanyak doa dan ibadah malam ini." },
  { hijriMonth: 9,  hijriDay: 1,  name: 'Awal Ramadan 🌙',          desc: 'Marhaban ya Ramadan! Mulai puasa hari ini.' },
  { hijriMonth: 9,  hijriDay: 17, name: 'Nuzulul Quran 📖',         desc: 'Peringatan turunnya Al-Quran. Perbanyak tilawah hari ini.' },
  { hijriMonth: 9,  hijriDay: 21, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-21 Ramadan — kemungkinan Lailatul Qadar!' },
  { hijriMonth: 9,  hijriDay: 23, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-23 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9,  hijriDay: 25, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-25 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9,  hijriDay: 27, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-27 Ramadan — malam yang paling utama!' },
  { hijriMonth: 9,  hijriDay: 29, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-29 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 10, hijriDay: 1,  name: 'Idul Fitri 🎉',            desc: 'Allahu Akbar! Selamat Hari Raya Idul Fitri.' },
  { hijriMonth: 12, hijriDay: 9,  name: 'Hari Arafah 🕋',           desc: 'Hari Arafah — puasa sunnah yang sangat dianjurkan hari ini.' },
  { hijriMonth: 12, hijriDay: 10, name: 'Idul Adha 🐑',             desc: 'Selamat Hari Raya Idul Adha 10 Dzulhijjah. Allahu Akbar!' },
];

export default function PageHeaderActions() {
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [bellOpen, setBellOpen] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const panelRef = useRef<HTMLDivElement>(null);

  // Upcoming events: today + next 3 days
  const upcoming = useMemo(() => {
    const now = new Date();
    const result: Array<{ name: string; desc: string; daysUntil: number }> = [];
    for (let d = 0; d <= 3; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const h = gregorianToHijri(date);
      EVENTS.filter(e => e.hijriMonth === h.month && e.hijriDay === h.day)
        .forEach(e => result.push({ ...e, daysUntil: d }));
    }
    return result;
  }, []);

  const hasToday = upcoming.some(e => e.daysUntil === 0);

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'));
    setMounted(true);

    // Sync dark mode
    const obs = new MutationObserver(() =>
      setDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });

    // Sync reminder state from localStorage
    if ('Notification' in window) {
      setPermission(Notification.permission);
      const saved = localStorage.getItem('azanReminderEnabled');
      if (Notification.permission === 'granted' && saved === 'true') setReminderOn(true);
    }

    return () => obs.disconnect();
  }, []);

  // Close panel on outside click
  useEffect(() => {
    if (!bellOpen) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setBellOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [bellOpen]);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  const handleReminderToggle = async () => {
    if (!('Notification' in window)) return;
    const perm = Notification.permission;
    if (perm === 'denied') return;
    if (perm === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        setReminderOn(true);
        localStorage.setItem('azanReminderEnabled', 'true');
      }
      return;
    }
    const next = !reminderOn;
    setReminderOn(next);
    localStorage.setItem('azanReminderEnabled', String(next));
  };

  if (!mounted) return <div className="flex items-center gap-1.5 w-[108px]" />;

  const isActive = reminderOn && permission === 'granted';

  return (
    <div className="relative flex items-center gap-1.5" ref={panelRef}>
      {/* Dark mode toggle */}
      <button
        onClick={toggleTheme}
        aria-label="Toggle dark mode"
        className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300"
      >
        {dark ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
            <circle cx="12" cy="12" r="4.5" />
            <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" />
          </svg>
        )}
      </button>

      {/* Search */}
      <Link
        href="/search"
        aria-label="Cari"
        className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
          <circle cx="11" cy="11" r="6.5" />
          <path d="m16 16 4 4" />
        </svg>
      </Link>

      {/* Bell — opens notification panel */}
      <button
        onClick={() => setBellOpen(v => !v)}
        aria-label="Notifikasi"
        className={`glass-subtle relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/60 ${bellOpen ? 'text-teal-600' : 'text-slate-700 dark:text-slate-300'}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {/* Red dot badge when there's a today event and reminder is off */}
        {hasToday && !isActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        )}
        {/* Teal dot when reminder is active */}
        {isActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-500" />
        )}
      </button>

      {/* Dropdown panel */}
      {bellOpen && (
        <div className="glass-panel absolute right-0 top-12 z-50 w-80 rounded-[1.5rem] p-4 shadow-xl">
          {/* Header + reminder toggle */}
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">Notifikasi</h3>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {permission === 'denied' ? '⚠️ Diblokir' : isActive ? 'Aktif' : 'Nonaktif'}
              </span>
              <button
                disabled={permission === 'denied'}
                onClick={handleReminderToggle}
                aria-label={isActive ? 'Matikan reminder' : 'Aktifkan reminder'}
                className={`relative inline-flex h-6 w-10 flex-shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${isActive ? 'bg-teal-600' : 'bg-slate-300 dark:bg-slate-600'}`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>
          </div>

          {permission === 'denied' && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              Notifikasi diblokir. Buka Pengaturan browser untuk mengizinkan.
            </p>
          )}

          {/* Upcoming events */}
          {upcoming.length > 0 ? (
            <div className="space-y-2">
              {upcoming.map(({ name, desc, daysUntil }, i) => (
                <div
                  key={i}
                  className="rounded-xl px-3 py-2.5"
                  style={{
                    backgroundColor: daysUntil === 0 ? 'rgba(250,204,21,0.13)' : 'rgba(250,204,21,0.07)',
                    border: `1px solid rgba(250,204,21,${daysUntil === 0 ? '0.3' : '0.15'})`,
                  }}
                >
                  <p className="text-xs font-semibold" style={{ color: '#d97706' }}>
                    {daysUntil === 0 ? '🗓 Hari ini' : daysUntil === 1 ? '🌙 Besok' : `📅 ${daysUntil} hari lagi`}
                    {' — '}{name}
                  </p>
                  <p className="mt-0.5 text-xs" style={{ color: '#92400e', opacity: 0.85 }}>{desc}</p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 px-3 py-4 text-center dark:bg-white/5">
              <p className="text-xs text-slate-500">Tidak ada event Hijriah dalam 3 hari ke depan</p>
            </div>
          )}

          <div className="mt-3 border-t border-white/30 pt-3">
            <p className="text-[11px] text-slate-400">
              {isActive ? '✓ Kamu akan dapat notifikasi adzan & event Hijriah' : 'Aktifkan untuk notifikasi adzan & event Hijriah'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
