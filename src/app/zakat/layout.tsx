import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/zakat', {
    title: 'Kalkulator Zakat | Muslim Traveler',
    description: 'Hitung zakat maal, emas, perak, penghasilan, dan pertanian sesuai nisab terkini.',
  });
}

export default function ZakatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/zakat' />
    </>
  );
}
