import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminDashboard from '@/components/admin/AdminDashboard';
import { getAdminSession } from '@/server/cms/auth';
import { getCmsStorageMode } from '@/server/cms/db';
import { getCmsSettings, listArticles, listAssets } from '@/server/cms/repository';

export default async function AdminPage() {
  const session = await getAdminSession();

  if (!session) {
    redirect('/admin/login');
  }

  const [articles, settings, assets] = await Promise.all([
    listArticles({ includeDrafts: true }),
    getCmsSettings(),
    listAssets(18),
  ]);

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Admin aktif</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">Kelola artikel dan SEO</h1>
          </div>
          <Link href="/artikel" target="_blank" className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90">
            Lihat blog publik
          </Link>
        </div>

        <AdminDashboard initialArticles={articles} initialSettings={settings} initialAssets={assets} storageMode={getCmsStorageMode()} />
      </main>
    </div>
  );
}