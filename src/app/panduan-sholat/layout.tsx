import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Panduan Sholat | Muslim Traveler',
  description: 'Panduan lengkap tata cara sholat fardhu 5 waktu beserta bacaan Arab dan artinya.',
};
export default function PanduanSholatLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
