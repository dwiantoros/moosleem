'use client';

import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
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
  translated_name?: { name?: string };
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

function formatTime(secs: number): string {
  const m = Math.floor(secs / 60);
  const s = secs % 60;
  return m > 0 ? `${m}m ${s}s` : `${s}s`;
}

export default function QuranReader({ initialSurah = 1 }: QuranReaderProps) {
  const [surahs, setSurahs] = useState<Surah[]>([]);
  const [selectedSurah, setSelectedSurah] = useState<number>(initialSurah);
  const [ayahs, setAyahs] = useState<Ayah[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [readingSecs, setReadingSecs] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Start / restart timer when surah changes
  useEffect(() => {
    setReadingSecs(0);
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setReadingSecs((s) => s + 1), 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [selectedSurah]);

  // Fetch list of Surahs (cached in sessionStorage)
  useEffect(() => {
    const fetchSurahs = async () => {
      try {
        const cached = sessionStorage.getItem('quran-surahs');
        if (cached) { setSurahs(JSON.parse(cached)); return; }
        const response = await axios.get('https://api.quran.com/api/v4/chapters', { timeout: 8000 });
        const mappedSurahs: Surah[] = (response.data?.chapters ?? []).map((chapter: QuranApiChapter) => ({
          number: chapter.id,
          name: chapter.name_arabic ?? chapter.name_simple ?? 'Unknown',
          latinName: chapter.name_simple ?? '',
          englishName: chapter.translated_name?.name ?? chapter.name_simple ?? 'Unknown',
          numberOfAyahs: chapter.verses_count ?? 0,
          revelationType: chapter.revelation_place ?? 'unknown',
        }));
        setSurahs(mappedSurahs);
        sessionStorage.setItem('quran-surahs', JSON.stringify(mappedSurahs));
      } catch (error) {
        console.error('Error fetching surahs:', error);
      }
    };
    fetchSurahs();
  }, []);

  useEffect(() => {
    setSelectedSurah(initialSurah);
  }, [initialSurah]);

  const handleSelectSurah = useCallback((num: number) => {
    setSelectedSurah(num);
    setSidebarOpen(false);
  }, []);

  // Fetch Ayahs (cached in sessionStorage)
  useEffect(() => {
    const fetchAyahs = async () => {
      setLoading(true);
      try {
        const cacheKey = `quran-ayahs-${selectedSurah}`;
        const cached = sessionStorage.getItem(cacheKey);
        if (cached) { setAyahs(JSON.parse(cached)); setLoading(false); return; }

        const response = await axios.get(
          `https://api.alquran.cloud/v1/surah/${selectedSurah}/editions/quran-uthmani,en.asad`,
          { timeout: 10000 }
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
        sessionStorage.setItem(cacheKey, JSON.stringify(mappedAyahs));
      } catch (error) {
        console.error('Error fetching ayahs:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchAyahs();
  }, [selectedSurah]);

  const { separateBismillah, displayAyahs } = useMemo(() => {
    if (selectedSurah === 1 || selectedSurah === 9 || ayahs.length === 0) {
      return { separateBismillah: null, displayAyahs: ayahs };
    }
    const firstText = ayahs[0].arabicText;
    const normalize = (s: string) =>
      s.replace(/\u0671/g, '\u0627').replace(/[\u064B-\u065F\u0610-\u061A\u06D6-\u06ED\u0640\u0670]/g, '').trim();
    const normFirst = normalize(firstText);
    const normBismillah = '\u0628\u0633\u0645 \u0627\u0644\u0644\u0647 \u0627\u0644\u0631\u062D\u0645\u0646 \u0627\u0644\u0631\u062D\u064A\u0645';
    if (!normFirst.startsWith(normBismillah)) return { separateBismillah: null, displayAyahs: ayahs };

    const isDiacritic = (code: number) =>
      (code >= 0x064B && code <= 0x065F) || (code >= 0x0610 && code <= 0x061A) ||
      (code >= 0x06D6 && code <= 0x06ED) || code === 0x0640 || code === 0x0670;

    let origIdx = 0; let normIdx = 0;
    while (origIdx < firstText.length && normIdx < normBismillah.length) {
      const code = firstText.charCodeAt(origIdx);
      if (isDiacritic(code)) { origIdx++; continue; }
      const ch = code === 0x0671 ? '\u0627' : firstText[origIdx];
      if (ch === normBismillah[normIdx]) normIdx++;
      origIdx++;
    }
    while (origIdx < firstText.length) {
      const code = firstText.charCodeAt(origIdx);
      if (isDiacritic(code) || firstText[origIdx] === ' ') origIdx++;
      else break;
    }
    const bismillahText = firstText.slice(0, origIdx).trim();
    const restText = firstText.slice(origIdx).trim();
    return {
      separateBismillah: bismillahText || '\u0628\u0650\u0633\u0652\u0645\u0650 \u0671\u0644\u0644\u0651\u064e\u0647\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0652\u0645\u064e\u0670\u0646\u0650 \u0671\u0644\u0631\u0651\u064e\u062d\u0650\u064a\u0645\u0650',
      displayAyahs: restText ? [{ ...ayahs[0], arabicText: restText }, ...ayahs.slice(1)] : ayahs.slice(1),
    };
  }, [ayahs, selectedSurah]);

  const normalizedSearchTerm = searchTerm.toLowerCase();
  const filteredSurahs = surahs.filter((surah) => {
    const arabicName = (surah.name ?? '').toLowerCase();
    const latinName = (surah.latinName ?? '').toLowerCase();
    const englishName = (surah.englishName ?? '').toLowerCase();
    return arabicName.includes(normalizedSearchTerm) || latinName.includes(normalizedSearchTerm) || englishName.includes(normalizedSearchTerm);
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
          <h2 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Quran Reader</h2>
          <p className="text-sm text-slate-500">Arabic script with translation</p>
        </div>
        <div className="flex items-center gap-3">
          {/* Reading timer */}
          {readingSecs > 0 && (
            <div className="flex items-center gap-1.5 rounded-full bg-teal-50 px-3 py-1.5 text-xs font-medium text-teal-700 dark:bg-teal-900/30 dark:text-teal-400">
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
              </svg>
              {formatTime(readingSecs)}
            </div>
          )}
          {/* Mobile: toggle surah list button */}
          <button
            onClick={() => setSidebarOpen((v) => !v)}
            className="flex items-center gap-2 rounded-2xl border border-slate-200 bg-white/70 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-white lg:hidden dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
            {sidebarOpen ? 'Tutup Daftar' : 'Pilih Surah'}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Sidebar */}
        <div className={`lg:col-span-1 lg:border-r lg:border-slate-200/60 lg:pr-6 dark:lg:border-slate-700/60 ${sidebarOpen ? 'block' : 'hidden lg:block'}`}>
          <input
            type="text"
            placeholder="Cari Surah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-4 w-full rounded-2xl border border-slate-200 bg-white/95 px-4 py-3 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100 dark:border-slate-600 dark:bg-slate-800 dark:text-slate-100 dark:placeholder-slate-400 dark:focus:border-teal-500 dark:focus:ring-teal-900/50"
          />
          <div className="max-h-[60vh] space-y-1.5 overflow-y-auto pr-1 lg:max-h-[480px]">
            {filteredSurahs.map((surah) => (
              <button
                key={surah.number}
                onClick={() => handleSelectSurah(surah.number)}
                className={`w-full text-left px-3 py-2.5 rounded-xl transition-all ${
                  selectedSurah === surah.number
                    ? 'bg-teal-50 border border-teal-200 text-teal-900 dark:border-teal-700/60 dark:bg-teal-900/25 dark:text-teal-300'
                    : 'border border-transparent text-slate-700 hover:bg-white/70 hover:border-slate-200/60 dark:text-slate-300 dark:hover:bg-slate-700/50 dark:hover:border-slate-600/60'
                }`}
              >
                <div className="font-arabic text-right text-lg leading-relaxed" dir="rtl">{surah.name}</div>
                <div className="mt-0.5 text-xs font-semibold text-slate-600 dark:text-slate-400">{surah.number}. {surah.latinName || surah.englishName}</div>
                <div className="text-[11px] text-slate-400">{surah.englishName} · {surah.numberOfAyahs} ayat</div>
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-2">
          {loading ? (
            <div className="space-y-4 animate-pulse">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-20 rounded-2xl bg-slate-100 dark:bg-slate-700/40"></div>
              ))}
            </div>
          ) : (
            <>
              {selectedSurahInfo && (
                <div className="mb-5 rounded-2xl border border-slate-200/60 bg-white/95 p-5 shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                  <div className="flex items-center justify-between gap-3">
                    <button
                      onClick={() => prevSurah && setSelectedSurah(prevSurah)}
                      disabled={!prevSurah}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                    </button>
                    <div className="flex-1 text-center">
                      <h3 className="font-arabic text-3xl text-slate-900 dark:text-slate-100" dir="rtl">{selectedSurahInfo.name}</h3>
                      <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{selectedSurahInfo.latinName} · {selectedSurahInfo.numberOfAyahs} ayat</p>
                    </div>
                    <button
                      onClick={() => nextSurah && setSelectedSurah(nextSurah)}
                      disabled={!nextSurah}
                      className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-slate-200/70 bg-white/80 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-700/50 dark:text-slate-400"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 18l6-6-6-6"/></svg>
                    </button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                    <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 dark:bg-slate-700/60">{selectedSurahInfo.englishName}</span>
                    <span className="rounded-full bg-slate-100/80 px-2.5 py-0.5 capitalize dark:bg-slate-700/60">{selectedSurahInfo.revelationType}</span>
                    {readingSecs > 0 && (
                      <span className="rounded-full bg-teal-50 px-2.5 py-0.5 text-teal-600 dark:bg-teal-900/30 dark:text-teal-400">
                        ⏱ {formatTime(readingSecs)}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {separateBismillah && (
                <div className="mb-5 rounded-2xl border border-slate-200/60 bg-white/95 p-5 text-center shadow-sm dark:border-slate-700/60 dark:bg-slate-800/70">
                  <p className="font-arabic text-3xl leading-[2] text-slate-900 dark:text-slate-100" dir="rtl">{separateBismillah}</p>
                </div>
              )}

              <div className="space-y-4">
                {displayAyahs.map((ayah) => (
                  <div
                    key={ayah.number}
                    className="rounded-2xl border border-slate-200/60 bg-white/95 p-5 transition hover:bg-white hover:shadow-sm dark:border-slate-700/60 dark:bg-slate-800/60 dark:hover:bg-slate-800/80"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-teal-50 text-xs font-semibold text-teal-700 dark:bg-teal-900/40 dark:text-teal-300">
                        {ayah.numberInSurah}
                      </span>
                    </div>
                    <p className="font-arabic mb-4 text-right text-[1.75rem] leading-[2.2] text-slate-900 dark:text-slate-100" dir="rtl">
                      {ayah.arabicText || '\u2014'}
                    </p>
                    <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-400">
                      {ayah.translationText}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-8 flex items-center justify-between gap-3">
                <button
                  onClick={() => prevSurah && setSelectedSurah(prevSurah)}
                  disabled={!prevSurah}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
                  {prevSurahInfo ? `${prevSurahInfo.number}. ${prevSurahInfo.latinName}` : 'Previous'}
                </button>
                <span className="text-xs text-slate-400">{selectedSurah} / 114</span>
                <button
                  onClick={() => nextSurah && setSelectedSurah(nextSurah)}
                  disabled={!nextSurah}
                  className="flex items-center gap-2 rounded-2xl border border-slate-200/60 bg-white/95 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white hover:shadow-sm disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-700 dark:bg-slate-800/60 dark:text-slate-300"
                >
                  {nextSurahInfo ? `${nextSurahInfo.number}. ${nextSurahInfo.latinName}` : 'Next'}
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
