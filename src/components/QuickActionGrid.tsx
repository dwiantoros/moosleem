'use client';

import React from 'react';
import Link from 'next/link';

interface QuickAction {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

const actions: QuickAction[] = [
  {
    id: 'quran',
    label: 'Quran',
    href: '/quran',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 6.5C4 5.1 5.1 4 6.5 4H20v15.5c0 .3-.2.5-.5.5H7a3 3 0 0 0-3 3" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M7 20a3 3 0 0 1 3-3h10" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-blue-700',
    bgColor: 'bg-blue-50',
  },
  {
    id: 'doa',
    label: 'Doa',
    href: '/doa',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 12c0-2.8 1.8-5 4-5s4 2.2 4 5" strokeLinecap="round" />
        <path d="M7 14c0 2.2 2.2 4 5 4s5-1.8 5-4" strokeLinecap="round" />
        <path d="M12 4v2" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-violet-700',
    bgColor: 'bg-violet-50',
  },
  {
    id: 'tasbih',
    label: 'Tasbih',
    href: '/tasbih',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="8" r="3" />
        <path d="M12 11v4" strokeLinecap="round" />
        <path d="M9 18c0-1.7 1.3-3 3-3s3 1.3 3 3" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="19" r="1" fill="currentColor" stroke="none" />
      </svg>
    ),
    color: 'text-amber-700',
    bgColor: 'bg-amber-50',
  },
  {
    id: 'halal',
    label: 'Halal',
    href: '/restoran-halal',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 4v7" strokeLinecap="round" />
        <path d="M6 4v7" strokeLinecap="round" />
        <path d="M4 4v7c0 1.1.9 2 2 2v7" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M14 4c2.2 0 4 2.2 4 5v11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-orange-700',
    bgColor: 'bg-orange-50',
  },
  {
    id: 'classes',
    label: 'Qibla',
    href: '/qibla',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="7" />
        <path d="m12 9 2 3-3 2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-cyan-700',
    bgColor: 'bg-cyan-50',
  },
  {
    id: 'notes',
    label: 'Catatan',
    href: '/notes',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M8 4h8l4 4v12H8a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Z" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 4v4h4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-lime-700',
    bgColor: 'bg-lime-50',
  },
  {
    id: 'tracker',
    label: 'Tracker',
    href: '/tracker',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M9 11l3 3L22 4" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-teal-700',
    bgColor: 'bg-teal-50',
  },
  {
    id: 'zakat',
    label: 'Zakat',
    href: '/zakat',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="12" cy="12" r="8" />
        <path d="M9 12h6M12 9v6" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-green-700',
    bgColor: 'bg-green-50',
  },
  {
    id: 'asmaul-husna',
    label: 'Asmaul Husna',
    href: '/asmaul-husna',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-yellow-700',
    bgColor: 'bg-yellow-50',
  },
  {
    id: 'kalender',
    label: 'Kalender',
    href: '/kalender-hijriah',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="5" width="18" height="16" rx="2" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 2v3M8 2v3M3 10h18" strokeLinecap="round" />
      </svg>
    ),
    color: 'text-indigo-700',
    bgColor: 'bg-indigo-50',
  },
  {
    id: 'panduan-sholat',
    label: 'Panduan Sholat',
    href: '/panduan-sholat',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 2C6.5 2 4 6 4 10c0 5 5 10 8 12 3-2 8-7 8-12 0-4-2.5-8-8-8Z" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="12" cy="10" r="2.5" />
      </svg>
    ),
    color: 'text-rose-700',
    bgColor: 'bg-rose-50',
  },
  {
    id: 'puasa',
    label: 'Puasa',
    href: '/puasa',
    icon: (
      <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
    color: 'text-sky-700',
    bgColor: 'bg-sky-50',
  },
];

export default function QuickActionGrid() {
  return (
    <div className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Akses Cepat</h3>
          <p className="mt-1 text-xs text-slate-500">Shortcut ke fitur utama yang paling sering dipakai.</p>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        {actions.map((action) => (
          <Link
            href={action.href}
            key={action.id}
            className={`glass-subtle rounded-[1.15rem] ${action.bgColor} flex min-h-[96px] flex-col justify-between p-4 transition hover:-translate-y-0.5 hover:bg-white/60 active:shadow-sm`}
          >
            <span className={`flex h-9 w-9 items-center justify-center rounded-full bg-white/70 ${action.color}`}>
              {action.icon}
            </span>
            <span className="text-sm font-medium text-slate-900">{action.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
