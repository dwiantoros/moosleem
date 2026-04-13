'use client';

import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import NotificationBell from '@/components/NotificationBell';

const MENU_ITEMS = [
  { href: '/schedule',      label: 'Jadwal Sholat',    desc: 'Waktu sholat sesuai lokasi',        emoji: '🕌' },
  { href: '/quran',         label: 'Quran Reader',     desc: 'Baca Al-Quran lengkap',             emoji: '📖' },
  { href: '/doa',           label: 'Doa Harian',       desc: 'Kumpulan doa sehari-hari',          emoji: '🤲' },
  { href: '/tasbih',        label: 'Tasbih Digital',   desc: 'Hitung dzikir dengan mudah',        emoji: '📿' },
  { href: '/tracker',       label: 'Tracker Sholat',   desc: 'Pantau konsistensi ibadah',         emoji: '✅' },
  { href: '/zakat',         label: 'Kalkulator Zakat', desc: 'Hitung zakat maal & penghasilan',   emoji: '💰' },
  { href: '/asmaul-husna',  label: 'Asmaul Husna',     desc: '99 nama-nama Allah',                emoji: '⭐' },
  { href: '/qibla',         label: 'Arah Qibla',       desc: 'Kompas qibla realtime',             emoji: '🧭' },
  { href: '/restoran-halal',label: 'Halal Nearby',     desc: 'Restoran halal terdekat',           emoji: '🍽️' },
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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('userName');
    if (saved) setUserName(saved);
    // Read the actual class applied by the inline theme script in <head>
    const isDark = document.documentElement.classList.contains('dark');
    setTheme(isDark ? 'dark' : 'light');
    // Persist current theme to localStorage if not yet saved
    if (!localStorage.getItem('theme')) {
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }
    setMounted(true);
    // Stay in sync if theme is toggled from BottomNav or another component
    const obs = new MutationObserver(() => {
      setTheme(document.documentElement.classList.contains('dark') ? 'dark' : 'light');
    });
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
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
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', nextTheme === 'dark' ? '#07111d' : '#eef3fb');
  };

  return (
    <>
      <div className="mb-8 flex items-center justify-between">
        <div className="flex-1">
          <p className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">Assalamu Alaikum, selamat {greeting()}</p>
          <h1 className="mt-2 text-[1.75rem] font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {userName}
            </span>
          </h1>
          <p className="mt-1 text-sm text-slate-500">Ringkasan ibadah harian yang lebih tenang dan fokus.</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Dark mode toggle */}
          <button onClick={toggleTheme} className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300" aria-label="Toggle dark mode">
            {mounted ? (
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
            ) : <span className="block h-4 w-4" />}
          </button>

          {/* Search */}
          <Link href="/search" className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300" aria-label="Open search">
            <HeaderIcon>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="11" cy="11" r="6.5" />
                <path d="m16 16 4 4" strokeLinecap="round" />
              </svg>
            </HeaderIcon>
          </Link>

          {/* Bell — notification panel */}
          <NotificationBell />

          {/* Menu button — hidden (BottomNav handles navigation) */}
          {/* Keeping state but rendering nothing to avoid breaking existing close-on-outside-click logic */}
        </div>
      </div>
    </>
  );
}
