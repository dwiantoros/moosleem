'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

const QUICK_AMOUNTS = [10000, 25000, 50000, 100000, 250000];
const QRIS_STATIC_PAYLOAD = process.env.NEXT_PUBLIC_QRIS_STATIC_PAYLOAD ?? '';

function formatIDR(value: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(value);
}

type Tlv = { tag: string; value: string };

function parseTlv(payload: string): Tlv[] {
  const chunks: Tlv[] = [];
  let i = 0;

  while (i + 4 <= payload.length) {
    const tag = payload.slice(i, i + 2);
    const lenStr = payload.slice(i + 2, i + 4);
    const len = Number.parseInt(lenStr, 10);
    if (Number.isNaN(len) || i + 4 + len > payload.length) break;

    const value = payload.slice(i + 4, i + 4 + len);
    chunks.push({ tag, value });
    i += 4 + len;
  }

  return chunks;
}

function encodeTlv(tag: string, value: string): string {
  return `${tag}${String(value.length).padStart(2, '0')}${value}`;
}

function crc16Ccitt(text: string): string {
  let crc = 0xffff;
  for (let i = 0; i < text.length; i++) {
    crc ^= text.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ 0x1021;
      } else {
        crc <<= 1;
      }
      crc &= 0xffff;
    }
  }
  return crc.toString(16).toUpperCase().padStart(4, '0');
}

function buildDynamicQris(staticPayload: string, amount: number): string | null {
  if (!staticPayload) return null;

  const chunks = parseTlv(staticPayload).filter((c) => c.tag !== '63');
  const amountValue = Math.max(1, Math.floor(amount)).toString();

  let hasTag01 = false;
  let hasTag54 = false;

  for (const chunk of chunks) {
    if (chunk.tag === '01') {
      chunk.value = '12';
      hasTag01 = true;
    }
    if (chunk.tag === '54') {
      chunk.value = amountValue;
      hasTag54 = true;
    }
  }

  if (!hasTag01) {
    chunks.splice(1, 0, { tag: '01', value: '12' });
  }

  if (!hasTag54) {
    chunks.push({ tag: '54', value: amountValue });
  }

  const withoutCrc = chunks.map((chunk) => encodeTlv(chunk.tag, chunk.value)).join('');
  const crcInput = `${withoutCrc}6304`;
  return `${crcInput}${crc16Ccitt(crcInput)}`;
}

export default function SedekahPage() {
  const [selectedAmount, setSelectedAmount] = useState<number>(QUICK_AMOUNTS[1]);
  const [qrisError, setQrisError] = useState(false);
  const dynamicPayload = buildDynamicQris(QRIS_STATIC_PAYLOAD, selectedAmount);
  const qrImageUrl = dynamicPayload
    ? `https://api.qrserver.com/v1/create-qr-code/?size=420x420&data=${encodeURIComponent(dynamicPayload)}`
    : '/qris-sedekah.png';

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
            <p className="mt-1 text-sm text-slate-500">Pilih nominal lalu scan QRIS untuk bayar cepat.</p>
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
          <h2 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">2. Scan QRIS</h2>
          <div className="mt-4 rounded-2xl border border-slate-200 bg-white/70 p-4">
            <p className="text-sm font-semibold text-slate-900">Pembayaran QRIS Otomatis</p>
            <p className="mt-1 text-xs text-slate-500">Nominal mengikuti pilihan Anda secara otomatis. Scan menggunakan m-banking atau e-wallet apa saja yang mendukung QRIS.</p>

            {!qrisError ? (
              <img
                src={qrImageUrl}
                alt="QRIS Sedekah"
                className="mx-auto mt-4 w-full max-w-[300px] rounded-2xl border border-slate-200 bg-white p-3"
                onError={() => setQrisError(true)}
              />
            ) : (
              <div className="mx-auto mt-4 flex h-[320px] w-full max-w-[300px] items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-500">
                QRIS otomatis belum aktif.<br />
                Isi env `NEXT_PUBLIC_QRIS_STATIC_PAYLOAD`<br />
                atau sediakan fallback di `public/qris-sedekah.png`.
              </div>
            )}

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={qrImageUrl}
                download
                className="rounded-xl bg-teal-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-teal-700"
              >
                Unduh QRIS
              </a>
              <a
                href={qrImageUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-300 bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
              >
                Buka QRIS
              </a>
            </div>
            {dynamicPayload && (
              <p className="mt-3 text-[11px] text-slate-500">
                Nominal QR aktif: <span className="font-semibold text-teal-700">{formatIDR(selectedAmount)}</span>
              </p>
            )}
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
          Info: Untuk QRIS otomatis, set env `NEXT_PUBLIC_QRIS_STATIC_PAYLOAD` dengan payload QRIS statis merchant Anda.
        </div>
      </div>
    </div>
  );
}
