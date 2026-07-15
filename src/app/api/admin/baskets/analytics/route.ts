// src/app/api/admin/baskets/analytics/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  baskets,
  basketVariants,
  orderItems,
  orders,
} from '@/lib/db/schema';
import { eq, and, gte, sql, desc, inArray } from 'drizzle-orm';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '7d';

    // Tarix aralığını hesabla
    const now = new Date();
    let startDate: Date;

    switch (period) {
      case '1d':
        startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        break;
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(
          now.getFullYear() - 1,
          now.getMonth(),
          now.getDate()
        );
        break;
      default:
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    }

    // Paralel sorğular
    const [
      totalBasketsResult,
      totalBasketSalesResult,
      basketTypeDistributionResult,
      topBasketsResult,
      lowStockBasketsResult,
      basketSalesByTypeResult,
    ] = await Promise.all([
      // 1. Ümumi aktiv səbət sayı
      db
        .select({ count: sql<number>`COUNT(*)` })
        .from(baskets)
        .where(eq(baskets.isActive, true)),

      // 2. Səbət satış gəliri
      db
        .select({
          total: sql<string>`COALESCE(SUM(CAST(${orderItems.subtotal} AS DECIMAL)), '0')`,
        })
        .from(orderItems)
        .innerJoin(
          orders,
          and(
            eq(orderItems.orderId, orders.id),
            eq(orders.status, 'DELIVERED'),
            gte(orders.createdAt, startDate)
          )
        )
        .where(sql`${orderItems.basketId} IS NOT NULL`),

      // 3. Səbət növünə görə paylanma
      db
        .select({
          type: baskets.type,
          count: sql<number>`COUNT(*)`,
          totalStock: sql<number>`SUM(${baskets.stock})`,
        })
        .from(baskets)
        .where(eq(baskets.isActive, true))
        .groupBy(baskets.type),

      // 4. Ən çox satılan səbətlər (ilk 10)
      db
        .select({
          basketId: orderItems.basketId,
          basketName: orderItems.basketName,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
          totalRevenue: sql<string>`SUM(CAST(${orderItems.subtotal} AS DECIMAL))`,
        })
        .from(orderItems)
        .innerJoin(
          orders,
          and(
            eq(orderItems.orderId, orders.id),
            eq(orders.status, 'DELIVERED'),
            gte(orders.createdAt, startDate)
          )
        )
        .where(sql`${orderItems.basketId} IS NOT NULL`)
        .groupBy(orderItems.basketId, orderItems.basketName)
        .orderBy(desc(sql<number>`SUM(${orderItems.qty})`))
        .limit(10),

      // 5. Az stoklu səbətlər (stok ≤ 10)
      db
        .select({
          id: baskets.id,
          name: baskets.name,
          slug: baskets.slug,
          stock: baskets.stock,
          type: baskets.type,
          discount: baskets.discount,
          bestseller: baskets.bestseller,
          trending: baskets.trending,
          new: baskets.new,
          isActive: baskets.isActive,
          createdAt: baskets.createdAt,
        })
        .from(baskets)
        .where(
          and(
            eq(baskets.isActive, true),
            sql`${baskets.stock} <= 10`
          )
        )
        .orderBy(baskets.stock)
        .limit(10),

      // 6. Səbət növünə görə satış
      db
        .select({
          basketType: baskets.type,
          totalRevenue: sql<string>`COALESCE(SUM(CAST(${orderItems.subtotal} AS DECIMAL)), '0')`,
          totalSold: sql<number>`SUM(${orderItems.qty})`,
        })
        .from(orderItems)
        .innerJoin(baskets, eq(orderItems.basketId, baskets.id))
        .innerJoin(
          orders,
          and(
            eq(orderItems.orderId, orders.id),
            eq(orders.status, 'DELIVERED'),
            gte(orders.createdAt, startDate)
          )
        )
        .groupBy(baskets.type),
    ]);

    // Ən çox satılan səbətlərin detallarını çək
    const topBasketIds = topBasketsResult
      .map((b: any) => b.basketId)
      .filter(Boolean) as string[];

    let topBasketDetails: any[] = [];
    if (topBasketIds.length > 0) {
      topBasketDetails = await db
        .select()
        .from(baskets)
        .where(inArray(baskets.id, topBasketIds));

      // Variantları da əlavə et
      const topVariantData = await db
        .select()
        .from(basketVariants)
        .where(inArray(basketVariants.basketId, topBasketIds));

      // Variantları uyğun basketə bağla
      topBasketDetails = topBasketDetails.map((b) => ({
        ...b,
        variants: topVariantData.filter((v) => v.basketId === b.id),
      }));
    }

    // Top basket nəticələrini detallarla zənginləşdir
    const enrichedTopBaskets = topBasketsResult.map((basket: any) => {
      const details = topBasketDetails.find((d) => d.id === basket.basketId);
      return { ...basket, details: details || null };
    });

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
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error('Baskets analytics error', error);
    return NextResponse.json(
      { error: 'Server xətası' },
      { status: 500 }
    );
  }
}