// src/lib/auth/server.ts

import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'

export class AuthError extends Error {
  status: number
  constructor(message: string, status = 401) {
    super(message)
    this.name = 'AuthError'
    this.status = status
  }
}

const isProd = process.env.NODE_ENV === 'production'

export const adminCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  // ✅ path:'/' mütləq lazımdır
  // path:'/admin' olsaydı, /api/auth/me (path=/api/...) cookie-ni görmürdü
  path: '/',
  maxAge: 8 * 60 * 60, // 8 saat
}

export const customerCookieOptions: Partial<ResponseCookie> = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? 'strict' : 'lax',
  path: '/',
  maxAge: 7 * 24 * 60 * 60, // 7 gün
}
// ─── getCustomerFromRequest ────────────────────────────────────────────────
// Sync helper — cookie-dən JWT decode (verify etmir, yalnız payload oxuyur)
// API route-larında istifadə üçün əlavə edilmişdir.
// NOT: Tam doğrulama üçün requireAuth() istifadə edin.
import { COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import type { NextRequest } from 'next/server'

export function getCustomerFromRequest(req: NextRequest): { sub: string; email: string; role: string } | null {
  try {
    const token = req.cookies.get(COOKIE_CUSTOMER)?.value
    if (!token) return null
    // JWT payload-ı decode et (base64) — verify etmirik çünki bu sync helper-dir
    // Real routes-da requireAuth() istifadə edin
    const parts = token.split('.')
    if (parts.length !== 3) return null
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'))
    if (!payload?.sub) return null
    return { sub: payload.sub, email: payload.email ?? '', role: payload.role ?? 'CUSTOMER' }
  } catch {
    return null
  }
}
