'use client';

import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';

// Primary items shown in floating bar
const PRIMARY = [
  {
    id: 'home',
    label: 'Beranda',
    href: '/',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
        <polyline points="9 22 9 12 15 12 15 22" />
      </svg>
    ),
  },
  {
    id: 'kalender',
    label: 'Kalender',
    href: '/kalender-hijriah',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
        <line x1="16" y1="2" x2="16" y2="6" />
        <line x1="8" y1="2" x2="8" y2="6" />
        <line x1="3" y1="10" x2="21" y2="10" />
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
    id: 'halal',
    label: 'Halal',
    href: '/restoran-halal',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/><path d="M7 2v20"/><path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7"/>
      </svg>
    ),
  },
  {
    id: 'mosques',
    label: 'Masjid',
    href: '/masjid',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 21h18M4 21V8l8-5 8 5v13M9 21v-5a3 3 0 0 1 6 0v5"/>
      </svg>
    ),
  },
  {
    id: 'qibla',
    label: 'Qibla',
    href: '/qibla',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="9"/><path d="M12 3v4M12 17v4M3 12h4M17 12h4"/><path d="M12 12l-3-5"/>
      </svg>
    ),
  },
];

// All other items shown in the "More" sheet
const MORE_ITEMS = [
  {
    id: 'doa', label: 'Doa', href: '/doa',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9 11c.5-2 2-3.5 3-3.5s2.5 1.5 3 3.5"/><path d="M6 14c0 3.3 2.7 6 6 6s6-2.7 6-6V9a6 6 0 0 0-12 0v5Z"/><path d="M6 14H4a2 2 0 0 1 0-4h2"/><path d="M18 14h2a2 2 0 0 0 0-4h-2"/></svg>,
  },
  {
    id: 'tracker', label: 'Pelacak Sholat', href: '/tracker',
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
    id: 'panduan', label: 'Panduan Solat', href: '/panduan-sholat',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>,
  },
  {
    id: 'puasa', label: 'Puasa', href: '/puasa',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 1 0 9.8 9.8Z"/></svg>,
  },
  {
    id: 'tasbih', label: 'Tasbih', href: '/tasbih',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="5" cy="12" r="2"/><circle cx="12" cy="5" r="2"/><circle cx="19" cy="12" r="2"/><circle cx="12" cy="19" r="2"/><path d="M7 12h3M12 7v3M17 12h-3M12 17v-3"/></svg>,
  },
  {
    id: 'artikel', label: 'Artikel Islami', href: '/artikel',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>,
  },
  {
    id: 'notes', label: 'Catatan', href: '/notes',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z"/><path d="M14 3v5h5M9 13h6M9 17h4"/><path d="m13 17 3-3-1.5-1.5L13 14l-2-2"/></svg>,
  },
  {
    id: 'search', label: 'Pencarian', href: '/search',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4 4"/></svg>,
  },
  {
    id: 'tentang', label: 'Tentang', href: '/tentang',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 11v5"/><circle cx="12" cy="8" r=".7" fill="currentColor" stroke="none"/></svg>,
  },
  {
    id: 'bantuan', label: 'Bantuan', href: '/bantuan',
    icon: <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M9.09 9a3 3 0 1 1 5.82 1c0 2-3 2-3 4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="9"/></svg>,
  },
];

const SCROLL_ITEMS = [...PRIMARY, ...MORE_ITEMS];

