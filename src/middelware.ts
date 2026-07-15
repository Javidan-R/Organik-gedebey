// src/middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { verifyAdminToken, COOKIE_ADMIN } from '@/lib/auth/jwt';
import { logger } from '@/lib/logger';

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Yalnız /admin və /api/admin ilə başlayan yollar
  if (!pathname.startsWith('/admin') && !pathname.startsWith('/api/admin')) {
    return NextResponse.next();
  }

  // Login səhifəsinə birbaşa icazə ver, amma artıq auth varsa dashboard-a yönləndir
  if (pathname === '/admin/login') {
    const token = request.cookies.get(COOKIE_ADMIN)?.value;
    if (token) {
      const payload = await verifyAdminToken(token);
      if (payload) {
        return NextResponse.redirect(new URL('/admin/dashboard', request.url));
      }
    }
    return NextResponse.next();
  }

  // Qorunan route
  const token = request.cookies.get(COOKIE_ADMIN)?.value;

  if (!token) {
    logger.info('[Middleware] No admin cookie', { pathname });
    // API sorğusudursa JSON xətası, səhifədirsə login-ə yönləndir
    if (pathname.startsWith('/api/admin')) {
      return NextResponse.json(
        { error: 'Giriş tələb olunur' },
        { status: 401 }
      );
    }
    const loginUrl = new URL('/admin/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  const payload = await verifyAdminToken(token);
  if (!payload) {
    logger.warn('[Middleware] Invalid token', { pathname });
    const response = NextResponse.redirect(
      new URL('/admin/login', request.url)
    );
    response.cookies.delete(COOKIE_ADMIN);
    return response;
  }

  // Uğurlu – davam et
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
// import { NextResponse } from 'next/server';
// import type { NextRequest } from 'next/server';
// import { verifyAdminToken, COOKIE_ADMIN } from '@/lib/auth/jwt';

// const ADMIN_PATHS = [
//   '/admin',
//   '/admin/dashboard',
//   '/admin/orders',
//   '/admin/products',
//   '/admin/users',
//   '/admin/settings',
//   '/admin/fresh-today',
//   '/admin/finance',
//   '/admin/expenses',
// ];

// const PUBLIC_PATHS = ['/admin/login'];

// export async function middleware(request: NextRequest) {
//   const pathname = request.nextUrl.pathname;

//   // Admin paths check
//   const isAdminPath = ADMIN_PATHS.some(path => pathname.startsWith(path));
//   const isPublicPath = PUBLIC_PATHS.some(path => pathname.startsWith(path));

//   // If not admin path, continue
//   if (!isAdminPath) {
//     return NextResponse.next();
//   }

//   // If public path (login), check if already authenticated
//   if (isPublicPath) {
//     const token = request.cookies.get(COOKIE_ADMIN)?.value;
//     if (token) {
//       try {
//         await verifyAdminToken(token);
//         // If valid token, redirect to dashboard
//         return NextResponse.redirect(new URL('/admin/dashboard', request.url));
//       } catch {
//         // Token invalid, continue to login
//         return NextResponse.next();
//       }
//     }
//     return NextResponse.next();
//   }

//   // Protected admin paths
//   const token = request.cookies.get(COOKIE_ADMIN)?.value;

//   if (!token) {
//     const loginUrl = new URL('/admin/login', request.url);
//     loginUrl.searchParams.set('next', pathname);
//     return NextResponse.redirect(loginUrl);
//   }

//   try {
//     await verifyAdminToken(token);
//     return NextResponse.next();
//   } catch {
//     const response = NextResponse.redirect(new URL('/admin/login', request.url));
//     response.cookies.delete(COOKIE_ADMIN);
//     return response;
//   }
// }

// export const config = {
//   matcher: [
//     '/admin/:path*',
//   ],
// };