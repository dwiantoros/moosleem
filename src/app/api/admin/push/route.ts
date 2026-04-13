import { NextRequest, NextResponse } from 'next/server';

import { getAdminSession } from '@/server/cms/auth';
import { listPushSubscribers, removePushSubscriber } from '@/server/push/store';
import { PushPayload } from '@/server/push/types';
import { sendWebPush } from '@/server/push/webpush';

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const subscribers = await listPushSubscribers();
  return NextResponse.json({ count: subscribers.length });
}

interface SendBody {
  title?: string;
  body?: string;
  url?: string;
  requireInteraction?: boolean;
  icon?: string;
  badge?: string;
  image?: string;
}

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: SendBody;
  try {
    body = (await request.json()) as SendBody;
  } catch {
    return NextResponse.json({ error: 'Request body tidak valid.' }, { status: 400 });
  }

  const title = body.title?.trim() ?? '';
  const bodyText = body.body?.trim() ?? '';

  if (!title || !bodyText) {
    return NextResponse.json({ error: 'Judul dan isi notifikasi wajib diisi.' }, { status: 400 });
  }

  const tag = `admin-push-${Date.now()}`;
  const payload: PushPayload = {
    title,
    body: bodyText,
    tag,
    url: body.url?.trim() || '/',
    requireInteraction: Boolean(body.requireInteraction),
    icon: body.icon?.trim() || '/logo-muslim-traveler.svg',
    badge: body.badge?.trim() || '/favicon.svg',
    image: body.image?.trim() || '/logo-muslim-traveler.svg',
  };

  const subscribers = await listPushSubscribers();
  let sent = 0;
  let failed = 0;
  let removed = 0;

  for (const subscriber of subscribers) {
    const result = await sendWebPush(subscriber, payload);
    if (result.delivered) {
      sent += 1;
    } else if (result.expired) {
      await removePushSubscriber(subscriber.endpoint);
      removed += 1;
    } else {
      failed += 1;
    }
  }

  return NextResponse.json({
    ok: true,
    total: subscribers.length,
    sent,
    failed,
    removed,
  });
}
