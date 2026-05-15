import { NextResponse, NextRequest } from 'next/server'

const ADMIN_PREFIX = '/admin'
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const authCookie = req.cookies.get('og_auth')
  const adminCookie = req.cookies.get('og_admin')

  let userData: { role?: string } | null = null
  try {
    if (authCookie?.value) {
      userData = JSON.parse(authCookie.value)
    }
  } catch {
    // Cookie səhvdirsə, təmizlə
  }

  // === ADMIN ROUTES ===
  if (pathname.startsWith(ADMIN_PREFIX)) {
    // Admin login səhifəsi
    if (pathname === '/admin/login') {
      if (adminCookie?.value === 'ok' || userData?.role === 'ADMIN' || userData?.role === 'MANAGER') {
        const url = req.nextUrl.clone()
        url.pathname = '/admin/dashboard'
        return NextResponse.redirect(url)
      }
      return NextResponse.next()
    }

    // Digər admin səhifələri
    if (adminCookie?.value !== 'ok' && 
        userData?.role !== 'ADMIN' && 
        userData?.role !== 'MANAGER' &&
        userData?.role !== 'WAREHOUSE_STAFF') {
      const url = req.nextUrl.clone()
      url.pathname = '/admin/login'
      url.searchParams.set('next', pathname)
      return NextResponse.redirect(url)
    }

    return NextResponse.next()
  }

  // === AUTH ROUTES (login, signup) ===
  if (AUTH_ROUTES.some(route => pathname.startsWith(route))) {
    if (userData) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
    return NextResponse.next()
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/admin/:path*', '/login', '/signup', '/forgot-password'],
}