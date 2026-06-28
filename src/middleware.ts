import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { verifyAdminToken, verifyCustomerToken, COOKIE_ADMIN, COOKIE_CUSTOMER } from '@/lib/auth/jwt'

// Protected routes that require authentication
const protectedRoutes = ['/admin', '/account', '/cart', '/checkout']
const adminRoutes = ['/admin']

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  
  // Check if route requires protection
  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAdminRoute = adminRoutes.some(route => pathname.startsWith(route))
  
  if (!isProtectedRoute) {
    return NextResponse.next()
  }
  
  // Verify admin token for admin routes
  if (isAdminRoute) {
    const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
    if (!adminToken) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    
    const payload = await verifyAdminToken(adminToken)
    if (!payload) {
      return NextResponse.redirect(new URL('/admin/login', req.url))
    }
    
    return NextResponse.next()
  }
  
  // Verify customer token for protected customer routes
  const customerToken = req.cookies.get(COOKIE_CUSTOMER)?.value
  if (!customerToken && pathname.startsWith('/account')) {
    return NextResponse.redirect(new URL('/login', req.url))
  }
  
  if (customerToken) {
    const payload = await verifyCustomerToken(customerToken)
    if (!payload && pathname.startsWith('/account')) {
      return NextResponse.redirect(new URL('/login', req.url))
    }
  }
  
  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
}
