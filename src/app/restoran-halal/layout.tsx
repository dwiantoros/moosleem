import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/restoran-halal', {
    title: 'Cari Restoran Halal Terdekat - Muslim Traveler',
    description:
      'Temukan restoran dan rumah makan halal terdekat dari lokasi Anda. Muslim Traveler memberikan rekomendasi halal yang akurat dan terpercaya.',
    keywords:
      'restoran halal, rumah makan halal, halal nearby, halal finder, tempat makan halal',
    openGraph: {
      title: 'Cari Restoran Halal Terdekat - Muslim Traveler',
      description: 'Temukan restoran halal terdekat dari lokasi Anda dengan Muslim Traveler',
      url: 'https://muslim-traveler.com/restoran-halal',
      type: 'website',
    },
  });
}

export default function RestoranHalalLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/restoran-halal' />
    </>
  );
}
