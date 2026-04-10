'use client';

import React, { useState, useEffect, useMemo } from 'react';
import axios from 'axios';

interface Surah {
  number: number;
  name: string;
  latinName: string;
  englishName: string;
  numberOfAyahs: number;
  revelationType: string;
}

interface Ayah {
  number: number;
  arabicText: string;
  translationText: string;
  numberInSurah: number;
}

interface QuranApiChapter {
  id: number;
  name_arabic?: string;
  name_simple?: string;
  verses_count?: number;
  revelation_place?: string;
  translated_name?: {
    name?: string;
  };
}

interface AlQuranCloudAyah {
  numberInSurah: number;
  text: string;
}

interface AlQuranCloudEdition {
  ayahs: AlQuranCloudAyah[];
}

interface QuranReaderProps {
  initialSurah?: number;
}

export default function QuranReader({ initialSurah = 1 }: QuranReaderProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(initialSurah);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Fetch list of Surahs
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const response = await axios.get('https://api.quran.com/api/v4/chapters');
        const mappedSurahs: Surah[] = (response.data?.chapters ?? []).map((chapter: QuranApiChapter) => ({
          number: chapter.id,
          name: chapter.name_arabic ?? chapter.name_simple ?? 'Unknown',
          latinName: chapter.name_simple ?? '',
          englishName: chapter.translated_name?.name ?? chapter.name_simple ?? 'Unknown',
          numberOfAyahs: chapter.verses_count ?? 0,
          revelationType: chapter.revelation_place ?? 'unknown',
        }));

        setSurahs(mappedSurahs);
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };
    fetchSurahs();
  }, []);

  // Fetch Ayahs for selected Surah
  useEffect(() => {
    setSelectedSurah(initialSurah);
  }, [initialSurah]);

  useEffect(() => {
    const fetchAyahs = async () => {
      setLoading(true);
      try {
        const response = await axios.get(
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,en.asad`
        );

        const editions: AlQuranCloudEdition[] = response.data?.data ?? [];
        const arabicAyahs = editions[0]?.ayahs ?? [];
        const translatedAyahs = editions[1]?.ayahs ?? [];

        const mappedAyahs: Ayah[] = arabicAyahs.map((arabicAyah, index) => ({
          number: selectedSurah * 1000 + arabicAyah.numberInSurah,
          numberInSurah: arabicAyah.numberInSurah,
          arabicText: arabicAyah.text ?? '',
          translationText: translatedAyahs[index]?.text ?? 'Translation unavailable.',
        }));

        setAyahs(mappedAyahs);
      } catch (error) {
        console.error('Error fetching ayahs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAyahs();
  }, [selectedSurah]);

  // Separate Bismillah from first ayah (except surah 1 where it IS ayah 1, and surah 9 which has none)
  const { separateBismillah, displayAyahs } = useMemo(() => {
    if (selectedSurah === 1 || selectedSurah === 9 || ayahs.length === 0) {
      return { separateBismillah: null, displayAyahs: ayahs };
    }
    const firstText = ayahs[0].arabicText;

    // Normalize: replace wasla ٱ (U+0671) → regular alef ا, then strip all diacritics and Quranic marks
    const normalize = (s: string) =>
      s
        .replace(/\u0671/g, '\u0627') // wasla → alef
        .replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0640\u0670]/g, '') // strip diacritics, Quranic marks, tatweel
        .trim();

    const normFirst = normalize(firstText);
    // Bismillah without harakat: بسم الله الرحمن الرحيم
    const normBismillah = '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645';

    if (!normFirst.startsWith(normBismillah)) {
      return { separateBismillah: null, displayAyahs: ayahs };
    }

    // Walk through original text, skipping diacritics, until we've advanced past all
    // base characters of the bismillah — this gives us the exact split index.
    const isDiacritic = (code: number) =>
      (code >= 0x064B && code <= 0x065F) ||
      (code >= 0x0610 && code <= 0x061A) ||
      (code >= 0x06D6 && code <= 0x06ED) ||
      code === 0x0640 ||
      code === 0x0670;

    let origIdx = 0;
    let normIdx = 0;
    while (origIdx < firstText.length && normIdx < normBismillah.length) {
      const code = firstText.charCodeAt(origIdx);
      if (isDiacritic(code)) { origIdx++; continue; }
      const ch = code === 0x0671 ? '\u0627' : firstText[origIdx]; // normalise wasla
      if (ch === normBismillah[normIdx]) normIdx++;
      origIdx++;
    }

    // Skip any trailing diacritics / whitespace after the last bismillah char
    while (origIdx < firstText.length) {
      const code = firstText.charCodeAt(origIdx);
      if (isDiacritic(code) || firstText[origIdx] === ' ') { origIdx++; }
      else { break; }
    }

    const bismillahText = firstText.slice(0, origIdx).trim();
    const restText = firstText.slice(origIdx).trim();

    return {
      separateBismillah: bismillahText || 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ',
      displayAyahs: restText
        ? [{ ...ayahs[0], arabicText: restText }, ...ayahs.slice(1)]
        : ayahs.slice(1),
    };
  }, [ayahs, selectedSurah]);

  const normalizedSearchTerm = searchTerm.toLowerCase();

  const filteredSurahs = surahs.filter((surah) => {
    const arabicName = (surah.name ?? '').toLowerCase();
    const latinName = (surah.latinName ?? '').toLowerCase();
    const englishName = (surah.englishName ?? '').toLowerCase();

    return (
      arabicName.includes(normalizedSearchTerm) ||
      latinName.includes(normalizedSearchTerm) ||
      englishName.includes(normalizedSearchTerm)
    );
  });

  const selectedSurahInfo = surahs.find((s) => s.number === selectedSurah);
  const prevSurah = selectedSurah > 1 ? selectedSurah - 1 : null;
  const nextSurah = selectedSurah < 114 ? selectedSurah + 1 : null;
  const prevSurahInfo = prevSurah ? surahs.find((s) => s.number === prevSurah) : null;
  const nextSurahInfo = nextSurah ? surahs.find((s) => s.number === nextSurah) : null;

  return (
    <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Al-Quran</p>
          <h2 className="text-2xl font-semibold text-slate-900">Quran Reader</h2>
          <p className="text-sm text-slate-500">Arabic script with translation</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar - Surah List */}
        <div className="lg:col-span-1 lg:border-r lg:border-slate-200 lg:pr-6 dark:lg:border-slate-700">
          <input
            type="text"
            placeholder="Search Surah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-200 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-teal-500 dark:focus:ring-teal-900"
          />

          <div className="max-h-[480px] space-y-2 overflow-y-auto pr-1">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => setSelectedSurah(surah.number)}
                className={`w-full text-left px-4 py-3 rounded-lg transition-all ${
                  selectedSurah === surah.number
                    ? 'border border-blue-200 bg-blue-50 text-blue-900 dark:border-teal-700 dark:bg-teal-900/30 dark:text-teal-300'
                    : 'border border-transparent bg-slate-50 text-slate-700 hover:border-slate-200 hover:bg-white dark:bg-slate-800/60 dark:text-slate-300 dark:hover:border-slate-600 dark:hover:bg-slate-700/60'
                }`}
              >
                <div className="font-arabic text-right text-xl leading-relaxed" dir="rtl">{surah.name}</div>
                <div className="mt-1 text-sm font-semibold">{surah.number}. {surah.latinName || surah.englishName}</div>
                <div className="text-xs text-slate-500">{surah.englishName} · {surah.numberOfAyahs} ayat</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content - Ayahs */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-200"></div>
              ))}
            </div>
          ) : (
            <>
              {selectedSurahInfo && (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 dark:border-slate-700 dark:bg-slate-800/80">
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => prevSurah && setSelectedSurah(prevSurah)}
                      disabled={!prevSurah}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50"
                      title={prevSurahInfo ? `${prevSurahInfo.number}. ${prevSurahInfo.latinName}` : ''}
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                      {prevSurahInfo ? <span className="hidden sm:inline">{prevSurahInfo.latinName}</span> : 'Prev'}
                    </button>
                    <h3 className="font-arabic text-right text-3xl text-slate-900 flex-1 dark:text-slate-100" dir="rtl">
                      {selectedSurahInfo.name}
                    </h3>
                    <button
                      onClick={() => nextSurah && setSelectedSurah(nextSurah)}
                      disabled={!nextSurah}
                      className="flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-700/50"
                      title={nextSurahInfo ? `${nextSurahInfo.number}. ${nextSurahInfo.latinName}` : ''}
                    >
                      {nextSurahInfo ? <span className="hidden sm:inline">{nextSurahInfo.latinName}</span> : 'Next'}
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-slate-600 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700 dark:text-slate-300">{selectedSurahInfo.latinName}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700 dark:text-slate-300">{selectedSurahInfo.englishName}</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 dark:bg-slate-700 dark:text-slate-300">{selectedSurahInfo.numberOfAyahs} verses</span>
                    <span className="rounded-full bg-slate-100 px-3 py-1 capitalize dark:bg-slate-700 dark:text-slate-300">{selectedSurahInfo.revelationType}</span>
                  </div>
                </div>
              )}

              {separateBismillah && (
                <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 text-center dark:border-slate-700 dark:bg-slate-800/80">
                  <p className="font-arabic text-3xl leading-[2] text-slate-900" dir="rtl">{separateBismillah}</p>
                </div>
              )}

              <div className="space-y-6">
                {displayAyahs.map((ayah) => (

                  <div
                    key={ayah.number}
                    className="rounded-2xl border border-slate-200 bg-white p-5 transition hover:shadow-sm dark:border-slate-700 dark:bg-slate-800/70 dark:hover:bg-slate-800"
                  >
                    <div className="mb-3 flex items-start justify-between">
                      <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-900 dark:bg-teal-900/50 dark:text-teal-300">
                        {ayah.numberInSurah}
                      </span>
                    </div>

                    <p className="font-arabic mb-4 text-right text-3xl leading-[2.2] text-slate-900 dark:text-slate-100" dir="rtl">
                      {ayah.arabicText || '—'}
                    </p>
                    <p className="text-base leading-relaxed text-slate-600 dark:text-slate-400">
                      {ayah.translationText}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bottom prev/next navigation */}
              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={() => prevSurah && setSelectedSurah(prevSurah)}
                  disabled={!prevSurah}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:-translate-x-0.5 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  {prevSurahInfo ? (
                    <span>{prevSurahInfo.number}. {prevSurahInfo.latinName}</span>
                  ) : 'Previous'}
                </button>
                <span className="text-xs text-slate-400">{selectedSurah} / 114</span>
                <button
                  onClick={() => nextSurah && setSelectedSurah(nextSurah)}
                  disabled={!nextSurah}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50 hover:translate-x-0.5 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
                >
                  {nextSurahInfo ? (
                    <span>{nextSurahInfo.number}. {nextSurahInfo.latinName}</span>
                  ) : 'Next'}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
