import React from 'react';
import Link from 'next/link';
import QuranReader from '@/components/QuranReader';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

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
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
          <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
          </Link>
          <div>
            <MoosleemLogoMark className="mb-1" />
            <h1 className="text-2xl font-semibold text-slate-900">Al-Quran</h1>
          </div>
          </div>
          <PageHeaderActions />
        </div>

        {/* Quran Reader */}
        <QuranReader initialSurah={initialSurah} />

        <footer className="mt-10 border-t border-slate-200 pt-6 text-center text-sm text-slate-500">
          <p>Baca Al-Quran Arab dengan terjemahan Bahasa Indonesia</p>
        </footer>
      </main>
    </div>
  );
}
