import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/qibla', {
    title: "Arah Qibla - Moosleem",
    description: "Temukan arah qibla dari lokasi Anda dengan tampilan bearing yang jelas dan sederhana.",
    openGraph: {
      title: "Arah Qibla - Moosleem",
      description: "Lihat arah qibla akurat dari posisi Anda sekarang.",
      url: "https://moosleem.com/qibla",
      type: "website",
    },
  });
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/qibla' />
    </>
  );
}
