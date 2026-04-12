'use client';

import { PrayerTimes } from '@/types';

export interface AzanNotificationAction {
  action: string;
  title: string;
  icon?: string;
}

export interface AzanNotificationOptions extends NotificationOptions {
  actions?: AzanNotificationAction[];
}

export interface IslamicEventNotif {
  hijriMonth: number;
  hijriDay: number;
  name: string;
  desc: string;
}

export const EVENT_NOTIFY: IslamicEventNotif[] = [
  { hijriMonth: 1, hijriDay: 1, name: 'Tahun Baru Hijriah 🌙', desc: 'Selamat Tahun Baru Islam! Semoga tahun ini penuh berkah.' },
  { hijriMonth: 1, hijriDay: 10, name: 'Hari Asyura', desc: 'Hari Asyura — puasa sunnah hari ini sangat dianjurkan.' },
  { hijriMonth: 3, hijriDay: 12, name: 'Maulid Nabi ﷺ', desc: 'Peringatan hari lahir Rasulullah ﷺ. Perbanyak shalawat.' },
  { hijriMonth: 7, hijriDay: 27, name: "Isra' Mi'raj 🕌", desc: "Peringatan perjalanan malam Nabi ﷺ ke Sidratul Muntaha." },
  { hijriMonth: 8, hijriDay: 15, name: "Nisfu Sya'ban 🌕", desc: "Malam nisfu Sya'ban — perbanyak doa dan ibadah malam ini." },
  { hijriMonth: 9, hijriDay: 1, name: 'Awal Ramadan 🌙', desc: 'Marhaban ya Ramadan! Mulai puasa hari ini. Semoga diberkahi.' },
  { hijriMonth: 9, hijriDay: 17, name: 'Nuzulul Quran 📖', desc: 'Peringatan turunnya Al-Quran. Perbanyak tilawah hari ini.' },
  { hijriMonth: 9, hijriDay: 21, name: 'Lailatul Qadar ✨', desc: 'Malam ke-21 Ramadan — kemungkinan Lailatul Qadar. Tingkatkan ibadah!' },
  { hijriMonth: 9, hijriDay: 23, name: 'Lailatul Qadar ✨', desc: 'Malam ke-23 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9, hijriDay: 25, name: 'Lailatul Qadar ✨', desc: 'Malam ke-25 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 9, hijriDay: 27, name: 'Lailatul Qadar ✨', desc: 'Malam ke-27 Ramadan — malam yang paling utama! Jangan lewatkan.' },
  { hijriMonth: 9, hijriDay: 29, name: 'Lailatul Qadar ✨', desc: 'Malam ke-29 Ramadan — kemungkinan Lailatul Qadar.' },
  { hijriMonth: 10, hijriDay: 1, name: 'Idul Fitri 🎉', desc: 'Allahu Akbar! Selamat Hari Raya Idul Fitri. Minal aidin wal faizin.' },
  { hijriMonth: 12, hijriDay: 9, name: 'Hari Arafah 🕋', desc: 'Hari Arafah — puasa sunnah yang sangat dianjurkan hari ini.' },
  { hijriMonth: 12, hijriDay: 10, name: 'Idul Adha 🐑', desc: 'Selamat Hari Raya Idul Adha 10 Dzulhijjah. Allahu Akbar!' },
];

export const NOTIFY_PRAYERS: Array<keyof PrayerTimes> = ['Fajr', 'Dhuhr', 'Asr', 'Maghrib', 'Isha'];

export const PRAYER_LABELS: Record<string, string> = {
  Fajr: 'Subuh',
  Dhuhr: 'Dzuhur',
  Asr: 'Ashar',
  Maghrib: 'Maghrib',
  Isha: "Isya'",
};

export const PRAYER_ARABIC: Record<string, string> = {
  Fajr: 'الفجر',
  Dhuhr: 'الظهر',
  Asr: 'العصر',
  Maghrib: 'المغرب',
  Isha: 'العشاء',
};

export const MINUTES_BEFORE = 10;

