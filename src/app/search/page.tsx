'use client';

import React, { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import axios from 'axios';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

interface SearchSurah {
  number: number;
  name: string;
  latinName: string;
  englishName: string;
  numberOfAyahs: number;
}

interface QuranApiChapter {
  id: number;
  name_arabic?: string;
  name_simple?: string;
  verses_count?: number;
  translated_name?: {
    name?: string;
  };
}

interface SearchItem {
  id: string;
  title: string;
  description: string;
  href: string;
  category: 'Fitur' | 'Quran';
  meta?: string;
}

const featureItems: SearchItem[] = [
  {
    id: 'feature-schedule',
    title: 'Jadwal Sholat',
    description: 'Lihat jadwal sholat harian dan sholat berikutnya sesuai lokasi.',
    href: '/schedule',
    category: 'Fitur',
  },
  {
    id: 'feature-quran',
    title: 'Quran Reader',
    description: 'Baca Al-Quran lengkap dengan teks Arab dan terjemahan.',
    href: '/quran',
    category: 'Fitur',
  },
  {
    id: 'feature-doa',
    title: 'Doa Harian',
    description: 'Kumpulan doa harian ringkas untuk aktivitas sehari-hari.',
    href: '/doa',
    category: 'Fitur',
  },
  {
    id: 'feature-qibla',
    title: 'Arah Qibla',
    description: 'Kompas qibla realtime sesuai orientasi perangkat.',
    href: '/qibla',
    category: 'Fitur',
  },
  {
    id: 'feature-halal',
    title: 'Halal Nearby',
    description: 'Cari restoran dan tempat makan halal terdekat.',
    href: '/restoran-halal',
    category: 'Fitur',
  },
  {
    id: 'feature-artikel',
    title: 'Artikel Islami',
    description: 'Baca artikel, panduan, dan insight terbaru dari Moosleem.',
    href: '/artikel',
    category: 'Fitur',
  },
  {
    id: 'feature-notes',
    title: 'Catatan Pribadi',
    description: 'Simpan checklist ibadah dan catatan perjalanan Muslim.',
    href: '/notes',
    category: 'Fitur',
  },
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [surahs, setSurahs] = useState<SearchSurah[]>([]);
  const [loadingSurahs, setLoadingSurahs] = useState(true);

  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await axios.get('https://api.quran.com/api/v4/chapters');
        const mappedSurahs: SearchSurah[] = (response.data?.chapters ?? []).map((chapter: QuranApiChapter) => ({
          number: chapter.id,
          name: chapter.name_arabic ?? chapter.name_simple ?? 'Unknown',
          latinName: chapter.name_simple ?? '',
          englishName: chapter.translated_name?.name ?? chapter.name_simple ?? 'Unknown',
          numberOfAyahs: chapter.verses_count ?? 0,
        }));
        setSurahs(mappedSurahs);
      } catch (error) {
        console.error('Error fetching surahs for search:', error);
      } finally {
        setLoadingSurahs(false);
      }
    };

    fetchSurahs();
  }, []);

  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase();

    const featureResults = featureItems.filter((item) => {
      if (!normalized) return true;
      return `${item.title} ${item.description}`.toLowerCase().includes(normalized);
    });

    const surahResults: SearchItem[] = surahs
      .filter((surah) => {
        if (!normalized) return surah.number <= 8;
        return `${surah.name} ${surah.latinName} ${surah.englishName} ${surah.number}`.toLowerCase().includes(normalized);
      })
      .slice(0, normalized ? 24 : 8)
      .map((surah) => ({
        id: `surah-${surah.number}`,
        title: `${surah.number}. ${surah.latinName || surah.englishName}`,
        description: `${surah.name} · ${surah.englishName}`,
        href: `/quran?surah=${surah.number}`,
        category: 'Quran',
        meta: `${surah.numberOfAyahs} ayat`,
      }));

    return [...featureResults, ...surahResults];
  }, [query, surahs]);

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
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">Cari Surah &amp; Fitur</h1>
            </div>
          </div>
          <PageHeaderActions />
        </div>

        <section className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
          <div className="glass-subtle rounded-[1.4rem] p-3">
            <input
              autoFocus
              type="text"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Cari surah, qibla, jadwal, doa, halal nearby..."
              className="w-full bg-transparent px-3 py-2 text-base text-slate-900 outline-none placeholder:text-slate-400"
            />
          </div>

          <div className="mt-5 flex items-center justify-between text-xs text-slate-500">
            <span>{loadingSurahs ? 'Memuat data surah...' : `${results.length} hasil ditemukan`}</span>
            <span>Cari surah Quran dan fitur utama</span>
          </div>

          <div className="mt-4 space-y-3">
            {results.map((item) => (
              <Link key={item.id} href={item.href} className="glass-subtle flex items-start justify-between gap-4 rounded-[1.3rem] p-4 transition hover:bg-white/60">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-white/70 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-slate-500">{item.category}</span>
                    {item.meta ? <span className="text-xs text-slate-500">{item.meta}</span> : null}
                  </div>
                  <h2 className="mt-3 text-base font-semibold text-slate-950">{item.title}</h2>
                  <p className="mt-1 text-sm text-slate-600">{item.description}</p>
                </div>
                <svg className="mt-1 h-4 w-4 flex-shrink-0 text-slate-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            ))}

            {!loadingSurahs && results.length === 0 && (
              <div className="glass-subtle rounded-[1.3rem] p-5 text-sm text-slate-600">
                Tidak ada hasil untuk "{query}". Coba kata kunci seperti "Yasin", "Qibla", "Doa", atau "Halal".
              </div>
            )}
          </div>
        </section>
      </main>
    </div>
  );
}
