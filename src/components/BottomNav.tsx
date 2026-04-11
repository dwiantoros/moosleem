'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

// Primary 5 shown in bar always
const PRIMARY = [
  {
    id: 'home',
    label: 'Home',
    href: '/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'schedule',
    label: 'Jadwal',
    href: '/schedule',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="8" />
        <path d="M12 7v5l3 2" />
      </svg>
    ),
  },
  {
    id: 'quran',
    label: 'Quran',
    href: '/quran',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 6.5C4 5.1 5.1 4 6.5 4H20v15.5c0 .3-.2.5-.5.5H7a3 3 0 0 0-3 3" />
        <path d="M7 20a3 3 0 0 1 3-3h10" />
      </svg>
    ),
  },
  {
    id: 'tasbih',
    label: 'Tasbih',
    href: '/tasbih',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="8" r="3" />
        <path d="M12 11v4" />
        <path d="M9 18c0-1.7 1.3-3 3-3s3 1.3 3 3" />
        <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    id: 'qibla',
    label: 'Qibla',
    href: '/qibla',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="7" />
        <path d="m12 9 2 3-3 2" />
      </svg>
    ),
  },
];

// All other items shown in the "More" sheet
const MORE_ITEMS = [
  {
    id: 'doa', label: 'Doa Harian', href: '/doa',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11c.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5"/><path d="M6 14c0 3.3 2.7 6 6 6s6-2.7 6-6V9a6 6 0 0 0-12 0v5Z"/><path d="M6 14H4a2 2 0 0 1 0-4h2"/><path d="M18 14h2a2 2 0 0 0 0-4h-2"/></svg>,
  },
  {
    id: 'tracker', label: 'Tracker Sholat', href: '/tracker',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><path d="m9 16 2 2 4-4"/></svg>,
  },
  {
    id: 'zakat', label: 'Zakat', href: '/zakat',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="8"/><path d="M12 7v10M9 9.5c0-1.1.9-2 2-2h2a2 2 0 0 1 0 4h-2a2 2 0 0 0 0 4h2a2 2 0 0 0 2-2"/></svg>,
  },
  {
    id: 'asmaul-husna', label: 'Asmaul Husna', href: '/asmaul-husna',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.8L12 18l-6.2 3 1.2-6.8-5-4.9 6.9-1Z"/></svg>,
  },
  {
    id: 'kalender', label: 'Kalender Hijriah', href: '/kalender',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="17" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/><circle cx="12" cy="16" r="1.5" fill="currentColor" stroke="none"/></svg>,
  },
  {
    id: 'panduan', label: 'Panduan Sholat', href: '/panduan-sholat',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>,
  },
  {
    id: 'puasa', label: 'Puasa', href: '/puasa',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"/></svg>,
  },
  {
    id: 'halal', label: 'Halal Nearby', href: '/restaurants',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/></svg>,
  },
  {
    id: 'mosques', label: 'Masjid Terdekat', href: '/mosques',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5a3 3 0 0 1 6 0v5"/></svg>,
  },
  {
    id: 'notes', label: 'Catatan', href: '/notes',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/><path d="m13 17 3-3-1.5-1.5L13 14l-2-2"/></svg>,
  },
  {
    id: 'search', label: 'Cari Surah', href: '/search',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>,
  },
];

