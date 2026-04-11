import { NextResponse } from 'next/server';
import { getVapidPublicKey } from '@/server/push/webpush';

export async function GET() {
  try {
    const publicKey = getVapidPublicKey();
    return NextResponse.json({ publicKey });
  } catch {
    return NextResponse.json(
      { error: 'Web Push VAPID belum dikonfigurasi di server' },
      { status: 503 }
    );
  }
}
