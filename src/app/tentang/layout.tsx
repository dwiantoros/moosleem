import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/tentang', {
    title: 'Tentang Moosleem',
    description:
      'Pelajari Moosleem secara lengkap: visi aplikasi, cara kerja, serta seluruh fitur utama dari jadwal sholat, Quran, pencarian halal, hingga pengingat adzan.',
    openGraph: {
      title: 'Tentang Moosleem',
      description:
        'Penjelasan detail tentang Moosleem dan seluruh fitur yang tersedia untuk membantu ibadah saat bepergian.',
      url: 'https://moosleem.com/tentang',
      type: 'website',
    },
  });
}

export default function TentangLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/tentang' />
    </>
  );
}
