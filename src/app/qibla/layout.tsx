import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Arah Qibla - Muslim Traveler",
  description: "Temukan arah qibla dari lokasi Anda dengan tampilan bearing yang jelas dan sederhana.",
  openGraph: {
    title: "Arah Qibla - Muslim Traveler",
    description: "Lihat arah qibla akurat dari posisi Anda sekarang.",
    url: "https://muslim-traveler.com/qibla",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
