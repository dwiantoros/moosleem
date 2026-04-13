import { NextRequest, NextResponse } from 'next/server';
import { upsertPushSubscriber } from '@/server/push/store';
import { PushSubscriptionPayload } from '@/server/push/types';

interface SubscribeBody {
  subscription?: PushSubscriptionPayload;
  location?: {
    latitude: number;
    longitude: number;
    timezone: string;
    method?: number;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SubscribeBody;
    const subscription = body.subscription;
    const location = body.location;

    if (!subscription?.endpoint || !subscription.keys?.auth || !subscription.keys?.p256dh) {
      return NextResponse.json({ error: 'Invalid push subscription payload' }, { status: 400 });
    }

    const hasLocation =
      location &&
      !Number.isNaN(Number(location.latitude)) &&
      !Number.isNaN(Number(location.longitude)) &&
      Boolean(location.timezone);

    if (location && !hasLocation) {
      return NextResponse.json({ error: 'Format location tidak valid.' }, { status: 400 });
    }

    const now = Date.now();
    await upsertPushSubscriber({
      endpoint: subscription.endpoint,
      subscription,
      latitude: hasLocation ? Number(location?.latitude) : undefined,
      longitude: hasLocation ? Number(location?.longitude) : undefined,
      timezone: hasLocation ? location?.timezone : undefined,
      method: hasLocation ? location?.method ?? 2 : undefined,
      createdAt: now,
      updatedAt: now,
      lastSentTags: [],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to store push subscription' }, { status: 500 });
  }
}
