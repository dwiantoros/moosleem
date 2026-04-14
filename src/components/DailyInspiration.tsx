'use client';

import React, { useEffect, useState, useRef } from 'react';
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

interface InspirationRotationState {
  queue: number[];
  lastSlotKey?: string;
  lastIndex?: number;
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
  {
    arabic: 'إِنَّ مَعَ الْعُسْرِ يُسْرًا',
    translation: 'Sesungguhnya bersama kesulitan ada kemudahan',
    reference: 'QS. Al-Insyirah: 6',
  },
  {
    arabic: 'وَمَن يَتَوَكَّلْ عَلَى اللَّهِ فَهُوَ حَسْبُهُ',
    translation: 'Barang siapa bertawakal kepada Allah, maka Allah mencukupinya',
    reference: 'QS. At-Thalaq: 3',
  },
  {
    arabic: 'خَيْرُ النَّاسِ أَنْفَعُهُمْ لِلنَّاسِ',
    translation: 'Sebaik-baik manusia adalah yang paling bermanfaat bagi orang lain',
    reference: 'Hadis Riwayat At-Thabrani',
  },
  {
    arabic: 'الصَّبْرُ مِفْتَاحُ الْفَرَج',
    translation: 'Sabar adalah kunci kelapangan',
    reference: 'Pepatah Arab',
  },
  {
    arabic: 'طَلَبُ الْعِلْمِ فَرِيضَةٌ عَلَى كُلِّ مُسْلِمٍ',
    translation: 'Menuntut ilmu adalah kewajiban bagi setiap muslim',
    reference: 'Hadis Riwayat Ibnu Majah',
  },
  {
    arabic: 'إِنَّ اللَّهَ لَا يُضِيعُ أَجْرَ الْمُحْسِنِينَ',
    translation: 'Sesungguhnya Allah tidak menyia-nyiakan pahala orang yang berbuat baik',
    reference: 'QS. At-Taubah: 120',
  },
  {
    arabic: 'وَاللَّهُ يُحِبُّ الصَّابِرِينَ',
    translation: 'Dan Allah mencintai orang-orang yang sabar',
    reference: 'QS. Ali Imran: 146',
  },
  {
    arabic: 'تَوَاضَعْ تَكُنْ كَالنَّجْمِ لَاحَ لِنَاظِرِيهِ',
    translation: 'Rendah hatilah, maka kamu akan seperti bintang yang bersinar bagi yang memandangnya',
    reference: 'Pepatah Arab',
  },
  {
    arabic: 'مَنْ صَمَتَ نَجَا',
    translation: 'Barang siapa diam, ia selamat',
    reference: 'Hadis Riwayat At-Tirmidzi',
  },
  {
    arabic: 'أَحِبَّ لِلنَّاسِ مَا تُحِبُّ لِنَفْسِكَ',
    translation: 'Cintailah untuk orang lain apa yang kamu cintai untuk dirimu sendiri',
    reference: 'Hadis Riwayat Ibnu Majah',
  },
  {
    arabic: 'الْمُؤْمِنُ مِرْآةُ الْمُؤْمِنِ',
    translation: 'Seorang mukmin adalah cermin bagi mukmin lainnya',
    reference: 'Hadis Riwayat Abu Dawud',
  },
  {
    arabic: 'كُنْ فِي الدُّنْيَا كَأَنَّكَ غَرِيبٌ أَوْ عَابِرُ سَبِيلٍ',
    translation: 'Jadilah di dunia ini seakan-akan kamu orang asing atau musafir',
    reference: 'Hadis Sahih Bukhari',
  },
  {
    arabic: 'إِنَّ اللَّهَ جَمِيلٌ يُحِبُّ الْجَمَالَ',
    translation: 'Sesungguhnya Allah itu indah dan mencintai keindahan',
    reference: 'Hadis Sahih Muslim',
  },
  {
    arabic: 'الْيَدُ الْعُلْيَا خَيْرٌ مِنَ الْيَدِ السُّفْلَى',
    translation: 'Tangan di atas lebih baik daripada tangan di bawah',
    reference: 'Hadis Sahih Bukhari',
  },
  {
    arabic: 'لَيْسَ الشَّدِيدُ بِالصُّرَعَةِ إِنَّمَا الشَّدِيدُ الَّذِي يَمْلِكُ نَفْسَهُ',
    translation: 'Orang kuat bukanlah yang menang bergulat, melainkan yang mampu mengendalikan dirinya',
    reference: 'Hadis Sahih Bukhari',
  },
  {
    arabic: 'اِبْدَأْ بِنَفْسِكَ',
    translation: 'Mulailah dari dirimu sendiri',
    reference: 'Hadis Sahih Muslim',
  },
  {
    arabic: 'الْقَنَاعَةُ كَنْزٌ لَا يَنْفَدُ',
    translation: 'Qanaah (merasa cukup) adalah harta yang tidak pernah habis',
    reference: 'Pepatah Arab',
  },
  {
    arabic: 'مَنْ عَرَفَ نَفْسَهُ فَقَدْ عَرَفَ رَبَّهُ',
    translation: 'Barang siapa mengenal dirinya, maka ia mengenal Tuhannya',
    reference: 'Pepatah Hikmah',
  },
  {
    arabic: 'اِغْتَنِمْ خَمْسًا قَبْلَ خَمْسٍ',
    translation: 'Manfaatkan lima perkara sebelum datang lima perkara (lainnya)',
    reference: 'Hadis Riwayat Al-Hakim',
  },
  {
    arabic: 'وَفِي أَنفُسِكُمْ ۚ أَفَلَا تُبْصِرُونَ',
    translation: 'Dan pada dirimu sendiri, apakah kamu tidak memperhatikan?',
    reference: 'QS. Adz-Dzariyat: 21',
  },
  {
    arabic: 'رَبَّنَا آتِنَا فِي الدُّنْيَا حَسَنَةً وَفِي الْآخِرَةِ حَسَنَةً',
    translation: 'Ya Rabb kami, berilah kami kebaikan di dunia dan kebaikan di akhirat',
    reference: 'QS. Al-Baqarah: 201',
  },
  {
    arabic: 'إِذَا أَرَدْتَ أَنْ تَعْرِفَ قَدْرَكَ عِنْدَ اللهِ فَانْظُرْ فِيمَ يَسْتَعْمِلُكَ',
    translation: 'Jika ingin tahu kedudukanmu di sisi Allah, lihatlah dalam hal apa Dia mempergunakanmu',
    reference: 'Pepatah Hikmah',
  },
  {
    arabic: 'أَكْثِرُوا ذِكْرَ اللَّهِ',
    translation: 'Perbanyaklah mengingat Allah',
    reference: 'QS. Al-Ahzab: 41',
  },
  {
    arabic: 'إِنَّ اللَّهَ مَعَ الصَّابِرِينَ',
    translation: 'Sesungguhnya Allah bersama orang-orang yang sabar',
    reference: 'QS. Al-Baqarah: 153',
  },
  {
    arabic: 'حَسْبُنَا اللَّهُ وَنِعْمَ الْوَكِيلُ',
    translation: 'Cukuplah Allah bagi kami, dan Dia sebaik-baik pelindung',
    reference: 'QS. Ali Imran: 173',
  },
  {
    arabic: 'وَمَا تَوْفِيقِي إِلَّا بِاللَّهِ',
    translation: 'Dan tidak ada taufik bagiku melainkan dari Allah',
    reference: 'QS. Hud: 88',
  },
];

