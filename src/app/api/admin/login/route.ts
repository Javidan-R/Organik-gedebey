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

/**
 * ROOT CAUSE FIX: Əvvəllər bu UUID ilə YALNIZ JWT imzalanırdı, `users`
 * cədvəlində qarşılığı yaradılmırdı. Nəticədə bu ID-ni `created_by`/`user_id`
 * kimi FK sütunlarına yazan HƏR ƏMƏLİYYAT (inventory_logs, admin_logs,
 * expenses və s.) `foreign key constraint` xətası ilə uğursuz olurdu.
 *
 * BUGFIX #2 (bu funksiyanın özündə): sadəcə `id`-yə görə `onConflictDoNothing`
 * kifayət deyil — `src/lib/db/seed.ts` HƏMİN EYNİ email ilə (`admin@organikgedebey.az`)
 * amma FƏRQLİ, təsadüfi UUID ilə admin sətri yarada bilər. Bu halda `id`
 * üzrə heç bir konflikt olmasa da, `users.email` UNIQUE indeksinə görə
 * insert rədd edilir (23505). Ona görə əvvəlcə EMAIL-ə görə axtarırıq və
 * artıq mövcud olan real sətri istifadə edirik — yalnız HEÇ BİR sətir
 * tapılmadıqda fix UUID ilə yeni sətir yaradırıq.
 *
 * Qaytarılan `id` DEV_ADMIN_UUID-dən FƏRQLİ ola bilər (seed.ts-in yaratdığı
 * sətir varsa) — bu normaldır və düzgündür: token HƏMİŞƏ faktiki DB sətrinə
 * uyğun `id` daşımalıdır, sabit UUID-ə deyil.
 */
async function ensureSeedAdminExists(
  fixedId: string,
  email: string,
  name: string,
  tempPassword: string
): Promise<{ id: string; role: string }> {
  const { eq } = await import('drizzle-orm')

  const [existing] = await db
    .select({ id: users.id, role: users.role, isActive: users.isActive, isBlocked: users.isBlocked })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (existing) {
    if (existing.isBlocked) throw new Error(`Hesab (${email}) bloklanıb`)
    if (!existing.isActive) throw new Error(`Hesab (${email}) aktiv deyil`)
    return { id: existing.id, role: existing.role }
  }

  const [firstName, ...rest] = name.trim().split(/\s+/)
  const lastName = rest.join(' ') || 'Admin'
  const passwordHash = await bcrypt.hash(tempPassword, 10)

  await db
    .insert(users)
    .values({
      id: fixedId,
      email,
      passwordHash,
      firstName: firstName || 'Dev',
      lastName,
      role: 'ADMIN',
      isEmailVerified: true,
      isActive: true,
      isBlocked: false,
    })
    .onConflictDoNothing({ target: users.id })

  // Race-condition qorunması: paralel sorğu artıq bu email/ID ilə sətir
  // yaratmış ola bilər — hər halda son vəziyyəti DB-dən yenidən oxuyuruq.
  const [final] = await db
    .select({ id: users.id, role: users.role })
    .from(users)
    .where(eq(users.email, email))
    .limit(1)

  if (!final) throw new Error(`Dev admin sətri yaradılandan sonra tapılmadı (${email})`)
  return { id: final.id, role: final.role }
}

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
      // ✅ ROOT CAUSE FIX: token verilməzdən əvvəl DB-də real sətir təmin
      // olunur. Qaytarılan `id`/`role` DEV_ADMIN_UUID-dən fərqli ola bilər
      // (seed.ts artıq bu email ilə sətir yaratmışdırsa) — bu gözləniləndir.
      let resolved: { id: string; role: string }
      try {
        resolved = await ensureSeedAdminExists(DEV_ADMIN_UUID, devEmail, 'Dev Admin', devPass)
      } catch (seedError) {
        logger.error('[admin/login] Dev admin seed uğursuz oldu:', { error: seedError })
        const message = seedError instanceof Error ? seedError.message : 'Naməlum xəta'
        return NextResponse.json(
          { error: `Dev admin hesabı hazırlana bilmədi: ${message}` },
          { status: 500 }
        )
      }

      if (!ADMIN_ROLES.includes(resolved.role as AdminRole)) {
        return NextResponse.json(
          { error: `Hesab (${devEmail}) admin rolunda deyil (${resolved.role})` },
          { status: 403 }
        )
      }

      const token = await signAdminToken({
        sub: resolved.id,
        email: devEmail,
        name: 'Dev Admin',
        role: resolved.role as AdminRole,
      })
      const res = NextResponse.json({
        success: true,
        user: {
          id: resolved.id,
          email: devEmail,
          name: 'Dev Admin',
          role: resolved.role as AdminRole,
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
    //
    // ⚠️ QEYD: bu blok yalnız DB SORĞUSU İSTİSNA ATDIQDA işə düşür (yəni DB
    // artıq əlçatan deyil). Belə vəziyyətdə `ensureSeedAdminExists` də
    // uğursuz olacaq, çünki o da eyni DB-yə yazır. Bu, DIZAYN QÜSURU DEYİL —
    // DB tamamilə əlçatmaz olduqda, order status dəyişikliyi kimi HƏR
    // YAZMA ƏMƏLİYYATI onsuz da mümkün deyil. Bu fallback yalnız DB
    // qayıtdıqdan sonra normal DB-təsdiqli login-ə keçid üçün keçici
    // "diaqnostika" girişidir; onunla verilən token DB bərpa olmadan
    // FK tələb edən heç bir yazma əməliyyatını yerinə yetirə bilməyəcək.
    const envEmail = process.env.ADMIN_EMAIL
    const envHash = process.env.ADMIN_PASSWORD_HASH
    if (envEmail && envHash && normalizedEmail === envEmail.toLowerCase()) {
      const valid = await bcrypt.compare(password, envHash)
      if (valid) {
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