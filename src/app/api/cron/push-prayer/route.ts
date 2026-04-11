import { NextRequest, NextResponse } from 'next/server';
import { runPushPrayerCron } from '@/server/push/prayerCron';

function isAuthorized(request: NextRequest): boolean {
  const isVercelCron = Boolean(request.headers.get('x-vercel-cron'));
  if (isVercelCron) return true;

  const secret = process.env.CRON_SECRET;
  if (!secret) return false;

  const bearer = request.headers.get('authorization');
  if (bearer === `Bearer ${secret}`) return true;

  return request.nextUrl.searchParams.get('secret') === secret;
}

export async function GET(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPushPrayerCron();
    return NextResponse.json({ ok: true, ...result });
  } catch {
    return NextResponse.json({ error: 'Failed to run prayer push cron' }, { status: 500 });
  }
}
