import 'server-only';

import { getPageSeoEntry } from '@/server/cms/repository';

type PageSeoFooterProps = {
  slug: string;
};

export default async function PageSeoFooter({ slug }: PageSeoFooterProps) {
  let entry: Awaited<ReturnType<typeof getPageSeoEntry>> = null;

  try {
    entry = await getPageSeoEntry(slug);
  } catch {
    return null;
  }

  const description = entry?.description?.trim() || '';
  const faqs = (entry?.faqs || [])
    .map((faq) => ({
      question: faq.question.trim(),
      answer: faq.answer.trim(),
    }))
    .filter((faq) => faq.question && faq.answer)
    .slice(0, 10);

  if (!description && faqs.length === 0) {
    return null;
  }

  const faqSchema =
    faqs.length > 0
      ? {
          '@context': 'https://schema.org',
          '@type': 'FAQPage',
          mainEntity: faqs.map((faq) => ({
            '@type': 'Question',
            name: faq.question,
            acceptedAnswer: {
              '@type': 'Answer',
              text: faq.answer,
            },
          })),
        }
      : null;

  return (
    <section className="mx-auto mt-8 w-full max-w-6xl px-4 pb-8 sm:px-6 lg:px-8">
      <div className="glass-panel relative overflow-hidden rounded-[1.8rem] border border-slate-200/70 bg-white/80 p-5 sm:p-6 dark:border-white/10 dark:bg-slate-950/40">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-teal-300/15 blur-3xl" aria-hidden="true" />

        {description ? (
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">Tentang Halaman Ini</p>
            <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{description}</p>
          </div>
        ) : null}

        {faqs.length > 0 ? (
          <div className={description ? 'mt-6' : ''}>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-teal-700">FAQ</p>
            <div className="mt-3 space-y-2">
              {faqs.map((faq, index) => (
                <details
                  key={`faq-${index}`}
                  className="group rounded-2xl border border-slate-200 bg-white/90 px-4 py-3 transition hover:border-teal-300 dark:border-white/10 dark:bg-slate-950/50"
                >
                  <summary className="cursor-pointer list-none pr-6 text-sm font-semibold text-slate-800 dark:text-slate-100">
                    {faq.question}
                  </summary>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{faq.answer}</p>
                </details>
              ))}
            </div>
          </div>
        ) : null}

        {faqSchema ? (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
          />
        ) : null}
      </div>
    </section>
  );
}
