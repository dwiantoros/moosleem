export type CmsArticleStatus = 'draft' | 'published';

export type CmsArticle = {
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
  status: CmsArticleStatus;
  publishedAt: string | null;
  createdAt: string;
  updatedAt: string;
};

export type CmsArticleInput = {
  title: string;
  slug?: string;
  category?: string;
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
  profileName: string;
  profileRole: string;
  profilePhoto: string;
  profileBio: string;
  updatedAt: string;
};

export type PageSeoEntry = {
  slug: string;
  title: string;
  description: string;
  keywords: string;
  ogImage: string;
  faqs: Array<{ question: string; answer: string }>;
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
  blogTitle: 'Artikel Moosleem',
  blogDescription: 'Kumpulan artikel Islami, panduan ibadah, dan tips Moosleem.',
  defaultSeoTitle: 'Artikel Moosleem',
  defaultSeoDescription: 'Baca artikel Islami, panduan ibadah, dan tips Moosleem dengan pengaturan SEO yang siap publish.',
  defaultKeywords: 'artikel islami, Moosleem, panduan ibadah, seo artikel islam',
  defaultOgImage: '',
  profileName: 'Tim Moosleem',
  profileRole: 'Editor Moosleem',
  profilePhoto: '',
  profileBio: 'Tim redaksi Moosleem yang membagikan panduan ibadah, perjalanan halal, dan inspirasi harian.',
  updatedAt: new Date(0).toISOString(),
};