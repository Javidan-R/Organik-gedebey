import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Admin login səhifəsinə icazə
  if (pathname === '/admin/login') return NextResponse.next();

  // Admin səhifələri – yalnız og_admin cookie varsa
  if (pathname.startsWith('/admin')) {
    const adminCookie = req.cookies.get('og_admin')?.value === 'ok';
    if (!adminCookie) {
      const url = new URL('/admin/login', req.url);
      url.searchParams.set('next', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Hesab / Sifarişlər (əgər varsa) – öz auth cookie-nizə uyğunlaşdırın
  if (pathname.startsWith('/account') || pathname.startsWith('/orders')) {
    const authCookie = req.cookies.get('og_auth')?.value;
    if (!authCookie) {
      const url = new URL('/login', req.url);
      url.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/orders/:path*'],
};