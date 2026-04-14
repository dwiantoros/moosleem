import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/doa', {
    title: "Doa Harian - Moosleem",
    description: "Kumpulan doa harian ringkas dengan teks Arab, transliterasi, dan terjemahan Indonesia.",
    openGraph: {
      title: "Doa Harian - Moosleem",
      description: "Baca doa harian pilihan untuk aktivitas sehari-hari.",
      url: "https://moosleem.com/doa",
      type: "website",
    },
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/doa' />
    </>
  );
}
