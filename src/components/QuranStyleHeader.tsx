import Link from 'next/link';
import MoosleemLogoMark from '@/components/MoosleemLogoMark';
import PageHeaderActions from '@/components/PageHeaderActions';

type QuranStyleHeaderProps = {
  title: string;
  homeHref?: string;
};

export default function QuranStyleHeader({ title, homeHref = '/' }: QuranStyleHeaderProps) {
  return (
    <div className="mb-6 flex items-center justify-between gap-3">
      <div className="flex items-center gap-3">
        <Link href={homeHref} className="glass-subtle flex h-10 w-10 items-center justify-center rounded-full text-slate-700 transition hover:bg-white/60 dark:text-slate-300">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 18l-6-6 6-6"/></svg>
        </Link>
        <div>
          <MoosleemLogoMark className="mb-1" />
          <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        </div>
      </div>
      <PageHeaderActions />
    </div>
  );
}
