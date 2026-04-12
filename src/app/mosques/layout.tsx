import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/mosques', {
    title: 'Cari Masjid Terdekat - Muslim Traveler',
    description:
      'Temukan masjid dan musholla terdekat dari lokasi Anda untuk memudahkan ibadah saat bepergian.',
    openGraph: {
      title: 'Cari Masjid Terdekat - Muslim Traveler',
      description: 'Pencarian masjid terdekat berbasis lokasi di Muslim Traveler.',
      url: 'https://muslim-traveler.com/mosques',
      type: 'website',
    },
  });
}

export default function MosquesLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/mosques' />
    </>
  );
}
