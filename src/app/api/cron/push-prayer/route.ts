import { NextRequest, NextResponse } from 'next/server';
import { runPushPrayerCron } from '@/server/push/prayerCron';

function normalizeSecret(value: string | null | undefined): string {
  if (!value) return '';
  return value.replace(/[\s\u200B-\u200D\uFEFF]/g, '');
}

function isAuthorized(request: NextRequest): boolean {
  const isVercelCron = Boolean(request.headers.get('x-vercel-cron'));
  if (isVercelCron) return true;

  const secret = normalizeSecret(process.env.CRON_SECRET);
  if (!secret) return false;

  const bearer = request.headers.get('authorization')?.replace(/^Bearer\s+/i, '');
  if (normalizeSecret(bearer) === secret) return true;

  const xCronSecret = normalizeSecret(request.headers.get('x-cron-secret'));
  if (xCronSecret === secret) return true;

  const xApiKey = normalizeSecret(request.headers.get('x-api-key'));
  if (xApiKey === secret) return true;

  return false;
}

async function handleCron(request: NextRequest) {
  if (!isAuthorized(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const result = await runPushPrayerCron();
    return NextResponse.json({ ok: true, triggeredAt: new Date().toISOString(), ...result });
  } catch {
    return NextResponse.json({ error: 'Failed to run prayer push cron' }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return handleCron(request);
}

export async function POST(request: NextRequest) {
  return handleCron(request);
}
