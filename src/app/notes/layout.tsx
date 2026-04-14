import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/notes', {
    title: "Catatan Muslim - Moosleem",
    description: "Simpan catatan pribadi, checklist ibadah, atau pengingat perjalanan Muslim Anda dalam satu tempat.",
    openGraph: {
      title: "Catatan Muslim - Moosleem",
      description: "Kelola catatan singkat dan pengingat pribadi Anda.",
      url: "https://moosleem.com/notes",
      type: "website",
    },
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/notes' />
    </>
  );
}
