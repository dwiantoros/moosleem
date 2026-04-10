'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';

const MENU_ITEMS = [
  { href: '/schedule',      label: 'Jadwal Sholat',    desc: 'Waktu sholat sesuai lokasi',        emoji: '🕌' },
  { href: '/quran',         label: 'Quran Reader',     desc: 'Baca Al-Quran lengkap',             emoji: '📖' },
  { href: '/doa',           label: 'Doa Harian',       desc: 'Kumpulan doa sehari-hari',          emoji: '🤲' },
  { href: '/tasbih',        label: 'Tasbih Digital',   desc: 'Hitung dzikir dengan mudah',        emoji: '📿' },
  { href: '/tracker',       label: 'Tracker Sholat',   desc: 'Pantau konsistensi ibadah',         emoji: '✅' },
  { href: '/zakat',         label: 'Kalkulator Zakat', desc: 'Hitung zakat maal & penghasilan',   emoji: '💰' },
  { href: '/asmaul-husna',  label: 'Asmaul Husna',     desc: '99 nama-nama Allah',                emoji: '⭐' },
  { href: '/qibla',         label: 'Arah Qibla',       desc: 'Kompas qibla realtime',             emoji: '🧭' },
  { href: '/restaurants',   label: 'Halal Nearby',     desc: 'Restoran halal terdekat',           emoji: '🍽️' },
  { href: '/notes',         label: 'Catatan',          desc: 'Checklist dan catatan ibadah',      emoji: '📝' },
  { href: '/kalender',      label: 'Kalender Hijriah', desc: 'Kalender Islam & hari penting',     emoji: '🗓️' },
  { href: '/panduan-sholat',label: 'Panduan Sholat',   desc: 'Tata cara sholat lengkap',          emoji: '📋' },
  { href: '/puasa',         label: 'Tracker Puasa',    desc: 'Catat dan pantau puasa sunnah',     emoji: '🌙' },
];

interface UserGreetingProps {
  reminderEnabled?: boolean;
  onReminderToggle?: () => void;
}

function HeaderIcon({ children }: { children: React.ReactNode }) {
  return <span className="text-slate-700">{children}</span>;
}

export default function UserGreeting({ reminderEnabled = false, onReminderToggle }: UserGreetingProps) {
  const [userName, setUserName] = useState('Muslim Traveler');
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('userName');
    if (saved) setUserName(saved);
    setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
  }, []);

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('[data-menu]')) setMenuOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [menuOpen]);

  const greeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Pagi';
    if (hour < 15) return 'Siang';
    if (hour < 18) return 'Sore';
    return 'Malam';
  };

  const toggleTheme = () => {
    const nextTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(nextTheme);
    document.documentElement.classList.toggle('dark', nextTheme === 'dark');
    document.documentElement.style.colorScheme = nextTheme;
    localStorage.setItem('theme', nextTheme);
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Assalamu Alaikum, selamat {greeting()}</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight text-slate-950">{userName}</h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan ibadah harian yang lebih tenang dan fokus.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button onClick={toggleTheme} className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60" aria-label="Toggle dark mode">
            <HeaderIcon>
              {theme === 'dark' ? (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <circle cx="12" cy="12" r="4.5" />
                  <path d="M12 2v2.5M12 19.5V22M4.93 4.93l1.77 1.77M17.3 17.3l1.77 1.77M2 12h2.5M19.5 12H22M4.93 19.07l1.77-1.77M17.3 6.7l1.77-1.77" strokeLinecap="round" />
                </svg>
              ) : (
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </HeaderIcon>
          </button>

          {/* Search */}
          <Link href="/search" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60" aria-label="Open search">
            <HeaderIcon>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
            </HeaderIcon>
          </Link>

          {/* Bell — wired to reminder toggle */}
          <button
            onClick={onReminderToggle}
            className={`glass-subtle relative flex h-10 w-10 items-center justify-center rounded-full transition hover:bg-white/60 ${reminderEnabled ? 'text-teal-600' : 'text-slate-700'}`}
            aria-label={reminderEnabled ? 'Matikan adzan reminder' : 'Aktifkan adzan reminder'}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 9a6 6 0 1 1 12 0c0 6 2.5 7 2.5 7h-17S6 15 6 9Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M10 19a2 2 0 0 0 4 0" strokeLinecap="round" />
            </svg>
            {/* Active indicator dot */}
            {reminderEnabled && (
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-teal-500 ring-2 ring-white" />
            )}
          </button>

          {/* Menu button */}
          <div className="relative" data-menu>
            <button
              onClick={() => setMenuOpen((o) => !o)}
              className={`glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 ${menuOpen ? 'bg-white/60' : ''}`}
              aria-label="Menu fitur"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <line x1="4" y1="7" x2="20" y2="7" />
                <line x1="4" y1="12" x2="20" y2="12" />
                <line x1="4" y1="17" x2="20" y2="17" />
              </svg>
            </button>

            {/* Dropdown menu — always mounted, animated in/out */}
            <div
              data-menu
              className="glass-panel absolute right-0 top-12 z-50 w-72 max-w-[calc(100vw-2rem)] rounded-[1.5rem] p-3 shadow-xl"
              style={{
                maxHeight: menuOpen ? '80vh' : '0px',
                overflowY: menuOpen ? 'auto' : 'hidden',
                overflowX: 'hidden',
                opacity: menuOpen ? 1 : 0,
                transform: menuOpen ? 'translateY(0) scale(1)' : 'translateY(-8px) scale(0.97)',
                pointerEvents: menuOpen ? 'auto' : 'none',
                transformOrigin: 'top right',
                transition: 'opacity 0.22s cubic-bezier(0.16,1,0.3,1), transform 0.22s cubic-bezier(0.16,1,0.3,1), max-height 0.28s cubic-bezier(0.16,1,0.3,1)',
              }}
            >
                <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">Fitur</p>
                <div className="space-y-0.5">
                  {MENU_ITEMS.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 rounded-xl px-3 py-2.5 transition hover:bg-white/60"
                    >
                      <span className="text-xl leading-none">{item.emoji}</span>
                      <div>
                        <p className="text-sm font-medium text-slate-900">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
          </div>
        </div>
      </div>
    </>
  );
}
