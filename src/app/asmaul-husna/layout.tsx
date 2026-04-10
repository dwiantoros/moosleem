import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Asmaul Husna | Muslim Traveler',
  description: '99 nama-nama Allah yang indah beserta arti dan transliterasi Latin.',
};

export default function AsmaulHusnaLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
