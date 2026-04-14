'use client';

import React, { useState, useMemo, useRef } from 'react';
import Link from 'next/link';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

const ASMAUL_HUSNA = [
  { no: 1,  arabic: 'ٱللَّهُ',          latin: 'Allah',           meaning: 'Yang Maha Berhak Disembah', color: '#0d9488' },
  { no: 2,  arabic: 'ٱلرَّحْمَٰنُ',     latin: 'Ar-Rahman',       meaning: 'Yang Maha Pengasih', color: '#0891b2' },
  { no: 3,  arabic: 'ٱلرَّحِيمُ',       latin: 'Ar-Rahim',        meaning: 'Yang Maha Penyayang', color: '#7c3aed' },
  { no: 4,  arabic: 'ٱلْمَلِكُ',        latin: 'Al-Malik',        meaning: 'Yang Maha Merajai', color: '#b45309' },
  { no: 5,  arabic: 'ٱلْقُدُّوسُ',      latin: 'Al-Quddus',       meaning: 'Yang Maha Suci', color: '#0369a1' },
  { no: 6,  arabic: 'ٱلسَّلَامُ',       latin: 'As-Salam',        meaning: 'Yang Maha Memberi Keselamatan', color: '#15803d' },
  { no: 7,  arabic: 'ٱلْمُؤْمِنُ',      latin: "Al-Mu'min",       meaning: 'Yang Maha Memberi Keamanan', color: '#9333ea' },
  { no: 8,  arabic: 'ٱلْمُهَيْمِنُ',    latin: 'Al-Muhaimin',     meaning: 'Yang Maha Memelihara', color: '#be123c' },
  { no: 9,  arabic: 'ٱلْعَزِيزُ',       latin: "Al-'Aziz",        meaning: 'Yang Maha Perkasa', color: '#ea580c' },
  { no: 10, arabic: 'ٱلْجَبَّارُ',      latin: 'Al-Jabbar',       meaning: 'Yang Maha Gagah', color: '#ca8a04' },
  { no: 11, arabic: 'ٱلْمُتَكَبِّرُ',   latin: 'Al-Mutakabbir',   meaning: 'Yang Memiliki Keagungan', color: '#0d9488' },
  { no: 12, arabic: 'ٱلْخَالِقُ',       latin: 'Al-Khaliq',       meaning: 'Yang Maha Pencipta', color: '#0891b2' },
  { no: 13, arabic: 'ٱلْبَارِئُ',       latin: "Al-Bari'",        meaning: 'Yang Maha Melepaskan', color: '#7c3aed' },
  { no: 14, arabic: 'ٱلْمُصَوِّرُ',     latin: 'Al-Musawwir',     meaning: 'Yang Maha Membentuk Rupa', color: '#b45309' },
  { no: 15, arabic: 'ٱلْغَفَّارُ',      latin: 'Al-Ghaffar',      meaning: 'Yang Maha Pengampun', color: '#0369a1' },
  { no: 16, arabic: 'ٱلْقَهَّارُ',      latin: 'Al-Qahhar',       meaning: 'Yang Maha Perkasa', color: '#15803d' },
  { no: 17, arabic: 'ٱلْوَهَّابُ',      latin: 'Al-Wahhab',       meaning: 'Yang Maha Pemberi', color: '#9333ea' },
  { no: 18, arabic: 'ٱلرَّزَّاقُ',      latin: 'Ar-Razzaq',       meaning: 'Yang Maha Pemberi Rezeki', color: '#be123c' },
  { no: 19, arabic: 'ٱلْفَتَّاحُ',      latin: 'Al-Fattah',       meaning: 'Yang Maha Pembuka', color: '#ea580c' },
  { no: 20, arabic: 'ٱلْعَلِيمُ',       latin: "Al-'Alim",        meaning: 'Yang Maha Mengetahui', color: '#ca8a04' },
  { no: 21, arabic: 'ٱلْقَابِضُ',       latin: 'Al-Qabidh',       meaning: 'Yang Maha Menyempitkan', color: '#0d9488' },
  { no: 22, arabic: 'ٱلْبَاسِطُ',       latin: 'Al-Basit',        meaning: 'Yang Maha Melapangkan', color: '#0891b2' },
  { no: 23, arabic: 'ٱلْخَافِضُ',       latin: 'Al-Khafidh',      meaning: 'Yang Maha Merendahkan', color: '#7c3aed' },
  { no: 24, arabic: 'ٱلرَّافِعُ',       latin: "Ar-Rafi'",        meaning: 'Yang Maha Meninggikan', color: '#b45309' },
  { no: 25, arabic: 'ٱلْمُعِزُّ',       latin: "Al-Mu'izz",       meaning: 'Yang Maha Memuliakan', color: '#0369a1' },
  { no: 26, arabic: 'ٱلْمُذِلُّ',       latin: 'Al-Mudzill',      meaning: 'Yang Maha Menghinakan', color: '#15803d' },
  { no: 27, arabic: 'ٱلسَّمِيعُ',       latin: "As-Sami'",        meaning: 'Yang Maha Mendengar', color: '#9333ea' },
  { no: 28, arabic: 'ٱلْبَصِيرُ',       latin: 'Al-Bashir',       meaning: 'Yang Maha Melihat', color: '#be123c' },
  { no: 29, arabic: 'ٱلْحَكَمُ',        latin: 'Al-Hakam',        meaning: 'Yang Maha Menetapkan Hukum', color: '#ea580c' },
  { no: 30, arabic: 'ٱلْعَدْلُ',        latin: "Al-'Adl",         meaning: 'Yang Maha Adil', color: '#ca8a04' },
  { no: 31, arabic: 'ٱللَّطِيفُ',       latin: 'Al-Latif',        meaning: 'Yang Maha Lembut', color: '#0d9488' },
  { no: 32, arabic: 'ٱلْخَبِيرُ',       latin: 'Al-Khabir',       meaning: 'Yang Maha Mengenal', color: '#0891b2' },
  { no: 33, arabic: 'ٱلْحَلِيمُ',       latin: 'Al-Halim',        meaning: 'Yang Maha Penyantun', color: '#7c3aed' },
  { no: 34, arabic: 'ٱلْعَظِيمُ',       latin: "Al-'Azhim",       meaning: 'Yang Maha Agung', color: '#b45309' },
  { no: 35, arabic: 'ٱلْغَفُورُ',       latin: 'Al-Ghafur',       meaning: 'Yang Maha Memaafkan', color: '#0369a1' },
  { no: 36, arabic: 'ٱلشَّكُورُ',       latin: 'Asy-Syakur',      meaning: 'Yang Maha Mensyukuri', color: '#15803d' },
  { no: 37, arabic: 'ٱلْعَلِىُّ',       latin: "Al-'Ali",         meaning: 'Yang Maha Tinggi', color: '#9333ea' },
  { no: 38, arabic: 'ٱلْكَبِيرُ',       latin: 'Al-Kabir',        meaning: 'Yang Maha Besar', color: '#be123c' },
  { no: 39, arabic: 'ٱلْحَفِيظُ',       latin: 'Al-Hafizh',       meaning: 'Yang Maha Memelihara', color: '#ea580c' },
  { no: 40, arabic: 'ٱلْمُقِيتُ',       latin: 'Al-Muqit',        meaning: 'Yang Maha Memberi Kecukupan', color: '#ca8a04' },
  { no: 41, arabic: 'ٱلْحَسِيبُ',       latin: 'Al-Hasib',        meaning: 'Yang Maha Membuat Perhitungan', color: '#0d9488' },
  { no: 42, arabic: 'ٱلْجَلِيلُ',       latin: 'Al-Jalil',        meaning: 'Yang Maha Mulia', color: '#0891b2' },
  { no: 43, arabic: 'ٱلْكَرِيمُ',       latin: 'Al-Karim',        meaning: 'Yang Maha Mulia (Dermawan)', color: '#7c3aed' },
  { no: 44, arabic: 'ٱلرَّقِيبُ',       latin: 'Ar-Raqib',        meaning: 'Yang Maha Mengawasi', color: '#b45309' },
  { no: 45, arabic: 'ٱلْمُجِيبُ',       latin: 'Al-Mujib',        meaning: 'Yang Maha Mengabulkan', color: '#0369a1' },
  { no: 46, arabic: 'ٱلْوَاسِعُ',       latin: "Al-Wasi'",        meaning: 'Yang Maha Luas', color: '#15803d' },
  { no: 47, arabic: 'ٱلْحَكِيمُ',       latin: 'Al-Hakim',        meaning: 'Yang Maha Bijaksana', color: '#9333ea' },
  { no: 48, arabic: 'ٱلْوَدُودُ',       latin: 'Al-Wadud',        meaning: 'Yang Maha Mencintai', color: '#be123c' },
  { no: 49, arabic: 'ٱلْمَجِيدُ',       latin: 'Al-Majid',        meaning: 'Yang Maha Mulia', color: '#ea580c' },
  { no: 50, arabic: 'ٱلْبَاعِثُ',       latin: "Al-Ba'its",       meaning: 'Yang Maha Membangkitkan', color: '#ca8a04' },
  { no: 51, arabic: 'ٱلشَّهِيدُ',       latin: 'Asy-Syahid',      meaning: 'Yang Maha Menyaksikan', color: '#0d9488' },
  { no: 52, arabic: 'ٱلْحَقُّ',         latin: 'Al-Haqq',         meaning: 'Yang Maha Benar', color: '#0891b2' },
  { no: 53, arabic: 'ٱلْوَكِيلُ',       latin: 'Al-Wakil',        meaning: 'Yang Maha Memelihara', color: '#7c3aed' },
  { no: 54, arabic: 'ٱلْقَوِيُّ',       latin: 'Al-Qawiyy',       meaning: 'Yang Maha Kuat', color: '#b45309' },
  { no: 55, arabic: 'ٱلْمَتِينُ',       latin: 'Al-Matin',        meaning: 'Yang Maha Kokoh', color: '#0369a1' },
  { no: 56, arabic: 'ٱلْوَلِيُّ',       latin: 'Al-Waliyy',       meaning: 'Yang Maha Melindungi', color: '#15803d' },
  { no: 57, arabic: 'ٱلْحَمِيدُ',       latin: 'Al-Hamid',        meaning: 'Yang Maha Terpuji', color: '#9333ea' },
  { no: 58, arabic: 'ٱلْمُحْصِي',       latin: 'Al-Muhshi',       meaning: 'Yang Maha Menghitung', color: '#be123c' },
  { no: 59, arabic: 'ٱلْمُبْدِئُ',      latin: "Al-Mubdi'",       meaning: 'Yang Maha Memulai', color: '#ea580c' },
  { no: 60, arabic: 'ٱلْمُعِيدُ',       latin: "Al-Mu'id",        meaning: 'Yang Maha Mengembalikan', color: '#ca8a04' },
  { no: 61, arabic: 'ٱلْمُحْيِي',       latin: 'Al-Muhyi',        meaning: 'Yang Maha Menghidupkan', color: '#0d9488' },
  { no: 62, arabic: 'ٱلْمُمِيتُ',       latin: 'Al-Mumit',        meaning: 'Yang Maha Mematikan', color: '#0891b2' },
  { no: 63, arabic: 'ٱلْحَيُّ',         latin: 'Al-Hayy',         meaning: 'Yang Maha Hidup', color: '#7c3aed' },
  { no: 64, arabic: 'ٱلْقَيُّومُ',      latin: 'Al-Qayyum',       meaning: 'Yang Berdiri Sendiri', color: '#b45309' },
  { no: 65, arabic: 'ٱلْوَاجِدُ',       latin: 'Al-Wajid',        meaning: 'Yang Maha Menemukan', color: '#0369a1' },
  { no: 66, arabic: 'ٱلْمَاجِدُ',       latin: 'Al-Majid',        meaning: 'Yang Maha Mulia', color: '#15803d' },
  { no: 67, arabic: 'ٱلْوَاحِدُ',       latin: 'Al-Wahid',        meaning: 'Yang Maha Esa', color: '#9333ea' },
  { no: 68, arabic: 'ٱلْأَحَدُ',        latin: 'Al-Ahad',         meaning: 'Yang Maha Tunggal', color: '#be123c' },
  { no: 69, arabic: 'ٱلصَّمَدُ',        latin: 'As-Samad',        meaning: 'Yang Maha Dibutuhkan', color: '#ea580c' },
  { no: 70, arabic: 'ٱلْقَادِرُ',       latin: 'Al-Qadir',        meaning: 'Yang Maha Menentukan', color: '#ca8a04' },
  { no: 71, arabic: 'ٱلْمُقْتَدِرُ',    latin: 'Al-Muqtadir',     meaning: 'Yang Maha Berkuasa', color: '#0d9488' },
  { no: 72, arabic: 'ٱلْمُقَدِّمُ',     latin: 'Al-Muqaddim',     meaning: 'Yang Maha Mendahulukan', color: '#0891b2' },
  { no: 73, arabic: 'ٱلْمُؤَخِّرُ',     latin: "Al-Mu'akhkhir",   meaning: 'Yang Maha Mengakhirkan', color: '#7c3aed' },
  { no: 74, arabic: 'ٱلْأَوَّلُ',       latin: 'Al-Awwal',        meaning: 'Yang Awal', color: '#b45309' },
  { no: 75, arabic: 'ٱلْأَخِرُ',        latin: 'Al-Akhir',        meaning: 'Yang Akhir', color: '#0369a1' },
  { no: 76, arabic: 'ٱلظَّاهِرُ',       latin: 'Azh-Zhahir',      meaning: 'Yang Nyata', color: '#15803d' },
  { no: 77, arabic: 'ٱلْبَاطِنُ',       latin: 'Al-Batin',        meaning: 'Yang Tersembunyi', color: '#9333ea' },
  { no: 78, arabic: 'ٱلْوَالِي',        latin: 'Al-Wali',         meaning: 'Yang Maha Memerintah', color: '#be123c' },
  { no: 79, arabic: 'ٱلْمُتَعَالِي',    latin: "Al-Muta'ali",     meaning: 'Yang Maha Tinggi', color: '#ea580c' },
  { no: 80, arabic: 'ٱلْبَرُّ',         latin: 'Al-Barr',         meaning: 'Yang Maha Berbuat Kebajikan', color: '#ca8a04' },
  { no: 81, arabic: 'ٱلتَّوَّابُ',      latin: 'At-Tawwab',       meaning: 'Yang Maha Penerima Taubat', color: '#0d9488' },
  { no: 82, arabic: 'ٱلْمُنْتَقِمُ',    latin: 'Al-Muntaqim',     meaning: 'Yang Maha Penyiksa', color: '#0891b2' },
  { no: 83, arabic: 'ٱلْعَفُوُّ',       latin: "Al-'Afuww",       meaning: 'Yang Maha Pemaaf', color: '#7c3aed' },
  { no: 84, arabic: 'ٱلرَّءُوفُ',       latin: "Ar-Ra'uf",        meaning: 'Yang Maha Pengasih', color: '#b45309' },
  { no: 85, arabic: 'مَالِكُ ٱلْمُلْكِ', latin: 'Malik-ul-Mulk',  meaning: 'Yang Maha Menguasai Kerajaan', color: '#0369a1' },
  { no: 86, arabic: 'ذُو ٱلْجَلَالِ وَٱلْإِكْرَامِ', latin: 'Dzul-Jalali wal-Ikram', meaning: 'Yang Maha Memiliki Kebesaran', color: '#15803d' },
  { no: 87, arabic: 'ٱلْمُقْسِطُ',      latin: 'Al-Muqsit',       meaning: 'Yang Maha Adil', color: '#9333ea' },
  { no: 88, arabic: 'ٱلْجَامِعُ',       latin: "Al-Jami'",        meaning: 'Yang Maha Mengumpulkan', color: '#be123c' },
  { no: 89, arabic: 'ٱلْغَنِيُّ',       latin: 'Al-Ghani',        meaning: 'Yang Maha Kaya', color: '#ea580c' },
  { no: 90, arabic: 'ٱلْمُغْنِي',       latin: 'Al-Mughni',       meaning: 'Yang Maha Memberi Kekayaan', color: '#ca8a04' },
  { no: 91, arabic: 'ٱلْمَانِعُ',       latin: "Al-Mani'",        meaning: 'Yang Maha Mencegah', color: '#0d9488' },
  { no: 92, arabic: 'ٱلضَّارُّ',        latin: 'Adh-Dharr',       meaning: 'Yang Maha Pemberi Derita', color: '#0891b2' },
  { no: 93, arabic: 'ٱلنَّافِعُ',       latin: 'An-Nafi',         meaning: 'Yang Maha Memberi Manfaat', color: '#7c3aed' },
  { no: 94, arabic: 'ٱلنُّورُ',         latin: 'An-Nur',          meaning: 'Yang Maha Bercahaya', color: '#b45309' },
  { no: 95, arabic: 'ٱلْهَادِي',        latin: 'Al-Hadi',         meaning: 'Yang Maha Pemberi Petunjuk', color: '#0369a1' },
  { no: 96, arabic: 'ٱلْبَدِيعُ',       latin: "Al-Badi'",        meaning: 'Yang Maha Pencipta Keindahan', color: '#15803d' },
  { no: 97, arabic: 'ٱلْبَاقِي',        latin: 'Al-Baqi',         meaning: 'Yang Maha Kekal', color: '#9333ea' },
  { no: 98, arabic: 'ٱلْوَارِثُ',       latin: 'Al-Warits',       meaning: 'Yang Maha Pewaris', color: '#be123c' },
  { no: 99, arabic: 'ٱلرَّشِيدُ',       latin: 'Ar-Rasyid',       meaning: 'Yang Maha Pandai', color: '#ea580c' },
];

