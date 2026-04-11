'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

type PaymentMethod = {
  id: string;
  title: string;
  accountName: string;
  accountNumber: string;
  note: string;
};

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000];

const PAYMENT_METHODS: PaymentMethod[] = [
  {
    id: 'bsi',
    title: 'Transfer Bank Syariah Indonesia (BSI)',
    accountName: 'Yayasan Muslim Traveler',
    accountNumber: '7123456789',
    note: 'Metode paling aman untuk nominal besar. Gunakan berita: SEDEKAH',
  },
  {
    id: 'dana',
    title: 'DANA',
    accountName: 'Muslim Traveler',
    accountNumber: '081234567890',
    note: 'Praktis untuk sedekah cepat dari HP.',
  },
  {
    id: 'gopay',
    title: 'GoPay',
    accountName: 'Muslim Traveler',
    accountNumber: '081298765432',
    note: 'Bisa dipakai langsung dari aplikasi Gojek.',
  },
];

function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

export default function SedekahPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(QUICK_AMOUNTS[1]);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch {
      // ignore clipboard errors
    }
  };

  const whatsappMessage = encodeURIComponent(
    `Assalamu alaikum, saya ingin konfirmasi sedekah sebesar ${formatIDR(selectedAmount)}.`
  );

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
            <p className="mt-1 text-sm text-slate-500">Pilih nominal dan bayar dengan cara paling cepat.</p>
          </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-3xl space-y-5">
        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">1. Pilih Nominal</h2>
          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
            {QUICK_AMOUNTS.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`rounded-xl px-3 py-2 text-sm font-semibold transition ${
                  selectedAmount === amount
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {formatIDR(amount)}
              </button>
            ))}
          </div>
          <p className="mt-4 text-sm text-slate-600">Nominal terpilih: <span className="font-semibold text-teal-700">{formatIDR(selectedAmount)}</span></p>
        </section>

        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">2. Pilih Metode Pembayaran</h2>
          <div className="mt-4 space-y-3">
            {PAYMENT_METHODS.map((method) => (
              <article key={method.id} className="rounded-2xl border border-slate-200 bg-white/70 p-4">
                <p className="text-sm font-semibold text-slate-900">{method.title}</p>
                <p className="mt-1 text-xs text-slate-500">a.n {method.accountName}</p>
                <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-slate-100 px-3 py-2">
                  <p className="text-sm font-semibold tracking-wide text-slate-800">{method.accountNumber}</p>
                  <button
                    onClick={() => handleCopy(method.id, method.accountNumber)}
                    className="rounded-lg bg-teal-600 px-2.5 py-1.5 text-xs font-semibold text-white transition hover:bg-teal-700"
                  >
                    {copiedId === method.id ? 'Tersalin' : 'Salin'}
                  </button>
                </div>
                <p className="mt-2 text-xs text-slate-500">{method.note}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-[1.5rem] p-5 sm:p-6">
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">3. Konfirmasi (Opsional)</h2>
          <p className="mt-3 text-sm text-slate-600">Setelah transfer, Anda bisa kirim konfirmasi agar tim kami lebih cepat melakukan pencatatan.</p>
          <a
            href={`https://wa.me/6281234567890?text=${whatsappMessage}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-700"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 2 11 13" />
              <path d="M22 2 15 22 11 13 2 9 22 2Z" />
            </svg>
            Konfirmasi via WhatsApp
          </a>
        </section>

        <div className="glass-subtle rounded-2xl px-4 py-3 text-xs text-slate-400">
          Info: Nomor rekening/e-wallet di halaman ini bisa Anda ubah sesuai akun lembaga Anda.
        </div>
      </div>
    </div>
  );
}
