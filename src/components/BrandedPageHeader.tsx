import Link from 'next/link';

import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

type BrandedPageHeaderProps = {
  title?: string;
  subtitle?: string;
  homeHref?: string;
  showLogoMark?: boolean;
};

export default function BrandedPageHeader({
  title,
  subtitle = 'Ringkasan ibadah harian yang lebih tenang dan fokus.',
  homeHref = '/',
  showLogoMark = true,
}: BrandedPageHeaderProps) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        {showLogoMark ? <MoosleemLogoMark className="mb-0.5" /> : null}
        {title ? (
          <Link href={homeHref} className="inline-block">
            <p className="text-[1.45rem] font-semibold tracking-tight md:text-[1.6rem]" aria-label={title}>
              <span className="bg-gradient-to-r from-teal-700 via-cyan-600 to-emerald-600 bg-clip-text text-transparent">
                {title}
              </span>
            </p>
          </Link>
        ) : null}
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-300">{subtitle}</p>
      </div>

      <PageHeaderActions />
    </header>
  );
}
