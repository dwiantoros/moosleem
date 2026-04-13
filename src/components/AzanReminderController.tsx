'use client';

import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import axios from 'axios';
import { PrayerTimes } from '@/types';
import { getCached, getLastLocation, prayerCacheKey, safeSet } from '@/utils/clientCache';
import {
  EVENT_NOTIFY,
  MINUTES_BEFORE,
  NOTIFY_PRAYERS,
  PRAYER_ARABIC,
  PRAYER_LABELS,
  gregorianToHijri,
  parsePrayerMs,
  primeAzanAudio,
  playAzanSound,
  stopAzanSound,
  sendNotification,
  ensureAzanServiceWorker,
} from '@/utils/azanReminderRuntime';
import {
  AZAN_REMINDER_ENABLED_KEY,
  AZAN_REMINDER_EVENT,
  AZAN_SOUND_ENABLED_KEY,
  AzanReminderSnapshot,
  AzanWebsitePopupDetail,
  AZAN_WEBSITE_POPUP_EVENT,
  clearPendingAzanWebsitePopup,
  queueAzanWebsitePopup,
  readAzanReminderSnapshot,
  readPendingAzanWebsitePopup,
} from '@/utils/azanReminder';
import {
  enableServerPushWithLastLocation,
  LOCATION_PERMISSION_UPDATED_EVENT,
} from '@/utils/permissionCenter';

interface WebsitePopup {
  title: string;
  body: string;
  timeLabel: string;
}

