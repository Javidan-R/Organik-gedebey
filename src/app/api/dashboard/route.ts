// src/app/api/admin/dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  products,
  productVariants,
  categories,
  users,
} from '@/lib/db/schema';
import { eq, and, gte, lte, sql, inArray, sum, count, avg, desc } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';

// ─── Köməkçi: Tarix aralığını hesabla ─────────────────────────────────
function getDateRange(period: string, start?: string, end?: string): { startDate: Date; endDate: Date; previousStart: Date; previousEnd: Date } {
  const now = new Date();
  let startDate: Date;
  let endDate: Date;

  switch (period) {
    case 'yesterday': {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 1);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(startDate);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'last7days': {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 6);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'last30days': {
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 29);
      startDate.setHours(0, 0, 0, 0);
      break;
    }
    case 'thisMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'lastMonth': {
      startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      endDate = new Date(now.getFullYear(), now.getMonth(), 0);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'thisYear': {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    case 'custom': {
      if (!start || !end) throw new Error('Custom range requires start and end');
      startDate = new Date(start);
      endDate = new Date(end);
      endDate.setHours(23, 59, 59, 999);
      break;
    }
    default: // today
      startDate = new Date(now);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(now);
      endDate.setHours(23, 59, 59, 999);
      break;
  }

  // Əvvəlki dövr (məsələn, öncəki həftə)
  const duration = endDate.getTime() - startDate.getTime();
  const previousEnd = new Date(startDate.getTime() - 1);
  const previousStart = new Date(previousEnd.getTime() - duration);

  return { startDate, endDate, previousStart, previousEnd };
}

