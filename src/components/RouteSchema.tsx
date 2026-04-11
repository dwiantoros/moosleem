'use client';

import { useMemo } from 'react';
import { usePathname } from 'next/navigation';

type JsonObject = Record<string, unknown>;

type RouteMeta = {
  title: string;
  description: string;
  breadcrumbs: Array<{ name: string; path: string }>;
};

const SITE_URL = 'https://muslim-traveler.com';

const ROUTE_META: Record<string, RouteMeta> = {
  '/': {
    title: 'Muslim Traveler',
    description:
      'Aplikasi komprehensif untuk Muslim yang bepergian: jadwal sholat, Quran, pengingat adzan, qibla, dan pencarian halal.',
    breadcrumbs: [{ name: 'Home', path: '/' }],
  },
  '/asmaul-husna': {
    title: 'Asmaul Husna',
    description: '99 nama Allah dengan transliterasi dan arti untuk dzikir harian.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Asmaul Husna', path: '/asmaul-husna' },
    ],
  },
  '/bantuan': {
    title: 'Bantuan Muslim Traveler',
    description: 'FAQ dan panduan penggunaan fitur utama Muslim Traveler.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Bantuan', path: '/bantuan' },
    ],
  },
  '/doa': {
    title: 'Doa Harian',
    description: 'Kumpulan doa harian dengan teks Arab, transliterasi, dan terjemahan.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Doa', path: '/doa' },
    ],
  },
  '/kalender': {
    title: 'Kalender Hijriah',
    description: 'Kalender Hijriah dan referensi hari penting Islam.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Kalender Hijriah', path: '/kalender' },
    ],
  },
  '/masjid': {
    title: 'Masjid Terdekat',
    description: 'Pencarian masjid dan musholla terdekat berdasarkan lokasi pengguna.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Masjid', path: '/masjid' },
    ],
  },
  '/notes': {
    title: 'Catatan Muslim',
    description: 'Catatan ibadah dan pengingat pribadi untuk aktivitas harian Muslim.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Catatan', path: '/notes' },
    ],
  },
  '/panduan-sholat': {
    title: 'Panduan Sholat',
    description: 'Panduan tata cara sholat dengan langkah dan bacaan.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Panduan Sholat', path: '/panduan-sholat' },
    ],
  },
  '/puasa': {
    title: 'Tracker Puasa',
    description: 'Pencatatan puasa wajib dan sunnah dengan ringkasan progres.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Puasa', path: '/puasa' },
    ],
  },
  '/qibla': {
    title: 'Arah Qibla',
    description: 'Fitur kompas qibla untuk membantu arah kiblat dari lokasi Anda.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Qibla', path: '/qibla' },
    ],
  },
  '/quran': {
    title: 'Quran Reader',
    description: 'Baca Al-Quran dengan navigasi surah dan dukungan pencarian.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Quran', path: '/quran' },
    ],
  },
  '/restoran-halal': {
    title: 'Restoran Halal Terdekat',
    description: 'Temukan restoran halal terdekat berdasarkan lokasi Anda.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Restoran Halal', path: '/restoran-halal' },
    ],
  },
  '/search': {
    title: 'Pencarian',
    description: 'Cari fitur, konten Quran, dan halaman penting di Muslim Traveler.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Search', path: '/search' },
    ],
  },
  '/sedekah': {
    title: 'Sedekah Mudah',
    description: 'Halaman sedekah mudah dengan metode transfer bank dan e-wallet.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Sedekah', path: '/sedekah' },
    ],
  },
  '/tasbih': {
    title: 'Tasbih Digital',
    description: 'Tasbih digital untuk dzikir harian dengan hitungan mudah.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tasbih', path: '/tasbih' },
    ],
  },
  '/tentang': {
    title: 'Tentang Muslim Traveler',
    description: 'Profil aplikasi, visi, dan penjelasan fitur Muslim Traveler.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tentang', path: '/tentang' },
    ],
  },
  '/tracker': {
    title: 'Tracker Sholat',
    description: 'Pantau konsistensi sholat harian dengan tracker ibadah.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Tracker Sholat', path: '/tracker' },
    ],
  },
  '/zakat': {
    title: 'Kalkulator Zakat',
    description: 'Perhitungan zakat maal, penghasilan, dan aset sesuai kebutuhan.',
    breadcrumbs: [
      { name: 'Home', path: '/' },
      { name: 'Zakat', path: '/zakat' },
    ],
  },
};

