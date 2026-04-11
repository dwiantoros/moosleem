'use client';

import React from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';
export default function SedekahPage() {

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <div className="mx-auto mb-8 flex max-w-3xl items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </Link>
          <div>
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Kebaikan</p>
            <h1 className="text-2xl font-semibold text-slate-900">Sedekah Mudah</h1>
            <p className="mt-1 text-sm text-slate-500">Pilih nominal lalu scan QRIS untuk bayar cepat.</p>
          </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Fitur Sedekah Nonaktif Sementara</h2>
          <div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50/70 p-4">
            <p className="text-sm font-semibold text-amber-800">Sedekah via QRIS sedang dipersiapkan</p>
            <p className="mt-2 text-sm text-amber-700">
              Untuk sementara fitur ini dinonaktifkan terlebih dahulu sampai akun QRIS resmi siap digunakan.
            </p>
            <p className="mt-2 text-xs text-amber-700/90">
              Silakan gunakan fitur lain terlebih dahulu. Nanti setelah aktif, fitur Sedekah akan kami buka kembali.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 rounded-xl bg-amber-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-amber-700"
            >
              Kembali ke Beranda
            </Link>
          </div>
        </section>

        <div className="glass-subtle rounded-2xl px-4 py-3 text-xs text-slate-400">
          Info: Halaman ini sengaja dimatikan sementara. Aktivasi ulang akan dilakukan setelah setup akun QRIS selesai.
        </div>
      </div>
    </div>
  );
}
