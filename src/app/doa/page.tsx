'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

const prayers = [
  {
    title: 'Doa Sebelum Bepergian',
    arabic: 'سُبْحَانَ الَّذِيْ سَخَّرَ لَنَا هٰذَا وَمَا كُنَّا لَهُ مُقْرِنِيْنَ وَاِنَّآ اِلٰى رَبِّنَا لَمُنْقَلِبُوْنَ',
    transliteration: 'Subhanalladzi sakh-khara lana hadza wa ma kunna lahu muqrinin wa inna ila rabbina lamunqalibun',
    translation: 'Maha suci Allah yang menundukkan ini bagi kami, padahal kami sebelumnya tidak mampu menguasainya.',
  },
  {
    title: 'Doa Memohon Kemudahan',
    arabic: 'اللَّهُمَّ لَا سَهْلَ إِلَّا مَا جَعَلْتَهُ سَهْلًا وَأَنْتَ تَجْعَلُ الْحَزْنَ إِذَا شِئْتَ سَهْلًا',
    transliteration: 'Allahumma la sahla illa ma ja’altahu sahla, wa anta taj’alul hazna idza syi’ta sahla',
    translation: 'Ya Allah, tidak ada kemudahan kecuali yang Engkau buat mudah.',
  },
  {
    title: 'Doa Setelah Adzan',
    arabic: 'اللَّهُمَّ رَبَّ هَذِهِ الدَّعْوَةِ التَّامَّةِ وَالصَّلَاةِ الْقَائِمَةِ آتِ مُحَمَّدًا الْوَسِيلَةَ وَالْفَضِيلَةَ',
    transliteration: 'Allahumma rabba hadzihid da’wati tammati wash shalatil qa’imah, ati Muhammadanil wasilata wal fadhilah',
    translation: 'Ya Allah, Rabb pemilik seruan yang sempurna ini dan shalat yang akan didirikan.',
  },
];

export default function DoaPage() {
  const { dailyPrayer, otherPrayers } = useMemo(() => {
    // Get unique number for today (changes every calendar day)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    const dailyIndex = dayOfYear % prayers.length;
    const dailyPrayer = prayers[dailyIndex];
    const otherPrayers = prayers.filter((_, i) => i !== dailyIndex);
    return { dailyPrayer, otherPrayers };
  }, []);
  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-5xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
            </Link>
            <div>
              <MoosleemLogoMark className="mb-1" />
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Doa Harian Pilihan</h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        <section className="space-y-4">
          <div className="glass-panel rounded-[1.6rem] p-5 sm:p-6 ring-2 ring-amber-400 bg-amber-50/50 dark:ring-amber-600 dark:bg-amber-900/20">
            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-amber-400 text-xs font-bold text-white">★</span>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-amber-700 dark:text-amber-300">Doa Pilihan Hari Ini</p>
            </div>
            <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-600 dark:text-slate-400">{dailyPrayer.title}</p>
            <p className="mt-4 text-right text-2xl leading-[2.4] font-semibold text-slate-950 font-arabic">{dailyPrayer.arabic}</p>
            <p className="mt-4 text-sm italic text-slate-600 dark:text-slate-400">{dailyPrayer.transliteration}</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{dailyPrayer.translation}</p>
          </div>

          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500 px-2 py-3">Doa-doa Pilihan Lainnya</p>
          {otherPrayers.map((prayer) => (
            <article key={prayer.title} className="glass-panel rounded-[1.6rem] p-5 sm:p-6">
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-500">{prayer.title}</p>
              <p className="mt-4 text-right text-2xl leading-[2.4] font-semibold text-slate-950 font-arabic">{prayer.arabic}</p>
              <p className="mt-4 text-sm italic text-slate-500">{prayer.transliteration}</p>
              <p className="mt-3 text-sm leading-relaxed text-slate-700">{prayer.translation}</p>
            </article>
          ))}
        </section>
      </main>
    </div>
  );
}
