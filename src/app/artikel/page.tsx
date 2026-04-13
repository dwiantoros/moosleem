import type { Metadata } from 'next';
import Link from 'next/link';

import BrandedPageHeader from '@/components/BrandedPageHeader';
import PageSeoFooter from '@/components/PageSeoFooter';
import { getPageSeoEntry, getCmsSettings, listArticles } from '@/server/cms/repository';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import { type CmsArticle } from '@/server/cms/types';

const SITE_URL = 'https://muslim-traveler.com';
const FALLBACK_OG_IMAGE = `${SITE_URL}/api/og`;

function absoluteUrl(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;

  if (/^https?:\/\//i.test(value)) {
    return value;
  }

  if (value.startsWith('/')) {
    return `${SITE_URL}${value}`;
  }

  return fallback;
}

function formatDate(value: string | null) {
  if (!value) {
    return 'Draft';
  }

  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'long',
    timeStyle: 'short',
  }).format(new Date(value));
}

function resolveAuthor(settings: Awaited<ReturnType<typeof getCmsSettings>>) {
  return {
    name: settings.profileName || 'Tim Muslim Traveler',
    role: settings.profileRole || 'Editor Muslim Traveler',
    photo: settings.profilePhoto,
  };
}

export async function generateMetadata(): Promise<Metadata> {
  try {
    const settings = await getCmsSettings();

    return withPageSeoOverride('/artikel', {
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
        images: [{ url: settings.defaultOgImage || FALLBACK_OG_IMAGE }],
      },
      twitter: {
        card: 'summary_large_image',
        title: settings.defaultSeoTitle || settings.blogTitle,
        description: settings.defaultSeoDescription || settings.blogDescription,
        images: [settings.defaultOgImage || FALLBACK_OG_IMAGE],
      },
    });
  } catch (error) {
    // Database not available during build
    return {
      title: 'Artikel',
      description: 'Baca artikel menarik tentang perjalanan halal dan muslim traveler',
      openGraph: {
        images: [{ url: FALLBACK_OG_IMAGE }],
      },
    };
  }
}

export default async function ArticleIndexPage() {
  let articles: CmsArticle[] = [];
  let pageSeoTitle = '';
  let pageSeoDescription = '';
  let settings = {
    blogTitle: 'Artikel',
    blogDescription: 'Baca artikel menarik tentang perjalanan halal dan muslim traveler',
    defaultOgImage: '',
    profileName: 'Tim Muslim Traveler',
    profileRole: 'Editor Muslim Traveler',
    profilePhoto: '',
  };

  try {
    const [fetchedArticles, fetchedSettings, fetchedPageSeo] = await Promise.all([
      listArticles(),
      getCmsSettings(),
      getPageSeoEntry('/artikel'),
    ]);
    articles = fetchedArticles;
    settings = fetchedSettings;
    pageSeoTitle = fetchedPageSeo?.title || '';
    pageSeoDescription = fetchedPageSeo?.description || '';
  } catch (error) {
    // Database not available during build
    console.log('Artikel page: Database not available, showing empty state');
  }

  const author = resolveAuthor(settings as Awaited<ReturnType<typeof getCmsSettings>>);

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <BrandedPageHeader />

        <section className="glass-panel rounded-[2rem] p-6 sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Artikel</p>
          <h1 className="mt-3 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{pageSeoTitle || settings.blogTitle}</h1>
          <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-600 dark:text-slate-300">{pageSeoDescription || settings.blogDescription}</p>
        </section>

        <section className="mt-6 grid gap-5">
          {articles.map((article) => (
            <article key={article.id} className="glass-panel rounded-[1.8rem] p-5 sm:p-6">
              {article.coverImage ? (
                <img
                  src={article.coverImage}
                  alt={article.title}
                  className="mb-4 h-44 w-full rounded-[1.2rem] border border-white/60 object-cover"
                />
              ) : null}
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-teal-700">{article.category || 'Artikel'}</span>
                <span>{formatDate(article.publishedAt)}</span>
              </div>
              <div className="mt-4 flex items-center gap-3">
                {author.photo ? (
                  <img src={author.photo} alt={author.name} className="h-10 w-10 rounded-full border border-white/70 object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                    {author.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div>
                  <p className="text-sm font-semibold text-slate-900">{author.name}</p>
                  <p className="text-xs text-slate-500">{author.role}</p>
                </div>
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
              Belum ada artikel yang dipublikasikan. Silakan hubungi admin untuk menulis artikel pertama.
            </div>
          ) : null}
        </section>

        <PageSeoFooter slug="/artikel" />

        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'Blog',
              name: settings.blogTitle,
              description: settings.blogDescription,
              url: `${SITE_URL}/artikel`,
              blogPost: articles.slice(0, 12).map((article) => ({
                '@type': 'BlogPosting',
                headline: article.title,
                description: article.excerpt || undefined,
                url: `${SITE_URL}/artikel/${article.slug}`,
                datePublished: article.publishedAt || article.createdAt,
                dateModified: article.updatedAt,
                image: article.ogImage || article.coverImage || settings.defaultOgImage || FALLBACK_OG_IMAGE,
                author: {
                  '@type': 'Person',
                  name: author.name,
                  jobTitle: author.role,
                  image: author.photo ? absoluteUrl(author.photo, FALLBACK_OG_IMAGE) : undefined,
                },
                publisher: {
                  '@type': 'Organization',
                  name: 'Muslim Traveler',
                },
              })),
            }),
          }}
        />
      </main>
    </div>
  );
}