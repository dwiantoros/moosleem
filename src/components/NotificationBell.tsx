'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  AZAN_REMINDER_EVENT,
  AzanReminderSnapshot,
  broadcastAzanReminderState,
  readAzanReminderSnapshot,
  writeAzanReminderEnabled,
  DAILY_INSPIRATION_NOTIF_EVENT,
  getDailyInspirationNotifications,
  deleteDailyInspirationNotif,
  DailyInspirationNotif,
} from '@/utils/azanReminder';

// ── Hijri conversion ─────────────────────────────────────────────────────────
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

export default function NotificationBell() {
  const [bellOpen, setBellOpen] = useState(false);
  const [reminderOn, setReminderOn] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(false);
  const [inspirationNotifs, setInspirationNotifs] = useState<DailyInspirationNotif[]>([]);
  const panelRef = useRef<HTMLDivElement>(null);

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
  const hasAnyNotif = inspirationNotifs.length > 0;

  const handleDeleteInspiration = (date: string, e: React.MouseEvent) => {
    e.stopPropagation();
    deleteDailyInspirationNotif(date);
  };

  useEffect(() => {
    const syncSnapshot = () => {
      const snapshot = readAzanReminderSnapshot();
      setReminderOn(snapshot.enabled);
      setPermission(snapshot.permission === 'unsupported' ? 'default' : snapshot.permission);
    };
const syncInspirationNotifs = () => {
      setInspirationNotifs(getDailyInspirationNotifications());
    };

    setMounted(true);
    setIsDark(document.documentElement.classList.contains('dark'));

    const obs = new MutationObserver(() =>
      setIsDark(document.documentElement.classList.contains('dark'))
    );
    obs.observe(document.documentElement, { attributeFilter: ['class'] });

    syncSnapshot();
    syncInspirationNotifs();

    const onReminderChanged = (event: Event) => {
      const custom = event as CustomEvent<AzanReminderSnapshot>;
      if (custom.detail) {
        setReminderOn(custom.detail.enabled);
        setPermission(custom.detail.permission === 'unsupported' ? 'default' : custom.detail.permission);
        return;
      }
      syncSnapshot();
    };

    const onInspirationUpdate = (event: Event) => {
      const custom = event as CustomEvent<DailyInspirationNotif[]>;
      if (custom.detail) {
        setInspirationNotifs(custom.detail);
      } else {
        syncInspirationNotifs();
      }
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        syncSnapshot();
        syncInspirationNotifs();
      }
    };

    window.addEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
    window.addEventListener(DAILY_INSPIRATION_NOTIF_EVENT, onInspirationUpdate as EventListener);
    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      obs.disconnect();
      window.removeEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
      window.removeEventListener(DAILY_INSPIRATION_NOTIF_EVENT, onInspirationUpdate as EventListener);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

  // Close on outside click
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

  const handleReminderToggle = async () => {
    if (!('Notification' in window)) return;
    const perm = Notification.permission;
    if (perm === 'denied') return;
    if (perm === 'default') {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result === 'granted') {
        const snapshot = writeAzanReminderEnabled(true);
        setReminderOn(snapshot.enabled);
        broadcastAzanReminderState(snapshot);
      }
      return;
    }
    const next = !reminderOn;
    setReminderOn(next);
    broadcastAzanReminderState(writeAzanReminderEnabled(next));
  };

  if (!mounted) return (
    <div className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full" />
  );

  const isActive = reminderOn && permission === 'granted';

  return (
    <div className="relative" ref={panelRef}>
      {bellOpen && (
        <div
          className={`fixed inset-0 z-40 backdrop-blur-[3px] ${
            isDark ? 'bg-slate-950/35' : 'bg-slate-900/18'
          }`}
          onClick={() => setBellOpen(false)}
        />
      )}

      <button
        onClick={() => setBellOpen(v => !v)}
        aria-label="Notifikasi"
        className={`glass-subtle relative z-50 flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/60 ${bellOpen ? 'text-teal-600' : 'text-slate-700 dark:text-slate-300'}`}
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9Z" />
          <path d="M10 19a2 2 0 0 0 4 0" />
        </svg>
        {hasToday && !isActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-rose-500" />
        )}
        {isActive && (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-teal-500" />
        )}
      </button>

      <div
        className="fixed right-4 top-20 z-50 flex w-[min(92vw,360px)] min-h-[320px] max-h-[80vh] flex-col overflow-y-auto rounded-[1.6rem] p-4 shadow-2xl transition-all duration-300"
        style={{
          transform: bellOpen ? 'translateX(0)' : 'translateX(115%)',
          opacity: bellOpen ? 1 : 0,
          pointerEvents: bellOpen ? 'auto' : 'none',
          background: isDark
            ? 'rgba(8,16,30,0.94)'
            : 'rgba(248,252,255,0.97)',
          backdropFilter: 'blur(28px) saturate(155%)',
          WebkitBackdropFilter: 'blur(28px) saturate(155%)',
          border: isDark
            ? '1px solid rgba(255,255,255,0.1)'
            : '1px solid rgba(255,255,255,0.9)',
          boxShadow: isDark
            ? '0 24px 60px rgba(0,0,0,0.45), inset 0 1px 0 rgba(255,255,255,0.06)'
            : '0 24px 60px rgba(15,23,42,0.2), inset 0 1px 0 rgba(255,255,255,0.95)',
        }}
      >
          {/* Header + toggle */}
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

          {/* Daily Inspirations */}
          {inspirationNotifs.length > 0 ? (
            <div className="mb-4 rounded-xl border border-white/20 bg-white/[0.04] p-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">✨ Inspirasi Harian</p>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {inspirationNotifs.map(({ date, arabic, translation, reference }) => (
                  <div
                    key={date}
                    className="rounded-xl px-3 py-2.5"
                    style={{
                      backgroundColor: 'rgba(168,85,247,0.08)',
                      border: '1px solid rgba(168,85,247,0.2)',
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-right font-arabic text-[0.9rem] leading-[1.6] text-slate-900 dark:text-slate-100" dir="rtl">
                          {arabic}
                        </p>
                        <p className="mt-1.5 text-xs leading-[1.5] text-slate-600 dark:text-slate-400">
                          {translation}
                        </p>
                        <p className="mt-1 text-[10px] text-slate-500">{reference}</p>
                      </div>
                      <button
                        onClick={(e) => handleDeleteInspiration(date, e)}
                        aria-label="Hapus notifikasi inspirasi"
                        className="flex-shrink-0 rounded-lg p-1 text-slate-400 transition hover:bg-white/20 hover:text-slate-600 dark:hover:text-slate-300"
                      >
                        <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                          <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}

          {permission === 'denied' && (
            <p className="mb-3 rounded-xl bg-red-50 px-3 py-2 text-xs text-red-700">
              Notifikasi diblokir. Buka Pengaturan browser untuk mengizinkan.
            </p>
          )}

          {/* Upcoming events */}
          {upcoming.length > 0 ? (
            <div className="rounded-xl border border-white/20 bg-white/[0.04] p-2.5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Event Hijriah</p>
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
            </div>
          ) : (
            <div className="rounded-xl border border-white/20 bg-white/[0.04] px-3 py-4 text-center">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-400">Event Hijriah</p>
              <p className="text-xs text-slate-500">Tidak ada event Hijriah dalam 3 hari ke depan</p>
            </div>
          )}

          <div className="mt-auto border-t border-white/30 pt-3">
            <p className="text-[11px] text-slate-400">
              {isActive
                ? '✓ Kamu akan dapat notifikasi adzan & event Hijriah'
                : 'Aktifkan untuk notifikasi adzan & event Hijriah'}
            </p>
          </div>
      </div>
    </div>
  );
}
