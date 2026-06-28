// src/app/api/auth/forgot-password/route.ts
// Şifrə unudulması - reset linki göndərir

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = checkRateLimit('auth:forgot-password', ip, 3, 60 * 60 * 1000)
  if (!limit.allowed) {
    const { body, status, headers } = rateLimitResponse(
      'Çox sayida cəhd. 1 saat sonra yenidən cəhd edin.',
      limit.retryAfterSec
    )
    return NextResponse.json(body, { status, headers })
  }

  const body = await req.json().catch(() => null)
  if (!body?.email) {
    return NextResponse.json({ error: 'Email tələb olunur' }, { status: 400 })
  }

  const { email } = body as { email: string }
  const normalizedEmail = email.toLowerCase().trim()

  try {
    const { db } = await import('@/lib/db')
    const { users } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const [user] = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    // Həmişə success qaytar - email var ya yoxdur, bunu aşkar etməmək üçün
    // Əgər user varsa, reset link göndər (burada email göndərmə implementasiyası lazımdır)
    if (user) {
      // TODO: Email göndərmə implementasiyası
      // Reset token yarat və email göndər
      logger.info('[forgot-password] Reset link requested for:', { email: normalizedEmail })
    }

    return NextResponse.json({
      success: true,
      message: 'Əgər bu email qeydiyyatda varsa, reset linki göndəriləcək',
    })
  } catch (err) {
    logger.error('[forgot-password] error:', { error: err })
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 })
  }
}
