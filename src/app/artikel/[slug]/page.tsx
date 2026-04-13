import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import sanitizeHtml from 'sanitize-html';

import BrandedPageHeader from '@/components/BrandedPageHeader';
import { getArticleBySlug, getCmsSettings } from '@/server/cms/repository';

const SITE_URL = 'https://muslim-traveler.com';
const FALLBACK_OG_IMAGE = `${SITE_URL}/api/og`;

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

function pickDescription(articleDescription: string, articleExcerpt: string, fallback: string) {
  const candidate = (articleDescription || articleExcerpt || fallback || '').trim();
  return candidate || 'Artikel Muslim Traveler.';
}

function normalizeMarkdownContent(value: string) {
  return value
    .trim()
    .replace(/\r\n/g, '\n')
    .replace(/\\r\\n|\\n|\\r/g, '\n')
    .replace(/`r`n|`n|`r/g, '\n')
    .replace(/([.!?])n(?=#{1,6}\s)/g, '$1\n\n')
    .replace(/(^|\s)n(?=#{1,6}\s)/g, '\n\n')
    .replace(/\sn(?=[A-Z])/g, '\n')
    .replace(/([.!?])n(?=[A-Z])/g, '$1\n\n')
    .replace(/\n{3,}/g, '\n\n');
}

function resolveAuthor(settings: Awaited<ReturnType<typeof getCmsSettings>>) {
  return {
    name: settings.profileName || 'Tim Muslim Traveler',
    role: settings.profileRole || 'Editor Muslim Traveler',
    photo: settings.profilePhoto,
    bio: settings.profileBio || 'Tim redaksi Muslim Traveler.',
  };
}

export async function generateMetadata({ params }: ArticlePageProps): Promise<Metadata> {
  try {
    const { slug } = await params;
    const [article, settings] = await Promise.all([
      getArticleBySlug(slug),
      getCmsSettings(),
    ]);

    if (!article) {
      const fallbackTitle = settings.defaultSeoTitle || 'Artikel Muslim Traveler';
      const fallbackDescription = settings.defaultSeoDescription || 'Artikel Muslim Traveler';
      const fallbackImage = absoluteUrl(settings.defaultOgImage, FALLBACK_OG_IMAGE);

      return {
        title: fallbackTitle,
        description: fallbackDescription,
        openGraph: {
          title: fallbackTitle,
          description: fallbackDescription,
          images: [{ url: fallbackImage }],
        },
      };
    }

    const title = (article.seoTitle || article.title || 'Artikel Muslim Traveler').trim();
    const description = pickDescription(article.seoDescription, article.excerpt, settings.defaultSeoDescription);
    const canonical = absoluteUrl(article.canonicalUrl, `${SITE_URL}/artikel/${article.slug}`);
    const image = absoluteUrl(article.ogImage || article.coverImage || settings.defaultOgImage, FALLBACK_OG_IMAGE);
    const publishedTime = article.publishedAt || article.createdAt;

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
        publishedTime,
        modifiedTime: article.updatedAt,
        images: [
          {
            url: image,
            width: 1200,
            height: 630,
            alt: article.title,
          },
        ],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [image],
      },
    };
  } catch {
    return {
      title: 'Artikel Muslim Traveler',
      description: 'Baca artikel Muslim Traveler.',
      openGraph: {
        title: 'Artikel Muslim Traveler',
        description: 'Baca artikel Muslim Traveler.',
        images: [{ url: FALLBACK_OG_IMAGE }],
      },
    };
  }
}

export default async function ArticleDetailPage({ params }: ArticlePageProps) {
  const { slug } = await params;
  const [article, settings] = await Promise.all([
    getArticleBySlug(slug),
    getCmsSettings(),
  ]);

  if (!article) {
    notFound();
  }

  const thumbnailImage = article.coverImage || article.ogImage || settings.defaultOgImage;
  const schemaImage = absoluteUrl(thumbnailImage, FALLBACK_OG_IMAGE);
  const canonical = absoluteUrl(article.canonicalUrl, `${SITE_URL}/artikel/${article.slug}`);
  const author = resolveAuthor(settings);

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: pickDescription(article.seoDescription, article.excerpt, settings.defaultSeoDescription),
    datePublished: article.publishedAt || article.createdAt,
    dateModified: article.updatedAt,
    mainEntityOfPage: canonical,
    image: [schemaImage],
    author: {
      '@type': 'Person',
      name: author.name,
      jobTitle: author.role,
      image: author.photo ? absoluteUrl(author.photo, FALLBACK_OG_IMAGE) : undefined,
    },
    publisher: {
      '@type': 'Organization',
      name: 'Muslim Traveler',
      logo: {
        '@type': 'ImageObject',
        url: `${SITE_URL}/logo-muslim-traveler.svg`,
      },
    },
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Beranda',
        item: SITE_URL,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Artikel',
        item: `${SITE_URL}/artikel`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: article.title,
        item: canonical,
      },
    ],
  };

  const isHtmlContent = looksLikeHtml(article.content);
  const normalizedMarkdown = normalizeMarkdownContent(article.content);
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
        <BrandedPageHeader />

        <article className="glass-panel rounded-[2rem] p-6 sm:p-8 lg:p-10">
          <nav aria-label="Breadcrumb" className="mb-3 text-xs text-slate-500 dark:text-slate-300">
            <ol className="flex flex-wrap items-center gap-1.5">
              <li>
                <Link href="/" className="font-medium text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300">
                  Beranda
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-400">&gt;</li>
              <li>
                <Link href="/artikel" className="font-medium text-slate-600 transition hover:text-teal-600 dark:text-slate-300 dark:hover:text-teal-300">
                  Artikel
                </Link>
              </li>
              <li aria-hidden="true" className="text-slate-400">&gt;</li>
              <li className="max-w-[min(70vw,34rem)] truncate font-medium text-slate-700 dark:text-slate-200" title={article.title}>
                {article.title}
              </li>
            </ol>
          </nav>

          <div className="mt-6 flex flex-wrap items-center gap-3 text-xs text-slate-500">
            <span className="rounded-full bg-teal-50 px-3 py-1 font-semibold uppercase tracking-[0.16em] text-teal-700">{article.category || 'Artikel'}</span>
            <span>{formatDate(article.publishedAt)}</span>
          </div>

          <div className="mt-3 flex items-center gap-2.5 text-slate-500 dark:text-slate-300">
            {author.photo ? (
              <img src={author.photo} alt={author.name} className="h-9 w-9 rounded-full border border-white/60 object-cover" />
            ) : (
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-teal-100 text-sm font-semibold text-teal-700">
                {author.name.charAt(0).toUpperCase()}
              </div>
            )}
            <div>
              <p className="text-sm font-semibold leading-none text-slate-900 dark:text-slate-100">{author.name}</p>
              <p className="mt-1 text-[11px] leading-none text-slate-500 dark:text-slate-300">{author.role}</p>
            </div>
          </div>

          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">{article.title}</h1>
          {article.excerpt ? <p className="mt-4 text-base leading-8 text-slate-600 dark:text-slate-300">{article.excerpt}</p> : null}

          {thumbnailImage ? (
            <img
              src={thumbnailImage}
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
                {normalizedMarkdown}
              </ReactMarkdown>
            )}
          </div>

          <section className="mt-10 rounded-[1.6rem] border border-white/60 bg-white/60 p-5 dark:border-white/10 dark:bg-white/5">
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-teal-700">Profil penulis</p>
            <div className="mt-4 flex items-start gap-4">
              {author.photo ? (
                <img src={author.photo} alt={author.name} className="h-16 w-16 rounded-full border border-white/70 object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-teal-100 text-lg font-semibold text-teal-700">
                  {author.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div>
                <p className="text-lg font-semibold text-slate-950 dark:text-slate-100">{author.name}</p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{author.role}</p>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">{author.bio}</p>
              </div>
            </div>
          </section>
        </article>

        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      </main>
    </div>
  );
}
