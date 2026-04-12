import Link from 'next/link';

import PageHeaderActions from '@/components/PageHeaderActions';

type BrandedPageHeaderProps = {
  title?: string;
  subtitle?: string;
  homeHref?: string;
};

export default function BrandedPageHeader({
  title = 'Muslim Traveler',
  subtitle = 'Ringkasan ibadah harian yang lebih tenang dan fokus.',
  homeHref = '/',
}: BrandedPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <Link href={homeHref} className="inline-block">
          <h1 className="text-[2.05rem] font-semibold tracking-tight">
            <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
              {title}
            </span>
          </h1>
        </Link>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
      </div>

      <PageHeaderActions />
    </header>
  );
}
