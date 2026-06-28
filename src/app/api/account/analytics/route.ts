// src/app/api/account/analytics/route.ts
// İstifadəçi analitikası

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { eq, and, gte, sql } from 'drizzle-orm'

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

    const { searchParams } = new URL(req.url)
    const period = searchParams.get('period') || 'all'

    let dateFilter
    const now = new Date()
    if (period === 'month') {
      dateFilter = gte(orders.createdAt, new Date(now.setMonth(now.getMonth() - 1)))
    } else if (period === 'year') {
      dateFilter = gte(orders.createdAt, new Date(now.setFullYear(now.getFullYear() - 1)))
    }

    const whereClause = dateFilter ? and(eq(orders.userId, payload.sub), dateFilter) : eq(orders.userId, payload.sub)

    const [user] = await db
      .select({
        totalOrders: users.totalOrders,
        loyaltyPoints: users.loyaltyPoints,
      })
      .from(users)
      .where(eq(users.id, payload.sub))
      .limit(1)

    const ordersResult = await db
      .select({
        total: sql<string>`SUM(CAST(${orders.total} AS DECIMAL))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(whereClause)

    const totalSpent = ordersResult[0]?.total || '0'
    const orderCount = ordersResult[0]?.count || 0

    return NextResponse.json({
      analytics: {
        totalOrders: user?.totalOrders || 0,
        loyaltyPoints: user?.loyaltyPoints || 0,
        totalSpent,
        orderCount,
      },
    })
  } catch (error) {
    console.error('[account/analytics] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
