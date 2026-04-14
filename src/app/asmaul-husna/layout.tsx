import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/asmaul-husna', {
    title: 'Asmaul Husna | Moosleem',
    description: '99 nama-nama Allah yang indah beserta arti dan transliterasi Latin.',
  });
}

export default function AsmaulHusnaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/asmaul-husna' />
    </>
  );
}
