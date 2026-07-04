// src/app/api/admin/finance/payments/route.ts
// Admin Finance Payments API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { eq, gte, lte, sql, desc, and, or, like } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const method = searchParams.get('method')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const conditions = []
    if (status && status !== 'all') conditions.push(eq(orders.paymentStatus, status as 'UNPAID' | 'PAID' | 'PARTIALLY_REFUNDED' | 'REFUNDED'))
    if (method && method !== 'all') conditions.push(eq(orders.paymentMethod, method as 'CASH_ON_DELIVERY' | 'CARD' | 'BANK_TRANSFER'))
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)))
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(orders.createdAt, endDate))
    }
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )
      )
    }

    const offset = (page - 1) * limit

    const paymentsData = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    // Calculate payment statistics
    const paymentStats = await db
      .select({
        paymentStatus: orders.paymentStatus,
        total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), '0')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orders.paymentStatus)

    const methodStats = await db
      .select({
        paymentMethod: orders.paymentMethod,
        total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), '0')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(orders.paymentMethod)

    return NextResponse.json({
      payments: paymentsData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      paymentStats,
      methodStats,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance payments GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}