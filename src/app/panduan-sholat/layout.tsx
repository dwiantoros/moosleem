import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/panduan-sholat', {
    title: 'Panduan Sholat | Moosleem',
    description: 'Panduan lengkap tata cara sholat fardhu 5 waktu beserta bacaan Arab dan artinya.',
  });
}

export default function PanduanSholatLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/panduan-sholat' />
    </>
  );
}