export function gregorianToHijri(gDate: Date): { month: number; day: number } {
  const jd = Math.floor(
    (1461 * (gDate.getFullYear() + 4800 + Math.floor((gDate.getMonth() + 1 - 14) / 12))) / 4 +
      Math.floor((367 * (gDate.getMonth() + 1 - 2 - 12 * Math.floor((gDate.getMonth() + 1 - 14) / 12))) / 12) -
      Math.floor((3 * Math.floor((gDate.getFullYear() + 4900 + Math.floor((gDate.getMonth() + 1 - 14) / 12)) / 100)) / 4) +
      gDate.getDate() -
      32075
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

export function parsePrayerMs(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const d = new Date();
  d.setHours(Number(match[1]), Number(match[2]), 0, 0);
  return d.getTime();
}

const AZAN_GENERAL_URLS = [
  '/Adzan.mp3',
  '/azan.mp3',
  'https://ia802609.us.archive.org/13/items/AzanMakkah/AzanMakkah.mp3',
  'https://ia800202.us.archive.org/17/items/AdhanazeazanAzan/Adan.mp3',
];

const AZAN_SUBUH_URLS = [
  '/adzan_shubuh.mp3',
  '/Adzan-Shubuh.mp3',
  '/adzan-shubuh.mp3',
];

let azanAudioGeneral: HTMLAudioElement | null = null;
let azanAudioSubuh: HTMLAudioElement | null = null;
let azanGeneralLoadPromise: Promise<HTMLAudioElement | null> | null = null;
let azanSubuhLoadPromise: Promise<HTMLAudioElement | null> | null = null;
let audioCtxRef: AudioContext | null = null;

async function canLoadAudio(url: string): Promise<boolean> {
  return new Promise((resolve) => {
    const audio = new Audio();
    const finalize = (result: boolean) => {
      audio.removeEventListener('canplaythrough', onReady);
      audio.removeEventListener('error', onError);
      resolve(result);
    };
    const onReady = () => finalize(true);
    const onError = () => finalize(false);

    audio.preload = 'auto';
    audio.src = url;
    audio.addEventListener('canplaythrough', onReady, { once: true });
    audio.addEventListener('error', onError, { once: true });
    audio.load();

    window.setTimeout(() => finalize(false), 4000);
  });
}

async function tryLoadAudio(urls: string[]): Promise<HTMLAudioElement | null> {
  for (const url of urls) {
    try {
      const ok = await canLoadAudio(url);
      if (!ok) continue;

      const audio = new Audio(url);
      audio.preload = 'auto';
      audio.load();
      return audio;
    } catch {
      // try next source
    }
  }

  return null;
}

async function loadAzanAudio(prayer?: keyof PrayerTimes): Promise<HTMLAudioElement | null> {
  const isSubuh = prayer === 'Fajr';

  if (isSubuh) {
    if (azanAudioSubuh) return azanAudioSubuh;
    if (!azanSubuhLoadPromise) {
      azanSubuhLoadPromise = tryLoadAudio(AZAN_SUBUH_URLS).then((audio) => {
        azanAudioSubuh = audio;
        return audio;
      });
    }
    return azanSubuhLoadPromise;
  }

  if (azanAudioGeneral) return azanAudioGeneral;
  if (!azanGeneralLoadPromise) {
    azanGeneralLoadPromise = tryLoadAudio(AZAN_GENERAL_URLS).then((audio) => {
      azanAudioGeneral = audio;
      return audio;
    });
  }
  return azanGeneralLoadPromise;
}

function playSynthChime(isShort = false) {
  try {
    const legacyWindow = window as Window & {
      webkitAudioContext?: typeof AudioContext;
    };
    const AudioCtor = window.AudioContext || legacyWindow.webkitAudioContext;
    if (!AudioCtor) return;

    if (!audioCtxRef || audioCtxRef.state === 'closed') {
      audioCtxRef = new AudioCtor();
    }

    const ctx = audioCtxRef;
    if (ctx.state === 'suspended') {
      void ctx.resume();
    }

    const t = ctx.currentTime;
    const bell = (freq: number, start: number, duration: number, volume = 0.28) => {
      const osc = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc.type = 'sine';
      osc2.type = 'sine';
      osc.frequency.setValueAtTime(freq, t + start);
      osc2.frequency.setValueAtTime(freq * 2.756, t + start);
      gain.gain.setValueAtTime(0, t + start);
      gain.gain.linearRampToValueAtTime(volume, t + start + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.0001, t + start + duration);
      osc.start(t + start);
      osc.stop(t + start + duration);
      osc2.start(t + start);
      osc2.stop(t + start + duration);
    };

    if (isShort) {
      bell(440, 0, 1.5, 0.22);
      bell(550, 1.7, 1.2, 0.2);
      bell(440, 3, 2, 0.22);
      return;
    }

    const root = 220;
    bell(root, 0, 2.5, 0.3);
    bell(root * 1.25, 2.7, 2, 0.28);
    bell(root * 1.5, 4.8, 2.5, 0.28);
    bell(root * 1.33, 7.4, 2, 0.26);
    bell(root, 9.5, 3.5, 0.3);
  } catch {
    // ignore playback failures
  }
}

export async function primeAzanAudio(prayer?: keyof PrayerTimes): Promise<void> {
  try {
    const audio = await loadAzanAudio(prayer);
    if (!audio) {
      playSynthChime(false);
      return;
    }

    const prevMuted = audio.muted;
    audio.currentTime = 0;
    audio.muted = true;
    await audio.play();
    audio.pause();
    audio.currentTime = 0;
    audio.muted = prevMuted;
  } catch {
    playSynthChime(false);
  }
}

export async function playAzanSound(type: 'azan' | 'before' | 'test' = 'azan', prayer?: keyof PrayerTimes) {
  const isShort = type === 'before';

  try {
    if (isShort) {
      playSynthChime(true);
      return;
    }

    const audio = await loadAzanAudio(prayer);
    if (audio) {
      audio.muted = false;
      audio.volume = 1;
      audio.playbackRate = 1;
      audio.currentTime = 0;
      await audio.play();
      return;
    }
  } catch {
    // fall back below
  }

  playSynthChime(isShort);
}

export function stopAzanSound(): void {
  const stopAudio = (audio: HTMLAudioElement | null) => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
  };

  stopAudio(azanAudioGeneral);
  stopAudio(azanAudioSubuh);

  if (audioCtxRef && audioCtxRef.state === 'running') {
    void audioCtxRef.suspend();
  }
}

export async function ensureAzanServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator)) return;

  const registration = await navigator.serviceWorker.getRegistration();
  if (!registration) {
    await navigator.serviceWorker.register('/sw.js');
  }

  await navigator.serviceWorker.ready;
}

export async function sendNotification(title: string, options: AzanNotificationOptions): Promise<void> {
  try {
    if ('serviceWorker' in navigator) {
      await ensureAzanServiceWorker();
      const registration = await navigator.serviceWorker.ready;
      await registration.showNotification(title, options);
      return;
    }
  } catch {
    // fall through
  }

  if ('Notification' in window) {
    new Notification(title, options);
  }
}
