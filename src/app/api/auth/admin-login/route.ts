// app/api/auth/admin-login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'

// Fallback credentials — DB olmasa da işləyir
// Production-da bu dəyərləri .env-ə köçürün:
//   ADMIN_EMAIL=admin@organikgedebey.az
//   ADMIN_PASSWORD_HASH=bcrypt_hash_here
const FALLBACK_ADMINS = [
  {
    email: 'admin@organikgedebey.az',
    // bcrypt hash of "admin123" — production-da dəyişin
    passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    name: 'Admin',
    role: 'admin',
  },
  {
    email: 'superadmin@organikgedebey.az',
    passwordHash: '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    name: 'Super Admin',
    role: 'superadmin',
  },
]

// Brute-force qorunması üçün sadə rate-limit (memory-based)
const loginAttempts = new Map<string, { count: number; resetAt: number }>()

function isRateLimited(ip: string): boolean {
  const now = Date.now()
  const entry = loginAttempts.get(ip)
  if (!entry || entry.resetAt < now) {
    loginAttempts.set(ip, { count: 1, resetAt: now + 15 * 60 * 1000 }) // 15 dəq
    return false
  }
  if (entry.count >= 10) return true
  entry.count++
  return false
}

export async function POST(req: NextRequest) {
  try {
    // IP götür (proxy arxasında X-Forwarded-For)
    const ip =
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ??
      req.headers.get('x-real-ip') ??
      'unknown'

    if (isRateLimited(ip)) {
      return NextResponse.json(
        { error: 'Çox sayda uğursuz cəhd. 15 dəqiqə gözləyin.' },
        { status: 429 }
      )
    }

    const body = await req.json().catch(() => null)
    if (!body?.email || !body?.password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      )
    }

    const { email, password } = body as { email: string; password: string }

    // 1. DB-dən yoxla (mövcuddursa)
    let authenticated = false
    let userName = 'Admin'
    let userRole = 'admin'

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
          passwordHash: users.passwordHash,
          role: users.role,
          isActive: users.isActive,
          isBlocked: users.isBlocked,
        })
        .from(users)
        .where(eq(users.email, email.toLowerCase().trim()))
        .limit(1)

      if (user && user.passwordHash) {
        const valid = await bcrypt.compare(password, user.passwordHash)
        if (valid && user.isActive && !user.isBlocked) {
          const isAdmin = ['admin', 'superadmin', 'ADMIN', 'SUPERADMIN'].includes(user.role)
          if (isAdmin) {
            authenticated = true
            userName = `${user.firstName} ${user.lastName}`.trim()
            userRole = user.role
            // son giriş vaxtını yenilə
            await db
              .update(users)
              .set({ lastLoginAt: new Date() })
              .where(eq(users.id, user.id))
              .catch(() => {})
          } else {
            return NextResponse.json(
              { error: 'Bu hesabın admin girişi icazəsi yoxdur' },
              { status: 403 }
            )
          }
        }
      }
    } catch {
      // DB xəta — fallback-ə keç
    }

    // 2. DB olmadıqda fallback credentials
    if (!authenticated) {
      const fallback = FALLBACK_ADMINS.find(
        a => a.email.toLowerCase() === email.toLowerCase().trim()
      )
      if (fallback) {
        const valid = await bcrypt.compare(password, fallback.passwordHash)
        if (valid) {
          authenticated = true
          userName = fallback.name
          userRole = fallback.role
        }
      }
    }

    // 3. Env-dən credentials (production üçün tövsiyə olunan)
    if (!authenticated) {
      const envEmail = process.env.ADMIN_EMAIL
      const envHash = process.env.ADMIN_PASSWORD_HASH
      if (
        envEmail &&
        envHash &&
        email.toLowerCase().trim() === envEmail.toLowerCase()
      ) {
        const valid = await bcrypt.compare(password, envHash)
        if (valid) {
          authenticated = true
          userName = 'Admin'
          userRole = 'admin'
        }
      }
    }

    if (!authenticated) {
      return NextResponse.json(
        { error: 'Email və ya şifrə yanlışdır' },
        { status: 401 }
      )
    }

    // Uğurlu giriş — cookie-ləri yarat
    const response = NextResponse.json({
      success: true,
      user: { name: userName, role: userRole },
      message: 'Uğurlu giriş',
    })

    const isProduction = process.env.NODE_ENV === 'production'
    const cookieOpts = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 8, // 8 saat
    }

    // Middleware-in gözlədiyi cookie
    response.cookies.set('og_admin', 'ok', cookieOpts)
    // Əlavə istifadəçi məlumatları
    response.cookies.set(
      'og_auth',
      JSON.stringify({ email, role: userRole, name: userName }),
      cookieOpts
    )

    return response
  } catch (error) {
    console.error('[admin-login] Error:', error)
    return NextResponse.json({ error: 'Server xətası baş verdi' }, { status: 500 })
  }
}