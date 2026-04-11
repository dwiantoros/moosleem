import { NextResponse } from 'next/server';

import { getAssetById } from '@/server/cms/repository';

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
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
    },
  });
}