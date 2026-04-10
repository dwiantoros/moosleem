import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Tasbih Digital | Muslim Traveler',
  description: 'Hitung dzikir harian dengan tasbih digital. Subhanallah, Alhamdulillah, Allahu Akbar, dan lebih banyak lagi.',
};

export default function TasbihLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
