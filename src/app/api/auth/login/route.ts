// src/app/api/auth/login/route.ts
// Müştəri girişi.

import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { signCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { customerCookieOptions } from '@/lib/auth/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@sentry/nextjs'

const isProd = process.env.NODE_ENV === 'production'
const cookieOptions = {
  ...customerCookieOptions,
  secure: isProd,
  sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
} 

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = checkRateLimit('auth:customer-login', ip, 10, 15 * 60 * 1000)
  if (!limit.allowed) {
    const { body, status, headers } = rateLimitResponse(
      'Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən cəhd edin.',
      limit.retryAfterSec
    )
    return NextResponse.json(body, { status, headers })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Email və şifrə tələb olunur' }, { status: 400 })
  }

  const { email, password } = body as { email: string; password: string }
  const normalizedEmail = email.toLowerCase().trim()

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
        phone: users.phone,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
        avatarUrl: users.avatarUrl,
        loyaltyPoints: users.loyaltyPoints,
        totalOrders: users.totalOrders,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (!user?.passwordHash) {
      await bcrypt.compare(password, '$2a$12$invalidhashtopreventtimingattack00000000000')
      return NextResponse.json({ error: 'Email və ya şifrə yanlışdır' }, { status: 401 })
    }

    const valid = await bcrypt.compare(password, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Email və ya şifrə yanlışdır' }, { status: 401 })
    }

    if (!user.isActive || user.isBlocked) {
      return NextResponse.json({ error: 'Hesabınız bloklanmışdır.' }, { status: 403 })
    }

    db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).catch(() => {})

    const customerRole = user.role === 'COURIER' ? 'COURIER' : 'CUSTOMER'
    const name = `${user.firstName} ${user.lastName}`.trim()

    // ✅ await — jose async sign
    const token = await signCustomerToken({
      sub: user.id,
      email: user.email,
      name,
      role: customerRole as 'CUSTOMER' | 'COURIER',
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name,
        phone: user.phone,
        role: customerRole,
        avatarUrl: user.avatarUrl,
        loyaltyPoints: user.loyaltyPoints ?? 0,
        totalOrders: user.totalOrders ?? 0,
      },
    })

    response.cookies.set(COOKIE_CUSTOMER, token, cookieOptions)
    return response
  } catch (err) {
    logger.error('[customer/login] error:', { error: err })
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 })
  }
}