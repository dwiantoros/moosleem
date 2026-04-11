export type CmsArticleStatus = 'draft' | 'published';

export type CmsArticle = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  seoKeywords: string;
  canonicalUrl: string;
  ogImage: string;
  status: CmsArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsArticleInput = {
  title: string;
  slug?: string;
  excerpt?: string;
  content?: string;
  coverImage?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  canonicalUrl?: string;
  ogImage?: string;
  status?: CmsArticleStatus;
  publishedAt?: string | null;
};

export type CmsSettings = {
  blogTitle: string;
  blogDescription: string;
  defaultSeoTitle: string;
  defaultSeoDescription: string;
  defaultKeywords: string;
  defaultOgImage: string;
  updatedAt: string;
};

export type CmsAsset = {
  id: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
  altText: string;
  createdAt: string;
  url: string;
};

export const DEFAULT_CMS_SETTINGS: CmsSettings = {
  blogTitle: 'Artikel Muslim Traveler',
  blogDescription: 'Kumpulan artikel Islami, panduan ibadah, dan tips Muslim Traveler.',
  defaultSeoTitle: 'Artikel Muslim Traveler',
  defaultSeoDescription: 'Baca artikel Islami, panduan ibadah, dan tips Muslim Traveler dengan pengaturan SEO yang siap publish.',
  defaultKeywords: 'artikel islami, muslim traveler, panduan ibadah, seo artikel islam',
  defaultOgImage: '',
  updatedAt: new Date(0).toISOString(),
};