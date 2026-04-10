import React from 'react';
import Link from 'next/link';
import QuranReader from '@/components/QuranReader';

export default async function QuranPage({
  searchParams,
}: {
  searchParams: Promise<{ surah?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const surahParam = Number(resolvedSearchParams.surah ?? '1');
  const initialSurah = Number.isFinite(surahParam) && surahParam > 0 ? surahParam : 1;

  return (
    <div className="min-h-screen pb-8">
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 flex items-center gap-3">
          <Link href="/" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60">
            <span>←</span>
          </Link>
          <div>
            <p className="text-sm text-slate-600">Muslim Traveler</p>
            <h1 className="text-2xl font-semibold text-slate-900">Al-Quran</h1>
          </div>
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
