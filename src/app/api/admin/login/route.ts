import { NextResponse } from 'next/server';

import { authenticateAdmin, createAdminSession } from '@/server/cms/auth';

export async function POST(request: Request) {
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