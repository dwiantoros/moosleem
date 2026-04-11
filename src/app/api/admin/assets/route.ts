import { NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { createAsset, listAssets } from '@/server/cms/repository';

const MAX_FILE_SIZE_BYTES = 2 * 1024 * 1024;
const ALLOWED_TYPES = new Set(['image/png', 'image/jpeg', 'image/webp', 'image/gif']);

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function GET() {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const assets = await listAssets(18);
  return NextResponse.json({ assets });
}

export async function POST(request: Request) {
  const session = await getAdminSession();

  if (!session) {
    return unauthorized();
  }

  const formData = await request.formData();
  const file = formData.get('file');
  const altText = String(formData.get('altText') || '');

  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File gambar wajib diunggah.' }, { status: 400 });
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    return NextResponse.json({ error: 'Format gambar harus PNG, JPG, WEBP, atau GIF.' }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE_BYTES) {
    return NextResponse.json({ error: 'Ukuran gambar maksimal 2 MB.' }, { status: 400 });
  }

  const arrayBuffer = await file.arrayBuffer();
  const base64Data = Buffer.from(arrayBuffer).toString('base64');
  const asset = await createAsset({
    filename: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    altText,
    base64Data,
  });

  return NextResponse.json({ asset });
}