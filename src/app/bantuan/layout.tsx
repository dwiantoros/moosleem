import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/bantuan', {
    title: 'Bantuan Muslim Traveler',
    description:
      'Pusat bantuan dan FAQ Muslim Traveler. Temukan jawaban terkait lokasi, jadwal sholat, notifikasi adzan, Quran, kalender hijriah, dan fitur lainnya.',
    openGraph: {
      title: 'Bantuan Muslim Traveler',
      description:
        'FAQ lengkap seputar penggunaan Muslim Traveler untuk pengalaman ibadah yang lebih mudah saat bepergian.',
      url: 'https://muslim-traveler.com/bantuan',
      type: 'website',
    },
  });
}

export default function BantuanLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/bantuan' />
    </>
  );
}