export default function BottomNav() {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);
  const [visible, setVisible] = useState(true);
  const [lastY, setLastY] = useState(0);
  const [dark, setDark] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Sync dark mode
  useEffect(() => {
    const check = () => setDark(document.documentElement.classList.contains('dark'));
    check();
    setMounted(true);
    const obs = new MutationObserver(check);
    obs.observe(document.documentElement, { attributeFilter: ['class'] });
    return () => obs.disconnect();
  }, []);

  const toggleTheme = () => {
    const next = !dark;
    document.documentElement.classList.toggle('dark', next);
    document.documentElement.style.colorScheme = next ? 'dark' : 'light';
    localStorage.setItem('theme', next ? 'dark' : 'light');
    setDark(next);
  };

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      if (y > lastY + 8 && y > 60) setVisible(false);
      else if (y < lastY - 4) setVisible(true);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [lastY]);

  // Close sheet on outside click
  useEffect(() => {
    if (!moreOpen) return;
    const fn = (e: MouseEvent) => {
      if (!(e.target as HTMLElement).closest('[data-bottomsheet]')) setMoreOpen(false);
    };
    document.addEventListener('mousedown', fn);
    return () => document.removeEventListener('mousedown', fn);
  }, [moreOpen]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <>
      {/* Bottom sheet overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-40 bg-slate-950/30 backdrop-blur-[2px]" onClick={() => setMoreOpen(false)} />
      )}

      {/* More sheet — raised, more solid frost glass */}
      <div
        data-bottomsheet
        className="fixed bottom-[88px] inset-x-0 z-50 mx-auto max-w-lg px-4 transition-all duration-300"
        style={{
          transform: moreOpen ? 'translateY(0)' : 'translateY(120%)',
          opacity: moreOpen ? 1 : 0,
          pointerEvents: moreOpen ? 'auto' : 'none',
        }}
      >
        <div
          className="rounded-[1.75rem] px-5 py-5 shadow-2xl"
          style={dark ? {
            background: 'rgba(9,18,31,0.94)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.1)',
            boxShadow: '0 24px 60px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.06)',
          } : {
            background: 'rgba(248,250,255,0.96)',
            backdropFilter: 'blur(32px) saturate(160%)',
            WebkitBackdropFilter: 'blur(32px) saturate(160%)',
            border: '1px solid rgba(255,255,255,0.8)',
            boxShadow: '0 24px 60px rgba(15,23,42,0.18), inset 0 1px 0 rgba(255,255,255,0.9)',
          }}
        >
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-semibold" style={{ color: dark ? '#e2e8f0' : '#1e293b' }}>Semua Fitur</p>
            <button onClick={() => setMoreOpen(false)} className="rounded-full p-1.5 transition" style={{ color: dark ? '#94a3b8' : '#64748b' }}>
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {MORE_ITEMS.map((item) => {
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  onClick={() => setMoreOpen(false)}
                  className="flex flex-col items-center gap-1.5 rounded-2xl px-2 py-3 text-center transition-all"
                  style={active
                    ? { backgroundColor: 'rgba(13,148,136,0.12)' }
                    : { backgroundColor: 'transparent' }}
                >
                  <span
                    className="flex h-9 w-9 items-center justify-center rounded-xl transition-all"
                    style={active
                      ? { backgroundColor: 'rgba(13,148,136,0.15)', color: '#0d9488' }
                      : { backgroundColor: dark ? 'rgba(255,255,255,0.06)' : 'rgba(15,23,42,0.06)', color: dark ? '#94a3b8' : '#475569' }}
                  >
                    {item.icon}
                  </span>
                  <span
                    className="text-[10px] font-medium leading-tight"
                    style={{ color: active ? '#0d9488' : dark ? '#94a3b8' : '#475569' }}
                  >
                    {item.label}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Floating bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-safe transition-transform duration-300"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div
          className="mb-4 flex w-full max-w-lg items-center justify-between rounded-[1.75rem] px-3 py-2"
          style={dark ? {
            background: 'linear-gradient(180deg, rgba(9,18,31,0.94) 0%, rgba(7,14,26,0.92) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.4), 0 2px 8px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.06)',
          } : {
            background: 'linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(255,255,255,0.78) 100%)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid rgba(255,255,255,0.6)',
            boxShadow: '0 8px 32px rgba(15,23,42,0.12), 0 2px 8px rgba(15,23,42,0.08), inset 0 1px 0 rgba(255,255,255,0.8)',
          }}
        >
          {PRIMARY.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                className="relative flex flex-1 flex-col items-center gap-1 py-2 transition-all"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200"
                  style={active
                    ? { backgroundColor: 'rgba(13,148,136,0.15)', color: '#0d9488', transform: 'scale(1.08)' }
                    : { color: '#94a3b8' }
                  }
                >
                  {item.icon}
                </span>
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? '#0d9488' : '#94a3b8' }}
                >
                  {item.label}
                </span>
                {active && (
                  <span
                    className="absolute -bottom-0.5 h-0.5 w-5 rounded-full"
                    style={{ backgroundColor: '#0d9488' }}
                  />
                )}
              </Link>
            );
          })}

          {/* More button */}
          <button
            onClick={() => setMoreOpen((v) => !v)}
            className="relative flex flex-1 flex-col items-center gap-1 py-2 transition-all"
          >
            <span
              className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200"
              style={moreOpen
                ? { backgroundColor: 'rgba(13,148,136,0.15)', color: '#0d9488' }
                : { color: '#94a3b8' }
              }
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
                <circle cx="5" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="12" cy="12" r="1.5" fill="currentColor" stroke="none"/>
                <circle cx="19" cy="12" r="1.5" fill="currentColor" stroke="none"/>
              </svg>
            </span>
            <span
              className="text-[10px] font-medium leading-none"
              style={{ color: moreOpen ? '#0d9488' : '#94a3b8' }}
            >
              Lainnya
            </span>
          </button>
        </div>
      </nav>
    </>
  );
}
