import Link from 'next/link';

export default function NotFoundPage() {
  return (
    <div className="relative min-h-screen pb-8">
      <div className="page-bg pointer-events-none absolute inset-x-0 top-0 -z-10 h-[30rem]" />
      <main className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-3xl items-center px-4 py-10 sm:px-6 lg:px-8">
        <section className="w-full rounded-[2rem] border border-slate-200/70 bg-white/85 p-7 shadow-[0_24px_60px_rgba(15,23,42,0.18)] backdrop-blur-xl dark:border-white/10 dark:bg-slate-900/78 dark:shadow-[0_24px_60px_rgba(2,6,23,0.46)] sm:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700 dark:text-teal-400">Error 404</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-slate-100 sm:text-4xl">
            Halaman tidak ditemukan
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300 sm:text-base">
            Link yang kamu buka mungkin sudah dipindah atau tidak tersedia. Coba kembali ke beranda untuk lanjut jelajah fitur Moosleem.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            <Link
              href="/"
              className="rounded-full bg-teal-700 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-600"
            >
              Ke Beranda
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}
