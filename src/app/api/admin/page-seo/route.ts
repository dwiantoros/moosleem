import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { getAllPageSeo, upsertPageSeo } from '@/server/cms/repository';

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const entries = await getAllPageSeo();
    return NextResponse.json({ entries });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memuat data SEO halaman.' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      slug?: string;
      title?: string;
      description?: string;
      keywords?: string;
      ogImage?: string;
      faqs?: Array<{ question?: string; answer?: string }>;
    };

    if (!body.slug || typeof body.slug !== 'string' || !body.slug.startsWith('/')) {
      return NextResponse.json({ error: 'Slug tidak valid.' }, { status: 400 });
    }

    const entry = await upsertPageSeo(body.slug, {
      title: typeof body.title === 'string' ? body.title : '',
      description: typeof body.description === 'string' ? body.description : '',
      keywords: typeof body.keywords === 'string' ? body.keywords : '',
      ogImage: typeof body.ogImage === 'string' ? body.ogImage : '',
      faqs: Array.isArray(body.faqs)
        ? body.faqs.map((item) => ({
            question: typeof item?.question === 'string' ? item.question : '',
            answer: typeof item?.answer === 'string' ? item.answer : '',
          }))
        : [],
    });

    revalidatePath(body.slug);

    return NextResponse.json({ entry });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan SEO halaman.' },
      { status: 400 },
    );
  }
}
