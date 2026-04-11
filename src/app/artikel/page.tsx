import type { Metadata } from 'next';
import Link from 'next/link';

import { getCmsSettings, listArticles } from '@/server/cms/repository';
import { type CmsArticle } from '@/server/cms/types';

const SITE_URL = 'https://muslim-traveler.com';

function formatDate(value: string | null) {
  if (!value) {
    return 'Draft';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getCmsSettings();

    return {
      title: settings.defaultSeoTitle || settings.blogTitle,
      description: settings.defaultSeoDescription || settings.blogDescription,
      keywords: settings.defaultKeywords,
      alternates: {
        canonical: `${SITE_URL}/artikel`,
      },
      openGraph: {
        title: settings.defaultSeoTitle || settings.blogTitle,
        description: settings.defaultSeoDescription || settings.blogDescription,
        url: `${SITE_URL}/artikel`,
        type: 'website',
        images: settings.defaultOgImage ? [{ url: settings.defaultOgImage }] : undefined,
      },
    };
  } catch (error) {
    // Database not available during build
    return {
      title: 'Artikel',
      description: 'Baca artikel menarik tentang perjalanan halal dan muslim traveler',
    };
  }
}

export default async function ArticleIndexPage() {
  let articles: CmsArticle[] = [];
  let settings = {
    blogTitle: 'Artikel',
    blogDescription: 'Baca artikel menarik tentang perjalanan halal dan muslim traveler',
  };

  try {
    const [fetchedArticles, fetchedSettings] = await Promise.all([
      listArticles(),
      getCmsSettings(),
    ]);
    articles = fetchedArticles;
    settings = fetchedSettings;
  } catch (error) {
    // Database not available during build
    console.log('Artikel page: Database not available, showing empty state');
  }

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Artikel</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950">{settings.blogTitle}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600">{settings.blogDescription}</p>
        </section>

        <section className="mt-6 grid gap-5">
          {articles.map((article) => (
            <article key={article.id} className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-teal-700">Artikel Islami</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{article.title}</h2>
              <p className="mt-3 text-sm leading-7 text-slate-600">{article.excerpt || 'Artikel ini belum memiliki ringkasan. Buka detail untuk membaca isi lengkapnya.'}</p>
              <Link href={`/artikel/${article.slug}`} className="mt-5 inline-flex items-center gap-2 rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-slate-800">
                Baca artikel
                <span aria-hidden="true">→</span>
              </Link>
            </article>
          ))}

          {articles.length === 0 ? (
            <div className="glass-panel rounded-[1.8rem] p-6 text-sm leading-7 text-slate-600">
              Belum ada artikel yang dipublikasikan. Masuk ke dashboard admin di <Link href="/admin/login" className="font-semibold text-teal-700">/admin/login</Link> untuk menulis artikel pertama.
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}