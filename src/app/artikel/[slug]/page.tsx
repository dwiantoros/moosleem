import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import sanitizeHtml from 'sanitize-html';

import { getArticleBySlug, getCmsSettings } from '@/server/cms/repository';

const SITE_URL = 'https://muslim-traveler.com';

type ArticlePageProps = {
  params: Promise<{ slug: string }>;
};

function looksLikeHtml(value: string) {
  return /<\/?[a-z][\s\S]*>/i.test(value);
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

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticleBySlug(slug),
    getCmsSettings(),
  ]);

  if (!article) {
    return {
      title: settings.defaultSeoTitle,
      description: settings.defaultSeoDescription,
    };
  }

  const title = article.seoTitle || article.title;
  const description = article.seoDescription || article.excerpt || settings.defaultSeoDescription;
  const canonical = article.canonicalUrl || `${SITE_URL}/artikel/${article.slug}`;
  const image = article.ogImage || article.coverImage || settings.defaultOgImage;

  return {
    title,
    description,
    keywords: article.seoKeywords || settings.defaultKeywords,
    alternates: {
      canonical,
    },
    openGraph: {
      title,
      description,
      url: canonical,
      type: 'article',
      publishedTime: article.publishedAt || undefined,
      images: image ? [{ url: image }] : undefined,
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: image ? [image] : undefined,
    },
  };
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const article = await getArticleBySlug(slug);

  if (!article) {
    notFound();
  }

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.seoDescription || article.excerpt,
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: `${SITE_URL}/artikel/${article.slug}`,
    image: article.ogImage || article.coverImage || undefined,
    publisher: {
      '@type': 'Organization',
      name: 'Muslim Traveler',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-muslim-traveler.svg`,
      },
    },
  };
  const isHtmlContent = looksLikeHtml(article.content);
  const sanitizedHtml = isHtmlContent
    ? sanitizeHtml(article.content, {
        allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h2', 'h3']),
        allowedAttributes: {
          a: ['href', 'target', 'rel'],
          img: ['src', 'alt'],
          '*': ['class'],
        },
      })
    : '';

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[34rem]" />
      <main className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8">
        <article className="glass-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <Link href="/artikel" className="inline-flex items-center gap-2 rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90">
            <span aria-hidden="true">←</span>
            Kembali ke daftar artikel
          </Link>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-teal-700">Artikel</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">{article.title}</h1>
          {article.excerpt ? <p className="mt-4 text-base leading-8 text-slate-600">{article.excerpt}</p> : null}

          {article.coverImage ? (
            <img
              src={article.coverImage}
              alt={article.title}
              className="mt-8 h-auto w-full rounded-[1.6rem] border border-white/60 object-cover"
            />
          ) : null}

          <div className="article-content mt-10 text-[1.02rem] leading-8 text-slate-700">
            {isHtmlContent ? (
              <div dangerouslySetInnerHTML={{ __html: sanitizedHtml }} />
            ) : (
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={{
                  h2: ({ children }) => <h2 className="mt-10 text-2xl font-semibold tracking-tight text-slate-950">{children}</h2>,
                  h3: ({ children }) => <h3 className="mt-8 text-xl font-semibold tracking-tight text-slate-950">{children}</h3>,
                  p: ({ children }) => <p className="mt-5">{children}</p>,
                  ul: ({ children }) => <ul className="mt-5 list-disc space-y-2 pl-6">{children}</ul>,
                  ol: ({ children }) => <ol className="mt-5 list-decimal space-y-2 pl-6">{children}</ol>,
                  li: ({ children }) => <li>{children}</li>,
                  blockquote: ({ children }) => <blockquote className="mt-6 rounded-r-[1.3rem] border-l-4 border-teal-500 bg-teal-50 px-5 py-4 text-slate-700">{children}</blockquote>,
                  a: ({ children, href }) => <a href={href} className="font-semibold text-teal-700 underline decoration-teal-300 underline-offset-4">{children}</a>,
                  code: ({ children }) => <code className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-slate-900">{children}</code>,
                  pre: ({ children }) => <pre className="mt-6 overflow-x-auto rounded-[1.4rem] bg-slate-950 px-4 py-4 text-sm text-slate-100">{children}</pre>,
                }}
              >
                {article.content}
              </ReactMarkdown>
            )}
          </div>
        </article>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
      </main>
    </div>
  );
}