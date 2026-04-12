import Link from 'next/link';
import { redirect } from 'next/navigation';

import AdminDashboard from '@/components/admin/AdminDashboard';
import PageHeaderActions from '@/components/PageHeaderActions';
import { getAdminSession } from '@/server/cms/auth';
import { getCmsStorageMode } from '@/server/cms/db';
import { getCmsSettings, listArticles, listAssets } from '@/server/cms/repository';

type AdminPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const session = await getAdminSession();
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<Record<string, string | string[] | undefined>>).then === 'function'
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : (searchParams as Record<string, string | string[] | undefined> | undefined);
  const keyRaw = resolvedSearchParams?.k;
  const accessKey = Array.isArray(keyRaw) ? keyRaw[0] : keyRaw;

  if (!session) {
    redirect(accessKey ? `/bukan-admin/login?k=${encodeURIComponent(accessKey)}` : '/bukan-admin/login');
  }

  try {
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
              <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">Kelola artikel, SEO, dan profil</h1>
            </div>
            <div className="flex items-center gap-2">
              <Link href={accessKey ? `/bukan-admin/profil?k=${encodeURIComponent(accessKey)}` : '/bukan-admin/profil'} className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                Profil author
              </Link>
              <Link href="/artikel" target="_blank" className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10">
                Lihat blog publik
              </Link>
              <PageHeaderActions />
            </div>
          </div>

          <AdminDashboard
            initialArticles={articles}
            initialSettings={settings}
            initialAssets={assets}
            storageMode={getCmsStorageMode()}
            profileHref={accessKey ? `/bukan-admin/profil?k=${encodeURIComponent(accessKey)}` : '/bukan-admin/profil'}
          />
        </main>
      </div>
    );
  } catch (error) {
    console.error('Admin page error:', error);

    // Fallback: show error message and logout link
    return (
      <div className="relative min-h-screen pb-8">
        <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
        <main className="mx-auto max-w-2xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="glass-panel rounded-[2rem] p-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path d="M12 8v4m0 4v.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
                </svg>
              </div>
              <div className="flex-1">
                <h1 className="text-2xl font-semibold text-slate-900">Database Connection Error</h1>
                <p className="mt-2 text-slate-600">
                  Tidak bisa terhubung ke database. Pastikan TURSO_DATABASE_URL dan TURSO_AUTH_TOKEN sudah dikonfigurasi di environment variables Vercel.
                </p>
                <p className="mt-4 text-sm text-slate-500">
                  Error: {error instanceof Error ? error.message : 'Unknown error'}
                </p>
                <div className="mt-6 flex gap-3">
                  <Link href="/bukan-admin/login" className="inline-flex items-center rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-700">
                    Kembali ke Login
                  </Link>
                  <Link href="/" className="inline-flex items-center rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50">
                    Ke Beranda
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }
}
