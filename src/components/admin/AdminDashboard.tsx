'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

import PushNotificationDashboard from '@/components/admin/PushNotificationDashboard';
import RichTextEditor from '@/components/admin/RichTextEditor';
import type { CmsArticle, CmsAsset, CmsSettings } from '@/server/cms/types';

type StorageMode = 'turso' | 'local' | 'missing';

type ArticleDraft = {
  id: string;
  title: string;
  slug: string;
  category: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImage: string;
  status: 'draft' | 'published';
  publishedAt: string;
};

type AdminDashboardProps = {
  initialArticles: CmsArticle[];
  initialSettings: CmsSettings;
  initialAssets: CmsAsset[];
  storageMode: StorageMode;
  profileHref?: string;
};

const EMPTY_ARTICLE: ArticleDraft = {
  id: '',
  title: '',
  slug: '',
  category: 'Artikel',
  excerpt: '',
  content: '',
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  seoKeywords: '',
  canonicalUrl: '',
  ogImage: '',
  status: 'draft',
  publishedAt: '',
};

function toLocalInputValue(value: string | null) {
  if (!value) {
    return '';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function fromArticle(article?: CmsArticle | null): ArticleDraft {
  if (!article) {
    return EMPTY_ARTICLE;
  }

  return {
    id: article.id,
    title: article.title,
    slug: article.slug,
    category: article.category || 'Artikel',
    excerpt: article.excerpt,
    content: article.content,
    coverImage: article.coverImage,
    seoTitle: article.seoTitle,
    seoDescription: article.seoDescription,
    seoKeywords: article.seoKeywords,
    canonicalUrl: article.canonicalUrl,
    ogImage: article.ogImage,
    status: article.status,
    publishedAt: toLocalInputValue(article.publishedAt),
  };
}

function formatStatus(status: 'draft' | 'published') {
  return status === 'published' ? 'Terbit' : 'Draft';
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Belum dijadwalkan';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(value));
}

function formatFileSize(sizeBytes: number) {
  if (sizeBytes < 1024) {
    return `${sizeBytes} B`;
  }

  if (sizeBytes < 1024 * 1024) {
    return `${(sizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function AdminDashboard({ initialArticles, initialSettings: _initialSettings, initialAssets, storageMode, profileHref = '/bukan-admin/profil' }: AdminDashboardProps) {
  const router = useRouter();
  const [articles, setArticles] = useState(initialArticles);
  const [assets, setAssets] = useState(initialAssets);
  const [selectedId, setSelectedId] = useState(initialArticles[0]?.id || 'new');
  const [draft, setDraft] = useState<ArticleDraft>(fromArticle(initialArticles[0]));
  const [tab, setTab] = useState<'articles' | 'push'>('articles');
  const [articleMessage, setArticleMessage] = useState('');
  const [savingArticle, setSavingArticle] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const [uploadingMedia, setUploadingMedia] = useState(false);

  const selectedArticle = useMemo(
    () => articles.find((article) => article.id === selectedId) || null,
    [articles, selectedId]
  );

  function selectArticle(articleId: string) {
    if (articleId === 'new') {
      setSelectedId('new');
      setDraft(EMPTY_ARTICLE);
      setArticleMessage('');
      return;
    }

    const article = articles.find((item) => item.id === articleId);

    if (!article) {
      return;
    }

    setSelectedId(articleId);
    setDraft(fromArticle(article));
    setArticleMessage('');
  }

  function updateDraft<K extends keyof ArticleDraft>(key: K, value: ArticleDraft[K]) {
    setDraft((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function handleSaveArticle() {
    setSavingArticle(true);
    setArticleMessage('');

    try {
      const method = draft.id ? 'PATCH' : 'POST';
      const endpoint = draft.id ? `/api/admin/articles/${draft.id}` : '/api/admin/articles';
      const response = await fetch(endpoint, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draft.title,
          slug: draft.slug,
          category: draft.category,
          excerpt: draft.excerpt,
          content: draft.content,
          coverImage: draft.coverImage,
          seoTitle: draft.seoTitle,
          seoDescription: draft.seoDescription,
          seoKeywords: draft.seoKeywords,
          canonicalUrl: draft.canonicalUrl,
          ogImage: draft.ogImage,
          status: draft.status,
          publishedAt: draft.publishedAt || null,
        }),
      });
      const data = (await response.json().catch(() => ({}))) as { article?: CmsArticle; error?: string };

      if (!response.ok || !data.article) {
        setArticleMessage(data.error || 'Gagal menyimpan artikel.');
        return;
      }

      setArticles((current) => {
        const next = current.filter((article) => article.id !== data.article?.id);
        next.unshift(data.article as CmsArticle);
        return next;
      });
      setSelectedId(data.article.id);
      setDraft(fromArticle(data.article));
      setArticleMessage(draft.id ? 'Artikel berhasil diperbarui.' : 'Artikel baru berhasil dibuat.');
      router.refresh();
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleDeleteArticle() {
    if (!draft.id) {
      setDraft(EMPTY_ARTICLE);
      setSelectedId('new');
      return;
    }

    const confirmed = window.confirm(`Hapus artikel "${draft.title}"?`);

    if (!confirmed) {
      return;
    }

    setSavingArticle(true);
    setArticleMessage('');

    try {
      const response = await fetch(`/api/admin/articles/${draft.id}`, {
        method: 'DELETE',
      });
      const data = (await response.json().catch(() => ({}))) as { error?: string };

      if (!response.ok) {
        setArticleMessage(data.error || 'Gagal menghapus artikel.');
        return;
      }

      const nextArticles = articles.filter((article) => article.id !== draft.id);
      setArticles(nextArticles);
      setSelectedId(nextArticles[0]?.id || 'new');
      setDraft(fromArticle(nextArticles[0] || null));
      setArticleMessage('Artikel berhasil dihapus.');
      router.refresh();
    } finally {
      setSavingArticle(false);
    }
  }

  async function handleLogout() {
    setLoggingOut(true);

    try {
      await fetch('/api/admin/logout', {
        method: 'POST',
      });
      router.replace('/bukan-admin/login');
      router.refresh();
    } finally {
      setLoggingOut(false);
    }
  }

  async function uploadAsset(file: File) {
    setUploadingMedia(true);

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('altText', file.name.replace(/\.[^.]+$/, ''));

      const response = await fetch('/api/admin/assets', {
        method: 'POST',
        body: formData,
      });
      const data = (await response.json().catch(() => ({}))) as { asset?: CmsAsset; error?: string };

      if (!response.ok || !data.asset) {
        throw new Error(data.error || 'Upload gambar gagal.');
      }

      setAssets((current) => [data.asset as CmsAsset, ...current.filter((item) => item.id !== data.asset?.id)]);
      return data.asset.url;
    } finally {
      setUploadingMedia(false);
    }
  }

  async function handleStandaloneUpload(field: 'coverImage' | 'ogImage', file: File) {
    try {
      const url = await uploadAsset(file);
      updateDraft(field, url);
      setArticleMessage(`${field === 'coverImage' ? 'Cover image' : 'OG image'} berhasil diunggah.`);
    } catch (error) {
      setArticleMessage(error instanceof Error ? error.message : 'Upload gambar gagal.');
    }
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)]">
      <aside className="glass-panel rounded-[2rem] p-5 sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Dashboard</p>
            <h1 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">CMS Artikel</h1>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-white/70 dark:border-white/10 dark:text-slate-200 dark:hover:bg-white/10"
            disabled={loggingOut}
          >
            {loggingOut ? 'Keluar...' : 'Logout'}
          </button>
        </div>

        <div className="mt-5 rounded-[1.4rem] border border-white/60 bg-white/70 px-4 py-3 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <span className="font-semibold text-slate-900 dark:text-slate-100">Database:</span>{' '}
          {storageMode === 'turso' ? 'Turso remote gratis' : storageMode === 'local' ? 'File lokal development' : 'Belum siap untuk production'}
        </div>

        <div className="mt-5 flex flex-wrap gap-2 rounded-[1.5rem] bg-white/70 p-1 dark:bg-white/5">
          <button
            key="articles"
            type="button"
            onClick={() => setTab('articles')}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'articles' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-white/90 dark:text-slate-300 dark:hover:bg-white/10'}`}
          >
            Artikel
          </button>
          <button
            key="push"
            type="button"
            onClick={() => setTab('push')}
            className={`flex-1 rounded-full px-3 py-2 text-sm font-medium transition ${tab === 'push' ? 'bg-teal-700 text-white' : 'text-slate-600 hover:bg-white/90 dark:text-slate-300 dark:hover:bg-white/10'}`}
          >
            Push Notif
          </button>
          <Link
            href="/bukan-admin/seo"
            className="flex-1 rounded-full px-3 py-2 text-center text-sm font-medium text-slate-600 transition hover:bg-white/90 dark:text-slate-300 dark:hover:bg-white/10"
          >
            SEO
          </Link>
        </div>

        <Link href={profileHref} className="mt-3 flex items-center justify-between rounded-[1.3rem] border border-white/60 bg-white/70 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
          <span>Profil author</span>
          <span aria-hidden="true">→</span>
        </Link>

        <div className="mt-5 flex items-center justify-between">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Daftar artikel</p>
          <button
            type="button"
            onClick={() => selectArticle('new')}
            className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 dark:bg-teal-600 dark:hover:bg-teal-500"
          >
            Artikel baru
          </button>
        </div>

        <div className="mt-4 space-y-3">
          {articles.map((article) => (
            <button
              key={article.id}
              type="button"
              onClick={() => {
                setTab('articles');
                selectArticle(article.id);
              }}
              className={`w-full rounded-[1.4rem] border px-4 py-3 text-left transition ${selectedId === article.id ? 'border-teal-400 bg-teal-50 dark:border-teal-500 dark:bg-teal-500/10' : 'border-white/60 bg-white/70 hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:hover:bg-white/10'}`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="text-sm font-semibold text-slate-900 dark:text-slate-100">{article.title}</span>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.16em] ${article.status === 'published' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {formatStatus(article.status)}
                </span>
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">/{article.slug}</p>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{formatDate(article.publishedAt)}</p>
            </button>
          ))}

          {articles.length === 0 ? (
            <div className="rounded-[1.4rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
              Belum ada artikel. Buat artikel pertama dari tombol di atas.
            </div>
          ) : null}
        </div>

        <div className="mt-6 rounded-[1.4rem] border border-white/60 bg-white/70 p-4 text-sm text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
          <p className="font-semibold text-slate-900 dark:text-slate-100">Link publik</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Link href="/artikel" target="_blank" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
              Halaman artikel
            </Link>
            {selectedArticle?.status === 'published' ? (
              <Link href={`/artikel/${selectedArticle.slug}`} target="_blank" className="rounded-full bg-white px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                Buka artikel ini
              </Link>
            ) : null}
          </div>
        </div>
      </aside>

      <section className="glass-panel rounded-[2rem] p-5 sm:p-6 lg:p-7">
        {tab === 'push' && (
          <div>
            <div className="mb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Push Notification</p>
              <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Kelola Notifikasi</h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Lihat jumlah subscriber aktif dan kirim notifikasi kustom ke semua pengguna.</p>
            </div>
            <PushNotificationDashboard />
          </div>
        )}
        {tab === 'articles' && <div>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Editor Artikel</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">
                  {draft.id ? 'Edit artikel' : 'Tulis artikel baru'}
                </h2>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Konten artikel mendukung Markdown. SEO per artikel bisa diatur langsung dari panel ini.</p>
              </div>
              <div className="rounded-[1.2rem] border border-white/60 bg-white/70 px-4 py-3 text-xs text-slate-500 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
                {draft.id ? `Status: ${formatStatus(draft.status)}` : 'Draft baru'}
              </div>
            </div>

            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Judul artikel
                <input
                  type="text"
                  value={draft.title}
                  onChange={(event) => updateDraft('title', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Slug URL
                <input
                  type="text"
                  value={draft.slug}
                  onChange={(event) => updateDraft('slug', event.target.value)}
                  placeholder="akan dibuat otomatis jika kosong"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Kategori artikel
                <input
                  type="text"
                  value={draft.category}
                  onChange={(event) => updateDraft('category', event.target.value)}
                  placeholder="Contoh: Panduan Ibadah"
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                Ringkasan artikel
                <textarea
                  value={draft.excerpt}
                  onChange={(event) => updateDraft('excerpt', event.target.value)}
                  rows={3}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                />
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                Isi artikel
                <div className="mt-2">
                  <RichTextEditor
                    value={draft.content}
                    onChange={(value) => updateDraft('content', value)}
                    onUploadImage={uploadAsset}
                  />
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Cover image URL
                <div className="mt-2 space-y-2">
                  <input
                    type="url"
                    value={draft.coverImage}
                    onChange={(event) => updateDraft('coverImage', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                    Upload cover
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';

                        if (!file) {
                          return;
                        }

                        await handleStandaloneUpload('coverImage', file);
                      }}
                    />
                  </label>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                OG image URL
                <div className="mt-2 space-y-2">
                  <input
                    type="url"
                    value={draft.ogImage}
                    onChange={(event) => updateDraft('ogImage', event.target.value)}
                    className="w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                  <label className="inline-flex cursor-pointer items-center rounded-full bg-slate-100 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800">
                    Upload OG image
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/gif"
                      className="hidden"
                      onChange={async (event) => {
                        const file = event.target.files?.[0];
                        event.target.value = '';

                        if (!file) {
                          return;
                        }

                        await handleStandaloneUpload('ogImage', file);
                      }}
                    />
                  </label>
                </div>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Status publish
                <select
                  value={draft.status}
                  onChange={(event) => updateDraft('status', event.target.value as 'draft' | 'published')}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                </select>
              </label>

              <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                Waktu publish
                <input
                  type="datetime-local"
                  value={draft.publishedAt}
                  onChange={(event) => updateDraft('publishedAt', event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100"
                />
              </label>
            </div>

            <div className="mt-8 rounded-[1.8rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">SEO per artikel</p>
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                  SEO title
                  <input
                    type="text"
                    value={draft.seoTitle}
                    onChange={(event) => updateDraft('seoTitle', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200 md:col-span-2">
                  SEO description
                  <textarea
                    value={draft.seoDescription}
                    onChange={(event) => updateDraft('seoDescription', event.target.value)}
                    rows={3}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  SEO keywords
                  <input
                    type="text"
                    value={draft.seoKeywords}
                    onChange={(event) => updateDraft('seoKeywords', event.target.value)}
                    placeholder="pisahkan dengan koma"
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700 dark:text-slate-200">
                  Canonical URL
                  <input
                    type="url"
                    value={draft.canonicalUrl}
                    onChange={(event) => updateDraft('canonicalUrl', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-300 bg-white/90 px-4 py-3 text-slate-900 outline-none transition focus:border-teal-400 dark:border-white/10 dark:bg-slate-950/60 dark:text-slate-100 dark:placeholder:text-slate-500"
                  />
                </label>
              </div>
            </div>

            <div className="mt-8 rounded-[1.8rem] border border-white/60 bg-white/70 p-5 dark:border-white/10 dark:bg-white/5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">Media Library</p>
                  <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">Upload gambar tersimpan di database CMS, jadi tetap terbawa saat deploy tanpa storage tambahan.</p>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600 dark:bg-slate-900 dark:text-slate-300">
                  {uploadingMedia ? 'Mengunggah...' : `${assets.length} file`}
                </span>
              </div>

              <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {assets.map((asset) => (
                  <div key={asset.id} className="rounded-[1.3rem] border border-white/70 bg-white p-3 dark:border-white/10 dark:bg-slate-950/40">
                    <img src={asset.url} alt={asset.altText || asset.filename} className="h-32 w-full rounded-[1rem] object-cover" />
                    <p className="mt-3 truncate text-sm font-semibold text-slate-900 dark:text-slate-100">{asset.filename}</p>
                    <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">{formatFileSize(asset.sizeBytes)}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() => updateDraft('coverImage', asset.url)}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Jadikan cover
                      </button>
                      <button
                        type="button"
                        onClick={() => updateDraft('ogImage', asset.url)}
                        className="rounded-full bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition hover:bg-slate-200 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
                      >
                        Jadikan OG
                      </button>
                    </div>
                  </div>
                ))}

                {assets.length === 0 ? (
                  <div className="rounded-[1.3rem] border border-dashed border-slate-300 px-4 py-5 text-sm text-slate-500 dark:border-white/15 dark:text-slate-400">
                    Belum ada media. Upload gambar dari toolbar editor atau tombol cover/OG.
                  </div>
                ) : null}
              </div>
            </div>

            {articleMessage ? <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">{articleMessage}</p> : null}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={handleSaveArticle}
                className="rounded-2xl bg-teal-700 px-5 py-3 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-60"
                disabled={savingArticle}
              >
                {savingArticle ? 'Menyimpan...' : draft.id ? 'Simpan Perubahan' : 'Publikasikan Draft'}
              </button>
              <button
                type="button"
                onClick={handleDeleteArticle}
                className="rounded-2xl border border-rose-200 px-5 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-rose-500/30 dark:text-rose-300 dark:hover:bg-rose-500/10"
                disabled={savingArticle}
              >
                {draft.id ? 'Hapus Artikel' : 'Reset Form'}
              </button>
            </div>
          </div>
        }
      </section>
    </div>
  );
}
