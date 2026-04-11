import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://muslim-traveler.com',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: 'https://muslim-traveler.com/quran',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://muslim-traveler.com/doa',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://muslim-traveler.com/qibla',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://muslim-traveler.com/search',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.72,
    },
    {
      url: 'https://muslim-traveler.com/notes',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: 'https://muslim-traveler.com/tasbih',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: 'https://muslim-traveler.com/tracker',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.85,
    },
    {
      url: 'https://muslim-traveler.com/zakat',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    {
      url: 'https://muslim-traveler.com/sedekah',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.76,
    },
    {
      url: 'https://muslim-traveler.com/asmaul-husna',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://muslim-traveler.com/restoran-halal',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://muslim-traveler.com/masjid',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: 'https://muslim-traveler.com/kalender',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.78,
    },
    {
      url: 'https://muslim-traveler.com/panduan-sholat',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: 'https://muslim-traveler.com/puasa',
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.82,
    },
    {
      url: 'https://muslim-traveler.com/tentang',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: 'https://muslim-traveler.com/bantuan',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.74,
    },
  ];
}
