import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Admin CMS | Moosleem',
  description: 'Dashboard admin untuk menulis dan mengelola artikel Moosleem.',
  robots: {
    index: false,
    follow: false,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children;
}