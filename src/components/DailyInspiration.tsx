'use client';

import React, { useMemo } from 'react';

interface Inspiration {
  arabic: string;
  translation: string;
  reference: string;
}

const inspirations: Inspiration[] = [
  {
    arabic: 'من سار على الدرب وصل',
    translation: 'Barang siapa berjalan di atas jalan akan sampai ke tujuan',
    reference: 'Pepatah Arab',
  },
  {
    arabic: 'يسروا ولا تعسروا وبشروا ولا تنفروا',
    translation: 'Mudahkanlah dan jangan dipersulit, berikanlah kabar gembira dan jangan membuat orang lari',
    reference: 'Hadis Sahih Bukhari',
  },
  {
    arabic: 'أفضل الجهاد جهاد النفس',
    translation: 'Jihad terbaik adalah jihad melawan hawa nafsu',
    reference: 'Hadis Riwayat At-Tirmidzi',
  },
  {
    arabic: 'الدعاء هو العبادة',
    translation: 'Doa adalah ibadah',
    reference: 'Hadis Riwayat At-Tirmidzi',
  },
];

export default function DailyInspiration() {
  const inspiration = useMemo(() => {
    // Get a unique number for today (changes every calendar day)
    const today = new Date();
    const dayOfYear = Math.floor((today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) / 1000 / 60 / 60 / 24);
    return inspirations[dayOfYear % inspirations.length];
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
          <p className="mt-4 text-right text-lg font-semibold leading-9 text-slate-900 font-arabic">{inspiration.arabic}</p>
          <p className="mt-3 text-sm leading-relaxed text-slate-600">{inspiration.translation}</p>
          <p className="mt-3 text-xs text-slate-500">{inspiration.reference}</p>
        </div>
      </div>
    </div>
  );
}
