'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { PrayerTimes } from '@/types';
import PermissionPromptModal from '@/components/PermissionPromptModal';
import {
  AZAN_REMINDER_EVENT,
  AzanReminderSnapshot,
  broadcastAzanReminderState,
  queueAzanWebsitePopup,
  readAzanReminderSnapshot,
  writeAzanReminderEnabled,
  writeAzanSoundEnabled,
} from '@/utils/azanReminder';
import { activateAllPermissionsInOneClick, PermissionStep } from '@/utils/permissionCenter';
import {
  EVENT_NOTIFY,
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

function base64UrlToUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4);
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; i += 1) {
    outputArray[i] = rawData.charCodeAt(i);
  }

  return outputArray;
}

async function enableServerSidePushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const locationRaw = localStorage.getItem('mt:last-location');
  if (!locationRaw) return;

  let location: { latitude: number; longitude: number; timezone: string } | null = null;
  try {
    location = JSON.parse(locationRaw) as { latitude: number; longitude: number; timezone: string };
  } catch {
    location = null;
  }
  if (!location) return;

  const keyRes = await fetch('/api/push/public-key', { cache: 'no-store' });
  if (!keyRes.ok) return;
  const keyData = (await keyRes.json()) as { publicKey?: string };
  if (!keyData.publicKey) return;

  const registration = await navigator.serviceWorker.ready;
  let subscription = await registration.pushManager.getSubscription();

  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlToUint8Array(keyData.publicKey) as BufferSource,
    });
  }

  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      subscription: subscription.toJSON(),
      location,
    }),
  });
}

async function disableServerSidePushSubscription(): Promise<void> {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;

  const registration = await navigator.serviceWorker.ready;
  const subscription = await registration.pushManager.getSubscription();
  if (!subscription) return;

  await fetch('/api/push/unsubscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ endpoint: subscription.endpoint }),
  }).catch(() => {});

  await subscription.unsubscribe().catch(() => {});
}

