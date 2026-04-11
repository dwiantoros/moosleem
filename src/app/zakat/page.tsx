'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

// Nisab & rates (can be updated via the UI)
const GOLD_PRICE_PER_GRAM_IDR = 1_350_000; // ~Apr 2026
const NISAB_GOLD_GRAMS = 85;
const NISAB_SILVER_GRAMS = 595;
const SILVER_PRICE_PER_GRAM_IDR = 14_000;

const NISAB_IDR = NISAB_GOLD_GRAMS * GOLD_PRICE_PER_GRAM_IDR; // gold-based nisab
const ZAKAT_RATE = 0.025; // 2.5%

type ZakatType = 'maal' | 'penghasilan' | 'emas' | 'perak' | 'pertanian';

interface ZakatResult {
  eligible: boolean;
  zakatAmount: number;
  nisabAmount: number;
  message: string;
}

function formatIDR(n: number): string {
  return new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(n);
}

const TABS: { id: ZakatType; label: string; icon: string }[] = [
  { id: 'maal',        label: 'Maal',         icon: '💰' },
  { id: 'penghasilan', label: 'Penghasilan',   icon: '💼' },
  { id: 'emas',        label: 'Emas',          icon: '🥇' },
  { id: 'perak',       label: 'Perak',         icon: '🥈' },
  { id: 'pertanian',   label: 'Pertanian',     icon: '🌾' },
];

