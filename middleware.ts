import { NextRequest, NextResponse } from 'next/server';

const ADMIN_PREFIX = '/bukan-admin';
const SESSION_COOKIE = 'mt_admin_session';

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (pathname === '/admin' || pathname.startsWith('/admin/')) {
    return new NextResponse('Not Found', { status: 404 });
  }

  if (!pathname.startsWith(ADMIN_PREFIX)) {
    return NextResponse.next();
  }

  const accessKey = process.env.CMS_ADMIN_ACCESS_KEY?.trim();

  // If no access key configured, keep current behavior.
  if (!accessKey) {
    return NextResponse.next();
  }

  const hasSession = Boolean(request.cookies.get(SESSION_COOKIE)?.value);
  if (hasSession) {
    return NextResponse.next();
  }

  const providedKey = searchParams.get('k')?.trim();
  if (providedKey && providedKey === accessKey) {
    return NextResponse.next();
  }

  return new NextResponse('Not Found', { status: 404 });
}

export const config = {
  matcher: ['/bukan-admin/:path*', '/admin/:path*', '/admin'],
};
