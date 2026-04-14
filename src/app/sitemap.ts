import { MetadataRoute } from 'next';

import { listArticles } from '@/server/cms/repository';
import { type CmsArticle } from '@/server/cms/types';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let articles: CmsArticle[] = [];
  try {
    articles = await listArticles();
  } catch (error) {
    // Database not available during build - that's okay
    console.log('Sitemap: Database not available, skipping articles');
  }

  return [
    {
      url: 'https://moosleem.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://moosleem.com/quran',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://moosleem.com/doa',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://moosleem.com/qibla',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://moosleem.com/search',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.72,
    },
    {
      url: 'https://moosleem.com/notes',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://moosleem.com/tasbih',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://moosleem.com/tracker',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: 'https://moosleem.com/zakat',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://moosleem.com/asmaul-husna',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://moosleem.com/artikel',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.78,
    },
    {
      url: 'https://moosleem.com/restoran-halal',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://moosleem.com/masjid',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://moosleem.com/kalender-hijriah',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.78,
    },
    {
      url: 'https://moosleem.com/panduan-sholat',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://moosleem.com/puasa',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.82,
    },
    {
      url: 'https://moosleem.com/tentang',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://moosleem.com/bantuan',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.74,
    },
    ...articles.map((article) => ({
      url: `https://moosleem.com/artikel/${article.slug}`,
      lastModified: new Date(article.updatedAt),
      changeFrequency: 'monthly' as const,
      priority: 0.76,
    })),
  ];
}
