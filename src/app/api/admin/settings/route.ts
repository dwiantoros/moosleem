import { revalidatePath } from 'next/cache';
import { NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { updateCmsSettings } from '@/server/cms/repository';
import type { CmsSettings } from '@/server/cms/types';

export async function PUT(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = (await request.json()) as Partial<CmsSettings>;
    const settings = await updateCmsSettings(body);
    revalidatePath('/artikel');

    return NextResponse.json({ settings });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal menyimpan pengaturan SEO.' },
      { status: 400 }
    );
  }
}