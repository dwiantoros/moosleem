'use client';

import React, { useMemo, useEffect, useState, useRef } from 'react';
import {
  DAILY_INSPIRATION_NOTIF_EVENT,
  DailyInspirationNotif,
  saveDailyInspirationNotif,
  broadcastDailyInspirationNotifUpdate,
} from '@/utils/azanReminder';
import { sendNotification } from '@/utils/azanReminderRuntime';

interface Inspiration {
  arabic: string;
  translation: string;
  reference: string;
}

const inspirations: Inspiration[] = [
  {
    arabic: 'مِن سَارَ عَلَى الدَّرْبِ وَصَل',
    translation: 'Barang siapa berjalan di atas jalan akan sampai ke tujuan',
    reference: 'Pepatah Arab',
  },
  {
    arabic: 'يَسِّرُوا وَلَا تُعَسِّرُوا وَبَشِّرُوا وَلَا تُنَفِّرُوا',
    translation: 'Mudahkanlah dan jangan dipersulit, berikanlah kabar gembira dan jangan membuat orang lari',
    reference: 'Hadis Sahih Bukhari',
  },
  {
    arabic: 'أَفْضَلُ الْجِهَادِ جِهَادُ النَّفْسِ',
    translation: 'Jihad terbaik adalah jihad melawan hawa nafsu',
    reference: 'Hadis Riwayat At-Tirmidzi',
  },
  {
    arabic: 'الدُّعَاءُ هُوَ الْعِبَادَةُ',
    translation: 'Doa adalah ibadah',
    reference: 'Hadis Riwayat At-Tirmidzi',
  },
];

function getTodayDateString(): string {
  const now = new Date();
  return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function getCurrentHour(): number {
  return new Date().getHours();
}

function getScheduledTimes(): number[] {
  // 8 AM (08:00) dan 6 PM (18:00)
  return [8, 18];
}

function getNextScheduledTime(now: Date = new Date()): { hour: number; minutesUntil: number } {
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const scheduledHours = getScheduledTimes();

  // Find next scheduled hour
  let nextHour = scheduledHours.find(h => h > currentHour);

  // If no hour found today, use first hour tomorrow
  if (nextHour === undefined) {
    nextHour = scheduledHours[0];
  }

  // Calculate minutes until next scheduled time
  const nextTime = new Date(now);
  nextTime.setHours(nextHour, 0, 0, 0);

  if (nextTime <= now) {
    nextTime.setDate(nextTime.getDate() + 1);
  }

  const minutesUntil = Math.ceil((nextTime.getTime() - now.getTime()) / 1000 / 60);

  return { hour: nextHour, minutesUntil };
}

export default function DailyInspiration() {
  const dayOfYear = useMemo(() => {
    const today = new Date();
    const dayOfYearNum = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return dayOfYearNum;
  }, []);

  const inspiration = useMemo(() => {
    return inspirations[dayOfYear % inspirations.length];
  }, [dayOfYear]);

  const [, setMounted] = useState(false);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerInspirationNotification = (hour: number) => {
    const todayStr = getTodayDateString();
    const timeKey = `lastInspirationNotif_${todayStr}_${hour}`;

    // Prevent duplicate notifications within same hour
    const lastNotifTime = localStorage.getItem(timeKey);
    const now = Date.now();
    if (lastNotifTime && now - Number(lastNotifTime) < 60 * 60 * 1000) {
      return; // Already notified in this hour window
    }

    // Mark as notified
    localStorage.setItem(timeKey, String(now));

    const notif: DailyInspirationNotif = {
      id: `inspiration-${todayStr}-${hour}-${Date.now()}`,
      date: todayStr,
      arabic: inspiration.arabic,
      translation: inspiration.translation,
      reference: inspiration.reference,
      createdAt: Date.now(),
    };

    // Determine time label
    const timeLabel = hour === 8 ? 'Pagi' : 'Sore';
    const timeDisplay = hour === 8 ? '08:00' : '18:00';

    // Save to storage
    saveDailyInspirationNotif(notif);

    // Send push notification
    void sendNotification(`✨ Inspirasi ${timeLabel} (${timeDisplay})`, {
      body: inspiration.translation,
      tag: `daily-inspiration-${todayStr}-${hour}`,
      requireInteraction: false,
      silent: false,
    });

    // Trigger website popup alert
    const popupEvent = new CustomEvent(DAILY_INSPIRATION_NOTIF_EVENT, {
      detail: [notif],
    });
    window.dispatchEvent(popupEvent);

    // Broadcast to bell for UI update
    broadcastDailyInspirationNotifUpdate();
  };

  const clearTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  // Setup 2x daily scheduled notifications
  useEffect(() => {
    setMounted(true);
    clearTimers();

    const setupScheduledNotifs = () => {
      const now = new Date();
      const scheduledHours = getScheduledTimes();

      scheduledHours.forEach((hour) => {
        const nextTime = new Date(now);
        nextTime.setHours(hour, 0, 0, 0);

        // If this hour already passed today, schedule for tomorrow
        if (nextTime <= now) {
          nextTime.setDate(nextTime.getDate() + 1);
        }

        const msUntil = nextTime.getTime() - now.getTime();

        const timer = setTimeout(() => {
          triggerInspirationNotification(hour);

          // Reschedule for next day same time
          setupScheduledNotifs();
        }, msUntil);

        timersRef.current.push(timer);
      });
    };

    setupScheduledNotifs();

    // Also check on visibility change
    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const now = new Date();
        const scheduledHours = getScheduledTimes();

        // Check if we missed any scheduled times
        scheduledHours.forEach((hour) => {
          if (getCurrentHour() === hour) {
            // We're in the hour, trigger notification
            triggerInspirationNotification(hour);
          }
        });
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [inspiration]);

  return (
    <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
      <div className="flex items-start gap-4">
        <div className="flex-shrink-0">
          <div className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-amber-700">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M9 18h6" strokeLinecap="round" />
              <path d="M10 22h4" strokeLinecap="round" />
              <path d="M8 14c-1.3-1-2-2.6-2-4.3A6 6 0 1 1 18 9.7c0 1.7-.7 3.3-2 4.3-.6.5-1 1.2-1 2H9c0-.8-.4-1.5-1-2Z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
        <div className="flex-1">
          <h3 className="text-sm uppercase tracking-[0.24em] text-slate-500 font-semibold">Inspirasi Harian</h3>
          <p className="mt-4 text-right font-arabic text-[1.75rem] leading-[2.2] text-slate-900 dark:text-slate-100" dir="rtl">{inspiration.arabic}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{inspiration.translation}</p>
          <p className="mt-3 text-xs text-slate-500">{inspiration.reference}</p>
        </div>
      </div>
    </div>
  );
}
