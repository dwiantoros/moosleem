import { NextResponse } from 'next/server';

import { getAssetById } from '@/server/cms/repository';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;

  if (!UUID_RE.test(id)) {
    return new NextResponse('Not found', { status: 404 });
  }

  const asset = await getAssetById(id);

  if (!asset) {
    return new NextResponse('Not found', { status: 404 });
  }

  return new NextResponse(Buffer.from(asset.base64Data, 'base64'), {
    status: 200,
    headers: {
      'Content-Type': asset.mimeType,
      'Cache-Control': 'public, max-age=31536000, immutable',
      'Content-Disposition': `inline; filename="${asset.filename.replace(/"/g, '')}"`,
      'X-Content-Type-Options': 'nosniff',
    },
  });
}