export default function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const shouldHide = pathname.startsWith('/bukan-admin') || pathname.startsWith('/admin');
  const [visible, setVisible] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const lastYRef = useRef(0);
  const visibleRef = useRef(true);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const dragMovedRef = useRef(false);
  const startXRef = useRef(0);
  const scrollLeftRef = useRef(0);
  const activePointerIdRef = useRef<number | null>(null);

  // Capture wheel with passive:false so page does not scroll while interacting with the nav.
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    const onWheelNative = (event: WheelEvent) => {
      event.preventDefault();
      el.scrollLeft += event.deltaY + event.deltaX;
    };

    el.addEventListener('wheel', onWheelNative, { passive: false });
    return () => el.removeEventListener('wheel', onWheelNative);
  }, []);

  // Hide on scroll down, show on scroll up
  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      const prevY = lastYRef.current;
      let nextVisible = visibleRef.current;

      if (y > prevY + 8 && y > 60) {
        nextVisible = false;
      } else if (y < prevY - 4) {
        nextVisible = true;
      }

      lastYRef.current = y;
      if (nextVisible !== visibleRef.current) {
        visibleRef.current = nextVisible;
        setVisible(nextVisible);
      }
    };

    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Warm route cache so floating-menu taps feel instant on first navigation.
  useEffect(() => {
    const hrefs = SCROLL_ITEMS.map((item) => item.href);
    const prefetchAll = () => {
      hrefs.forEach((href) => {
        router.prefetch(href);
      });
    };

    if (typeof requestIdleCallback === 'function') {
      const idleId = requestIdleCallback(prefetchAll, { timeout: 1200 });
      return () => cancelIdleCallback(idleId);
    }

    const timeoutId = setTimeout(prefetchAll, 200);
    return () => clearTimeout(timeoutId);
  }, [router]);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const onPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || !scrollRef.current) return;

    activePointerIdRef.current = event.pointerId;
    isDraggingRef.current = false;
    setIsDragging(false);
    dragMovedRef.current = false;
    startXRef.current = event.clientX;
    scrollLeftRef.current = scrollRef.current.scrollLeft;
  };

  const onPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (activePointerIdRef.current !== event.pointerId || !scrollRef.current) return;

    const deltaX = event.clientX - startXRef.current;

    if (!isDraggingRef.current) {
      if (Math.abs(deltaX) < 6) {
        return;
      }

      isDraggingRef.current = true;
      setIsDragging(true);
      dragMovedRef.current = true;
      scrollRef.current.setPointerCapture(event.pointerId);
    }

    event.preventDefault();
    if (Math.abs(deltaX) > 2) {
      dragMovedRef.current = true;
    }
    scrollRef.current.scrollLeft = scrollLeftRef.current - deltaX * 1.15;
  };

  const endPointerDrag = (event?: React.PointerEvent<HTMLDivElement>) => {
    if (event && activePointerIdRef.current !== null && scrollRef.current?.hasPointerCapture(activePointerIdRef.current)) {
      scrollRef.current.releasePointerCapture(activePointerIdRef.current);
    }
    activePointerIdRef.current = null;
    isDraggingRef.current = false;
    dragMovedRef.current = false;
    setIsDragging(false);
  };

  const onClickCapture = (event: React.MouseEvent<HTMLDivElement>) => {
    if (dragMovedRef.current) {
      event.preventDefault();
      event.stopPropagation();
      dragMovedRef.current = false;
    }
  };

  // Do not render floating public navigation on CMS/admin screens.
  if (shouldHide) {
    return null;
  }

  return (
    <>
      {/* Floating bottom bar */}
      <nav
        className="fixed bottom-0 inset-x-0 z-40 flex justify-center px-4 pb-safe transition-transform duration-300"
        style={{ transform: visible ? 'translateY(0)' : 'translateY(100%)' }}
      >
        <div
          ref={scrollRef}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endPointerDrag}
          onPointerCancel={endPointerDrag}
          onDragStart={(event) => event.preventDefault()}
          onClickCapture={onClickCapture}
          className="mb-4 flex w-full max-w-lg items-center gap-1 overflow-x-auto overflow-y-hidden rounded-[1.75rem] px-2.5 py-2"
          style={{
            background: 'var(--bottomnav-bar-bg)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            border: '1px solid var(--bottomnav-bar-border)',
            boxShadow: 'var(--bottomnav-bar-shadow)',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            cursor: isDragging ? 'grabbing' : 'grab',
            userSelect: isDragging ? 'none' : 'auto',
            touchAction: 'pan-y',
          }}
        >
          {SCROLL_ITEMS.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.id}
                href={item.href}
                draggable={false}
                className="relative flex min-w-[72px] flex-shrink-0 flex-col items-center gap-1 px-1 py-2 transition-all"
              >
                <span
                  className="flex h-9 w-9 items-center justify-center rounded-2xl transition-all duration-200"
                  style={active
                    ? { backgroundColor: 'rgba(13,148,136,0.15)', color: '#0d9488', transform: 'scale(1.08)' }
                    : { color: 'var(--bottomnav-inactive)' }
                  }
                >
                  {item.icon}
                </span>
                <span
                  className="text-[10px] font-medium leading-none"
                  style={{ color: active ? '#0d9488' : 'var(--bottomnav-inactive)' }}
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
        </div>
      </nav>
    </>
  );
}
