import { NextResponse, NextRequest } from 'next/server';

const ADMIN_COOKIE = 'og_admin';
const ADMIN_PREFIX = '/admin';

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  if (!pathname.startsWith(ADMIN_PREFIX)) return NextResponse.next();

  const ok = req.cookies.get(ADMIN_COOKIE)?.value === 'ok';
  if (!ok && pathname !== '/admin/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }
  if (ok && pathname === '/admin/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/admin/dashboard';
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
