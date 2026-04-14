import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/search', {
    title: "Search - Moosleem",
    description: "Cari surah Quran, jadwal sholat, qibla, doa, restoran halal, dan fitur Moosleem lainnya.",
    openGraph: {
      title: "Search - Moosleem",
      description: "Cari surah Quran dan fitur utama Moosleem dengan cepat.",
      url: "https://moosleem.com/search",
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
