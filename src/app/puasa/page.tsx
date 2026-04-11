'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import PageHeaderActions from '@/components/PageHeaderActions';

type FastingType = 'ramadan' | 'senin-kamis' | 'ayyamul-bidh' | 'daud' | 'syawal' | 'arafah' | 'asyura' | 'custom';
type FastStatus = 'done' | 'batal' | 'uzur' | null;

const FASTING_TYPES: { id: FastingType; label: string; desc: string; color: string; sunnah: boolean }[] = [
  { id: 'ramadan',      label: 'Ramadan',       desc: 'Puasa wajib selama Ramadan',            color: '#0891b2', sunnah: false },
  { id: 'senin-kamis',  label: 'Senin & Kamis',  desc: 'Puasa sunnah tiap Senin dan Kamis',    color: '#7c3aed', sunnah: true },
  { id: 'ayyamul-bidh', label: 'Ayyamul Bidh',   desc: '13, 14, 15 setiap bulan Hijriah',     color: '#d97706', sunnah: true },
  { id: 'daud',         label: 'Puasa Daud',      desc: 'Selang-seling: puasa, berbuka, dst.',  color: '#0369a1', sunnah: true },
  { id: 'syawal',       label: '6 Hari Syawal',   desc: '6 hari di bulan Syawal',              color: '#16a34a', sunnah: true },
  { id: 'arafah',       label: 'Hari Arafah',     desc: '9 Dzulhijjah, sangat dianjurkan',     color: '#ea580c', sunnah: true },
  { id: 'asyura',       label: 'Asyura',          desc: '10 Muharram (+ 9/11 Muharram)',        color: '#9333ea', sunnah: true },
  { id: 'custom',       label: 'Nazar / Lainnya', desc: 'Puasa nazar atau puasa lainnya',       color: '#64748b', sunnah: false },
];

const STATUS_CONFIG: Record<NonNullable<FastStatus>, { label: string; color: string; bg: string }> = {
  done:  { label: '✓ Puasa',  color: '#0d9488', bg: '#ccfbf1' },
  batal: { label: '✗ Batal',  color: '#ef4444', bg: '#fee2e2' },
  uzur:  { label: '⚡ Uzur',   color: '#f59e0b', bg: '#fef3c7' },
};

function todayKey() { return new Date().toISOString().slice(0, 10); }

function pastDays(n: number): string[] {
  const arr: string[] = [];
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(); d.setDate(d.getDate() - i);
    arr.push(d.toISOString().slice(0, 10));
  }
  return arr;
}

function dayLabel(dt: string) {
  return new Date(dt).toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric', month: 'short' });
}

type LogEntry = { type: FastingType; status: FastStatus; note?: string };
type Log = Record<string, LogEntry[]>; // dateKey → entries

function loadLog(): Log {
  try { return JSON.parse(localStorage.getItem('puasa-log') || '{}'); } catch { return {}; }
}
function saveLog(log: Log) { localStorage.setItem('puasa-log', JSON.stringify(log)); }

