import Link from 'next/link';
import { redirect } from 'next/navigation';

import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';
import PageSeoDashboard from '@/components/admin/PageSeoDashboard';
import { getAdminSession } from '@/server/cms/auth';
import { getAllPageSeo } from '@/server/cms/repository';

type SeoPageProps = {
  searchParams?: Promise<Record<string, string | string[] | undefined>> | Record<string, string | string[] | undefined>;
};

export default async function AdminSeoPage({ searchParams }: SeoPageProps) {
  const session = await getAdminSession();
  const resolvedSearchParams =
    searchParams && typeof (searchParams as Promise<Record<string, string | string[] | undefined>>).then === 'function'
      ? await (searchParams as Promise<Record<string, string | string[] | undefined>>)
      : (searchParams as Record<string, string | string[] | undefined> | undefined);
  const keyRaw = resolvedSearchParams?.k;
  const accessKey = Array.isArray(keyRaw) ? keyRaw[0] : keyRaw;
  const dashboardHref = accessKey ? `/bukan-admin?k=${encodeURIComponent(accessKey)}` : '/bukan-admin';

  if (!session) {
    redirect(accessKey ? `/bukan-admin/login?k=${encodeURIComponent(accessKey)}` : '/bukan-admin/login');
  }

  const entries = await getAllPageSeo();

  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <MoosleemLogoMark className="mb-1" />
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100">SEO per halaman</h1>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              Edit title, description, FAQ (maks 10), keywords, dan OG image untuk setiap halaman aplikasi.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href={dashboardHref}
              className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-white/90 dark:border-white/10 dark:bg-white/5 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Dashboard CMS
            </Link>
            <PageHeaderActions />
          </div>
        </div>

        <PageSeoDashboard initialEntries={entries} />
      </main>
    </div>
  );
}
