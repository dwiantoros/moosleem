import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/notes', {
    title: "Catatan Muslim - Muslim Traveler",
    description: "Simpan catatan pribadi, checklist ibadah, atau pengingat perjalanan Muslim Anda dalam satu tempat.",
    openGraph: {
      title: "Catatan Muslim - Muslim Traveler",
      description: "Kelola catatan singkat dan pengingat pribadi Anda.",
      url: "https://muslim-traveler.com/notes",
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
