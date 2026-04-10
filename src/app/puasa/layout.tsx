import { Metadata } from 'next';
export const metadata: Metadata = {
  title: 'Tracker Puasa | Muslim Traveler',
  description: 'Catat puasa Ramadan, Senin-Kamis, Ayyamul Bidh, Syawal, dan puasa sunnah lainnya.',
};
export default function PuasaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
