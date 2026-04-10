import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Kalkulator Zakat | Muslim Traveler',
  description: 'Hitung zakat maal, emas, perak, penghasilan, dan pertanian sesuai nisab terkini.',
};

export default function ZakatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
