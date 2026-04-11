import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { createArticle } from '@/server/cms/repository';
import type { CmsArticleInput } from '@/server/cms/types';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function revalidateArticlePaths(slug: string) {
  revalidatePath('/artikel');
  revalidatePath(`/artikel/${slug}`);
  revalidatePath('/');
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  try {
    const body = (await request.json()) as CmsArticleInput;
    const article = await createArticle(body);
    revalidateArticlePaths(article.slug);

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal membuat artikel.' },
      { status: 400 }
    );
  }
}