// ─── GET /api/admin/dashboard ────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'today';
    const customStart = searchParams.get('start') || undefined;
    const customEnd = searchParams.get('end') || undefined;

    const { startDate, endDate, previousStart, previousEnd } = getDateRange(period, customStart, customEnd);

    // ─── 1. Sifariş xülasəsi (cari dövr) ────────────────────────────
    const currentOrdersStats = await db
      .select({
        totalOrders: count(orders.id),
        totalRevenue: sum(orders.total).mapWith(Number),
        totalDiscount: sum(orders.discountAmount).mapWith(Number),
        totalDeliveryFee: sum(orders.deliveryFee).mapWith(Number),
        avgOrderValue: avg(orders.total).mapWith(Number),
        completedOrders: count(sql`CASE WHEN ${orders.status} = 'DELIVERED' THEN 1 END`),
        cancelledOrders: count(sql`CASE WHEN ${orders.status} = 'CANCELLED' THEN 1 END`),
        pendingOrders: count(sql`CASE WHEN ${orders.status} = 'PENDING' THEN 1 END`),
        returnedOrders: count(sql`CASE WHEN ${orders.status} = 'REFUNDED' THEN 1 END`),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .then(rows => rows[0]);

    // ─── 2. Ən çox satılan məhsullar (cari dövr) ─────────────────
    const topProducts = await db
      .select({
        productId: orderItems.productId,
        productName: sql<string>`MAX(${orderItems.productName})`,
        totalQty: sum(orderItems.qty).mapWith(Number),
        totalRevenue: sum(orderItems.subtotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(orderItems.productId)
      .orderBy(desc(sum(orderItems.qty)))
      .limit(10);

    // ─── 3. Kateqoriya üzrə gəlir ─────────────────────────────────
    const topCategories = await db
      .select({
        categoryId: categories.id,
        categoryName: categories.name,
        totalRevenue: sum(orderItems.subtotal).mapWith(Number),
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .innerJoin(products, eq(orderItems.productId, products.id))
      .innerJoin(categories, eq(products.categoryId, categories.id))
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(categories.id, categories.name)
      .orderBy(desc(sum(orderItems.subtotal)))
      .limit(10);

    // ─── 4. Müştəri seqmentasiyası ────────────────────────────────
    const customerSegments = await db
      .select({
        newCustomers: count(sql`CASE WHEN u."created_at" >= ${startDate} THEN 1 END`),
        returningCustomers: count(sql`CASE WHEN u."created_at" < ${startDate} THEN 1 END`),
      })
      .from(users)
      .innerJoin(orders, eq(users.id, orders.userId))
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .then(rows => rows[0]);

    // ─── 5. Kritik stok məhsulları ────────────────────────────────
    const lowStockProducts = await db
      .select({
        productId: productVariants.productId,
        variantId: productVariants.id,
        variantName: productVariants.name,
        stock: productVariants.stock,
        minStock: productVariants.minStock,
        productName: sql<string>`${products.name}`,
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .where(lte(productVariants.stock, productVariants.minStock))
      .limit(15);

    // ─── 6. Saatlıq sifariş intensivliyi ─────────────────────────
    const ordersByHour = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})`,
        orderCount: count(orders.id),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);

    // ─── 7. Gündəlik gəlir (zaman seriyası) ──────────────────────
    const revenueByPeriod = await db
      .select({
        date: sql<string>`DATE(${orders.createdAt})`,
        revenue: sum(orders.total).mapWith(Number),
        orders: count(orders.id),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, startDate), lte(orders.createdAt, endDate)))
      .groupBy(sql`DATE(${orders.createdAt})`)
      .orderBy(sql`DATE(${orders.createdAt})`);

    // ─── 8. Əvvəlki dövr ilə müqayisə ───────────────────────────
    const previousStats = await db
      .select({
        totalRevenue: sum(orders.total).mapWith(Number),
        totalOrders: count(orders.id),
      })
      .from(orders)
      .where(and(gte(orders.createdAt, previousStart), lte(orders.createdAt, previousEnd)))
      .then(rows => rows[0]);

    // ─── 9. Ümumi inventar dəyəri ───────────────────────────────
    const inventoryValue = await db
      .select({
        totalValue: sum(sql`${productVariants.stock} * COALESCE(${productVariants.costPrice}, ${productVariants.basePrice})`).mapWith(Number),
      })
      .from(productVariants)
      .innerJoin(products, eq(productVariants.productId, products.id))
      .then(rows => rows[0]?.totalValue ?? 0);

    // ─── 10. KPI müqayisələri (artım/azalma faizləri) ─────────
    const currentRevenue = Number(currentOrdersStats?.totalRevenue ?? 0);
    const previousRevenue = Number(previousStats?.totalRevenue ?? 0);
    const revenueGrowth = previousRevenue > 0
      ? ((currentRevenue - previousRevenue) / previousRevenue) * 100
      : null;

    const currentOrders = Number(currentOrdersStats?.totalOrders ?? 0);
    const previousOrders = Number(previousStats?.totalOrders ?? 0);
    const orderGrowth = previousOrders > 0
      ? ((currentOrders - previousOrders) / previousOrders) * 100
      : null;

    // ─── Nəticə ─────────────────────────────────────────────────
    return NextResponse.json({
      summary: {
        totalOrders: currentOrdersStats?.totalOrders ?? 0,
        totalRevenue: currentRevenue,
        netProfit: currentRevenue - (Number(currentOrdersStats?.totalDiscount ?? 0)) - (Number(currentOrdersStats?.totalDeliveryFee ?? 0)),
        totalDiscount: Number(currentOrdersStats?.totalDiscount ?? 0),
        totalDeliveryFee: Number(currentOrdersStats?.totalDeliveryFee ?? 0),
        avgOrderValue: Number(currentOrdersStats?.avgOrderValue ?? 0),
        completedOrders: Number(currentOrdersStats?.completedOrders ?? 0),
        cancelledOrders: Number(currentOrdersStats?.cancelledOrders ?? 0),
        pendingOrders: Number(currentOrdersStats?.pendingOrders ?? 0),
        returnedOrders: Number(currentOrdersStats?.returnedOrders ?? 0),
        newCustomers: customerSegments?.newCustomers ?? 0,
        returningCustomers: customerSegments?.returningCustomers ?? 0,
        inventoryValue,
        lowStockCount: lowStockProducts.length,
      },
      revenueByPeriod,
      topProducts,
      topCategories,
      customerSegments,
      lowStockProducts,
      ordersByHour,
      kpiComparisons: {
        revenueGrowth,
        orderGrowth,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[dashboard] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}