import axios from 'axios';
import { listPushSubscribers, removePushSubscriber, upsertPushSubscriber } from '@/server/push/store';
import { PushPayload, PushSubscriber } from '@/server/push/types';
import { sendWebPush } from '@/server/push/webpush';

const ALADHAN_API = 'https://api.aladhan.com/v1';
const PRAYERS: Array<'Fajr' | 'Dhuhr' | 'Asr' | 'Maghrib' | 'Isha'> = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];
const LABELS: Record<string, string> = {
  Fajr: 'Subuh',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: "Isya'",
};
const MINUTES_BEFORE = 10;

function getZonedNow(timezone: string): {
  date: string;
  hour: number;
  minute: number;
} {
  const formatter = new Intl.DateTimeFormat('en-CA', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(new Date());
  const map = new Map<string, string>();
  parts.forEach((part) => {
    if (part.type !== 'literal') {
      map.set(part.type, part.value);
    }
  });

  const year = map.get('year') ?? '1970';
  const month = map.get('month') ?? '01';
  const day = map.get('day') ?? '01';
  const hour = Number(map.get('hour') ?? '0');
  const minute = Number(map.get('minute') ?? '0');

  return {
    date: `${year}-${month}-${day}`,
    hour,
    minute,
  };
}

function cleanTiming(raw: string): string {
  return raw.split(' ')[0];
}

function toMinuteOfDay(time: string): number | null {
  const match = cleanTiming(time).match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  return Number(match[1]) * 60 + Number(match[2]);
}

function isSameMinute(time: string, hour: number, minute: number): boolean {
  const target = toMinuteOfDay(time);
  if (target === null) return false;
  return target === hour * 60 + minute;
}

function isBeforeMinute(time: string, hour: number, minute: number, minutesBefore: number): boolean {
  const target = toMinuteOfDay(time);
  if (target === null) return false;

  const nowMinute = hour * 60 + minute;
  const beforeMinute = target - minutesBefore;
  return nowMinute === beforeMinute;
}

async function fetchPrayerTimes(subscriber: PushSubscriber, date: string): Promise<Record<string, string> | null> {
  try {
    const response = await axios.get(`${ALADHAN_API}/timings/${date}`, {
      params: {
        latitude: subscriber.latitude,
        longitude: subscriber.longitude,
        method: subscriber.method,
      },
      timeout: 9000,
    });

    return response.data?.data?.timings ?? null;
  } catch {
    return null;
  }
}

function alreadySent(subscriber: PushSubscriber, tag: string): boolean {
  return subscriber.lastSentTags.includes(tag);
}

async function markSent(subscriber: PushSubscriber, tag: string): Promise<void> {
  const unique = [tag, ...subscriber.lastSentTags.filter((t) => t !== tag)].slice(0, 30);
  const next: PushSubscriber = {
    ...subscriber,
    lastSentTags: unique,
    updatedAt: Date.now(),
  };

  await upsertPushSubscriber(next);
}

export async function runPushPrayerCron(): Promise<{
  total: number;
  sent: number;
  removed: number;
}> {
  const subscribers = await listPushSubscribers();
  let sent = 0;
  let removed = 0;

  for (const subscriber of subscribers) {
    const zoned = getZonedNow(subscriber.timezone);
    const timings = await fetchPrayerTimes(subscriber, zoned.date);
    if (!timings) continue;

    for (const prayer of PRAYERS) {
      const timing = timings[prayer];
      if (!timing) continue;

      const label = LABELS[prayer] ?? prayer;

      if (isSameMinute(timing, zoned.hour, zoned.minute)) {
        const tag = `push-at-${subscriber.timezone}-${zoned.date}-${prayer}`;
        if (!alreadySent(subscriber, tag)) {
          const payload: PushPayload = {
            title: `🕌 Allahu Akbar — Waktu ${label}`,
            body: `Waktu sholat ${label} pukul ${cleanTiming(timing)} telah tiba.`,
            tag,
            requireInteraction: true,
            url: '/',
            actions: [
              { action: 'open-app', title: 'Buka' },
              { action: 'stop-azan', title: 'Stop Adzan' },
            ],
          };

          const result = await sendWebPush(subscriber, payload);
          if (result.expired) {
            await removePushSubscriber(subscriber.endpoint);
            removed += 1;
            break;
          }
          if (result.delivered) {
            sent += 1;
            await markSent(subscriber, tag);
          }
        }
      }

      if (isBeforeMinute(timing, zoned.hour, zoned.minute, MINUTES_BEFORE)) {
        const tag = `push-before-${subscriber.timezone}-${zoned.date}-${prayer}`;
        if (!alreadySent(subscriber, tag)) {
          const payload: PushPayload = {
            title: `⏰ ${label} dalam ${MINUTES_BEFORE} menit`,
            body: `Bersiaplah untuk sholat ${label}. Masuk pukul ${cleanTiming(timing)}.`,
            tag,
            requireInteraction: false,
            url: '/',
            actions: [{ action: 'open-app', title: 'Buka' }],
          };

          const result = await sendWebPush(subscriber, payload);
          if (result.expired) {
            await removePushSubscriber(subscriber.endpoint);
            removed += 1;
            break;
          }
          if (result.delivered) {
            sent += 1;
            await markSent(subscriber, tag);
          }
        }
      }
    }
  }

  return {
    total: subscribers.length,
    sent,
    removed,
  };
}
