import React from 'react';
import QuranReader from '@/components/QuranReader';
import QuranStyleHeader from '@/components/QuranStyleHeader';

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ surah?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const surahParam = Number(resolvedSearchParams.surah ?? '1');
  const initialSurah = Number.isFinite(surahParam) && surahParam > 0 ? surahParam : 1;

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <QuranStyleHeader title="Al-Quran" />

        {/* Quran Reader */}
        <QuranReader initialSurah={initialSurah} />

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>Baca Al-Quran Arab dengan terjemahan Bahasa Indonesia</p>
        </footer>
      </main>
    </div>
  );
}
