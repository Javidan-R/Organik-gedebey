// src/app/api/account/orders/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'

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
    const limit = parseInt(searchParams.get('limit') || '10')
    const offset = parseInt(searchParams.get('offset') || '0')

    const userOrders = await (db.query as any).orders.findMany({
      where: eq(orders.userId, payload.sub),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    })

    return NextResponse.json({ orders: userOrders })
  } catch (error) {
    console.error('[account/orders] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}