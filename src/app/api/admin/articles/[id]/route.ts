import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { deleteArticle, getArticleById, updateArticle } from '@/server/cms/repository';
import type { CmsArticleInput } from '@/server/cms/types';

type RouteProps = {
  params: Promise<{ id: string }>;
};

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

function revalidateArticlePaths(slug: string, previousSlug?: string) {
  revalidatePath('/artikel');
  revalidatePath(`/artikel/${slug}`);

  if (previousSlug && previousSlug !== slug) {
    revalidatePath(`/artikel/${previousSlug}`);
  }
}

export async function PATCH(request: Request, { params }: RouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;
  const existing = await getArticleById(id);

  if (!existing) {
    return NextResponse.json({ error: 'Artikel tidak ditemukan.' }, { status: 404 });
  }

  try {
    const body = (await request.json()) as CmsArticleInput;
    const article = await updateArticle(id, body);
    revalidateArticlePaths(article.slug, existing.slug);

    return NextResponse.json({ article });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal memperbarui artikel.' },
      { status: 400 }
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteProps) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const { id } = await params;

  try {
    const article = await deleteArticle(id);
    revalidateArticlePaths(article.slug);

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menghapus artikel.' },
      { status: 400 }
    );
  }
}