export default function AzanReminder({ prayerTimes, nextPrayer, enabled, onToggle }: AzanReminderProps) {
  const [permission, setPermission] = useState<NotificationPermission>('default');
  const [supported, setSupported] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [testSent, setTestSent] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [activatingPermissions, setActivatingPermissions] = useState(false);
  const [permissionStatusMessage, setPermissionStatusMessage] = useState('Siap mengaktifkan semua izin.');
  const [locationFlowState, setLocationFlowState] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [notificationFlowState, setNotificationFlowState] = useState<'idle' | 'pending' | 'granted' | 'denied' | 'unsupported'>('idle');
  const [reminderFlowState, setReminderFlowState] = useState<'idle' | 'pending' | 'enabled' | 'disabled'>('idle');
  const [nowTick, setNowTick] = useState(() => Date.now());
  const repromptTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearRepromptTimer = () => {
    if (!repromptTimerRef.current) return;
    clearTimeout(repromptTimerRef.current);
    repromptTimerRef.current = null;
  };

  const scheduleReprompt = () => {
    clearRepromptTimer();
    repromptTimerRef.current = setTimeout(() => {
      if ('Notification' in window && Notification.permission === 'default') {
        setShowPrompt(true);
      }
    }, 10 * 60 * 1000);
  };

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
      setShowPrompt(true);
    }

    return () => {
      document.removeEventListener('visibilitychange', syncPerm);
      window.removeEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
      window.removeEventListener('storage', onStorage);
      clearRepromptTimer();
    };
  }, []);

  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      setNowTick(Date.now());
    }, 30000);

    return () => clearInterval(interval);
  }, [enabled]);

  useEffect(() => {
    if (!enabled || permission !== 'granted') {
      void disableServerSidePushSubscription();
      return;
    }

    void enableServerSidePushSubscription();
  }, [enabled, permission]);

  const requestPermission = async () => {
    if (!supported || activatingPermissions) return;

    const handlePermissionStep = (step: PermissionStep) => {
      if (step === 'requesting-location') {
        setLocationFlowState('pending');
        setPermissionStatusMessage('Meminta izin lokasi...');
        return;
      }
      if (step === 'location-granted') {
        setLocationFlowState('granted');
        setPermissionStatusMessage('Izin lokasi aktif.');
        return;
      }
      if (step === 'location-denied') {
        setLocationFlowState('denied');
        setPermissionStatusMessage('Izin lokasi belum diaktifkan.');
        return;
      }
      if (step === 'requesting-notification') {
        setNotificationFlowState('pending');
        setPermissionStatusMessage('Meminta izin notifikasi browser...');
        return;
      }
      if (step === 'notification-granted') {
        setNotificationFlowState('granted');
        setPermissionStatusMessage('Izin notifikasi aktif.');
        return;
      }
      if (step === 'notification-denied') {
        setNotificationFlowState('denied');
        setPermissionStatusMessage('Izin notifikasi belum diaktifkan.');
        return;
      }
      if (step === 'enabling-reminder') {
        setReminderFlowState('pending');
        setPermissionStatusMessage('Mengaktifkan adzan reminder...');
        return;
      }

      setPermissionStatusMessage('Proses izin selesai.');
    };

    setActivatingPermissions(true);
    setPermissionStatusMessage('Menyiapkan aktivasi izin...');
    setLocationFlowState('idle');
    setNotificationFlowState('idle');
    setReminderFlowState('idle');
    try {
      const result = await activateAllPermissionsInOneClick(handlePermissionStep);

      if ('Notification' in window) {
        setPermission(Notification.permission);
      }

      setNotificationFlowState(result.notificationPermission === 'granted' ? 'granted' : result.notificationPermission === 'denied' ? 'denied' : 'unsupported');
      setReminderFlowState(result.notificationGranted ? 'enabled' : 'disabled');
      setPermissionStatusMessage(result.notificationGranted
        ? 'Semua izin penting sudah aktif.'
        : 'Sebagian izin belum aktif. Anda bisa coba lagi.');

      if (result.notificationGranted) {
        setShowPrompt(false);
        clearRepromptTimer();
        onToggle(true);
        const snapshot = writeAzanReminderEnabled(true);
        broadcastAzanReminderState(snapshot);
        if (soundEnabled) {
          await primeAzanAudio(nextPrayer?.name as keyof PrayerTimes | undefined);
        }
      }
    } finally {
      setActivatingPermissions(false);
    }
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
    scheduleReprompt();
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
      body: 'Popup website berjalan. Kamu akan diingatkan tepat saat waktu sholat.',
      timeLabel: 'Tes sekarang',
    });

    await sendNotification('🕌 Test Adzan Reminder', {
      body: 'Notifikasi berjalan! Kamu akan diingatkan tepat saat waktu sholat.',
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
      <PermissionPromptModal
        open={showPrompt}
        loading={activatingPermissions}
        onClose={dismissPrompt}
        onConfirm={requestPermission}
        statusMessage={permissionStatusMessage}
        locationState={locationFlowState}
        notificationState={notificationFlowState}
        reminderState={reminderFlowState}
      />

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
                  : 'Notifikasi tepat waktu sholat'}
              </p>
            </div>
          </div>

          <span className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isActive ? 'bg-teal-100 text-teal-700' : 'bg-slate-100 text-slate-500'}`}>
            {isActive ? 'Aktif' : 'Belum Aktif'}
          </span>
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
                {nextPrayer.minutesUntil > 0 && (
                  <span className="ml-1.5 font-normal text-xs" style={{ color: '#0d9488' }}>• {nextPrayer.minutesUntil} mnt lagi</span>
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
        {permission === 'default' && (
          <div className="mt-4 space-y-3">
            <p className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3 text-xs leading-5 text-slate-300">
              Aktifkan izin agar aplikasi bisa kirim pengingat adzan tepat waktu. Izin lokasi dipakai
              untuk menghitung jadwal sholat yang akurat sesuai posisi kamu.
            </p>
            <button
              onClick={requestPermission}
              disabled={activatingPermissions}
              className="w-full rounded-2xl bg-teal-600 py-2.5 text-sm font-semibold text-white hover:bg-teal-700 transition"
            >
              {activatingPermissions ? 'Memproses izin...' : 'Aktifkan Semua Permission'}
            </button>
          </div>
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
            <span className="text-[10px] text-slate-400">Notif: tepat waktu</span>
          </div>
        )}
      </div>
    </>
  );
}