export default function PuasaPage() {
  const [log, setLog] = useState<Log>({});
  const [selectedDate, setSelectedDate] = useState(todayKey());
  const [selectedType, setSelectedType] = useState<FastingType>('ramadan');
  const [mounted, setMounted] = useState(false);
  const [addNote, setAddNote] = useState('');

  useEffect(() => { setLog(loadLog()); setMounted(true); }, []);

  const updateLog = useCallback((newLog: Log) => { setLog(newLog); saveLog(newLog); }, []);

  const setStatus = (date: string, type: FastingType, status: FastStatus) => {
    const existing = log[date] ?? [];
    const without = existing.filter(e => e.type !== type);
    const next: Log = {
      ...log,
      [date]: status ? [...without, { type, status, note: addNote || undefined }] : without,
    };
    updateLog(next);
    setAddNote('');
  };

  const getEntry = (date: string, type: FastingType): LogEntry | undefined =>
    (log[date] ?? []).find(e => e.type === type);

  const days = pastDays(30);

  const totalThisMonth = Object.values(log).flatMap(v => v).filter(e => e.status === 'done').length;
  const todayEntries = log[todayKey()] ?? [];
  const fastingToday = todayEntries.filter(e => e.status === 'done').length;

  // Streak: consecutive days with at least one puasa
  let streak = 0;
  for (let i = 0; i < 365; i++) {
    const d = new Date(); d.setDate(d.getDate() - i);
    const k = d.toISOString().slice(0, 10);
    const hasFast = (log[k] ?? []).some(e => e.status === 'done');
    if (!hasFast) { if (i === 0) continue; break; }
    streak++;
  }

  const selectedEntry = getEntry(selectedDate, selectedType);

  return (
    <div className="relative min-h-screen px-4 py-8 sm:px-6">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[28rem]" />
      <div className="mx-auto mb-8 flex max-w-lg items-center justify-between gap-4">
        <div className="flex items-center gap-4">
        <Link href="/" className="glass-subtle flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-2xl text-slate-600 transition hover:bg-white/60">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <p className="text-xs uppercase tracking-[0.24em] text-slate-500">Ibadah</p>
          <h1 className="text-2xl font-semibold text-slate-900">Tracker Puasa</h1>
        </div>
        </div>
        <PageHeaderActions />
      </div>

      <div className="mx-auto max-w-lg space-y-5">
        {/* Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-teal-600">{mounted ? streak : 0}</p>
            <p className="mt-0.5 text-xs text-slate-500">🔥 Hari streak</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{fastingToday}</p>
            <p className="mt-0.5 text-xs text-slate-500">Hari ini</p>
          </div>
          <div className="glass-panel rounded-[1.25rem] p-4 text-center">
            <p className="text-3xl font-bold text-slate-900">{mounted ? totalThisMonth : 0}</p>
            <p className="mt-0.5 text-xs text-slate-500">Total puasa</p>
          </div>
        </div>

        {/* 30-day scroll calendar */}
        <div className="glass-panel rounded-[1.5rem] p-5">
          <h3 className="mb-3 text-sm font-semibold text-slate-700">30 Hari Terakhir</h3>
          <div className="flex gap-1.5 overflow-x-auto pb-1">
            {days.map((d) => {
              const entries = log[d] ?? [];
              const hasDone = entries.some(e => e.status === 'done');
              const hasBatal = entries.some(e => e.status === 'batal');
              const isToday = d === todayKey();
              const isSel = d === selectedDate;
              const bgColor = hasDone ? '#0d9488' : hasBatal ? '#ef4444' : 'rgba(148,163,184,0.18)';
              return (
                <button key={d} onClick={() => setSelectedDate(d)} className="flex flex-shrink-0 flex-col items-center gap-1">
                  <div
                    className="h-8 w-8 rounded-lg transition-transform hover:scale-110 flex items-center justify-center text-[10px] font-bold"
                    style={{
                      backgroundColor: bgColor,
                      color: hasDone || hasBatal ? '#fff' : '#94a3b8',
                      outline: isSel ? '2px solid #0d9488' : isToday ? '2px solid #94a3b8' : 'none',
                      outlineOffset: 2,
                    }}
                  >
                    {new Date(d).getDate()}
                  </div>
                  <span className="text-[9px] text-slate-400">{new Date(d).toLocaleDateString('id-ID', { weekday: 'narrow' })}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Type selector */}
        <div className="glass-panel rounded-[1.5rem] p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-slate-500">Jenis Puasa</p>
          <div className="flex flex-wrap gap-2">
            {FASTING_TYPES.map(ft => (
              <button
                key={ft.id}
                onClick={() => setSelectedType(ft.id)}
                className="rounded-full px-3.5 py-1 text-xs font-medium transition"
                style={
                  selectedType === ft.id
                    ? { backgroundColor: ft.color, color: '#fff' }
                    : { backgroundColor: ft.color + '20', color: ft.color }
                }
              >
                {ft.label}
              </button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="glass-panel rounded-[1.5rem] p-5">
          <div className="mb-4">
            <p className="text-sm font-semibold text-slate-900">
              {selectedDate === todayKey() ? 'Hari Ini' : dayLabel(selectedDate)}
            </p>
            <p className="text-xs text-teal-600 mt-0.5">
              {FASTING_TYPES.find(f => f.id === selectedType)?.label}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            {(['done', 'batal', 'uzur'] as const).map(s => {
              const cfg = STATUS_CONFIG[s];
              const isActive = selectedEntry?.status === s;
              return (
                <button
                  key={s}
                  onClick={() => setStatus(selectedDate, selectedType, isActive ? null : s)}
                  className="rounded-2xl py-3 text-sm font-semibold transition hover:scale-[1.02]"
                  style={{
                    backgroundColor: isActive ? cfg.color : cfg.bg,
                    color: isActive ? '#fff' : cfg.color,
                    border: `1.5px solid ${cfg.color}44`,
                  }}
                >
                  {cfg.label}
                </button>
              );
            })}
          </div>

          <input
            type="text"
            value={addNote}
            onChange={e => setAddNote(e.target.value)}
            placeholder="Catatan (opsional)..."
            className="w-full rounded-xl border border-slate-200 bg-white/70 px-4 py-2 text-sm outline-none focus:border-teal-400 focus:ring-2 focus:ring-teal-100 transition"
          />
        </div>

        {/* All entries for selected date */}
        {(log[selectedDate] ?? []).length > 0 && (
          <div className="glass-panel rounded-[1.5rem] p-5">
            <p className="mb-3 text-sm font-semibold text-slate-700">Catatan {dayLabel(selectedDate)}</p>
            <div className="space-y-2">
              {(log[selectedDate] ?? []).map((entry, i) => {
                const ft = FASTING_TYPES.find(f => f.id === entry.type);
                const sc = entry.status ? STATUS_CONFIG[entry.status] : null;
                return (
                  <div key={i} className="flex items-center justify-between rounded-xl px-3 py-2"
                    style={{ backgroundColor: sc?.bg ?? '#f8fafc' }}>
                    <div>
                      <p className="text-sm font-medium text-slate-800">{ft?.label}</p>
                      {entry.note && <p className="text-xs text-slate-500">{entry.note}</p>}
                    </div>
                    <span className="text-xs font-semibold rounded-full px-2.5 py-0.5"
                      style={{ color: sc?.color, backgroundColor: sc?.color + '22' }}>
                      {sc?.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Sunnah reminder */}
        <div className="glass-subtle rounded-2xl p-4">
          <p className="text-xs font-semibold text-slate-600 mb-2">💡 Puasa Sunnah Terbaik</p>
          <ul className="space-y-1 text-xs text-slate-500">
            <li>• <span className="font-medium">Senin & Kamis</span> — Nabi ﷺ rutin berpuasa di hari ini</li>
            <li>• <span className="font-medium">Ayyamul Bidh</span> — 13, 14, 15 setiap bulan Hijriah</li>
            <li>• <span className="font-medium">Puasa Daud</span> — Puasa paling dicintai Allah (selang-seling)</li>
            <li>• <span className="font-medium">6 Hari Syawal</span> — Seperti puasa setahun penuh</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
