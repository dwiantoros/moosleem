import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Kalender Hijriah | Muslim Traveler',
  description: 'Kalender Hijriah lengkap dengan hari-hari penting Islam: Ramadan, Idul Fitri, Idul Adha, Maulid Nabi, dan lainnya.',
};
export default function KalenderLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
