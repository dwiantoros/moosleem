import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/search', {
    title: "Search - Muslim Traveler",
    description: "Cari surah Quran, jadwal sholat, qibla, doa, restoran halal, dan fitur Muslim Traveler lainnya.",
    openGraph: {
      title: "Search - Muslim Traveler",
      description: "Cari surah Quran dan fitur utama Muslim Traveler dengan cepat.",
      url: "https://muslim-traveler.com/search",
      type: "website",
    },
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/search' />
    </>
  );
}
