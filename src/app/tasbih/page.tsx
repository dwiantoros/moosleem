'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';

const DHIKR_LIST = [
  {
    id: 'subhanallah',
    arabic: 'سُبْحَانَ ٱللَّهِ',
    latin: 'Subhanallah',
    meaning: 'Maha Suci Allah',
    target: 33,
    color: '#0d9488',
    light: '#ccfbf1',
  },
  {
    id: 'alhamdulillah',
    arabic: 'ٱلْحَمْدُ لِلَّهِ',
    latin: 'Alhamdulillah',
    meaning: 'Segala Puji bagi Allah',
    target: 33,
    color: '#7c3aed',
    light: '#ede9fe',
  },
  {
    id: 'allahuakbar',
    arabic: 'ٱللَّهُ أَكْبَرُ',
    latin: 'Allahu Akbar',
    meaning: 'Allah Maha Besar',
    target: 34,
    color: '#b45309',
    light: '#fef3c7',
  },
  {
    id: 'lailahaillallah',
    arabic: 'لَا إِلَٰهَ إِلَّا ٱللَّهُ',
    latin: 'La ilaha illallah',
    meaning: 'Tiada tuhan selain Allah',
    target: 100,
    color: '#0369a1',
    light: '#dbeafe',
  },
  {
    id: 'astaghfirullah',
    arabic: 'أَسْتَغْفِرُ ٱللَّهَ',
    latin: 'Astaghfirullah',
    meaning: 'Aku memohon ampun kepada Allah',
    target: 100,
    color: '#9d174d',
    light: '#fce7f3',
  },
];

type Dhikr = (typeof DHIKR_LIST)[0];

