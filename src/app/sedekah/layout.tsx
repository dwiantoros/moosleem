import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sedekah Mudah | Muslim Traveler',
  description: 'Sedekah cepat dan mudah melalui QRIS.',
};

export default function SedekahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
