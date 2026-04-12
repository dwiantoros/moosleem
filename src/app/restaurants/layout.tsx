import type { Metadata } from "next";
import { withPageSeoOverride } from '@/server/cms/pageSeo';
import PageSeoFooter from '@/components/PageSeoFooter';

export async function generateMetadata(): Promise<Metadata> {
  return withPageSeoOverride('/restaurants', {
    title: "Cari Restoran Halal Terdekat - Muslim Traveler",
    description: "Temukan restoran dan rumah makan halal terdekat dari lokasi Anda. Muslim Traveler memberikan rekomendasi halal yang akurat dan terpercaya.",
    keywords: "restoran halal, rumah makan halal, halal nearby, halal finder, tempat makan halal",
    openGraph: {
      title: "Cari Restoran Halal Terdekat - Muslim Traveler",
      description: "Temukan restoran halal terdekat dari lokasi Anda dengan Muslim Traveler",
      url: "https://muslim-traveler.com/restaurants",
      type: "website",
    },
  });
}

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      {children}
      <PageSeoFooter slug='/restaurants' />
    </>
  );
}
