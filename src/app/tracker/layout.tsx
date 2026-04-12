import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/tracker', {
    title: 'Trackers Sholat | Muslim Traveler',
    description: 'Pantau konsistensi sholat lima waktu harian. Streak, riwayat, dan statistik ibadah kamu.',
  });
}

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/tracker' />
    </>
  );
}
