import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Baca Al-Quran - Muslim Traveler",
  description: "Baca Al-Quran Arab (Uthmani) dengan terjemahan Bahasa Indonesia dan Inggris. Fitur pencarian surah mudah dan antarmuka yang user-friendly.",
  keywords: "al-quran, quran arabic, quran reading, terjemahan quran, quran surah, ayat quran",
  openGraph: {
    title: "Baca Al-Quran - Muslim Traveler",
    description: "Baca Al-Quran dengan terjemahan lengkap di Muslim Traveler",
    url: "https://muslim-traveler.com/quran",
    type: "website",
  },
};

export default function Layout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
