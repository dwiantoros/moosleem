'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PrayerTimes } from '@/types';
import {
  AZAN_PROMPT_DISMISSED_KEY,
  AZAN_REMINDER_EVENT,
  AzanReminderSnapshot,
  broadcastAzanReminderState,
  queueAzanWebsitePopup,
  readAzanReminderSnapshot,
  writeAzanReminderEnabled,
  writeAzanSoundEnabled,
} from '@/utils/azanReminder';
import {
  EVENT_NOTIFY,
  MINUTES_BEFORE,
  NOTIFY_PRAYERS,
  PRAYER_LABELS,
  gregorianToHijri,
  parsePrayerMs,
  playAzanSound,
  primeAzanAudio,
  sendNotification,
  ensureAzanServiceWorker,
} from '@/utils/azanReminderRuntime';

interface AzanReminderProps {
  prayerTimes: PrayerTimes | null;
  nextPrayer: { name: string; time: string; minutesUntil: number } | null;
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
}

export default function AzanReminder({ prayerTimes, nextPrayer, enabled, onToggle }: AzanReminderProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [nowTick, setNowTick] = useState(() => Date.now());

  // Upcoming Hijri events (today + next 3 days) — always shown regardless of reminder state
  const upcomingEvents = useMemo(() => {
    const now = new Date();
    const result: Array<{ ev: (typeof EVENT_NOTIFY)[number]; daysUntil: number }> = [];
    for (let d = 0; d <= 3; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d);
      const hijri = gregorianToHijri(date);
      EVENT_NOTIFY
        .filter(e => e.hijriMonth === hijri.month && e.hijriDay === hijri.day)
        .forEach(ev => result.push({ ev, daysUntil: d }));
    }
    return result;
  }, [onToggle]);

  const scheduledPrayers = useMemo(() => {
    if (!prayerTimes) return [];

    return NOTIFY_PRAYERS.filter((prayer) => {
      const prayerMs = parsePrayerMs(prayerTimes[prayer]);
      return prayerMs !== null && prayerMs > nowTick - 30000;
    });
  }, [nowTick, prayerTimes]);

  useEffect(() => {
    if (!('Notification' in window)) return;

    const syncSnapshot = () => {
      const snapshot = readAzanReminderSnapshot();
      setPermission(snapshot.permission === 'unsupported' ? 'default' : snapshot.permission);
      setSoundEnabled(snapshot.soundEnabled);
      onToggle(snapshot.enabled);
    };

    setSupported(true);
    syncSnapshot();

    void ensureAzanServiceWorker().catch(() => {});

    const syncPerm = () => {
      if (document.visibilityState !== 'visible') return;
      syncSnapshot();
    };
    const onReminderChanged = (event: Event) => {
      const custom = event as CustomEvent<AzanReminderSnapshot>;
      if (custom.detail) {
        setPermission(custom.detail.permission === 'unsupported' ? 'default' : custom.detail.permission);
        setSoundEnabled(custom.detail.soundEnabled);
        onToggle(custom.detail.enabled);
        return;
      }

      syncSnapshot();
    };
    const onStorage = () => syncSnapshot();

    document.addEventListener('visibilitychange', syncPerm);
    window.addEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
    window.addEventListener('storage', onStorage);

    if (Notification.permission === 'default') {
      const dismissed = localStorage.getItem(AZAN_PROMPT_DISMISSED_KEY);
      if (!dismissed) setTimeout(() => setShowPrompt(true), 900);
    }

    return () => {
      document.removeEventListener('visibilitychange', syncPerm);
      window.removeEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  const requestPermission = async () => {
    if (!supported) return;
    void ensureAzanServiceWorker().catch(() => {});
    const result = await Notification.requestPermission();
    setPermission(result);
    if (result === 'granted') {
      setShowPrompt(false);
      localStorage.removeItem(AZAN_PROMPT_DISMISSED_KEY);
      onToggle(true);
      const snapshot = writeAzanReminderEnabled(true);
      broadcastAzanReminderState(snapshot);
      if (soundEnabled) {
        await primeAzanAudio(nextPrayer?.name as keyof PrayerTimes | undefined);
      }
    }
  };

  const handleToggle = (next: boolean) => {
    if (next && permission === 'default') {
      void requestPermission();
      return;
    }

    onToggle(next);
    broadcastAzanReminderState(writeAzanReminderEnabled(next));
    if (next && soundEnabled) {
      void primeAzanAudio(nextPrayer?.name as keyof PrayerTimes | undefined);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    localStorage.setItem(AZAN_PROMPT_DISMISSED_KEY, 'true');
  };

  const enableFromPrompt = () => {
    dismissPrompt();
    requestPermission();
  };

  const sendTest = async () => {
    const livePerm = Notification.permission;
    if (livePerm !== permission) setPermission(livePerm);
    if (livePerm !== 'granted') {
      void requestPermission();
      return;
    }

    if (soundEnabled) {
      await primeAzanAudio(nextPrayer?.name as keyof PrayerTimes | undefined);
      await playAzanSound('azan', nextPrayer?.name as keyof PrayerTimes | undefined);
    }

    queueAzanWebsitePopup({
      title: '🕌 Test Adzan Reminder',
      body: `Popup website berjalan. Kamu akan diingatkan ${MINUTES_BEFORE} mnt sebelum dan tepat saat waktu sholat.`,
      timeLabel: 'Tes sekarang',
    });

    await sendNotification('🕌 Test Adzan Reminder', {
      body: `Notifikasi berjalan! Kamu akan diingatkan ${MINUTES_BEFORE} mnt sebelum dan tepat saat waktu sholat.`,
      tag: 'azan-test',
      requireInteraction: false,
    });
    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
  };

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    broadcastAzanReminderState(writeAzanSoundEnabled(next));
    if (next) {
      void primeAzanAudio(nextPrayer?.name as keyof PrayerTimes | undefined).then(() =>
        playAzanSound('test', nextPrayer?.name as keyof PrayerTimes | undefined)
      );
    }
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
