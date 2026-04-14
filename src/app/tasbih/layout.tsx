import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/tasbih', {
    title: 'Tasbih Digital | Moosleem',
    description: 'Hitung dzikir harian dengan tasbih digital. Subhanallah, Alhamdulillah, Allahu Akbar, dan lebih banyak lagi.',
  });
}

export default function TasbihLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/tasbih' />
    </>
  );
}
