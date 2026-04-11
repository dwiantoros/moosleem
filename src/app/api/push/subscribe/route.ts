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

    if (!location || Number.isNaN(location.latitude) || Number.isNaN(location.longitude) || !location.timezone) {
      return NextResponse.json({ error: 'Location and timezone are required for server-side prayer push' }, { status: 400 });
    }

    const now = Date.now();
    await upsertPushSubscriber({
      endpoint: subscription.endpoint,
      subscription,
      latitude: Number(location.latitude),
      longitude: Number(location.longitude),
      timezone: location.timezone,
      method: location.method ?? 2,
      createdAt: now,
      updatedAt: now,
      lastSentTags: [],
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to store push subscription' }, { status: 500 });
  }
}
