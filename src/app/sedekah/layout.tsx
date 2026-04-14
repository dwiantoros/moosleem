import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/sedekah', {
    title: 'Sedekah Sementara Nonaktif | Moosleem',
    description: 'Fitur sedekah sedang dinonaktifkan sementara sampai akun QRIS siap.',
  });
}

export default function SedekahLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/sedekah' />
    </>
  );
}
