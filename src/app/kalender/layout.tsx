import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/kalender', {
    title: 'Kalender Hijriah | Moosleem',
    description: 'Kalender Hijriah lengkap dengan hari-hari penting Islam: Ramadan, Idul Fitri, Idul Adha, Maulid Nabi, dan lainnya.',
  });
}

export default function KalenderLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/kalender' />
    </>
  );
}
