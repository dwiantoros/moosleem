import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tentang Muslim Traveler',
  description:
    'Pelajari Muslim Traveler secara lengkap: visi aplikasi, cara kerja, serta seluruh fitur utama dari jadwal sholat, Quran, pencarian halal, hingga pengingat adzan.',
  openGraph: {
    title: 'Tentang Muslim Traveler',
    description:
      'Penjelasan detail tentang Muslim Traveler dan seluruh fitur yang tersedia untuk membantu ibadah saat bepergian.',
    url: 'https://muslim-traveler.com/tentang',
    type: 'website',
  },
};

export default function TentangLayout({ children }: { children: React.ReactNode }) {
  return children;
}
