'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

type JsonObject = Record<string, unknown>;

function getSchemaByPath(pathname: string): JsonObject | JsonObject[] {
  const url = `https://muslim-traveler.com${pathname === '/' ? '' : pathname}`;

  if (pathname === '/bantuan') {
    return {
      '@context': 'https://schema.org',
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Apa itu Muslim Traveler?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Muslim Traveler adalah web app pendamping ibadah yang menyediakan jadwal sholat, Quran, pengingat adzan, kalender hijriah, dan pencarian tempat halal.',
          },
        },
        {
          '@type': 'Question',
          name: 'Apakah notifikasi adzan tetap masuk saat website ditutup?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Ya, notifikasi tetap dapat masuk selama izin browser aktif karena aplikasi menggunakan Service Worker dan Web Push.',
          },
        },
      ],
    };
  }

  const byRoute: Record<string, JsonObject> = {
    '/': {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'Muslim Traveler',
      url: 'https://muslim-traveler.com',
      potentialAction: {
        '@type': 'SearchAction',
        target: 'https://muslim-traveler.com/search?q={search_term_string}',
        'query-input': 'required name=search_term_string',
      },
    },
    '/asmaul-husna': {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Asmaul Husna',
      url,
      numberOfItems: 99,
    },
    '/doa': {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Doa Harian',
      url,
    },
    '/kalender': {
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: 'Kalender Hijriah',
      url,
    },
    '/mosques': {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: 'Pencarian Masjid Terdekat',
      url,
      about: 'Mosque Finder',
    },
    '/notes': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Catatan Muslim',
      applicationCategory: 'ProductivityApplication',
      url,
    },
    '/panduan-sholat': {
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'Panduan Sholat',
      url,
    },
    '/puasa': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tracker Puasa',
      applicationCategory: 'HealthApplication',
      url,
    },
    '/qibla': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Arah Qibla',
      applicationCategory: 'UtilitiesApplication',
      url,
    },
    '/quran': {
      '@context': 'https://schema.org',
      '@type': 'Book',
      name: 'Al-Quran Digital',
      inLanguage: ['ar', 'id', 'en'],
      url,
    },
    '/restaurants': {
      '@context': 'https://schema.org',
      '@type': 'ItemList',
      name: 'Restoran Halal Terdekat',
      url,
    },
    '/search': {
      '@context': 'https://schema.org',
      '@type': 'SearchResultsPage',
      name: 'Pencarian Muslim Traveler',
      url,
    },
    '/tasbih': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tasbih Digital',
      applicationCategory: 'UtilitiesApplication',
      url,
    },
    '/tentang': {
      '@context': 'https://schema.org',
      '@type': 'AboutPage',
      name: 'Tentang Muslim Traveler',
      url,
    },
    '/tracker': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Tracker Sholat',
      applicationCategory: 'HealthApplication',
      url,
    },
    '/zakat': {
      '@context': 'https://schema.org',
      '@type': 'WebApplication',
      name: 'Kalkulator Zakat',
      applicationCategory: 'FinanceApplication',
      url,
    },
  };

  return byRoute[pathname] ?? {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    name: 'Muslim Traveler',
    url,
  };
}

export default function RouteSchema() {
  const pathname = usePathname();
  const schema = useMemo(() => getSchemaByPath(pathname), [pathname]);

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