export default function TasbihPage() {
  const [selectedDhikr, setSelectedDhikr] = useState<Dhikr>(DHIKR_LIST[0]);
  const [count, setCount] = useState(0);
  const [rounds, setRounds] = useState(0);
  const [totalToday, setTotalToday] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);

  // Load persisted state
  useEffect(() => {
    const today = new Date().toDateString();
    try {
      const session = localStorage.getItem('tasbih-session');
      if (session) {
        const data = JSON.parse(session);
        if (data.date === today) setTotalToday(data.totalToday ?? 0);
      }
      const current = localStorage.getItem('tasbih-current');
      if (current) {
        const data = JSON.parse(current);
        if (data.date === today) {
          const dhikr = DHIKR_LIST.find((d) => d.id === data.dhikrId);
          if (dhikr) {
            setSelectedDhikr(dhikr);
            setCount(data.count ?? 0);
            setRounds(data.rounds ?? 0);
          }
        }
      }
    } catch {
      // ignore malformed localStorage
    }
  }, []);

  // Persist state
  useEffect(() => {
    const today = new Date().toDateString();
    localStorage.setItem(
      'tasbih-current',
      JSON.stringify({ date: today, dhikrId: selectedDhikr.id, count, rounds })
    );
    localStorage.setItem(
      'tasbih-session',
      JSON.stringify({ date: today, totalToday })
    );
  }, [count, rounds, totalToday, selectedDhikr]);

  const handleTap = useCallback(() => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(18);

    setIsAnimating(true);
    setTimeout(() => setIsAnimating(false), 130);

    const newCount = count + 1;
    setTotalToday((t) => t + 1);

    if (newCount >= selectedDhikr.target) {
      setCount(0);
      setRounds((r) => r + 1);
      setJustCompleted(true);
      setTimeout(() => setJustCompleted(false), 800);
      if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate([30, 60, 30]);
    } else {
      setCount(newCount);
    }
  }, [count, selectedDhikr.target]);

  const handleSelectDhikr = (dhikr: Dhikr) => {
    setSelectedDhikr(dhikr);
    setCount(0);
    setRounds(0);
  };

  const handleReset = () => {
    setCount(0);
    setRounds(0);
  };

  // SVG progress ring
  const radius = 100;
  const circumference = 2 * Math.PI * radius;
  const progress = selectedDhikr.target > 0 ? count / selectedDhikr.target : 0;
  const dashOffset = circumference * (1 - progress);

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link
          href="/"
          className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-2xl font-semibold text-slate-900">Tasbih Digital</h1>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-lg space-y-5">
        {/* Dhikr selector */}
        <div className="glass-panel rounded-[1.5rem] p-4">
          <div className="flex flex-wrap gap-2">
            {DHIKR_LIST.map((dhikr) => (
              <button
                key={dhikr.id}
                onClick={() => handleSelectDhikr(dhikr)}
                className="rounded-full px-3.5 py-1.5 text-xs font-medium transition"
                style={
                  selectedDhikr.id === dhikr.id
                    ? { backgroundColor: dhikr.color, color: '#fff' }
                    : { backgroundColor: dhikr.light, color: dhikr.color }
                }
              >
                {dhikr.latin}
              </button>
            ))}
          </div>
        </div>

        {/* Main counter */}
        <div className="glass-panel rounded-[2rem] p-6 flex flex-col items-center">
          {/* Arabic dhikr text */}
          <p
            className="font-arabic mb-1 text-center text-3xl leading-[2]"
            dir="rtl"
            style={{ color: selectedDhikr.color }}
          >
            {selectedDhikr.arabic}
          </p>
          <p className="mb-1 text-sm font-medium text-slate-600">{selectedDhikr.latin}</p>
          <p className="mb-6 text-xs text-slate-400">{selectedDhikr.meaning}</p>

          {/* Circular tap button with progress ring */}
          <button
            onClick={handleTap}
            className="relative flex items-center justify-center rounded-full transition select-none w-[min(260px,80vw)] aspect-square"
            aria-label="Tap to count dhikr"
          >
            {/* SVG ring — scales with container via viewBox */}
            <svg
              viewBox="0 0 260 260"
              className="absolute inset-0 w-full h-full"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Track */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="10"
              />
              {/* Progress */}
              <circle
                cx="130"
                cy="130"
                r={radius}
                fill="none"
                stroke={selectedDhikr.color}
                strokeWidth="10"
                strokeLinecap="round"
                strokeDasharray={circumference}
                strokeDashoffset={dashOffset}
                style={{ transition: 'stroke-dashoffset 0.25s ease' }}
              />
            </svg>

            {/* Inner circle — ~85% of outer */}
            <div
              className="relative flex flex-col items-center justify-center rounded-full shadow-xl transition-transform w-[min(220px,calc(80vw-40px))] aspect-square"
              style={{
                backgroundColor: justCompleted ? selectedDhikr.color : 'white',
                transform: isAnimating ? 'scale(0.95)' : 'scale(1)',
                transition: 'transform 0.13s ease, background-color 0.2s ease',
              }}
            >
              <span
                className="text-6xl sm:text-7xl font-bold tabular-nums leading-none transition-colors"
                style={{ color: justCompleted ? '#fff' : selectedDhikr.color }}
              >
                {count}
              </span>
              <span
                className="mt-1 text-sm transition-colors"
                style={{ color: justCompleted ? 'rgba(255,255,255,0.8)' : '#94a3b8' }}
              >
                {justCompleted ? 'Jazakallah! ✓' : `dari ${selectedDhikr.target}`}
              </span>
            </div>
          </button>

          <p className="mt-4 text-xs text-slate-400">Ketuk lingkaran untuk menghitung</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{rounds}</p>
            <p className="mt-0.5 text-xs text-slate-500">Putaran</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-2xl font-bold" style={{ color: selectedDhikr.color }}>
              {count}
            </p>
            <p className="mt-0.5 text-xs text-slate-500">Hitungan</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-2xl font-bold text-slate-900">{totalToday}</p>
            <p className="mt-0.5 text-xs text-slate-500">Hari ini</p>
          </div>
        </div>

        {/* Reset */}
        <button
          onClick={handleReset}
          className="glass-subtle w-full rounded-2xl py-3 text-sm font-medium text-slate-500 transition hover:bg-white/60 hover:text-slate-700"
        >
          Reset Putaran
        </button>
      </div>
    </div>
  );
}
