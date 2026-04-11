import { NextRequest, NextResponse } from 'next/server';
import { removePushSubscriber } from '@/server/push/store';

interface UnsubscribeBody {
  endpoint?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as UnsubscribeBody;
    if (!body.endpoint) {
      return NextResponse.json({ error: 'endpoint is required' }, { status: 400 });
    }

    await removePushSubscriber(body.endpoint);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: 'Failed to unsubscribe push endpoint' }, { status: 500 });
  }
}
