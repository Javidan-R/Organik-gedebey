// src/app/api/auth/me/route.ts
// Cari istifadəçi məlumatlarını qaytarır

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { customerCookieOptions } from '@/lib/auth/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ user: null })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ user: null })
    }

    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        phone: users.phone,
        role: users.role,
        isActive: users.isActive,
        isBlocked: users.isBlocked,
        avatarUrl: users.avatarUrl,
        loyaltyPoints: users.loyaltyPoints,
        totalOrders: users.totalOrders,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    if (!user) {
      return NextResponse.json({ user: null })
    }

    if (!user.isActive || user.isBlocked) {
      return NextResponse.json({ user: null })
    }

    const customerRole = user.role === 'COURIER' ? 'COURIER' : 'CUSTOMER'
    const name = `${user.firstName} ${user.lastName}`.trim()

    return NextResponse.json({
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
  } catch (error) {
    console.error('[auth/me] error:', error)
    return NextResponse.json({ user: null })
  }
}