function routeUrl(pathname: string): string {
  return `${SITE_URL}${pathname === '/' ? '' : pathname}`;
}

function baseGraph(pathname: string): JsonObject[] {
  const url = routeUrl(pathname);
  const routeMeta = ROUTE_META[pathname] ?? {
    title: 'Muslim Traveler',
    description: 'Platform ibadah digital untuk Muslim.',
    breadcrumbs: [{ name: 'Home', path: '/' }],
  };

  const breadcrumbItems = routeMeta.breadcrumbs.map((crumb, index) => {
    return {
      '@type': 'ListItem',
      position: index + 1,
      name: crumb.name,
      item: `${SITE_URL}${crumb.path === '/' ? '' : crumb.path}`,
    };
  });

  return [
    {
      '@context': 'https://schema.org',
      '@type': 'Organization',
      '@id': `${SITE_URL}/#organization`,
      name: 'Muslim Traveler',
      url: SITE_URL,
      logo: `${SITE_URL}/logo-muslim-traveler.svg`,
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      '@id': `${SITE_URL}/#website`,
      url: SITE_URL,
      name: 'Muslim Traveler',
      inLanguage: ['id', 'en', 'ar'],
      potentialAction: {
        '@type': 'SearchAction',
        target: `${SITE_URL}/search?q={search_term_string}`,
        'query-input': 'required name=search_term_string',
      },
      publisher: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      '@id': `${url}#webpage`,
      url,
      name: routeMeta.title,
      description: routeMeta.description,
      inLanguage: 'id',
      isPartOf: {
        '@id': `${SITE_URL}/#website`,
      },
      about: {
        '@id': `${SITE_URL}/#organization`,
      },
    },
    {
      '@context': 'https://schema.org',
      '@type': 'BreadcrumbList',
      '@id': `${url}#breadcrumb`,
      itemListElement: breadcrumbItems,
    },
  ];
}

