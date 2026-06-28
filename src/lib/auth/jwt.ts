// src/lib/auth/jwt.ts
// ⚠️ jsonwebtoken → jose dəyişdirildi.
// Səbəb: jsonwebtoken Node.js crypto API-sindən asılıdır.
// Next.js middleware Edge Runtime-da Node.js API-ləri mövcud deyil.
// jose isə Web Crypto API istifadə edir — həm Edge, həm Node-da işləyir.

import { SignJWT, jwtVerify, type JWTPayload } from 'jose'

// ─── Secret ──────────────────────────────────────────────────────────────────

function getSecret(): Uint8Array {
  // ✅ Hər çağırışda oxu — module-level cache YOX
  // Səbəb: module-level const SECRET = process.env.X ilə
  // əgər env var sonradan set edilibsə əks olunmur.
  const secret = process.env.NEXTAUTH_SECRET
  if (!secret) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('[jwt] NEXTAUTH_SECRET env var is required in production')
    }
    // Dev fallback — production-da istifadə etmə
    return new TextEncoder().encode('dev-only-fallback-secret-change-in-prod-32c')
  }
  return new TextEncoder().encode(secret)
}

// ─── Tip tərifləri ───────────────────────────────────────────────────────────

export type AdminRole = 'ADMIN' | 'SUPERADMIN' | 'MANAGER' | 'WAREHOUSE_STAFF' | 'COURIER'
export type CustomerRole = 'CUSTOMER' | 'COURIER'

export type AdminTokenPayload = JWTPayload & {
  sub: string
  email: string
  name: string
  role: AdminRole
  type: 'admin'
}

export type CustomerTokenPayload = JWTPayload & {
  sub: string
  email: string
  name: string
  role: CustomerRole
  type: 'customer'
}

export type TokenPayload = AdminTokenPayload | CustomerTokenPayload

// ─── Sign ────────────────────────────────────────────────────────────────────

export async function signAdminToken(
  payload: Omit<AdminTokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'admin' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('8h')
    .sign(getSecret())
}

export async function signCustomerToken(
  payload: Omit<CustomerTokenPayload, 'type' | 'iat' | 'exp'>
): Promise<string> {
  return new SignJWT({ ...payload, type: 'customer' as const })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('7d')
    .sign(getSecret())
}

// ─── Verify ──────────────────────────────────────────────────────────────────

export async function verifyToken(token: string): Promise<TokenPayload | null> {
  try {
    const { payload } = await jwtVerify(token, getSecret(), {
      algorithms: ['HS256'],
    })
    return payload as TokenPayload
  } catch {
    return null
  }
}

export async function verifyAdminToken(token: string): Promise<AdminTokenPayload | null> {
  const payload = await verifyToken(token)
  if (!payload || payload.type !== 'admin') return null
  return payload as AdminTokenPayload
}

export async function verifyCustomerToken(token: string): Promise<CustomerTokenPayload | null> {
  const payload = await verifyToken(token)
  if (!payload || payload.type !== 'customer') return null
  return payload as CustomerTokenPayload
}

// ─── Cookie adları ───────────────────────────────────────────────────────────

export const COOKIE_ADMIN = 'og_admin_jwt'
export const COOKIE_CUSTOMER = 'og_session'
export const COOKIE_LEGACY_ADMIN = 'admin_token'
export const COOKIE_LEGACY_AUTH = 'auth_token'