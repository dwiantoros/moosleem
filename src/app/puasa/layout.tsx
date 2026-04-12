import type { Metadata } from 'next';
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/puasa', {
    title: 'Tracker Puasa | Muslim Traveler',
    description: 'Catat puasa Ramadan, Senin-Kamis, Ayyamul Bidh, Syawal, dan puasa sunnah lainnya.',
  });
}

export default function PuasaLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/puasa' />
    </>
  );
}
