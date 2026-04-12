'use client';

import { useState } from 'react';
import type { PageSeoEntry } from '@/server/cms/types';

type PageSeoDashboardProps = {
  initialEntries: PageSeoEntry[];
};

type PageInfo = {
  slug: string;
  label: string;
};

const APP_PAGES: PageInfo[] = [
  { slug: '/', label: 'Beranda' },
  { slug: '/quran', label: 'Al-Quran' },
  { slug: '/doa', label: 'Doa & Dzikir' },
  { slug: '/qibla', label: 'Arah Qibla' },
  { slug: '/kalender', label: 'Kalender Hijriah' },
  { slug: '/asmaul-husna', label: 'Asmaul Husna' },
  { slug: '/tasbih', label: 'Tasbih Digital' },
  { slug: '/zakat', label: 'Kalkulator Zakat' },
  { slug: '/puasa', label: 'Tracker Puasa' },
  { slug: '/panduan-sholat', label: 'Panduan Sholat' },
  { slug: '/tracker', label: 'Tracker Sholat' },
  { slug: '/masjid', label: 'Cari Masjid' },
  { slug: '/restoran-halal', label: 'Restoran Halal' },
  { slug: '/artikel', label: 'Blog Artikel' },
  { slug: '/notes', label: 'Catatan' },
  { slug: '/search', label: 'Pencarian' },
  { slug: '/tentang', label: 'Tentang' },
  { slug: '/bantuan', label: 'Bantuan' },
  { slug: '/sedekah', label: 'Sedekah' },
];

type SeoForm = {
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  faqs: Array<{ question: string; answer: string }>;
};

const EMPTY_FAQS = Array.from({ length: 10 }, () => ({ question: '', answer: '' }));
const EMPTY_FORM: SeoForm = { title: '', description: '', keywords: '', ogImage: '', faqs: EMPTY_FAQS };

function entryToForm(entry: PageSeoEntry | undefined): SeoForm {
  if (!entry) return EMPTY_FORM;
  const faqs = Array.from({ length: 10 }, (_, index) => entry.faqs?.[index] || { question: '', answer: '' });
  return { title: entry.title, description: entry.description, keywords: entry.keywords, ogImage: entry.ogImage, faqs };
}

