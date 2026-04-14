import 'server-only';

import type { Metadata } from 'next';
import { unstable_cache } from 'next/cache';

import { getPageSeoEntry } from '@/server/cms/repository';

const DEFAULT_OG_LOGO = 'https://moosleem.com/logo-muslim-traveler.png';

export const getPageSeoEntryCached = unstable_cache(
  async (slug: string) => getPageSeoEntry(slug),
  ['cms-page-seo-entry'],
  { revalidate: 300 }
);

/**
 * Merges CMS-stored SEO overrides on top of static page metadata.
 * Empty CMS fields are ignored, falling back to the static defaults.
 */
export async function withPageSeoOverride(slug: string, base: Metadata): Promise<Metadata> {
  let entry: Awaited<ReturnType<typeof getPageSeoEntry>>;

  try {
    entry = await getPageSeoEntryCached(slug);
  } catch {
    return base;
  }

  if (!entry || (!entry.title && !entry.description && !entry.keywords && !entry.ogImage)) {
    return base;
  }

  const title = entry.title || base.title;
  const description = entry.description || (typeof base.description === 'string' ? base.description : undefined);
  const keywords = entry.keywords || base.keywords;

  const updatedBase: Metadata = {
    ...base,
    ...(title !== undefined && { title }),
    ...(description !== undefined && { description }),
    ...(keywords !== undefined && { keywords }),
  };

  if (base.openGraph) {
    updatedBase.openGraph = {
      ...base.openGraph,
      ...(title !== undefined && { title: typeof title === 'string' ? title : undefined }),
      ...(description !== undefined && { description }),
      images: [{ url: DEFAULT_OG_LOGO }],
    };
  }

  return updatedBase;
}