function routeSpecificSchema(pathname: string): JsonObject[] {
  const url = routeUrl(pathname);

  if (pathname === '/bantuan') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        '@id': `${url}#faq`,
        url,
        mainEntity: [
          {
            '@type': 'Question',
            name: 'Apa itu Muslim Traveler?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Muslim Traveler adalah web app pendamping ibadah dengan jadwal sholat, Quran, pengingat adzan, kalender hijriah, dan pencarian halal.',
            },
          },
          {
            '@type': 'Question',
            name: 'Apakah notifikasi adzan tetap masuk saat website ditutup?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Ya, notifikasi tetap masuk selama izin browser aktif karena aplikasi menggunakan Service Worker dan Web Push.',
            },
          },
          {
            '@type': 'Question',
            name: 'Bagaimana cara memperbarui lokasi?',
            acceptedAnswer: {
              '@type': 'Answer',
              text: 'Gunakan tombol refresh/sinkronkan di halaman utama agar jadwal dan fitur terdekat menyesuaikan lokasi terbaru.',
            },
          },
        ],
      },
    ];
  }

  const appSchemaRoutes: Record<string, { name: string; category: string; description: string }> = {
    '/notes': {
      name: 'Catatan Muslim',
      category: 'ProductivityApplication',
      description: 'Catatan ibadah dan pengingat pribadi Muslim.',
    },
    '/puasa': {
      name: 'Tracker Puasa',
      category: 'HealthApplication',
      description: 'Tracker puasa wajib dan sunnah.',
    },
    '/qibla': {
      name: 'Arah Qibla',
      category: 'UtilitiesApplication',
      description: 'Kompas arah kiblat berdasarkan lokasi pengguna.',
    },
    '/tasbih': {
      name: 'Tasbih Digital',
      category: 'UtilitiesApplication',
      description: 'Tasbih digital untuk membantu dzikir harian.',
    },
    '/tracker': {
      name: 'Tracker Sholat',
      category: 'HealthApplication',
      description: 'Pelacakan konsistensi sholat harian.',
    },
    '/zakat': {
      name: 'Kalkulator Zakat',
      category: 'FinanceApplication',
      description: 'Perhitungan zakat maal dan penghasilan.',
    },
    '/sedekah': {
      name: 'Sedekah Mudah',
      category: 'FinanceApplication',
      description: 'Panduan dan metode pembayaran sedekah secara cepat.',
    },
  };

  if (pathname in appSchemaRoutes) {
    const app = appSchemaRoutes[pathname];
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        '@id': `${url}#app`,
        name: app.name,
        url,
        description: app.description,
        applicationCategory: app.category,
        operatingSystem: 'Web',
        isAccessibleForFree: true,
        offers: {
          '@type': 'Offer',
          price: '0',
          priceCurrency: 'USD',
        },
      },
    ];
  }

  const itemListRoutes: Record<string, { name: string; description: string; numberOfItems?: number }> = {
    '/asmaul-husna': {
      name: 'Asmaul Husna',
      description: 'Daftar 99 Asmaul Husna beserta transliterasi dan arti.',
      numberOfItems: 99,
    },
    '/doa': {
      name: 'Doa Harian',
      description: 'Kumpulan doa harian untuk aktivitas Muslim.',
    },
    '/restoran-halal': {
      name: 'Restoran Halal Terdekat',
      description: 'Daftar restoran halal berdasarkan lokasi pengguna.',
    },
  };

  if (pathname in itemListRoutes) {
    const list = itemListRoutes[pathname];
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'ItemList',
        '@id': `${url}#list`,
        name: list.name,
        description: list.description,
        url,
        ...(list.numberOfItems ? { numberOfItems: list.numberOfItems } : {}),
        itemListOrder: 'http://schema.org/ItemListOrderAscending',
      },
    ];
  }

  if (pathname === '/quran') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'Book',
        '@id': `${url}#book`,
        name: 'Al-Quran Digital',
        url,
        inLanguage: ['ar', 'id', 'en'],
        author: {
          '@type': 'Organization',
          name: 'Muslim Traveler',
        },
        bookFormat: 'EBook',
      },
    ];
  }

  if (pathname === '/search') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'SearchResultsPage',
        '@id': `${url}#search`,
        name: 'Pencarian Muslim Traveler',
        url,
        potentialAction: {
          '@type': 'SearchAction',
          target: `${SITE_URL}/search?q={search_term_string}`,
          'query-input': 'required name=search_term_string',
        },
      },
    ];
  }

  if (pathname === '/panduan-sholat') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'HowTo',
        '@id': `${url}#howto`,
        name: 'Panduan Sholat',
        url,
        description: 'Panduan langkah-langkah sholat fardhu.',
        step: [
          { '@type': 'HowToStep', name: 'Niat', text: 'Niat sholat sesuai waktu.' },
          { '@type': 'HowToStep', name: 'Takbiratul Ihram', text: 'Mulai sholat dengan takbir.' },
          { '@type': 'HowToStep', name: 'Ruku dan Sujud', text: 'Laksanakan rukun sholat secara berurutan.' },
          { '@type': 'HowToStep', name: 'Salam', text: 'Tutup sholat dengan salam.' },
        ],
      },
    ];
  }

  if (pathname === '/masjid') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${url}#collection`,
        name: 'Masjid Terdekat',
        url,
        description: 'Pencarian masjid dan musholla terdekat dengan lokasi pengguna.',
      },
    ];
  }

  if (pathname === '/tentang') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'AboutPage',
        '@id': `${url}#about`,
        name: 'Tentang Muslim Traveler',
        url,
        description: 'Penjelasan visi, misi, dan fitur Muslim Traveler.',
      },
    ];
  }

  if (pathname === '/kalender') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'CollectionPage',
        '@id': `${url}#calendar`,
        name: 'Kalender Hijriah',
        url,
        description: 'Referensi tanggal Hijriah dan hari penting Islam.',
      },
    ];
  }

  if (pathname === '/') {
    return [
      {
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        '@id': `${SITE_URL}/#homepage`,
        name: 'Muslim Traveler',
        url: SITE_URL,
      },
    ];
  }

  return [];
}

function getSchemaByPath(pathname: string): JsonObject | JsonObject[] {
  return {
    '@context': 'https://schema.org',
    '@graph': [...baseGraph(pathname), ...routeSpecificSchema(pathname)],
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
