import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Muslim Traveler - Jadwal Shalat & Quran",
  description: "Muslim Traveler adalah aplikasi komprehensif untuk Muslim yang bepergian: jadwal shalat akurat real-time, baca Al-Quran Arab dengan terjemahan, pengingat azan, dan rekomendasi restoran halal terdekat di lokasi Anda.",
  keywords: "jadwal shalat, quran arabic, azan reminder, halal restaurants, muslim travel, islamic app, prayer times",
  openGraph: {
    title: "Muslim Traveler - Jadwal Shalat, Quran & Halal Finder",
    description: "Aplikasi lengkap untuk Muslim traveler dengan jadwal shalat akurat, baca Quran, pengingat azan, dan halal finder",
    url: "https://muslim-traveler.com",
    type: "website",
    images: [{ url: "https://muslim-traveler.com/logo-muslim-traveler.png" }],
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
