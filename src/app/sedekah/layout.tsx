import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sedekah Sementara Nonaktif | Muslim Traveler',
  description: 'Fitur sedekah sedang dinonaktifkan sementara sampai akun QRIS siap.',
};

export default function SedekahLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
