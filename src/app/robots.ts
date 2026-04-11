import { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        disallow: [
          '/api/',
          '/search',
          '/notes',
          '/tracker',
          '/qibla',
        ],
      },
      {
        userAgent: '*',
        allow: '/',
      },
    ],
    sitemap: 'https://muslim-traveler.vercel.app/sitemap.xml',
  };
}
