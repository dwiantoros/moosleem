import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminLoginForm from '@/components/admin/AdminLoginForm';
import BrandedPageHeader from '@/components/BrandedPageHeader';
import { getAdminSession, isAdminAuthConfigured } from '@/server/cms/auth';
import { getCmsStorageMode } from '@/server/cms/db';

export default async function AdminLoginPage() {
  const session = await getAdminSession();

  if (session) {
    redirect('/admin');
  }

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <BrandedPageHeader subtitle="Akses aman untuk mengelola artikel dan SEO." />

        <div className="mb-8 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Muslim Traveler</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Portal admin artikel</h1>
          </div>
          <Link href="/" className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90">
            Kembali ke beranda
          </Link>
        </div>

        <AdminLoginForm authReady={isAdminAuthConfigured()} storageMode={getCmsStorageMode()} />
      </main>
    </div>
  );
}