'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { PrayerTimes } from '@/types';

// ── Hijri conversion (for Islamic event notifications) ───────────────────────
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

interface IslamicEventNotif { hijriMonth: number; hijriDay: number; name: string; desc: string; }
const EVENT_NOTIFY: IslamicEventNotif[] = [
  { hijriMonth: 1,  hijriDay: 1,  name: 'Tahun Baru Hijriah 🌙',  desc: 'Selamat Tahun Baru Islam! Semoga tahun ini penuh berkah.' },
  { hijriMonth: 1,  hijriDay: 10, name: 'Hari Asyura',             desc: 'Hari Asyura — puasa sunnah hari ini sangat dianjurkan.' },
  { hijriMonth: 3,  hijriDay: 12, name: 'Maulid Nabi ﷺ',           desc: 'Peringatan hari lahir Rasulullah ﷺ. Perbanyak shalawat.' },
  { hijriMonth: 7,  hijriDay: 27, name: "Isra' Mi'raj 🕌",          desc: "Peringatan perjalanan malam Nabi ﷺ ke Sidratul Muntaha." },
  { hijriMonth: 8,  hijriDay: 15, name: "Nisfu Sya'ban 🌕",         desc: "Malam nisfu Sya'ban — perbanyak doa dan ibadah malam ini." },
  { hijriMonth: 9,  hijriDay: 1,  name: 'Awal Ramadan 🌙',          desc: 'Marhaban ya Ramadan! Mulai puasa hari ini. Semoga diberkahi.' },
  { hijriMonth: 9,  hijriDay: 17, name: 'Nuzulul Quran 📖',         desc: 'Peringatan turunnya Al-Quran. Perbanyak tilawah hari ini.' },
  { hijriMonth: 9,  hijriDay: 21, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-21 Ramadan — kemungkinan Lailatul Qadar. Tingkatkan ibadah!' },
  { hijriMonth: 9,  hijriDay: 23, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-23 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9,  hijriDay: 25, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-25 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9,  hijriDay: 27, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-27 Ramadan — malam yang paling utama! Jangan lewatkan.' },
  { hijriMonth: 9,  hijriDay: 29, name: 'Lailatul Qadar ✨',        desc: 'Malam ke-29 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 10, hijriDay: 1,  name: 'Idul Fitri 🎉',            desc: 'Allahu Akbar! Selamat Hari Raya Idul Fitri. Minal aidin wal faizin.' },
  { hijriMonth: 12, hijriDay: 9,  name: 'Hari Arafah 🕋',           desc: 'Hari Arafah — puasa sunnah yang sangat dianjurkan hari ini.' },
  { hijriMonth: 12, hijriDay: 10, name: 'Idul Adha 🐑',             desc: 'Selamat Hari Raya Idul Adha 10 Dzulhijjah. Allahu Akbar!' },
];

// Only schedule fard prayers (not Sunrise/Sunset)
const NOTIFY_PRAYERS: Array<keyof PrayerTimes> = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'Subuh', Dhuhr: 'Dzuhur', Asr: 'Ashar', Maghrib: 'Maghrib', Isha: "Isya'",
};
const PRAYER_ARABIC: Record<string, string> = {
  Fajr: 'الفجر', Dhuhr: 'الظهر', Asr: 'العصر', Maghrib: 'المغرب', Isha: 'العشاء',
};
const MINUTES_BEFORE = 10;

interface AzanReminderProps {
  prayerTimes: PrayerTimes | null;
  nextPrayer: { name: string; time: string; minutesUntil: number } | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

function parsePrayerMs(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d.getTime();
}

// ── Synthesized adhan chime (Web Audio API, no external file needed) ─────────
// ── Azan audio — tries local file first, then CDN, then synth fallback ───────
// Drop your own MP3 in public/azan.mp3 to override CDN
const AZAN_URLS = [
  '/azan.mp3',
  'https://ia802609.us.archive.org/13/items/AzanMakkah/AzanMakkah.mp3',
  'https://ia800202.us.archive.org/17/items/AdhanazeazanAzan/Adan.mp3',
];

let azanAudio: HTMLAudioElement | null = null;
let azanLoadPromise: Promise<HTMLAudioElement | null> | null = null;

async function loadAzanAudio(): Promise<HTMLAudioElement | null> {
  // Only attempt load once — reuse the same promise
  if (azanLoadPromise) return azanLoadPromise;
  azanLoadPromise = (async () => {
    for (const url of AZAN_URLS) {
      try {
        const audio = new Audio();
        audio.src = url;
        audio.preload = 'auto';
        // Just try to play directly — most reliable signal vs canplaythrough
        await audio.play();
        audio.pause();
        audio.currentTime = 0;
        azanAudio = audio;
        return audio;
      } catch { /* try next URL */ }
    }
    return null; // all failed → use synth fallback
  })();
  return azanLoadPromise;
}

// Synthesized fallback — bell chime via Web Audio API
let audioCtxRef: AudioContext | null = null;
function playSynthChime(isShort = false) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    if (!audioCtxRef || audioCtxRef.state === 'closed') audioCtxRef = new AudioCtx();
    const ctx = audioCtxRef;
    if (ctx.state === 'suspended') ctx.resume();
    const t = ctx.currentTime;
    const bell = (freq: number, start: number, dur: number, vol = 0.28) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); osc2.connect(gain); gain.connect(ctx.destination);
      osc.type = 'sine'; osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);
      osc2.frequency.setValueAtTime(freq * 2.756, t + start);
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(vol, t + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + dur);
      osc.start(t + start); osc.stop(t + start + dur);
      osc2.start(t + start); osc2.stop(t + start + dur);
    };
    if (!isShort) {
      const r = 220;
      bell(r,        0.00, 2.5, 0.30); bell(r * 1.25, 2.70, 2.0, 0.28);
      bell(r * 1.50, 4.80, 2.5, 0.28); bell(r * 1.33, 7.40, 2.0, 0.26);
      bell(r * 1.00, 9.50, 3.5, 0.30);
    } else {
      bell(440, 0.0, 1.5, 0.22); bell(550, 1.7, 1.2, 0.20); bell(440, 3.0, 2.0, 0.22);
    }
  } catch { /* silent fail */ }
}

