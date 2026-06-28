// src/app/api/account/security/route.ts
// İstifadəçi təhlükəsizlik ayarları

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import bcrypt from 'bcryptjs'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        phone: users.phone,
        lastLoginAt: users.lastLoginAt,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    return NextResponse.json({
      security: {
        email: user?.email,
        phone: user?.phone,
        lastLoginAt: user?.lastLoginAt,
      },
    })
  } catch (error) {
    console.error('[account/security] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { currentPassword, newPassword } = body

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Cari və yeni şifrə tələb olunur' }, { status: 400 })
    }

    const [user] = await db
      .select({ passwordHash: users.passwordHash })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    if (!user?.passwordHash) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash)
    if (!valid) {
      return NextResponse.json({ error: 'Cari şifrə yanlışdır' }, { status: 401 })
    }

    const newPasswordHash = await bcrypt.hash(newPassword, 12)

    await db.update(users).set({ passwordHash: newPasswordHash }).where(eq(users.id, payload.sub))

    return NextResponse.json({ success: true, message: 'Şifrə uğurla dəyişdirildi' })
  } catch (error) {
    console.error('[account/security] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