function getTodayDateString(): string {
  return toDateStringLocal(new Date());
}

function getScheduledTimes(): number[] {
  // 8 AM (08:00) dan 4 PM (16:00)
  return [8, 16];
}

function toDateStringLocal(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function getSlotKeyFromDate(now: Date): string {
  const active = new Date(now);
  const hour = active.getHours();

  // Before 08:00, still show the previous day's 16:00 slot.
  if (hour < 8) {
    active.setDate(active.getDate() - 1);
    return `${toDateStringLocal(active)}-16`;
  }

  return `${toDateStringLocal(active)}-${hour < 16 ? '08' : '16'}`;
}

function shuffleIndices(length: number): number[] {
  const arr = Array.from({ length }, (_, i) => i);
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

function getSlotInspirationIndex(slotKey: string): number {
  const storageKey = 'dailyInspirationRotationV2';
  const defaultState: InspirationRotationState = {
    queue: shuffleIndices(inspirations.length),
  };

  let state = defaultState;
  try {
    const raw = localStorage.getItem(storageKey);
    if (raw) {
      const parsed = JSON.parse(raw) as InspirationRotationState;
      if (Array.isArray(parsed.queue)) {
        state = {
          queue: parsed.queue.filter((n) => Number.isInteger(n) && n >= 0 && n < inspirations.length),
          lastSlotKey: parsed.lastSlotKey,
          lastIndex: parsed.lastIndex,
        };
      }
    }
  } catch {
    state = defaultState;
  }

  if (state.lastSlotKey === slotKey && Number.isInteger(state.lastIndex)) {
    return Number(state.lastIndex);
  }

  if (state.queue.length === 0) {
    state.queue = shuffleIndices(inspirations.length);
    if (Number.isInteger(state.lastIndex) && inspirations.length > 1 && state.queue[0] === state.lastIndex) {
      const first = state.queue.shift();
      if (first !== undefined) {
        state.queue.push(first);
      }
    }
  }

  const nextIndex = state.queue.shift();
  const safeIndex = Number.isInteger(nextIndex) ? Number(nextIndex) : 0;
  const nextState: InspirationRotationState = {
    queue: state.queue,
    lastSlotKey: slotKey,
    lastIndex: safeIndex,
  };
  localStorage.setItem(storageKey, JSON.stringify(nextState));
  return safeIndex;
}

export default function DailyInspiration() {
  const [inspirationIndex, setInspirationIndex] = useState(0);
  const inspiration = inspirations[inspirationIndex] ?? inspirations[0];

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const triggerInspirationNotification = (hour: number) => {
    const todayStr = getTodayDateString();
    const hourKey = String(hour).padStart(2, '0');
    const slotKey = `${todayStr}-${hourKey}`;
    const timeKey = `lastInspirationNotif_${slotKey}`;

    // Prevent duplicate notifications within same hour
    const lastNotifTime = localStorage.getItem(timeKey);
    const nowMs = Date.now();
    if (lastNotifTime && nowMs - Number(lastNotifTime) < 60 * 60 * 1000) {
      return; // Already notified in this hour window
    }

    // Mark as notified
    localStorage.setItem(timeKey, String(nowMs));

    const slotInspirationIndex = getSlotInspirationIndex(slotKey);
    const slotInspiration = inspirations[slotInspirationIndex] ?? inspirations[0];
    setInspirationIndex(slotInspirationIndex);

    const notif: DailyInspirationNotif = {
      id: `inspiration-${slotKey}-${Date.now()}`,
      date: todayStr,
      slotKey,
      arabic: slotInspiration.arabic,
      translation: slotInspiration.translation,
      reference: slotInspiration.reference,
      createdAt: nowMs,
    };

    // Determine time label
    const timeLabel = hour === 8 ? 'Pagi' : 'Sore';
    const timeDisplay = hour === 8 ? '08:00' : '16:00';

    // Save to storage
    saveDailyInspirationNotif(notif);

    // Send push notification
    void sendNotification(`✨ Inspirasi ${timeLabel} (${timeDisplay})`, {
      body: slotInspiration.translation,
      tag: `daily-inspiration-${slotKey}`,
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
    const syncCurrentInspiration = () => {
      const slotKey = getSlotKeyFromDate(new Date());
      const index = getSlotInspirationIndex(slotKey);
      setInspirationIndex(index);
    };

    const processMissedTodaySlots = () => {
      const now = new Date();
      const today = toDateStringLocal(now);

      getScheduledTimes().forEach((hour) => {
        const slotTime = new Date(now);
        slotTime.setHours(hour, 0, 0, 0);
        if (now < slotTime) return;

        const slotKey = `${today}-${String(hour).padStart(2, '0')}`;
        const sentKey = `lastInspirationNotif_${slotKey}`;
        const alreadySent = Boolean(localStorage.getItem(sentKey));
        if (!alreadySent) {
          triggerInspirationNotification(hour);
        }
      });
    };

    syncCurrentInspiration();
    processMissedTodaySlots();
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
        syncCurrentInspiration();
        processMissedTodaySlots();
      }
    };

    document.addEventListener('visibilitychange', onVisibilityChange);

    return () => {
      clearTimers();
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, []);

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