async function playAzanSound(type: 'azan' | 'before' | 'test' = 'azan') {
  const isShort = type === 'before';
  try {
    // Always use full adzan audio for azan + test; short synth for before-reminder
    if (!isShort) {
      // azanAudio is already loaded if loadAzanAudio() was previously called
      const audio = azanAudio ?? await loadAzanAudio();
      if (audio) {
        audio.currentTime = 0;
        await audio.play();
        return;
      }
      playSynthChime(false); // fallback
    } else {
      // Short reminder — just synth chime (avoids playing full 5-min azan 10min before)
      playSynthChime(true);
    }
  } catch { playSynthChime(isShort); }
}



// ── Reliable notification via SW → fallback to Notification API ─────────────
async function sendNotification(title: string, options: NotificationOptions): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) { await reg.showNotification(title, options); return; }
      const newReg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;
      await newReg.showNotification(title, options);
      return;
    }
  } catch {
    // fall through to Notification API
  }
  new Notification(title, options);
}

export default function AzanReminder({ prayerTimes, nextPrayer, enabled, onToggle }: AzanReminderProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [scheduledPrayers, setScheduledPrayers] = useState<string[]>([]);
  const [testSent, setTestSent] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // Upcoming Hijri events (today + next 3 days) — always shown regardless of reminder state
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const result: Array<{ ev: IslamicEventNotif; daysUntil: number }> = [];
    for (let d = 0; d <= 3; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const hijri = gregorianToHijri(date);
      EVENT_NOTIFY
        .filter(e => e.hijriMonth === hijri.month && e.hijriDay === hijri.day)
        .forEach(ev => result.push({ ev, daysUntil: d }));
    }
    return result;
  }, []);

  // Init: detect support, register SW, sync permission, restore toggle, maybe show prompt
  useEffect(() => {
    if (!('Notification' in window)) return;
    setSupported(true);
    setPermission(Notification.permission);

    // Pre-register SW so it's ready when notifications arrive
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {/* non-critical */});
    }

    // Sync permission when user switches back to tab
    const syncPerm = () => setPermission(Notification.permission);
    document.addEventListener('visibilitychange', syncPerm);

    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem('azanPromptDismissed');
      if (!dismissed) setTimeout(() => setShowPrompt(true), 900);
    }

    // Restore saved enabled state (only honour if permission still granted)
    if (Notification.permission === 'granted') {
      const saved = localStorage.getItem('azanReminderEnabled');
      if (saved === 'true') onToggle(true);
    }
    // Restore sound preference
    const savedSound = localStorage.getItem('azanSoundEnabled');
    if (savedSound === 'false') setSoundEnabled(false);

    return () => document.removeEventListener('visibilitychange', syncPerm);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Clear all scheduled timeouts
  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
    setScheduledPrayers([]);
  }, []);

  // Schedule setTimeout for each prayer that hasn't passed yet
  const scheduleAll = useCallback((times: PrayerTimes, withSound: boolean) => {
    clearTimers();
    if (Notification.permission !== 'granted') return;

    const now = Date.now();
    const scheduled: string[] = [];

    NOTIFY_PRAYERS.forEach((prayer) => {
      const timeStr = times[prayer];
      if (!timeStr) return;
      const prayerMs = parsePrayerMs(timeStr);
      if (!prayerMs) return;
      const msUntil = prayerMs - now;

      // Skip prayers that already passed (allow up to 30s grace)
      if (msUntil <= -30_000) return;

      const label = PRAYER_LABELS[prayer] ?? prayer;
      const arabic = PRAYER_ARABIC[prayer] ?? '';

      // Notification exactly at prayer time
      const atMs = Math.max(msUntil, 0);
      const t1 = setTimeout(() => {
        if (Notification.permission !== 'granted') return;
        if (withSound) playAzanSound('azan');
        sendNotification(`🕌 Allahu Akbar — Waktu ${label}`, {
          body: `Waktu sholat ${label} ${arabic} pukul ${timeStr} telah tiba. Allahu Akbar!`,
          icon: '/icon-192.png',
          tag: `azan-at-${prayer}`,
          requireInteraction: true,
          silent: false,
        });
      }, atMs);
      timersRef.current.push(t1);
      scheduled.push(prayer);

      // Notification MINUTES_BEFORE minutes before
      const beforeMs = msUntil - MINUTES_BEFORE * 60_000;
      if (beforeMs > 0) {
        const t2 = setTimeout(() => {
          if (Notification.permission !== 'granted') return;
          if (withSound) playAzanSound('before');
          sendNotification(`⏰ ${label} dalam ${MINUTES_BEFORE} menit`, {
            body: `Bersiaplah untuk sholat ${label}. Waktu masuk pukul ${timeStr}.`,
            icon: '/icon-192.png',
            tag: `azan-before-${prayer}`,
            silent: false,
          });
        }, beforeMs);
        timersRef.current.push(t2);
      }
    });

    setScheduledPrayers(scheduled);
  }, [clearTimers]);

  // Schedule Islamic calendar event notifications (today at 8am, tomorrow reminder at 8pm)
  const scheduleIslamicEvents = useCallback(() => {
    if (Notification.permission !== 'granted') return;
    const now = new Date();
    const nowMs = now.getTime();
    const todayHijri = gregorianToHijri(now);
    const tomorrowDate = new Date(now); tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowHijri = gregorianToHijri(tomorrowDate);

    const todayEvts = EVENT_NOTIFY.filter(e => e.hijriMonth === todayHijri.month && e.hijriDay === todayHijri.day);
    const tomorrowEvts = EVENT_NOTIFY.filter(e => e.hijriMonth === tomorrowHijri.month && e.hijriDay === tomorrowHijri.day);

    // Today events: fire at 8:00 AM (or immediately if already past 8am)
    todayEvts.forEach((ev) => {
      const at8am = new Date(now); at8am.setHours(8, 0, 0, 0);
      const delay = Math.max(at8am.getTime() - nowMs, 2000);
      const t = setTimeout(() => {
        if (Notification.permission !== 'granted') return;
        sendNotification(`📅 ${ev.name}`, {
          body: ev.desc,
          icon: '/icon-192.png',
          tag: `islamic-event-today-${ev.hijriMonth}-${ev.hijriDay}`,
          requireInteraction: false,
        });
      }, delay);
      timersRef.current.push(t);
    });

    // Tomorrow events: remind at 8:00 PM today
    tomorrowEvts.forEach((ev) => {
      const at8pm = new Date(now); at8pm.setHours(20, 0, 0, 0);
      const delay = at8pm.getTime() - nowMs;
      if (delay <= 0) return;
      const t = setTimeout(() => {
        if (Notification.permission !== 'granted') return;
        sendNotification(`🌙 Besok: ${ev.name}`, {
          body: `Besok adalah ${ev.name}. ${ev.desc}`,
          icon: '/icon-192.png',
          tag: `islamic-event-tomorrow-${ev.hijriMonth}-${ev.hijriDay}`,
          requireInteraction: false,
        });
      }, delay);
      timersRef.current.push(t);
    });
  }, []);

  // Reschedule whenever prayerTimes, enabled, permission, or sound changes
  useEffect(() => {
    if (!enabled || !prayerTimes || permission !== 'granted') {
      clearTimers();
      return;
    }
    scheduleAll(prayerTimes, soundEnabled);
    scheduleIslamicEvents();
    return () => clearTimers();
  }, [enabled, prayerTimes, permission, soundEnabled, scheduleAll, scheduleIslamicEvents, clearTimers]);

  const requestPermission = async () => {
    if (!supported) return;
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setShowPrompt(false);
      localStorage.removeItem('azanPromptDismissed');
      onToggle(true);
      localStorage.setItem('azanReminderEnabled', 'true');
    }
  };

  const handleToggle = (next: boolean) => {
    if (next && permission === 'default') {
      requestPermission();
      return;
    }
    onToggle(next);
    localStorage.setItem('azanReminderEnabled', String(next));
    if (!next) clearTimers();
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem('azanPromptDismissed', 'true');
  };

  const enableFromPrompt = () => {
    dismissPrompt();
    requestPermission();
  };

  const sendTest = async () => {
    const livePerm = Notification.permission;
    if (livePerm !== permission) setPermission(livePerm);
    if (livePerm !== 'granted') { requestPermission(); return; }
    if (soundEnabled) await playAzanSound('azan'); // full adzan on user gesture
    await sendNotification('🕌 Test Adzan Reminder', {
      body: `Notifikasi berjalan! Kamu akan diingatkan ${MINUTES_BEFORE} mnt sebelum dan tepat saat waktu sholat.`,
      icon: '/icon-192.png',
      tag: 'azan-test',
      requireInteraction: false,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    localStorage.setItem('azanSoundEnabled', String(next));
    if (next) playAzanSound('azan'); // preview when turning on
  };

  if (!supported) return null;

  const isActive = enabled && permission === 'granted';

  return (
    <>
      {/* Prompt modal */}
      {showPrompt && (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/25 p-4 backdrop-blur-sm sm:items-center">
          <div className="glass-panel w-full max-w-md rounded-[2rem] p-6">
            <div className="mb-5 flex items-start gap-3">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                  <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
                </svg>
              </div>
              <div>
                <h2 className="text-base font-semibold text-slate-900">Aktifkan Adzan Reminder?</h2>
                <p className="mt-0.5 text-sm text-slate-500">
                  Notifikasi {MINUTES_BEFORE} menit sebelum & tepat saat waktu sholat tiba.
                </p>
              </div>
            </div>
            <ul className="mb-5 space-y-1.5 text-xs text-slate-600">
              {['Subuh', 'Dzuhur', 'Ashar', 'Maghrib', "Isya'"].map((p) => (
                <li key={p} className="flex items-center gap-2">
                  <span className="text-teal-500">✓</span> {p}
                </li>
              ))}
            </ul>
            <div className="flex gap-3">
              <button onClick={dismissPrompt} className="glass-subtle flex-1 rounded-xl py-2.5 text-sm font-medium text-slate-600 hover:bg-white/60 transition">Nanti Saja</button>
              <button onClick={enableFromPrompt} className="flex-1 rounded-xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition">Aktifkan</button>
            </div>
          </div>
        </div>
      )}

      {/* Settings card */}
      <div className="glass-panel rounded-[1.75rem] p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`flex h-11 w-11 items-center justify-center rounded-2xl transition-colors ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-400'}`}>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-semibold text-slate-900">Adzan Reminder</h3>
              <p className="text-xs text-slate-500">
                {permission === 'denied'
                  ? '⚠️ Izin notifikasi ditolak browser'
                  : isActive && scheduledPrayers.length > 0
                  ? `✓ ${scheduledPrayers.length} waktu sholat terjadwal hari ini`
                  : `Notifikasi ${MINUTES_BEFORE} menit sebelum & tepat waktu sholat`}
              </p>
            </div>
          </div>

          {/* Toggle switch */}
          <button
            disabled={permission === 'denied'}
            onClick={() => handleToggle(!enabled)}
            aria-label={enabled ? 'Matikan reminder' : 'Aktifkan reminder'}
            className={`relative inline-flex h-7 w-12 flex-shrink-0 items-center rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-40 ${
              isActive ? 'bg-teal-600' : 'bg-slate-300'
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                isActive ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        {/* Upcoming Islamic events — always visible */}
        {upcomingEvents.length > 0 && (
          <div className="mt-4 space-y-2">
            {upcomingEvents.map(({ ev, daysUntil }) => (
              <div
                key={`${ev.hijriMonth}-${ev.hijriDay}-${daysUntil}`}
                className="rounded-2xl px-4 py-3"
                style={{
                  backgroundColor: daysUntil === 0 ? 'rgba(250,204,21,0.13)' : 'rgba(250,204,21,0.07)',
                  border: `1px solid rgba(250,204,21,${daysUntil === 0 ? '0.28' : '0.15'})`,
                }}
              >
                <p className="text-xs font-semibold" style={{ color: '#d97706' }}>
                  {daysUntil === 0 ? '🗓 Hari ini' : daysUntil === 1 ? '🌙 Besok' : `📅 ${daysUntil} hari lagi`}
                  {' — '}{ev.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: '#92400e', opacity: 0.85 }}>{ev.desc}</p>
                {!isActive && (
                  <p className="text-[11px] mt-1" style={{ color: '#b45309', opacity: 0.75 }}>
                    Aktifkan reminder untuk dapat notifikasi
                  </p>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Next prayer info */}
        {isActive && nextPrayer && (
          <div className="mt-4 flex items-center justify-between rounded-2xl px-4 py-3" style={{ backgroundColor: 'rgba(13, 148, 136, 0.12)', border: '1px solid rgba(13, 148, 136, 0.2)' }}>
            <div>
              <p className="text-xs font-medium" style={{ color: '#0d9488' }}>Sholat berikutnya: {PRAYER_LABELS[nextPrayer.name] ?? nextPrayer.name}</p>
              <p className="mt-0.5 text-sm font-bold" style={{ color: '#0f766e' }}>
                Pukul {nextPrayer.time}
                {nextPrayer.minutesUntil > MINUTES_BEFORE && (
                  <span className="ml-1.5 font-normal text-xs" style={{ color: '#0d9488' }}>• Notif dalam {nextPrayer.minutesUntil - MINUTES_BEFORE} mnt</span>
                )}
              </p>
            </div>
            <svg className="h-5 w-5 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <circle cx="12" cy="12" r="8" />
              <path d="M12 7v5l3 2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        )}

        {/* Scheduled pills + sound toggle */}
        {isActive && scheduledPrayers.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            {scheduledPrayers.map((p) => (
              <span key={p} className="rounded-full bg-teal-100 px-2.5 py-0.5 text-[11px] font-medium text-teal-700">
                {PRAYER_LABELS[p] ?? p}
              </span>
            ))}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Suara adzan aktif — klik untuk matikan' : 'Suara adzan mati — klik untuk aktifkan'}
              className="ml-auto flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium transition"
              style={soundEnabled
                ? { backgroundColor: 'rgba(13,148,136,0.12)', color: '#0d9488' }
                : { backgroundColor: 'rgba(148,163,184,0.15)', color: '#94a3b8' }
              }
            >
              {soundEnabled ? (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
                  <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
                  <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
                </svg>
              ) : (
                <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                  <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" fill="currentColor" stroke="none"/>
                  <line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/>
                </svg>
              )}
              {soundEnabled ? 'Suara On' : 'Suara Off'}
            </button>
          </div>
        )}

        {/* Permission needs to be granted */}
        {permission === 'default' && enabled && (
          <button
            onClick={requestPermission}
            className="mt-4 w-full rounded-2xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
          >
            Izinkan Notifikasi Browser
          </button>
        )}

        {/* Permission denied */}
        {permission === 'denied' && (
          <div className="mt-4 rounded-2xl bg-red-50 px-4 py-3 text-xs text-red-700">
            Notifikasi diblokir oleh browser. Buka <strong>Pengaturan → Privasi &amp; Keamanan → Notifikasi</strong> dan izinkan situs ini, lalu muat ulang halaman.
          </div>
        )}

        {/* Test & tip */}
        {permission === 'granted' && (
          <div className="mt-4 flex items-center justify-between">
            <button
              onClick={sendTest}
              className="text-xs font-medium transition"
              style={{ color: testSent ? '#16a34a' : '#0d9488' }}
            >
              {testSent ? '✓ Terkirim!' : 'Kirim notifikasi test →'}
            </button>
            <span className="text-[10px] text-slate-400">Notif: tepat waktu + {MINUTES_BEFORE} mnt sebelumnya</span>
          </div>
        )}
      </div>
    </>
  );
}
