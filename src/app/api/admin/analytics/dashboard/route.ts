// src/app/api/admin/analytics/dashboard/route.ts
// Admin Dashboard Analytics API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders, products, users, orderItems } from '@/lib/db/schema'
import { eq, and, gte, sql, desc } from 'drizzle-orm'

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
      totalRevenueResult,
      totalOrdersResult,
      totalUsersResult,
      totalProductsResult,
      recentOrdersResult,
      topProductsResult,
      lowStockResult,
      ordersByStatusResult,
    ] = await Promise.all([
      // Total Revenue
      db
        .select({ total: sql<string>`COALESCE(SUM(CAST(${orders.total} AS DECIMAL)), '0')` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startDate),
            eq(orders.status, 'DELIVERED')
          )
        ),
      
      // Total Orders
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(orders)
        .where(gte(orders.createdAt, startDate)),
      
      // Total Users
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(users)
        .where(gte(users.createdAt, startDate)),
      
      // Total Products
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(products)
        .where(eq(products.archived, false)),
      
      // Recent Orders
      (db.query as any).orders.findMany({
        where: gte(orders.createdAt, startDate),
        with: {
          user: {
            columns: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
            },
          },
          items: {
            columns: {
              id: true,
              qty: true,
              subtotal: true,
            },
          },
        },
        orderBy: [desc(orders.createdAt)],
        limit: 10,
      }),
      
      // Top Products by Sales
      db
        .select({
          productId: orderItems.productId,
          productName: orderItems.productName,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
          totalRevenue: sql<string>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        })
        .from(orderItems)
        .innerJoin(orders, eq(orderItems.orderId, orders.id))
        .where(
          and(
            gte(orders.createdAt, startDate),
            eq(orders.status, 'DELIVERED')
          )
        )
        .groupBy(orderItems.productId, orderItems.productName)
        .orderBy(desc(sql<number>`SUM(${orderItems.qty})`))
        .limit(10),
      
      // Low Stock Products
      (db.query as any).products.findMany({
        with: {
          variants: {
            columns: {
              id: true,
              name: true,
              stock: true,
              minStock: true,
            },
          },
        },
        where: eq(products.archived, false),
        limit: 10,
      }),
      
      // Orders by Status
      db
        .select({
          status: orders.status,
          count: sql<number>`COUNT(*)`,
          total: sql<string>`SUM(CAST(${orders.total} AS DECIMAL))`,
        })
        .from(orders)
        .where(gte(orders.createdAt, startDate))
        .groupBy(orders.status),
    ])

    // Process low stock products
    const lowStockProducts = totalProductsResult.length > 0 
      ? lowStockResult
          .filter((p: any) => p.variants.some((v: any) => v.stock <= v.minStock))
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            lowStockVariants: p.variants.filter((v: any) => v.stock <= v.minStock),
          }))
      : []

    // Calculate average order value
    const totalRevenue = totalRevenueResult[0]?.total || '0'
    const totalOrders = totalOrdersResult[0]?.count || 0
    const avgOrderValue = totalOrders > 0 
      ? (parseFloat(totalRevenue) / totalOrders).toFixed(2)
      : '0'

    return NextResponse.json({
      period,
      dateRange: {
        start: startDate.toISOString(),
        end: new Date().toISOString(),
      },
      metrics: {
        totalRevenue,
        totalOrders,
        totalUsers: totalUsersResult[0]?.count || 0,
        totalProducts: totalProductsResult[0]?.count || 0,
        avgOrderValue,
      },
      recentOrders: recentOrdersResult,
      topProducts: topProductsResult,
      lowStockProducts,
      ordersByStatus: ordersByStatusResult,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Dashboard analytics error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
