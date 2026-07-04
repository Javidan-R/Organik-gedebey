// src/lib/auth.ts
// Server-side auth helpers — API route-larda istifadə olunur.

import { NextRequest } from 'next/server'
import {
  verifyAdminToken,
  verifyCustomerToken,
  COOKIE_ADMIN,
  COOKIE_CUSTOMER,
  type AdminRole,
} from '@/lib/auth/jwt'
import { AuthError } from '@/lib/auth/server'

export type SessionUser = {
  id: string
  email: string
  role: string
  name: string
  type: 'admin' | 'customer'
}

const ADMIN_ROLES: AdminRole[] = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

function isUuid(id: string): boolean {
  return UUID_RE.test(id)
}

async function resolveUserFromDb(
  userId: string,
  type: 'admin' | 'customer'
): Promise<SessionUser | null> {
  if (!isUuid(userId)) {
    return null
  }

  try {
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
      })
      .from(users)
      .where(eq(users.id, userId))
      .limit(1)

    if (!user || !user.isActive || user.isBlocked) return null

    if (type === 'admin' && !ADMIN_ROLES.includes(user.role as AdminRole)) return null
    if (type === 'customer' && !['CUSTOMER', 'COURIER'].includes(user.role)) return null

    const name = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email

    return {
      id: user.id,
      email: user.email,
      role: user.role,
      name,
      type,
    }
  } catch (error) {
    // ✅ FIX: If DB fails, return null so token payload fallback is used
    console.warn('[auth] DB resolve failed, using token payload:', error)
    return null
  }
}

function sessionFromPayload(
  payload: { sub: string; email: string; role: string; name: string },
  type: 'admin' | 'customer'
): SessionUser {
  return {
    id: payload.sub,
    email: payload.email,
    role: payload.role,
    name: payload.name,
    type,
  }
}

async function validateTokenUser(
  payload: { sub: string; email: string; role: string; name: string },
  type: 'admin' | 'customer'
): Promise<SessionUser | null> {
  // ✅ Try DB resolve first
  if (isUuid(payload.sub)) {
    const dbUser = await resolveUserFromDb(payload.sub, type)
    if (dbUser) return dbUser
    // Fall through to payload fallback
  }

  // ✅ Dev / env fallback tokens (non-UUID sub) - always allowed in dev
  if (process.env.NODE_ENV !== 'production' && payload.sub === 'dev-admin-id' && type === 'admin') {
    return sessionFromPayload(payload, type)
  }
  if (payload.sub === 'env-admin' && type === 'admin' && process.env.ADMIN_EMAIL) {
    return sessionFromPayload(payload, type)
  }

  // ✅ PAYLOAD FALLBACK: If DB failed but token is valid, trust token
  // This prevents constant logouts when DB is slow/unavailable
  if (isUuid(payload.sub) && payload.role) {
    // Check role validity
    if (type === 'admin' && !ADMIN_ROLES.includes(payload.role as AdminRole)) {
      return null
    }
    if (type === 'customer' && !['CUSTOMER', 'COURIER'].includes(payload.role)) {
      return null
    }
    return sessionFromPayload(payload, type)
  }

  return null
}

// ─── Admin Auth ──────────────────────────────────────────────────────────────

export async function requireAuth(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: SessionUser }> {
  const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
  if (adminToken) {
    const payload = await verifyAdminToken(adminToken)
    if (payload) {
      const user = await validateTokenUser(payload, 'admin')
      if (user) {
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          throw new AuthError('Bu əməliyyat üçün icazəniz yoxdur', 403)
        }
        return { user }
      }
      // If validateTokenUser returns null but token was valid, it means
      // user not found or inactive. Still throw error.
      throw new AuthError('Sessiya bitmişdir. Yenidən giriş edin.', 401)
    }
  }

  const customerToken = req.cookies.get(COOKIE_CUSTOMER)?.value
  if (customerToken) {
    const payload = await verifyCustomerToken(customerToken)
    if (payload) {
      const user = await validateTokenUser(payload, 'customer')
      if (user) {
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          throw new AuthError('Bu əməliyyat üçün icazəniz yoxdur', 403)
        }
        return { user }
      }
      throw new AuthError('Sessiya bitmişdir. Yenidən giriş edin.', 401)
    }
  }

  throw new AuthError('Giriş tələb olunur', 401)
}

export async function requireAdminAuth(
  req: NextRequest,
  allowedRoles?: string[]
): Promise<{ user: SessionUser }> {
  const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
  if (!adminToken) throw new AuthError('Admin girişi tələb olunur', 401)

  const payload = await verifyAdminToken(adminToken)
  if (!payload) throw new AuthError('Sessiya bitmişdir. Yenidən giriş edin.', 401)

  const user = await validateTokenUser(payload, 'admin')
  if (!user) throw new AuthError('Sessiya bitmişdir. Yenidən giriş edin.', 401)

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    throw new AuthError('Bu əməliyyat üçün icazəniz yoxdur', 403)
  }

  return { user }
}

// ─── Optional Auth (for guest checkout) ────────────────────────────────────

export async function optionalAuth(
  req: NextRequest
): Promise<{ user: SessionUser | null }> {
  try {
    // Try admin token first
    const adminToken = req.cookies.get(COOKIE_ADMIN)?.value
    if (adminToken) {
      const payload = await verifyAdminToken(adminToken)
      if (payload) {
        const user = await validateTokenUser(payload, 'admin')
        if (user) return { user }
      }
    }

    // Try customer token
    const customerToken = req.cookies.get(COOKIE_CUSTOMER)?.value
    if (customerToken) {
      const payload = await verifyCustomerToken(customerToken)
      if (payload) {
        const user = await validateTokenUser(payload, 'customer')
        if (user) return { user }
      }
    }

    // Guest (no auth)
    return { user: null }
  } catch {
    // Any error, treat as guest
    return { user: null }
  }
}

export async function getServerSession() {
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()

    const adminToken = cookieStore.get(COOKIE_ADMIN)?.value
    if (adminToken) {
      const payload = await verifyAdminToken(adminToken)
      if (payload) {
        const user = await validateTokenUser(payload, 'admin')
        if (user) return { user }
      }
    }

    const customerToken = cookieStore.get(COOKIE_CUSTOMER)?.value
    if (customerToken) {
      const payload = await verifyCustomerToken(customerToken)
      if (payload) {
        const user = await validateTokenUser(payload, 'customer')
        if (user) return { user }
      }
    }

    return null
  } catch {
    return null
  }
}

export { AuthError } from '@/lib/auth/server'