export default function AzanReminderController() {
  // Safety net: re-apply theme from localStorage/cookie BEFORE first paint,
  // in case React 19 hydration reconciliation removed the dark class.
  useLayoutEffect(() => {
    try {
      let ck = '';
      document.cookie.split(';').forEach((c) => {
        const t = c.trim();
        if (t.startsWith('theme=')) ck = t.slice(6);
      });
      const saved = ck || localStorage.getItem('theme');
      const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      const theme = saved ?? (systemDark ? 'dark' : 'light');
      const isDark = theme === 'dark';
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
      if (!ck) document.cookie = 'theme=' + theme + ';path=/;max-age=31536000;SameSite=Lax';
    } catch {}
  }, []);
  const [snapshot, setSnapshot] = useState<AzanReminderSnapshot>(() => readAzanReminderSnapshot());
  const [prayerTimes, setPrayerTimes] = useState<PrayerTimes | null>(null);
  const [popup, setPopup] = useState<WebsitePopup | null>(null);
  const [isDark, setIsDark] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const popupTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const syncSnapshot = useCallback(() => {
    setSnapshot(readAzanReminderSnapshot());
  }, []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  }, []);

  const showWebsitePopup = useCallback((detail: Pick<WebsitePopup, 'title' | 'body' | 'timeLabel'>) => {
    setPopup(detail);
    clearPendingAzanWebsitePopup();

    if (popupTimerRef.current) {
      clearTimeout(popupTimerRef.current);
    }

    popupTimerRef.current = setTimeout(() => {
      setPopup(null);
    }, 20000);
  }, []);

  const flushPendingPopup = useCallback(() => {
    if (document.visibilityState !== 'visible') return;

    const pending = readPendingAzanWebsitePopup();
    if (!pending) return;

    showWebsitePopup(pending);
  }, [showWebsitePopup]);

  const fetchPrayerData = useCallback(async () => {
    const cachedLoc = getLastLocation(24 * 60 * 60 * 1000);
    if (!cachedLoc) {
      setPrayerTimes(null);
      return null;
    }

    const cacheKey = prayerCacheKey(cachedLoc.latitude, cachedLoc.longitude);
    const staleMs = 6 * 60 * 60 * 1000;

    const doFetch = async () => {
      const response = await axios.get('/api/prayer-times', {
        params: {
          latitude: cachedLoc.latitude,
          longitude: cachedLoc.longitude,
        },
        timeout: 8000,
      });

      if (response.data) {
        safeSet(cacheKey, response.data);
        setPrayerTimes(response.data);
        return response.data as PrayerTimes;
      }

      return null;
    };

    const cached = getCached<PrayerTimes>(cacheKey, staleMs);
    if (cached) {
      setPrayerTimes(cached.data);
      if (cached.isStale) {
        void doFetch().catch(() => {});
      }
      return cached.data;
    }

    try {
      return await doFetch();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));

    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'));
    });
    observer.observe(document.documentElement, { attributeFilter: ['class'] });

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (snapshot.permission === 'unsupported') {
      return;
    }

    void ensureAzanServiceWorker().catch(() => {});
  }, [snapshot.permission]);

  useEffect(() => {
    if (!snapshot.enabled || snapshot.permission !== 'granted') {
      return;
    }

    // Keep server-side push subscription alive even if user enables reminder from non-home pages.
    void enableServerPushWithLastLocation().catch(() => {});

    const onLocationPermissionUpdated = () => {
      void enableServerPushWithLastLocation().catch(() => {});
    };

    window.addEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    return () => {
      window.removeEventListener(LOCATION_PERMISSION_UPDATED_EVENT, onLocationPermissionUpdated as EventListener);
    };
  }, [snapshot.enabled, snapshot.permission]);

  useEffect(() => {
    if (!snapshot.enabled || snapshot.permission !== 'granted' || !snapshot.soundEnabled) {
      return;
    }

    void primeAzanAudio().catch(() => {});
  }, [snapshot.enabled, snapshot.permission, snapshot.soundEnabled]);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const onWorkerMessage = (event: MessageEvent) => {
      if (event.data?.type === 'STOP_AZAN') {
        stopAzanSound();
        setPopup(null);
        clearPendingAzanWebsitePopup();
      }

      if (event.data?.type === 'OPEN_URL' && typeof event.data.url === 'string') {
        window.location.assign(event.data.url);
      }
    };

    navigator.serviceWorker.addEventListener('message', onWorkerMessage);
    return () => {
      navigator.serviceWorker.removeEventListener('message', onWorkerMessage);
    };
  }, []);

  useEffect(() => {
    void fetchPrayerData();

    const onReminderChanged = (event: Event) => {
      const custom = event as CustomEvent<AzanReminderSnapshot>;
      if (custom.detail) {
        setSnapshot(custom.detail);
      } else {
        syncSnapshot();
      }

      void fetchPrayerData();
    };

    const onWebsitePopup = (event: Event) => {
      const custom = event as CustomEvent<AzanWebsitePopupDetail>;
      if (!custom.detail) return;
      if (document.visibilityState !== 'visible') return;

      showWebsitePopup(custom.detail);
    };

    const onStorage = (event: StorageEvent) => {
      if (
        event.key &&
        event.key !== AZAN_REMINDER_ENABLED_KEY &&
        event.key !== AZAN_SOUND_ENABLED_KEY
      ) {
        return;
      }

      syncSnapshot();
      void fetchPrayerData();
    };

    const onVisibilityChange = () => {
      if (document.visibilityState !== 'visible') return;
      syncSnapshot();
      void fetchPrayerData();
      flushPendingPopup();
    };

    window.addEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
    window.addEventListener(AZAN_WEBSITE_POPUP_EVENT, onWebsitePopup as EventListener);
    window.addEventListener('storage', onStorage);
    document.addEventListener('visibilitychange', onVisibilityChange);
    flushPendingPopup();

    return () => {
      window.removeEventListener(AZAN_REMINDER_EVENT, onReminderChanged as EventListener);
      window.removeEventListener(AZAN_WEBSITE_POPUP_EVENT, onWebsitePopup as EventListener);
      window.removeEventListener('storage', onStorage);
      document.removeEventListener('visibilitychange', onVisibilityChange);
      clearTimers();
      if (popupTimerRef.current) {
        clearTimeout(popupTimerRef.current);
      }
    };
  }, [clearTimers, fetchPrayerData, flushPendingPopup, showWebsitePopup, syncSnapshot]);

  useEffect(() => {
    if (!snapshot.enabled || snapshot.permission !== 'granted' || !prayerTimes) {
      clearTimers();
      return;
    }

    clearTimers();
    const now = Date.now();

    NOTIFY_PRAYERS.forEach((prayer) => {
      const timeStr = prayerTimes[prayer];
      if (!timeStr) return;

      const prayerMs = parsePrayerMs(timeStr);
      if (!prayerMs) return;

      const msUntil = prayerMs - now;
      if (msUntil <= -30000) return;

      const label = PRAYER_LABELS[prayer] ?? prayer;
      const arabic = PRAYER_ARABIC[prayer] ?? '';

      const atTime = setTimeout(() => {
        if (snapshot.permission !== 'granted') return;

        const title = `🕌 Allahu Akbar — Waktu ${label}`;
        const body = `Waktu sholat ${label} ${arabic} pukul ${timeStr} telah tiba. Allahu Akbar!`;

        if (snapshot.soundEnabled) {
          void playAzanSound('azan', prayer);
        }

        queueAzanWebsitePopup({ title, body, timeLabel: timeStr });
        void sendNotification(title, {
          body,
          tag: `azan-at-${prayer}`,
          requireInteraction: true,
          silent: false,
          actions: [
            { action: 'open-app', title: 'Buka' },
            { action: 'stop-azan', title: 'Stop Adzan' },
          ],
        });
      }, Math.max(msUntil, 0));
      timersRef.current.push(atTime);

      const beforeMs = msUntil - MINUTES_BEFORE * 60000;
      if (beforeMs > 0) {
        const beforeTime = setTimeout(() => {
          if (snapshot.permission !== 'granted') return;

          const title = `⏰ ${label} dalam ${MINUTES_BEFORE} menit`;
          const body = `Bersiaplah untuk sholat ${label}. Waktu masuk pukul ${timeStr}.`;

          if (snapshot.soundEnabled) {
            void playAzanSound('before');
          }

          void sendNotification(title, {
            body,
            tag: `azan-before-${prayer}`,
            silent: false,
          });
        }, beforeMs);
        timersRef.current.push(beforeTime);
      }
    });

    const nowDate = new Date();
    const todayHijri = gregorianToHijri(nowDate);
    const tomorrowDate = new Date(nowDate);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowHijri = gregorianToHijri(tomorrowDate);

    EVENT_NOTIFY.filter((event) => event.hijriMonth === todayHijri.month && event.hijriDay === todayHijri.day)
      .forEach((event) => {
        const at8am = new Date(nowDate);
        at8am.setHours(8, 0, 0, 0);
        const delay = Math.max(at8am.getTime() - now, 2000);

        const timer = setTimeout(() => {
          if (snapshot.permission !== 'granted') return;
          void sendNotification(`📅 ${event.name}`, {
            body: event.desc,
            tag: `islamic-event-today-${event.hijriMonth}-${event.hijriDay}`,
            requireInteraction: false,
          });
        }, delay);

        timersRef.current.push(timer);
      });

    EVENT_NOTIFY.filter((event) => event.hijriMonth === tomorrowHijri.month && event.hijriDay === tomorrowHijri.day)
      .forEach((event) => {
        const at8pm = new Date(nowDate);
        at8pm.setHours(20, 0, 0, 0);
        const delay = at8pm.getTime() - now;
        if (delay <= 0) return;

        const timer = setTimeout(() => {
          if (snapshot.permission !== 'granted') return;
          void sendNotification(`🌙 Besok: ${event.name}`, {
            body: `Besok adalah ${event.name}. ${event.desc}`,
            tag: `islamic-event-tomorrow-${event.hijriMonth}-${event.hijriDay}`,
            requireInteraction: false,
          });
        }, delay);

        timersRef.current.push(timer);
      });

    const nextRefresh = new Date();
    nextRefresh.setHours(24, 1, 0, 0);
    const refreshDelay = Math.max(nextRefresh.getTime() - now, 60000);
    const refreshTimer = setTimeout(() => {
      void fetchPrayerData();
    }, refreshDelay);
    timersRef.current.push(refreshTimer);

    return () => clearTimers();
  }, [clearTimers, fetchPrayerData, prayerTimes, snapshot]);

  const popupTitle = useMemo(() => popup?.title ?? '', [popup]);

  const closePopup = () => {
    clearPendingAzanWebsitePopup();
    setPopup(null);
  };

  const stopAndClosePopup = () => {
    stopAzanSound();
    closePopup();
  };

  if (!popup) {
    return null;
  }

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[70] flex justify-center px-4">
      <div className={`pointer-events-auto w-full max-w-md rounded-[1.75rem] p-4 backdrop-blur-xl ${
        isDark
          ? 'border border-teal-800/55 bg-slate-900/92 shadow-[0_20px_60px_rgba(2,6,23,0.52)]'
          : 'border border-teal-200/60 bg-white/95 shadow-[0_20px_60px_rgba(15,23,42,0.18)]'
      }`}>
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-teal-100 text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.8">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" strokeLinecap="round" />
            </svg>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600 dark:text-teal-300">Reminder Adzan</p>
            <h2 className="mt-1 text-sm font-semibold text-slate-900 dark:text-slate-100">{popupTitle}</h2>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{popup.body}</p>
            <p className="mt-2 text-[11px] font-medium text-slate-500 dark:text-slate-400">Masuk pada {popup.timeLabel}</p>
            <div className="mt-3 flex items-center gap-2">
              <button
                onClick={closePopup}
                className="rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs font-medium text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                Tutup
              </button>
              <button
                onClick={stopAndClosePopup}
                className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-rose-700"
              >
                Stop Adzan
              </button>
            </div>
          </div>
          <button
            onClick={closePopup}
            className="rounded-full p-1.5 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-slate-800 dark:hover:text-slate-300"
            aria-label="Tutup popup adzan"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 6l12 12M18 6 6 18" strokeLinecap="round" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
}
