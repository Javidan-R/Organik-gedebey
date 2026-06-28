// src/app/api/admin/products/[id]/analytics/route.ts
// Product Analytics API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { orderItems, orders, reviews, productVariants, products } from '@/lib/db/schema'
import { eq, desc, and, gte, lte, sql } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params
    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30' // days

    const daysAgo = parseInt(period)
    const startDate = new Date()
    startDate.setDate(startDate.getDate() - daysAgo)

    // Get product info
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        variants: true,
        reviews: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    // Calculate total orders and revenue
    const orderStats = await db
      .select({
        totalOrders: sql<number>`count(*)`,
        totalQuantity: sql<number>`sum(${orderItems.quantity})`,
        totalRevenue: sql<string>`sum(${orderItems.price} * ${orderItems.quantity})`,
      })
      .from(orderItems)
      .where(
        and(
          eq(orderItems.productId, id),
          gte(orders.createdAt, startDate)
        )
      )
      .leftJoin(orders, eq(orderItems.orderId, orders.id))

    const stats = orderStats[0] || { totalOrders: 0, totalQuantity: 0, totalRevenue: '0' }

    // Calculate sales for different periods
    const salesLast7Days = await getSalesForPeriod(db, id, 7)
    const salesLast30Days = await getSalesForPeriod(db, id, 30)
    const salesLast90Days = await getSalesForPeriod(db, id, 90)

    // Calculate sales trend
    const salesTrend = calculateSalesTrend(salesLast7Days, salesLast30Days)

    // Review statistics
    const totalReviews = product.reviews?.length || 0
    const approvedReviews = product.reviews?.filter((r: any) => r.isApproved).length || 0
    const pendingReviews = product.reviews?.filter((r: any) => !r.isApproved).length || 0
    const averageRating = totalReviews > 0
      ? product.reviews?.reduce((sum: number, r: any) => sum + r.rating, 0) / totalReviews
      : 0

    // Stock statistics
    const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
    const lowStockVariants = product.variants?.filter((v: any) => (v.stock || 0) < (v.minStock || 10)).length || 0
    const outOfStockVariants = product.variants?.filter((v: any) => (v.stock || 0) === 0).length || 0

    // Calculate average order value
    const averageOrderValue = stats.totalOrders > 0
      ? (parseFloat(stats.totalRevenue) / stats.totalOrders).toFixed(2)
      : '0'

    // View count
    const viewCount = product.viewCount || 0

    // Calculate conversion rate (simplified)
    const conversionRate = viewCount > 0 ? ((stats.totalOrders / viewCount) * 100).toFixed(2) : '0'

    // Calculate popularity rank (simplified - based on recent sales)
    const popularityRank = await calculatePopularityRank(db, id, salesLast30Days)

    const analytics = {
      productId: id,
      productName: product.name,
      // Sales metrics
      totalOrders: Number(stats.totalOrders),
      totalQuantitySold: Number(stats.totalQuantity),
      totalRevenue: stats.totalRevenue,
      averageOrderValue,
      // View metrics
      viewCount,
      uniqueViews: viewCount, // Simplified
      conversionRate: parseFloat(conversionRate),
      // Rating metrics
      averageRating: parseFloat(averageRating.toFixed(1)),
      totalReviews,
      approvedReviews,
      pendingReviews,
      // Stock metrics
      totalStock,
      lowStockVariants,
      outOfStockVariants,
      // Time-based metrics
      salesLast7Days,
      salesLast30Days,
      salesLast90Days,
      // Trend
      salesTrend,
      popularityRank,
    }

    return NextResponse.json({ analytics })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product analytics GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

async function getSalesForPeriod(db: any, productId: string, days: number): Promise<number> {
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - days)

  const result = await db
    .select({
      total: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .where(
      and(
        eq(orderItems.productId, productId),
        gte(orders.createdAt, startDate)
      )
    )
    .leftJoin(orders, eq(orderItems.orderId, orders.id))

  return Number(result[0]?.total || 0)
}

function calculateSalesTrend(last7Days: number, last30Days: number): 'up' | 'down' | 'stable' {
  if (last7Days === 0 && last30Days === 0) return 'stable'
  if (last7Days > last30Days / 4) return 'up'
  if (last7Days < last30Days / 4) return 'down'
  return 'stable'
}

async function calculatePopularityRank(db: any, productId: string, salesLast30Days: number): Promise<number> {
  // Simplified ranking based on sales
  const allProductSales = await db
    .select({
      productId: orderItems.productId,
      totalSales: sql<number>`sum(${orderItems.quantity})`,
    })
    .from(orderItems)
    .where(
      gte(orders.createdAt, new Date(Date.now() - 30 * 24 * 60 * 60 * 1000))
    )
    .leftJoin(orders, eq(orderItems.orderId, orders.id))
    .groupBy(orderItems.productId)
    .orderBy(desc(sql`sum(${orderItems.quantity})`))

  const rank = allProductSales.findIndex((item: any) => item.productId === productId) + 1
  return rank > 0 ? rank : allProductSales.length + 1
}
