import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Trackers Sholat | Muslim Traveler',
  description: 'Pantau konsistensi sholat lima waktu harian. Streak, riwayat, dan statistik ibadah kamu.',
};

export default function TrackerLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
