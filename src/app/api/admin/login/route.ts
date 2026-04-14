import { NextRequest, NextResponse } from 'next/server';

import { authenticateAdmin, createAdminSession } from '@/server/cms/auth';

// In-memory rate limiter: max 10 attempts per 15 minutes per IP
const loginAttempts = new Map<string, { count: number; resetAt: number }>();

const RATE_LIMIT_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const entry = loginAttempts.get(ip);

  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS });
    return false;
  }

  entry.count += 1;
  return entry.count > RATE_LIMIT_MAX;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) return forwarded.split(',')[0].trim();
  return request.headers.get('x-real-ip') ?? 'unknown';
}

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);

  if (isRateLimited(ip)) {
    return NextResponse.json(
      { error: 'Terlalu banyak percobaan login. Coba lagi setelah 15 menit.' },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };
  const result = await authenticateAdmin(body.username?.trim() || '', body.password?.trim() || '');

  if (!result.ok) {
    return NextResponse.json({ error: result.message }, { status: result.status });
  }

  await createAdminSession(result.username);
  return NextResponse.json({ ok: true });
}