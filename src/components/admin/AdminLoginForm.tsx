'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';

type AdminLoginFormProps = {
  authReady: boolean;
  storageMode: 'turso' | 'local' | 'missing';
};

export default function AdminLoginForm({ authReady, storageMode }: AdminLoginFormProps) {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError('');

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setError(data.error || 'Login admin gagal.');
        return;
      }

      router.replace('/admin');
      router.refresh();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <section className="glass-panel mx-auto max-w-xl rounded-[2rem] p-6 sm:p-8">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Admin CMS</p>
        <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Masuk untuk kelola artikel</h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          CMS ini pakai login admin sederhana. Artikel tersimpan di database gratis Turso saat env production diisi, dan otomatis fallback ke file lokal saat development.
        </p>
      </div>

      {!authReady ? (
        <div className="rounded-[1.4rem] border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          Env admin belum lengkap. Isi <strong>CMS_ADMIN_USERNAME</strong>, <strong>CMS_ADMIN_PASSWORD</strong>, dan <strong>CMS_SESSION_SECRET</strong> dulu.
        </div>
      ) : null}

      <div className="mb-5 rounded-[1.4rem] border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-600">
        <span className="font-semibold text-slate-900">Mode database:</span>{' '}
        {storageMode === 'turso' ? 'Turso remote' : storageMode === 'local' ? 'File lokal development' : 'Belum dikonfigurasi untuk production'}
      </div>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <label className="block text-sm font-medium text-slate-700">
          Username admin
          <input
            type="text"
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-teal-400"
            autoComplete="username"
            disabled={!authReady || submitting}
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Password admin
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="mt-2 w-full rounded-2xl border border-white/70 bg-white/80 px-4 py-3 text-slate-900 outline-none ring-0 transition focus:border-teal-400"
            autoComplete="current-password"
            disabled={!authReady || submitting}
          />
        </label>

        {error ? <p className="text-sm text-rose-600">{error}</p> : null}

        <button
          type="submit"
          className="inline-flex w-full items-center justify-center rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          disabled={!authReady || submitting}
        >
          {submitting ? 'Memproses...' : 'Masuk ke Dashboard'}
        </button>
      </form>
    </section>
  );
}