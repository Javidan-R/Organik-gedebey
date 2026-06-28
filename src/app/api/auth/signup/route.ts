// src/app/api/auth/signup/route.ts
// Müştəri qeydiyyatı.

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
  const limit = checkRateLimit('auth:customer-signup', ip, 5, 15 * 60 * 1000)
  if (!limit.allowed) {
    const { body, status, headers } = rateLimitResponse(
      'Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən cəhd edin.',
      limit.retryAfterSec
    )
    return NextResponse.json(body, { status, headers })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password || !body?.firstName || !body?.lastName) {
    return NextResponse.json({ error: 'Email, şifrə, ad və soyad tələb olunur' }, { status: 400 })
  }

  const { email, password, firstName, lastName, phone } = body as {
    email: string
    password: string
    firstName: string
    lastName: string
    phone?: string
  }
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    // Email-in artıq mövcud olub-olmadığını yoxla
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    if (existingUser) {
      return NextResponse.json({ error: 'Bu email artıq qeydiyyatdan keçib' }, { status: 409 })
    }

    // Şifrəni hash et
    const passwordHash = await bcrypt.hash(password, 12)

    // İstifadəçini yarat
    const [newUser] = await db
      .insert(users)
      .values({
        email: normalizedEmail,
        firstName,
        lastName,
        phone: phone || null,
        passwordHash,
        role: 'CUSTOMER',
        isActive: true,
        isBlocked: false,
        loyaltyPoints: 0,
        totalOrders: 0,
      })
      .returning()

    const name = `${newUser.firstName} ${newUser.lastName}`.trim()

    // Token yarat
    const token = await signCustomerToken({
      sub: newUser.id,
      email: newUser.email,
      name,
      role: 'CUSTOMER',
    })

    const response = NextResponse.json({
      success: true,
      user: {
        id: newUser.id,
        email: newUser.email,
        name,
        phone: newUser.phone,
        role: 'CUSTOMER',
        avatarUrl: newUser.avatarUrl,
        loyaltyPoints: 0,
        totalOrders: 0,
      },
    })

    response.cookies.set(COOKIE_CUSTOMER, token, cookieOptions)
    return response
  } catch (err) {
    logger.error('[customer/signup] error:', { error: err })
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 })
  }
}
