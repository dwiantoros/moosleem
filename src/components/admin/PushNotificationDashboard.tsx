'use client';

import { useEffect, useState } from 'react';

interface SendResult {
  ok: boolean;
  total: number;
  sent: number;
  failed: number;
  removed: number;
}

export default function PushNotificationDashboard() {
  const [subscriberCount, setSubscriberCount] = useState<number | null>(null);
  const [loadingCount, setLoadingCount] = useState(true);

  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [url, setUrl] = useState('/');
  const [requireInteraction, setRequireInteraction] = useState(false);

  const [sending, setSending] = useState(false);
  const [result, setResult] = useState<{ ok: boolean; message: string } | null>(null);

  async function fetchCount() {
    setLoadingCount(true);
    try {
      const res = await fetch('/api/admin/push');
      if (res.ok) {
        const data = (await res.json()) as { count?: number };
        setSubscriberCount(data.count ?? 0);
      }
    } finally {
      setLoadingCount(false);
    }
  }

  useEffect(() => {
    void fetchCount();
  }, []);

  async function handleSend() {
    if (!title.trim() || !body.trim()) return;
    setSending(true);
    setResult(null);

    try {
      const res = await fetch('/api/admin/push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim(), body: body.trim(), url: url.trim() || '/', requireInteraction }),
      });

      const data = (await res.json().catch(() => ({}))) as Partial<SendResult> & { error?: string };

      if (!res.ok || !data.ok) {
        setResult({ ok: false, message: data.error ?? 'Gagal mengirim notifikasi.' });
        return;
      }

      setResult({
        ok: true,
        message: `Terkirim ke ${data.sent ?? 0} dari ${data.total ?? 0} subscriber.${(data.removed ?? 0) > 0 ? ` ${data.removed} expired dihapus.` : ''}${(data.failed ?? 0) > 0 ? ` ${data.failed} gagal.` : ''}`,
      });

      // Reset form
      setTitle('');
      setBody('');
      setUrl('/');
      setRequireInteraction(false);

      // Refresh count (expired subs may have been removed)
      void fetchCount();
    } finally {
      setSending(false);
    }
  }

  const canSend = title.trim().length > 0 && body.trim().length > 0 && !sending;

  return (
    <div className="space-y-6">
      {/* Subscriber count */}
      <div className="flex items-center gap-4 rounded-[1.4rem] border border-white/60 bg-white/70 px-5 py-4 dark:border-white/10 dark:bg-white/5">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-teal-50 dark:bg-teal-500/10">
          <svg className="h-5 w-5 text-teal-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-teal-700 dark:text-teal-400">Total Subscriber</p>
          <p className="mt-1 text-2xl font-semibold text-slate-900 dark:text-slate-100">
            {loadingCount ? (
              <span className="inline-block h-7 w-10 animate-pulse rounded-lg bg-slate-200 dark:bg-slate-700" />
            ) : (
              subscriberCount ?? 0
            )}
          </p>
          <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">user aktifkan notifikasi sholat</p>
        </div>
        <button
          type="button"
          onClick={() => void fetchCount()}
          disabled={loadingCount}
          className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-600 transition hover:bg-white/80 disabled:opacity-50 dark:border-white/10 dark:text-slate-300 dark:hover:bg-white/10"
        >
          Refresh
        </button>
      </div>

      {/* Send form */}
      <div className="rounded-[1.4rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Kirim notifikasi kustom</p>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Notifikasi akan dikirim ke semua subscriber yang aktif.</p>

        <div className="mt-5 space-y-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Judul notifikasi
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              placeholder="Contoh: Pengumuman penting"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Isi pesan
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Tulis pesan singkat di sini..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
            <span className="mt-1 block text-right text-xs text-slate-400">{body.length}/200</span>
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            URL tujuan (opsional)
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="/"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <label className="flex cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={requireInteraction}
              onChange={(e) => setRequireInteraction(e.target.checked)}
              className="h-4 w-4 rounded accent-teal-600"
            />
            <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
              Notifikasi tetap muncul sampai ditutup manual
            </span>
          </label>
        </div>

        {result && (
          <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-medium ${result.ok ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-red-50 text-red-700 dark:bg-red-500/10 dark:text-red-400'}`}>
            {result.message}
          </div>
        )}

        <div className="mt-5 flex items-center gap-3">
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={!canSend}
            className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600 disabled:opacity-50 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            {sending ? 'Mengirim...' : 'Kirim ke semua subscriber'}
          </button>
          {subscriberCount !== null && subscriberCount === 0 && (
            <p className="text-xs text-slate-500 dark:text-slate-400">Belum ada subscriber.</p>
          )}
        </div>
      </div>
    </div>
  );
}