export default function PageSeoDashboard({ initialEntries }: PageSeoDashboardProps) {
  const [entries, setEntries] = useState<Record<string, PageSeoEntry>>(() => {
    const map: Record<string, PageSeoEntry> = {};
    for (const e of initialEntries) {
      map[e.slug] = e;
    }
    return map;
  });

  const [selectedSlug, setSelectedSlug] = useState(APP_PAGES[0].slug);
  const [form, setForm] = useState<SeoForm>(() => entryToForm(initialEntries.find((e) => e.slug === APP_PAGES[0].slug)));
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  function selectPage(slug: string) {
    setSelectedSlug(slug);
    setForm(entryToForm(entries[slug]));
    setMessage('');
  }

  function updateForm(key: 'title' | 'description' | 'keywords' | 'ogImage', value: string) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function updateFaq(index: number, key: 'question' | 'answer', value: string) {
    setForm((current) => {
      const nextFaqs = current.faqs.map((faq, faqIndex) => {
        if (faqIndex !== index) {
          return faq;
        }

        return {
          ...faq,
          [key]: value,
        };
      });

      return {
        ...current,
        faqs: nextFaqs,
      };
    });
  }

  async function handleSave() {
    setSaving(true);
    setMessage('');

    try {
      const response = await fetch('/api/admin/page-seo', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: selectedSlug,
          ...form,
          faqs: form.faqs.filter((item) => item.question.trim() || item.answer.trim()),
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { entry?: PageSeoEntry; error?: string };

      if (!response.ok || !data.entry) {
        setMessage(data.error || 'Gagal menyimpan SEO.');
        return;
      }

      setEntries((current) => ({ ...current, [selectedSlug]: data.entry as PageSeoEntry }));
      setMessage('SEO berhasil disimpan.');
    } finally {
      setSaving(false);
    }
  }

  function hasCustomSeo(slug: string) {
    const entry = entries[slug];
    return entry && (entry.title || entry.description || entry.keywords || entry.ogImage || entry.faqs.length > 0);
  }

  const selectedPage = APP_PAGES.find((p) => p.slug === selectedSlug);

  return (
    <div className="grid gap-6 lg:grid-cols-[260px_minmax(0,1fr)]">
      {/* Page list */}
      <aside className="glass-panel rounded-[2rem] p-4">
        <p className="px-1 text-xs font-semibold uppercase tracking-[0.2em] text-teal-700">Halaman</p>
        <div className="mt-3 space-y-1">
          {APP_PAGES.map((page) => (
            <button
              key={page.slug}
              type="button"
              onClick={() => selectPage(page.slug)}
              className={`flex w-full items-center justify-between rounded-[1.2rem] px-3 py-2.5 text-left text-sm transition ${
                selectedSlug === page.slug
                  ? 'bg-teal-700 text-white'
                  : 'text-slate-700 hover:bg-white/70 dark:text-slate-200 dark:hover:bg-white/10'
              }`}
            >
              <span className="font-medium">{page.label}</span>
              <span className={`text-xs ${selectedSlug === page.slug ? 'text-teal-200' : 'text-slate-400 dark:text-slate-500'}`}>
                {page.slug}
              </span>
              {hasCustomSeo(page.slug) ? (
                <span className={`ml-1 h-1.5 w-1.5 shrink-0 rounded-full ${selectedSlug === page.slug ? 'bg-teal-300' : 'bg-teal-500'}`} />
              ) : null}
            </button>
          ))}
        </div>
      </aside>

      {/* SEO form */}
      <section className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:p-7">
        <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">SEO Halaman</p>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
          {selectedPage?.label ?? selectedSlug}
        </h2>
        <p className="mt-1 font-mono text-sm text-slate-500 dark:text-slate-400">{selectedSlug}</p>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Kosongkan field untuk menggunakan judul/deskripsi default halaman.
        </p>

        <div className="mt-6 grid gap-4">
          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Field Title
            <input
              type="text"
              value={form.title}
              onChange={(e) => updateForm('title', e.target.value)}
              placeholder="Judul utama halaman (juga dipakai untuk title SEO)"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Description
            <textarea
              value={form.description}
              onChange={(e) => updateForm('description', e.target.value)}
              rows={3}
              placeholder="Deskripsi halaman (ditampilkan di bawah halaman + meta description)"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <div className="rounded-[1.4rem] border border-slate-200 bg-white/70 p-4 dark:border-white/10 dark:bg-white/5">
            <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">FAQ (maksimal 10)</p>
            <div className="mt-3 space-y-3">
              {form.faqs.map((faq, index) => (
                <div key={`faq-${index}`} className="rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-white/10 dark:bg-slate-950/40">
                  <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500 dark:text-slate-400">FAQ {index + 1}</p>
                  <input
                    type="text"
                    value={faq.question}
                    onChange={(e) => updateFaq(index, 'question', e.target.value)}
                    placeholder="Pertanyaan"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <textarea
                    value={faq.answer}
                    onChange={(e) => updateFaq(index, 'answer', e.target.value)}
                    rows={2}
                    placeholder="Jawaban"
                    className="mt-2 w-full rounded-xl border border-slate-300 bg-white/90 px-3 py-2 text-sm text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </div>
              ))}
            </div>
          </div>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            Keywords
            <input
              type="text"
              value={form.keywords}
              onChange={(e) => updateForm('keywords', e.target.value)}
              placeholder="pisahkan dengan koma"
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>

          <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
            OG Image URL
            <input
              type="url"
              value={form.ogImage}
              onChange={(e) => updateForm('ogImage', e.target.value)}
              placeholder="https://..."
              className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
            />
          </label>
        </div>

        {message ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{message}</p> : null}

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {saving ? 'Menyimpan...' : 'Simpan SEO'}
          </button>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Perubahan langsung aktif pada halaman setelah disimpan.
          </p>
        </div>
      </section>
    </div>
  );
}
