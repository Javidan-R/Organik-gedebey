// src/app/api/admin/login/route.ts
// Admin girişi — jose JWT, Edge/Node uyğun.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { signAdminToken, COOKIE_ADMIN, type AdminRole } from '@/lib/auth/jwt'
import { adminCookieOptions } from '@/lib/auth/server'
import { checkRateLimit, getClientIp, rateLimitResponse } from '@/lib/rate-limit'
import { logger } from '@sentry/nextjs'

const loginSchema = z.object({
  email: z.string().email('Düzgün email daxil edin').max(254),
  password: z.string()
    .min(1, 'Şifrə tələb olunur')
    .max(128, 'Şifrə 128 simvoldan çox ola bilməz'),
})

const ADMIN_ROLES: AdminRole[] = ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']

const isProd = process.env.NODE_ENV === 'production'

const cookieOptions = {
  ...adminCookieOptions,
  secure: isProd,
  sameSite: (isProd ? 'strict' : 'lax') as 'strict' | 'lax',
  path: '/',
}

// ✅ Sabit UUID (development üçün)
const DEV_ADMIN_UUID = '00000000-0000-0000-0000-000000000001'

export async function POST(req: NextRequest) {
  const ip = getClientIp(req)
  const { allowed, remaining, retryAfterSec } = checkRateLimit('auth:admin-login', ip, 10, 15 * 60 * 1000)
  if (!allowed) {
    const { body, status, headers } = rateLimitResponse(
      'Çox sayda uğursuz cəhd. 15 dəqiqə sonra yenidən cəhd edin.',
      retryAfterSec
    )
    return NextResponse.json(body, { status, headers })
  }

  // Content-Type
  const ct = req.headers.get('content-type') ?? ''
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Yanlış content-type' }, { status: 415 })
  }

  // Body parse
  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Yanlış JSON formatı' }, { status: 400 })
  }

  // Validation
  const parsed = loginSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Validation error' }, { status: 400 })
  }

  const { email, password } = parsed.data
  const normalizedEmail = email.toLowerCase().trim()

  // ── Dev mock admin ────────────────────────────────────────────────────────
  if (!isProd) {
    const devEmail = process.env.DEV_ADMIN_EMAIL ?? process.env.SEED_ADMIN_EMAIL ?? 'admin@organikgedebey.az'
    const devPass = process.env.DEV_ADMIN_PASSWORD ?? process.env.SEED_ADMIN_PASSWORD ?? 'Admin123!'
    if (normalizedEmail === devEmail && password === devPass) {
      // ✅ UUID formatında ID istifadə et
      const token = await signAdminToken({
        sub: DEV_ADMIN_UUID, // ✅ UUID formatı
        email: devEmail,
        name: 'Dev Admin',
        role: 'ADMIN',
      })
      const res = NextResponse.json({
        success: true,
        user: {
          id: DEV_ADMIN_UUID,
          email: devEmail,
          name: 'Dev Admin',
          role: 'ADMIN' as AdminRole,
          type: 'admin' as const,
        },
      })
      res.cookies.set(COOKIE_ADMIN, token, cookieOptions)
      return res
    }
  }

  // ── DB axtarışı ───────────────────────────────────────────────────────────
  try {
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        passwordHash: users.passwordHash,
        role: users.role,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
      })
      .from(users)
      .where(eq(users.email, normalizedEmail))
      .limit(1)

    const FAKE_HASH = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewFkWFfKqjBmr.f'

    if (!user) {
      await bcrypt.compare(password, FAKE_HASH) // timing-safe
      return NextResponse.json(
        { error: 'Email və ya şifrə yanlışdır' },
        { status: 401, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    if (!ADMIN_ROLES.includes(user.role as AdminRole)) {
      await bcrypt.compare(password, FAKE_HASH) // timing-safe
      return NextResponse.json({ error: 'Email və ya şifrə yanlışdır' }, { status: 401 })
    }

    if (!user.passwordHash) {
      return NextResponse.json({ error: 'Email və ya şifrə yanlışdır' }, { status: 401 })
    }

    const isValid = await bcrypt.compare(password, user.passwordHash)
    if (!isValid) {
      return NextResponse.json(
        { error: 'Email və ya şifrə yanlışdır' },
        { status: 401, headers: { 'X-RateLimit-Remaining': String(remaining) } }
      )
    }

    if (user.isBlocked) {
      return NextResponse.json({ error: 'Hesabınız bloklanmışdır. Əlaqə saxlayın.' }, { status: 403 })
    }

    if (!user.isActive) {
      return NextResponse.json({ error: 'Hesabınız aktiv deyil.' }, { status: 403 })
    }

    // lastLoginAt yenilə (fire-and-forget)
    db.update(users).set({ lastLoginAt: new Date() }).where(eq(users.id, user.id)).catch(() => {})

    const fullName = [user.firstName, user.lastName].filter(Boolean).join(' ').trim() || user.email
    const role = user.role as AdminRole

    const token = await signAdminToken({ sub: user.id, email: user.email, name: fullName, role })

    const response = NextResponse.json({
      success: true,
      user: { id: user.id, email: user.email, name: fullName, role, type: 'admin' as const },
    })

    response.cookies.set(COOKIE_ADMIN, token, cookieOptions)
    // Köhnə cookie-ləri sil
    response.cookies.delete('og_admin')
    response.cookies.delete('og_auth')

    return response
  } catch (err) {
    logger.error('[admin/login] error:', { error: err })

    // Env fallback — DB yoxdursa
    const envEmail = process.env.ADMIN_EMAIL
    const envHash = process.env.ADMIN_PASSWORD_HASH
    if (envEmail && envHash && normalizedEmail === envEmail.toLowerCase()) {
      const valid = await bcrypt.compare(password, envHash)
      if (valid) {
        // ✅ UUID formatında ID istifadə et
        const token = await signAdminToken({
          sub: DEV_ADMIN_UUID,
          email: envEmail,
          name: process.env.ADMIN_NAME ?? 'Admin',
          role: 'ADMIN',
        })
        const res = NextResponse.json({
          success: true,
          user: {
            id: DEV_ADMIN_UUID,
            email: envEmail,
            name: process.env.ADMIN_NAME ?? 'Admin',
            role: 'ADMIN' as AdminRole,
            type: 'admin' as const,
          },
        })
        res.cookies.set(COOKIE_ADMIN, token, cookieOptions)
        return res
      }
    }

    return NextResponse.json({ error: 'Server xətası baş verdi.' }, { status: 500 })
  }
}

export function GET() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export function PUT() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }
export function DELETE() { return NextResponse.json({ error: 'Method not allowed' }, { status: 405 }) }