import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/masjid', {
    title: 'Cari Masjid Terdekat - Moosleem',
    description:
      'Temukan masjid dan musholla terdekat dari lokasi Anda untuk memudahkan ibadah saat bepergian.',
    openGraph: {
      title: 'Cari Masjid Terdekat - Moosleem',
      description: 'Pencarian masjid terdekat berbasis lokasi di Moosleem.',
      url: 'https://moosleem.com/masjid',
      type: 'website',
    },
  });
}

export default function MasjidLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/masjid' />
    </>
  );
}