export default function ZakatPage() {
  const [type, setType] = useState<ZakatType>('maal');

  // Maal (savings / harta simpanan)
  const [totalHarta, setTotalHarta] = useState('');
  const [hutang, setHutang] = useState('');

  // Penghasilan
  const [gajiPerBulan, setGajiPerBulan] = useState('');
  const [penghasilanLain, setPenghasilanLain] = useState('');

  // Emas
  const [emasGram, setEmasGram] = useState('');
  const [hargaEmas, setHargaEmas] = useState(String(GOLD_PRICE_PER_GRAM_IDR));

  // Perak
  const [perakGram, setPerakGram] = useState('');
  const [hargaPerak, setHargaPerak] = useState(String(SILVER_PRICE_PER_GRAM_IDR));

  // Pertanian
  const [hasilPanen, setHasilPanen] = useState('');
  const [jenisPengairan, setJenisPengairan] = useState<'hujan' | 'irigasi'>('hujan');

  function calculate(): ZakatResult {
    switch (type) {
      case 'maal': {
        const harta = parseFloat(totalHarta.replace(/\./g, '').replace(',', '.')) || 0;
        const debt  = parseFloat(hutang.replace(/\./g, '').replace(',', '.')) || 0;
        const net   = harta - debt;
        const nisab = NISAB_IDR;
        if (net <= 0) return { eligible: false, zakatAmount: 0, nisabAmount: nisab, message: 'Harta bersih tidak mencukupi.' };
        if (net < nisab) return { eligible: false, zakatAmount: 0, nisabAmount: nisab, message: `Harta bersih (${formatIDR(net)}) belum mencapai nisab (${formatIDR(nisab)}).` };
        return { eligible: true, zakatAmount: net * ZAKAT_RATE, nisabAmount: nisab, message: `Harta bersih: ${formatIDR(net)} · Sudah melewati nisab emas (${NISAB_GOLD_GRAMS}g).` };
      }
      case 'penghasilan': {
        const gaji  = parseFloat(gajiPerBulan.replace(/\./g, '').replace(',', '.')) || 0;
        const lain  = parseFloat(penghasilanLain.replace(/\./g, '').replace(',', '.')) || 0;
        const total = (gaji + lain) * 12;
        const nisab = NISAB_IDR;
        if (total < nisab) return { eligible: false, zakatAmount: 0, nisabAmount: nisab, message: `Total penghasilan setahun (${formatIDR(total)}) belum mencapai nisab (${formatIDR(nisab)}).` };
        // Zakat penghasilan: 2.5% per bulan dari total penghasilan kotor
        return { eligible: true, zakatAmount: (gaji + lain) * ZAKAT_RATE, nisabAmount: nisab, message: `Zakat per bulan dari penghasilan ${formatIDR(gaji + lain)}.` };
      }
      case 'emas': {
        const gram   = parseFloat(emasGram) || 0;
        const harga  = parseFloat(hargaEmas.replace(/\./g, '').replace(',', '.')) || GOLD_PRICE_PER_GRAM_IDR;
        const nilai  = gram * harga;
        const nisab  = NISAB_GOLD_GRAMS * harga;
        if (gram < NISAB_GOLD_GRAMS) return { eligible: false, zakatAmount: 0, nisabAmount: nisab, message: `Emas (${gram}g) belum mencapai nisab ${NISAB_GOLD_GRAMS}g (${formatIDR(nisab)}).` };
        return { eligible: true, zakatAmount: nilai * ZAKAT_RATE, nisabAmount: nisab, message: `${gram}g emas × ${formatIDR(harga)}/g = ${formatIDR(nilai)}.` };
      }
      case 'perak': {
        const gram   = parseFloat(perakGram) || 0;
        const harga  = parseFloat(hargaPerak.replace(/\./g, '').replace(',', '.')) || SILVER_PRICE_PER_GRAM_IDR;
        const nilai  = gram * harga;
        const nisab  = NISAB_SILVER_GRAMS * harga;
        if (gram < NISAB_SILVER_GRAMS) return { eligible: false, zakatAmount: 0, nisabAmount: nisab, message: `Perak (${gram}g) belum mencapai nisab ${NISAB_SILVER_GRAMS}g (${formatIDR(nisab)}).` };
        return { eligible: true, zakatAmount: nilai * ZAKAT_RATE, nisabAmount: nisab, message: `${gram}g perak × ${formatIDR(harga)}/g = ${formatIDR(nilai)}.` };
      }
      case 'pertanian': {
        const panen = parseFloat(hasilPanen.replace(/\./g, '').replace(',', '.')) || 0;
        const rate  = jenisPengairan === 'hujan' ? 0.1 : 0.05; // 10% hujan, 5% irigasi
        const nisabKg = 653; // ~653 kg gabah
        if (panen < nisabKg) return { eligible: false, zakatAmount: panen * rate, nisabAmount: nisabKg, message: `Hasil panen (${panen} kg) belum mencapai nisab ${nisabKg} kg.` };
        return { eligible: true, zakatAmount: panen * rate, nisabAmount: nisabKg, message: `Tarif ${(rate * 100).toFixed(0)}% (${jenisPengairan === 'hujan' ? 'air hujan/sungai' : 'irigasi berbayar'}).` };
      }
    }
  }

  const result = calculate();
  const isPertanian = type === 'pertanian';

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      {/* Header */}
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M15 18l-6-6 6-6" />
          </svg>
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Keuangan</p>
          <h1 className="text-2xl font-semibold text-slate-900">Kalkulator Zakat</h1>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-lg space-y-5">

        {/* Tabs */}
        <div className="glass-panel rounded-[1.5rem] p-3">
          <div className="flex flex-wrap gap-2">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setType(tab.id)}
                className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                  type === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {tab.icon} {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input form */}
        <div className="glass-panel rounded-[1.5rem] p-5 space-y-4">
          {type === 'maal' && (
            <>
              <Field label="Total Harta (Rp)" value={totalHarta} onChange={setTotalHarta} placeholder="Tabungan, investasi, piutang, dll." />
              <Field label="Total Hutang (Rp)" value={hutang} onChange={setHutang} placeholder="Hutang yang jatuh tempo tahun ini" />
              <Info>Zakat Maal wajib setelah harta dimiliki penuh 1 tahun Hijriah (haul).</Info>
            </>
          )}
          {type === 'penghasilan' && (
            <>
              <Field label="Gaji / Penghasilan Per Bulan (Rp)" value={gajiPerBulan} onChange={setGajiPerBulan} placeholder="Gaji pokok + tunjangan" />
              <Field label="Penghasilan Lain Per Bulan (Rp)" value={penghasilanLain} onChange={setPenghasilanLain} placeholder="Freelance, bisnis, dll." />
              <Info>Zakat penghasilan langsung dari gaji kotor setiap bulan (mazhab kontemporer).</Info>
            </>
          )}
          {type === 'emas' && (
            <>
              <Field label="Berat Emas (gram)" value={emasGram} onChange={setEmasGram} placeholder="Emas murni / perhiasan simpanan" />
              <Field label="Harga Emas per Gram (Rp)" value={hargaEmas} onChange={setHargaEmas} placeholder="Update harga hari ini" />
              <Info>Nisab emas: {NISAB_GOLD_GRAMS} gram. Emas yang dipakai sehari-hari terdapat perbedaan pendapat ulama.</Info>
            </>
          )}
          {type === 'perak' && (
            <>
              <Field label="Berat Perak (gram)" value={perakGram} onChange={setPerakGram} placeholder="Perak murni yang dimiliki" />
              <Field label="Harga Perak per Gram (Rp)" value={hargaPerak} onChange={setHargaPerak} placeholder="Update harga hari ini" />
              <Info>Nisab perak: {NISAB_SILVER_GRAMS} gram (lebih rendah dari nisab emas, lebih besar kemungkinan wajib).</Info>
            </>
          )}
          {type === 'pertanian' && (
            <>
              <Field label="Hasil Panen (kg)" value={hasilPanen} onChange={setHasilPanen} placeholder="Berat panen sekali panen" />
              <div>
                <label className="mb-1.5 block text-sm font-medium text-slate-700">Jenis Pengairan</label>
                <div className="flex gap-3">
                  {['hujan', 'irigasi'].map((j) => (
                    <button
                      key={j}
                      onClick={() => setJenisPengairan(j as 'hujan' | 'irigasi')}
                      className={`flex-1 rounded-xl py-2 text-sm font-medium transition capitalize ${
                        jenisPengairan === j ? 'bg-teal-600 text-white' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      {j === 'hujan' ? '🌧 Hujan / Sungai (10%)' : '💧 Irigasi Berbayar (5%)'}
                    </button>
                  ))}
                </div>
              </div>
              <Info>Nisab pertanian: {isPertanian ? '653 kg' : ''} gabah / setara. Zakat langsung saat panen.</Info>
            </>
          )}
        </div>

        {/* Result */}
        <div
          className={`rounded-[1.5rem] p-6 transition-all ${
            result.eligible ? 'bg-teal-50 border-2 border-teal-200' : 'glass-panel'
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl text-xl ${result.eligible ? 'bg-teal-100' : 'bg-slate-100'}`}>
              {result.eligible ? '✅' : '⏳'}
            </div>
            <div className="flex-1">
              <p className={`text-lg font-bold ${result.eligible ? 'text-teal-700' : 'text-slate-600'}`}>
                {result.eligible ? 'Wajib Zakat' : 'Belum Wajib Zakat'}
              </p>
              <p className="mt-0.5 text-sm text-slate-500">{result.message}</p>
              {result.eligible && (
                <div className="mt-3 rounded-xl bg-white px-4 py-3">
                  <p className="text-xs text-slate-400">{isPertanian ? 'Zakat panen ini' : 'Zakat yang harus dikeluarkan'}</p>
                  <p className="text-2xl font-bold text-teal-600 mt-0.5">
                    {isPertanian
                      ? `${result.zakatAmount.toFixed(1)} kg`
                      : formatIDR(result.zakatAmount)}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="glass-subtle rounded-2xl px-4 py-3 text-xs text-slate-400">
          ⚠️ Kalkulator ini bersifat estimasi. Untuk kepastian hukum, konsultasikan dengan ulama atau lembaga zakat terpercaya.
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-slate-700">{label}</label>
      <input
        type="text"
        inputMode="numeric"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm outline-none transition focus:border-teal-400 focus:ring-2 focus:ring-teal-100"
      />
    </div>
  );
}

function Info({ children }: { children: React.ReactNode }) {
  return (
    <p className="rounded-xl bg-blue-50 px-3 py-2 text-xs text-blue-700">
      ℹ️ {children}
    </p>
  );
}
