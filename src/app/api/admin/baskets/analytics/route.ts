// src/app/api/admin/baskets/analytics/route.ts
// Admin Baskets Analytics API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { baskets, orderItems, orders } from '@/lib/db/schema'
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '7d'
    
    // Calculate date range based on period
    const now = new Date()
    let startDate: Date
    
    switch (period) {
      case '1d':
        startDate = new Date(now.setHours(now.getHours() - 24))
        break
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90))
        break
      case '1y':
        startDate = new Date(now.setFullYear(now.getFullYear() - 1))
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 7))
    }

    // Parallel queries for performance
    const [
      totalBasketsResult,
      totalBasketSalesResult,
      basketTypeDistributionResult,
      topBasketsResult,
      lowStockBasketsResult,
      basketSalesByTypeResult,
    ] = await Promise.all([
      // Total Baskets
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(baskets)
        .where(eq(baskets.isActive, true)),
      
      // Total Basket Sales Revenue
      db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${orderItems.subtotal} AS DECIMAL)), '0')` })
        .from(orderItems)
        .innerJoin(orders, and(
          eq(orderItems.orderId, orders.id),
          eq(orders.status, 'DELIVERED'),
          gte(orders.createdAt, startDate)
        ))
        .where(sql`${orderItems.basketId} IS NOT NULL`),
      
      // Basket Type Distribution
      db
        .select({
          type: baskets.type,
          count: sql<number>`COUNT(*)`,
          totalStock: sql<number>`SUM(${baskets.stock})`,
        })
        .from(baskets)
        .where(eq(baskets.isActive, true))
        .groupBy(baskets.type),
      
      // Top Selling Baskets
      db
        .select({
          basketId: orderItems.basketId,
          basketName: orderItems.basketName,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
          totalRevenue: sql<string>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        })
        .from(orderItems)
        .innerJoin(orders, and(
          eq(orderItems.orderId, orders.id),
          eq(orders.status, 'DELIVERED'),
          gte(orders.createdAt, startDate)
        ))
        .where(sql`${orderItems.basketId} IS NOT NULL`)
        .groupBy(orderItems.basketId, orderItems.basketName)
        .orderBy(desc(sql<number>`SUM(${orderItems.qty})`))
        .limit(10),
      
      // Low Stock Baskets
      (db.query as any).baskets.findMany({
        where: and(
          eq(baskets.isActive, true),
          sql`${baskets.stock} <= 10`
        ),
        orderBy: [baskets.stock],
        limit: 10,
      }),
      
      // Basket Sales by Type
      db
        .select({
          basketType: baskets.type,
          totalRevenue: sql<string>`COALESCE(SUM(CAST(${orderItems.subtotal} AS DECIMAL)), '0')`,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
        })
        .from(orderItems)
        .innerJoin(baskets, eq(orderItems.basketId, baskets.id))
        .innerJoin(orders, and(
          eq(orderItems.orderId, orders.id),
          eq(orders.status, 'DELIVERED'),
          gte(orders.createdAt, startDate)
        ))
        .groupBy(baskets.type),
    ])

    // Get basket details for top selling baskets
    const topBasketIds = topBasketsResult.map((b: any) => b.basketId).filter(Boolean) as string[]
    const topBasketDetails = topBasketIds.length > 0
      ? await (db.query as any).baskets.findMany({
          where: inArray(baskets.id, topBasketIds),
          with: {
            variants: true,
          },
        })
      : []

    // Enrich top baskets with details
    const enrichedTopBaskets = topBasketsResult.map((basket: any) => {
      const details = topBasketDetails.find((d: any) => d.id === basket.basketId)
      return {
        ...basket,
        details: details || null,
      }
    })

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        totalBaskets: totalBasketsResult[0]?.count || 0,
        totalBasketRevenue: totalBasketSalesResult[0]?.total || '0',
      },
      basketTypeDistribution: basketTypeDistributionResult,
      topBaskets: enrichedTopBaskets,
      lowStockBaskets: lowStockBasketsResult,
      basketSalesByType: basketSalesByTypeResult,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Baskets analytics error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
