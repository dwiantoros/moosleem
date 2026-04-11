import 'server-only';

import { createHmac, timingSafeEqual } from 'crypto';

import { cookies } from 'next/headers';

const COOKIE_NAME = 'mt_admin_session';
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 7;

type AdminSession = {
  username: string;
  exp: number;
};

function getAuthConfig() {
  return {
    username: process.env.CMS_ADMIN_USERNAME?.trim() || '',
    password: process.env.CMS_ADMIN_PASSWORD?.trim() || '',
    secret: process.env.CMS_SESSION_SECRET?.trim() || '',
  };
}

export function isAdminAuthConfigured() {
  const config = getAuthConfig();
  return Boolean(config.username && config.password && config.secret);
}

function signPayload(payload: string) {
  const { secret } = getAuthConfig();
  return createHmac('sha256', secret).update(payload).digest('base64url');
}

function safeEqual(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  if (leftBuffer.length !== rightBuffer.length) {
    return false;
  }

  return timingSafeEqual(leftBuffer, rightBuffer);
}

export async function authenticateAdmin(username: string, password: string) {
  const config = getAuthConfig();

  if (!isAdminAuthConfigured()) {
    return {
      ok: false as const,
      status: 503,
      message: 'CMS admin belum aktif. Isi env CMS_ADMIN_USERNAME, CMS_ADMIN_PASSWORD, dan CMS_SESSION_SECRET.',
    };
  }

  if (!safeEqual(username, config.username) || !safeEqual(password, config.password)) {
    return {
      ok: false as const,
      status: 401,
      message: 'Username atau password admin tidak cocok.',
    };
  }

  return {
    ok: true as const,
    username: config.username,
  };
}

export async function createAdminSession(username: string) {
  const expires = Date.now() + SESSION_MAX_AGE_SECONDS * 1000;
  const payload = Buffer.from(JSON.stringify({ username, exp: expires } satisfies AdminSession)).toString('base64url');
  const cookieStore = await cookies();

  cookieStore.set(COOKIE_NAME, `${payload}.${signPayload(payload)}`, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function clearAdminSession() {
  const cookieStore = await cookies();
  cookieStore.set(COOKIE_NAME, '', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 0,
  });
}

export async function getAdminSession() {
  const token = (await cookies()).get(COOKIE_NAME)?.value;

  if (!token || !isAdminAuthConfigured()) {
    return null;
  }

  const [payload, signature] = token.split('.');

  if (!payload || !signature || !safeEqual(signature, signPayload(payload))) {
    return null;
  }

  try {
    const session = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSession;

    if (!session.username || typeof session.exp !== 'number' || session.exp < Date.now()) {
      return null;
    }

    return session;
  } catch {
    return null;
  }
}