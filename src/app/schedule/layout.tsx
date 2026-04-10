import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Jadwal Sholat - Muslim Traveler",
  description: "Cek jadwal sholat harian sesuai lokasi Anda lengkap dengan info sholat berikutnya dan pembaruan waktu real-time.",
  openGraph: {
    title: "Jadwal Sholat - Muslim Traveler",
    description: "Jadwal sholat harian real-time sesuai lokasi Anda.",
    url: "https://muslim-traveler.com/schedule",
    type: "website",
  },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