export default function AsmaulHusnaPage() {
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<(typeof ASMAUL_HUSNA)[0] | null>(null);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const modalRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ASMAUL_HUSNA;
    return ASMAUL_HUSNA.filter(
      (n) =>
        n.latin.toLowerCase().includes(q) ||
        n.meaning.toLowerCase().includes(q) ||
        String(n.no).includes(q)
    );
  }, [search]);

  const handleSwipe = () => {
    if (!selected) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      // Next
      const currentIndex = ASMAUL_HUSNA.findIndex(n => n.no === selected.no);
      if (currentIndex < ASMAUL_HUSNA.length - 1) {
        setSelected(ASMAUL_HUSNA[currentIndex + 1]);
      }
    } else if (isRightSwipe) {
      // Previous
      const currentIndex = ASMAUL_HUSNA.findIndex(n => n.no === selected.no);
      if (currentIndex > 0) {
        setSelected(ASMAUL_HUSNA[currentIndex - 1]);
      }
    }
  };

  const goToPrevious = () => {
    if (!selected) return;
    const currentIndex = ASMAUL_HUSNA.findIndex(n => n.no === selected.no);
    if (currentIndex > 0) {
      setSelected(ASMAUL_HUSNA[currentIndex - 1]);
    }
  };

  const goToNext = () => {
    if (!selected) return;
    const currentIndex = ASMAUL_HUSNA.findIndex(n => n.no === selected.no);
    if (currentIndex < ASMAUL_HUSNA.length - 1) {
      setSelected(ASMAUL_HUSNA[currentIndex + 1]);
    }
  };

  const currentIndex = selected ? ASMAUL_HUSNA.findIndex(n => n.no === selected.no) : -1;

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-2xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-2xl font-semibold text-slate-900">Asmaul Husna</h1>
          <p className="text-sm text-slate-500">99 Nama-Nama Allah yang Indah</p>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-2xl space-y-5">
        {/* Search */}
        <div className="glass-panel rounded-[1.5rem] p-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Cari nama, nomor, atau arti..."
            className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400 text-slate-900"
          />
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {filtered.map((name) => (
            <button
              key={name.no}
              onClick={() => setSelected(name)}
              className="glass-panel rounded-[1.25rem] p-4 text-left transition hover:-translate-y-0.5 hover:shadow-md active:scale-[0.98]"
            >
              <div className="mb-2 flex items-center justify-between">
                <span
                  className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                  style={{ backgroundColor: name.color }}
                >
                  {name.no}
                </span>
              </div>
              <p
                className="font-arabic mb-1 text-right text-2xl leading-[1.8]"
                dir="rtl"
                style={{ color: name.color }}
              >
                {name.arabic}
              </p>
              <p className="text-xs font-semibold text-slate-700">{name.latin}</p>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">{name.meaning}</p>
            </button>
          ))}
        </div>

        {filtered.length === 0 && (
          <p className="py-8 text-center text-slate-400">Tidak ditemukan.</p>
        )}
      </div>

      {/* Detail modal */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
          style={{ backgroundColor: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)' }}
          onClick={() => setSelected(null)}
          onTouchStart={(e) => setTouchStart(e.targetTouches[0].clientX)}
          onTouchEnd={(e) => {
            setTouchEnd(e.changedTouches[0].clientX);
            handleSwipe();
          }}
        >
          <div
            ref={modalRef}
            className="glass-panel w-full max-w-sm rounded-[2rem] p-8 text-center"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <button
                onClick={goToPrevious}
                disabled={currentIndex <= 0}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
                title="Sebelumnya (atau swipe kanan)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15 18 9 12 15 6"/>
                </svg>
              </button>
              <div
                className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl text-xl font-bold text-white"
                style={{ backgroundColor: selected.color }}
              >
                {selected.no}
              </div>
              <button
                onClick={goToNext}
                disabled={currentIndex >= ASMAUL_HUSNA.length - 1}
                className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-200 bg-white/70 text-slate-600 transition hover:bg-slate-50 disabled:opacity-30 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-700/60 dark:text-slate-300"
                title="Berikutnya (atau swipe kiri)"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9 18 15 12 9 6"/>
                </svg>
              </button>
            </div>
            <p
              className="font-arabic text-5xl leading-[2] mb-2"
              dir="rtl"
              style={{ color: selected.color }}
            >
              {selected.arabic}
            </p>
            <p className="text-xl font-bold text-slate-900 mb-1">{selected.latin}</p>
            <p className="text-base text-slate-500 mb-4">{selected.meaning}</p>
            <p className="text-xs text-slate-400 mb-6">({selected.no}/99) · Swipe untuk navigasi →</p>
            <button
              onClick={() => setSelected(null)}
              className="w-full rounded-2xl py-3 text-sm font-medium text-slate-500 transition hover:bg-slate-100"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
