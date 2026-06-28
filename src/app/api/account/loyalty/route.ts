// src/app/api/account/loyalty/route.ts
// İstifadəçi sadiqlik proqramı

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
        loyaltyPoints: users.loyaltyPoints,
        totalOrders: users.totalOrders,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    // Sadiqlik səviyyəsini hesabla
    const points = user?.loyaltyPoints || 0
    let tier = 'BRONZE'
    if (points >= 1000) tier = 'SILVER'
    if (points >= 2500) tier = 'GOLD'
    if (points >= 5000) tier = 'PLATINUM'

    return NextResponse.json({
      loyalty: {
        points,
        tier,
        totalOrders: user?.totalOrders || 0,
        nextTier: tier === 'BRONZE' ? 'SILVER' : tier === 'SILVER' ? 'GOLD' : tier === 'GOLD' ? 'PLATINUM' : null,
        pointsToNext: tier === 'BRONZE' ? 1000 - points : tier === 'SILVER' ? 2500 - points : tier === 'GOLD' ? 5000 - points : 0,
      },
    })
  } catch (error) {
    console.error('[account/loyalty] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
