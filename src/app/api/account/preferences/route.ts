// src/app/api/account/preferences/route.ts
// İstifadəçi üstünlükləri

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
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
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    return NextResponse.json({
      preferences: {
        firstName: user?.firstName,
        lastName: user?.lastName,
        phone: user?.phone,
        avatarUrl: user?.avatarUrl,
      },
    })
  } catch (error) {
    console.error('[account/preferences] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PUT(req: NextRequest) {
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
    const { firstName, lastName, phone, avatarUrl } = body

    const [updatedUser] = await db
      .update(users)
      .set({
        firstName: firstName || undefined,
        lastName: lastName || undefined,
        phone: phone || undefined,
        avatarUrl: avatarUrl || undefined,
      })
      .where(eq(users.id, payload.sub))
      .returning()

    return NextResponse.json({
      preferences: {
        firstName: updatedUser.firstName,
        lastName: updatedUser.lastName,
        phone: updatedUser.phone,
        avatarUrl: updatedUser.avatarUrl,
      },
    })
  } catch (error) {
    console.error('[account/preferences] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
