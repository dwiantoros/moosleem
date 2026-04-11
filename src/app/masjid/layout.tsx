import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Cari Masjid Terdekat - Muslim Traveler',
  description:
    'Temukan masjid dan musholla terdekat dari lokasi Anda untuk memudahkan ibadah saat bepergian.',
  openGraph: {
    title: 'Cari Masjid Terdekat - Muslim Traveler',
    description: 'Pencarian masjid terdekat berbasis lokasi di Muslim Traveler.',
    url: 'https://muslim-traveler.com/masjid',
    type: 'website',
  },
};

export default function MasjidLayout({ children }: { children: React.ReactNode }) {
  return children;
}
