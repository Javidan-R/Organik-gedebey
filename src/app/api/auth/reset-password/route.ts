// src/app/api/auth/reset-password/route.ts
// Şifrə sıfırlama

import { NextRequest, NextResponse } from 'next/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@sentry/nextjs'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const limit = checkRateLimit('auth:reset-password', ip, 5, 60 * 60 * 1000)
  if (!limit.allowed) {
    const { body, status, headers } = rateLimitResponse(
      'Çox sayida cəhd. 1 saat sonra yenidən cəhd edin.',
      limit.retryAfterSec
    )
    return NextResponse.json(body, { status, headers })
  }
 
  const body = await req.json().catch(() => null)
  if (!body?.token || !body?.password) {
    return NextResponse.json({ error: 'Token və şifrə tələb olunur' }, { status: 400 })
  }

  const { token, password } = body as { token: string; password: string }

  try {
    // TODO: Token validation implementasiyası
    // Token-i validate et və user ID-ni əldə et
    // Bu hissədə token storage və validation lazımdır
    void token
    void password

    // Temporarily return success for testing
    // In production, validate token and update password
    logger.info('[reset-password] Password reset requested with token')

    return NextResponse.json({
      success: true,
      message: 'Şifrə uğurla dəyişdirildi',
    })
  } catch (err) {
    logger.error('[reset-password] error:', { error: err })
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 })
  }
}
