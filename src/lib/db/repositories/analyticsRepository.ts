// ============================================================
// src/lib/db/repositories/analyticsRepository.ts
// PHASE 1 — Aggregation queries (Drizzle) that populate the
// snapshot tables defined in src/lib/db/schema/analytics.ts
// ============================================================

import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  expenses,
  financePurchases,
  couponUsage,
  productVariants,
  products,
  categories,
 
} from '@/lib/db/schema';
import { and, eq, gte, lt, sql, inArray } from 'drizzle-orm';
import { categoryDailyStats, dailySnapshots, hourlySalesStats, productDailyStats } from '../schema/analytics';

// Statuslar ki, "gəlir" hesabına daxil edilir — ləğv/refund xaric.
const REVENUE_STATUSES = [
  'PENDING',
  'CONFIRMED',
  'PREPARING',
  'READY_FOR_DELIVERY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
] as const;

function dayRange(dateStr: string) {
  const start = new Date(dateStr);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

/**
 * Bir günün BÜTÜN snapshot cədvəllərini yenidən hesablayır və upsert edir.
 * Cron (Phase 2-də) və ya admin "Yenidən hesabla" düyməsi bunu çağırır.
 */
export async function recomputeDaySnapshot(dateStr: string) {
  const { start, end } = dayRange(dateStr);

  const [dailyRow] = await computeDailyAggregate(start, end);
  await upsertDailySnapshot(dateStr, dailyRow);

  const productRows = await computeProductAggregate(start, end);
  await upsertProductDailyStats(dateStr, productRows);

  const categoryRows = await computeCategoryAggregate(start, end);
  await upsertCategoryDailyStats(dateStr, categoryRows);

  const hourlyRows = await computeHourlyAggregate(start, end);
  await upsertHourlySalesStats(dateStr, hourlyRows);

  return { dateStr, orders: dailyRow?.ordersTotal ?? 0 };
}

// ────────────────────────────────────────────────────────────
// DAILY AGGREGATE
// ────────────────────────────────────────────────────────────
async function computeDailyAggregate(start: Date, end: Date) {
  return db
    .select({
      ordersTotal: sql<number>`COUNT(DISTINCT ${orders.id})`,
      ordersPending: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'PENDING')`,
      ordersConfirmed: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'CONFIRMED')`,
      ordersPreparing: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'PREPARING')`,
      ordersReadyForDelivery: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'READY_FOR_DELIVERY')`,
      ordersOutForDelivery: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'OUT_FOR_DELIVERY')`,
      ordersDelivered: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'DELIVERED')`,
      ordersCancelled: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'CANCELLED')`,
      ordersRefunded: sql<number>`COUNT(DISTINCT ${orders.id}) FILTER (WHERE ${orders.status} = 'REFUNDED')`,
      itemsSoldTotal: sql<number>`COALESCE(SUM(${orderItems.qty}) FILTER (WHERE ${orders.status} IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      grossRevenue: sql<string>`COALESCE(SUM(${orderItems.subtotal}) FILTER (WHERE ${orders.status} IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      cogsTotal: sql<string>`COALESCE(SUM(${orderItems.qty} * COALESCE(${orderItems.costAtOrder}, 0)) FILTER (WHERE ${orders.status} IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      discountTotal: sql<string>`COALESCE((SELECT SUM(${orders.discountAmount}) FROM ${orders} o2 WHERE o2.created_at >= ${start} AND o2.created_at < ${end} AND o2.status IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      couponDiscountTotal: sql<string>`COALESCE((SELECT SUM(${orders.couponDiscount}) FROM ${orders} o3 WHERE o3.created_at >= ${start} AND o3.created_at < ${end} AND o3.status IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      deliveryFeeTotal: sql<string>`COALESCE((SELECT SUM(${orders.deliveryFee}) FROM ${orders} o4 WHERE o4.created_at >= ${start} AND o4.created_at < ${end} AND o4.status IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      netRevenue: sql<string>`COALESCE((SELECT SUM(${orders.total}) FROM ${orders} o5 WHERE o5.created_at >= ${start} AND o5.created_at < ${end} AND o5.status IN ${sql.raw(
        `('${REVENUE_STATUSES.join("','")}')`
      )}), 0)`,
      customerCountTotal: sql<number>`(SELECT COUNT(DISTINCT COALESCE(o6.user_id::text, o6.customer_phone)) FROM ${orders} o6 WHERE o6.created_at >= ${start} AND o6.created_at < ${end})`,
    })
    .from(orders)
    .leftJoin(orderItems, eq(orderItems.orderId, orders.id))
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)));
}

async function upsertDailySnapshot(dateStr: string, row: any) {
  const expensesTotalRow = await db
    .select({ total: sql<string>`COALESCE(SUM(${expenses.amount}), 0)` })
    .from(expenses)
    .where(and(gte(expenses.date, dayRange(dateStr).start), lt(expenses.date, dayRange(dateStr).end)));

  const purchasesTotalRow = await db
    .select({ total: sql<string>`COALESCE(SUM(${financePurchases.unitCost} * ${financePurchases.qty}), 0)` })
    .from(financePurchases)
    .where(and(gte(financePurchases.date, dayRange(dateStr).start), lt(financePurchases.date, dayRange(dateStr).end)));

  // "Yeni müştəri" — bu tarixdən əvvəl heç sifariş verməmiş userId/telefon
  const newCustomerRow = await db.execute<{ new_count: number }>(sql`
    SELECT COUNT(DISTINCT first_orders.customer_key) AS new_count
    FROM (
      SELECT COALESCE(o.user_id::text, o.customer_phone) AS customer_key,
             MIN(o.created_at) AS first_order_at
      FROM ${orders} o
      GROUP BY COALESCE(o.user_id::text, o.customer_phone)
    ) first_orders
    WHERE first_orders.first_order_at >= ${dayRange(dateStr).start}
      AND first_orders.first_order_at < ${dayRange(dateStr).end}
  `);

  const expensesTotal = expensesTotalRow[0]?.total ?? '0';
  const purchasesTotal = purchasesTotalRow[0]?.total ?? '0';
  const newCustomerCount = Number((newCustomerRow as any).rows?.[0]?.new_count ?? 0);

  const grossProfit = Number(row.netRevenue) - Number(row.cogsTotal);
  const netProfit = grossProfit - Number(expensesTotal);
  const avgOrderValue = row.ordersTotal > 0 ? Number(row.netRevenue) / row.ordersTotal : 0;
  const avgBasketSize = row.ordersTotal > 0 ? Number(row.itemsSoldTotal) / row.ordersTotal : 0;

  const values = {
    snapshotDate: dateStr,
    ordersTotal: row.ordersTotal ?? 0,
    ordersPending: row.ordersPending ?? 0,
    ordersConfirmed: row.ordersConfirmed ?? 0,
    ordersPreparing: row.ordersPreparing ?? 0,
    ordersReadyForDelivery: row.ordersReadyForDelivery ?? 0,
    ordersOutForDelivery: row.ordersOutForDelivery ?? 0,
    ordersDelivered: row.ordersDelivered ?? 0,
    ordersCancelled: row.ordersCancelled ?? 0,
    ordersRefunded: row.ordersRefunded ?? 0,
    itemsSoldTotal: row.itemsSoldTotal ?? 0,
    grossRevenue: String(row.grossRevenue ?? '0'),
    discountTotal: String(row.discountTotal ?? '0'),
    couponDiscountTotal: String(row.couponDiscountTotal ?? '0'),
    deliveryFeeTotal: String(row.deliveryFeeTotal ?? '0'),
    netRevenue: String(row.netRevenue ?? '0'),
    cogsTotal: String(row.cogsTotal ?? '0'),
    grossProfit: String(grossProfit),
    expensesTotal: String(expensesTotal),
    purchasesTotal: String(purchasesTotal),
    netProfit: String(netProfit),
    customerCountTotal: row.customerCountTotal ?? 0,
    newCustomerCount,
    returningCustomerCount: Math.max(0, (row.customerCountTotal ?? 0) - newCustomerCount),
    avgOrderValue: String(avgOrderValue),
    avgBasketSize: String(avgBasketSize),
    updatedAt: new Date(),
  };

  await db
    .insert(dailySnapshots)
    .values(values)
    .onConflictDoUpdate({
      target: dailySnapshots.snapshotDate,
      set: values,
    });
}

// ────────────────────────────────────────────────────────────
// PRODUCT AGGREGATE
// ────────────────────────────────────────────────────────────
async function computeProductAggregate(start: Date, end: Date) {
  return db
    .select({
      productId: orderItems.productId,
      variantId: orderItems.variantId,
      qtySold: sql<number>`SUM(${orderItems.qty})`,
      revenue: sql<string>`SUM(${orderItems.subtotal})`,
      ordersCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(
      and(
        gte(orders.createdAt, start),
        lt(orders.createdAt, end),
        inArray(orders.status, REVENUE_STATUSES)
      )
    )
    .groupBy(orderItems.productId, orderItems.variantId);
}

async function upsertProductDailyStats(dateStr: string, rows: any[]) {
  for (const r of rows) {
    if (!r.productId) continue;
    const values = {
      snapshotDate: dateStr,
      productId: r.productId,
      variantId: r.variantId ?? null,
      qtySold: Number(r.qtySold ?? 0),
      revenue: String(r.revenue ?? '0'),
      ordersCount: Number(r.ordersCount ?? 0),
      computedAt: new Date(),
    };
    await db
      .insert(productDailyStats)
      .values(values)
      .onConflictDoUpdate({
        target: [productDailyStats.snapshotDate, productDailyStats.productId, productDailyStats.variantId],
        set: values,
      });
  }
}

// ────────────────────────────────────────────────────────────
// CATEGORY AGGREGATE
// ────────────────────────────────────────────────────────────
async function computeCategoryAggregate(start: Date, end: Date) {
  return db
    .select({
      categoryId: products.categoryId,
      qtySold: sql<number>`SUM(${orderItems.qty})`,
      revenue: sql<string>`SUM(${orderItems.subtotal})`,
      ordersCount: sql<number>`COUNT(DISTINCT ${orderItems.orderId})`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .innerJoin(products, eq(orderItems.productId, products.id))
    .where(
      and(
        gte(orders.createdAt, start),
        lt(orders.createdAt, end),
        inArray(orders.status, REVENUE_STATUSES)
      )
    )
    .groupBy(products.categoryId);
}

async function upsertCategoryDailyStats(dateStr: string, rows: any[]) {
  for (const r of rows) {
    if (!r.categoryId) continue;
    const values = {
      snapshotDate: dateStr,
      categoryId: r.categoryId,
      qtySold: Number(r.qtySold ?? 0),
      revenue: String(r.revenue ?? '0'),
      ordersCount: Number(r.ordersCount ?? 0),
      computedAt: new Date(),
    };
    await db
      .insert(categoryDailyStats)
      .values(values)
      .onConflictDoUpdate({
        target: [categoryDailyStats.snapshotDate, categoryDailyStats.categoryId],
        set: values,
      });
  }
}

// ────────────────────────────────────────────────────────────
// HOURLY AGGREGATE
// ────────────────────────────────────────────────────────────
async function computeHourlyAggregate(start: Date, end: Date) {
  return db
    .select({
      hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})::int`,
      ordersCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      revenue: sql<string>`COALESCE(SUM(${orders.total}), 0)`,
    })
    .from(orders)
    .where(and(gte(orders.createdAt, start), lt(orders.createdAt, end)))
    .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);
}

async function upsertHourlySalesStats(dateStr: string, rows: any[]) {
  for (const r of rows) {
    const values = {
      snapshotDate: dateStr,
      hour: Number(r.hour),
      ordersCount: Number(r.ordersCount ?? 0),
      revenue: String(r.revenue ?? '0'),
      computedAt: new Date(),
    };
    await db
      .insert(hourlySalesStats)
      .values(values)
      .onConflictDoUpdate({
        target: [hourlySalesStats.snapshotDate, hourlySalesStats.hour],
        set: values,
      });
  }
}

// ────────────────────────────────────────────────────────────
// LOW STOCK / OUT OF STOCK (real-time — inventoriya cari vəziyyət,
// snapshot-a ehtiyac yoxdur, çünki "indiki" stok lazımdır)
// ────────────────────────────────────────────────────────────
export async function getLowStockVariants() {
  return db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      variantName: productVariants.name,
      stock: productVariants.stock,
      minStock: productVariants.minStock,
      unit: productVariants.unit,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(
      and(
        eq(products.archived, false),
        sql`${productVariants.stock} <= COALESCE(${productVariants.minStock}, 10)`
      )
    )
    .orderBy(sql`${productVariants.stock} ASC`);
}

export async function getOutOfStockVariants() {
  return db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      variantName: productVariants.name,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .where(and(eq(products.archived, false), eq(productVariants.stock, 0)));
}

// ────────────────────────────────────────────────────────────
// PERIOD KPI (Bugün / Son 7 gün / Bu ay ... + öncəki dövrlə müqayisə)
// dailySnapshots üzərindən — sürətli, RAW cədvələ dəymir
// ────────────────────────────────────────────────────────────
export async function getPeriodKpis(startDate: string, endDate: string) {
  const [row] = await db
    .select({
      ordersTotal: sql<number>`COALESCE(SUM(${dailySnapshots.ordersTotal}), 0)`,
      ordersDelivered: sql<number>`COALESCE(SUM(${dailySnapshots.ordersDelivered}), 0)`,
      ordersCancelled: sql<number>`COALESCE(SUM(${dailySnapshots.ordersCancelled}), 0)`,
      ordersRefunded: sql<number>`COALESCE(SUM(${dailySnapshots.ordersRefunded}), 0)`,
      itemsSoldTotal: sql<number>`COALESCE(SUM(${dailySnapshots.itemsSoldTotal}), 0)`,
      netRevenue: sql<string>`COALESCE(SUM(${dailySnapshots.netRevenue}), 0)`,
      grossProfit: sql<string>`COALESCE(SUM(${dailySnapshots.grossProfit}), 0)`,
      netProfit: sql<string>`COALESCE(SUM(${dailySnapshots.netProfit}), 0)`,
      discountTotal: sql<string>`COALESCE(SUM(${dailySnapshots.discountTotal}), 0)`,
      couponDiscountTotal: sql<string>`COALESCE(SUM(${dailySnapshots.couponDiscountTotal}), 0)`,
      deliveryFeeTotal: sql<string>`COALESCE(SUM(${dailySnapshots.deliveryFeeTotal}), 0)`,
      newCustomerCount: sql<number>`COALESCE(SUM(${dailySnapshots.newCustomerCount}), 0)`,
    })
    .from(dailySnapshots)
    .where(and(gte(dailySnapshots.snapshotDate, startDate), lt(dailySnapshots.snapshotDate, endDate)));

  return row;
}

/**
 * Cari dövrü öncəki EYNİ UZUNLUQDA dövrlə müqayisə edir və faiz dəyişimini
 * qaytarır. Məs: "Son 7 gün" seçilibsə, ondan öncəki 7 günlə müqayisə olunur.
 */
export async function getKpiComparison(startDate: string, endDate: string) {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const lengthMs = end.getTime() - start.getTime();

  const prevEnd = startDate;
  const prevStart = new Date(start.getTime() - lengthMs).toISOString().slice(0, 10);

  const [current, previous] = await Promise.all([
    getPeriodKpis(startDate, endDate),
    getPeriodKpis(prevStart, prevEnd),
  ]);

  const pctChange = (curr: number, prev: number) => {
    if (prev === 0) return curr > 0 ? 100 : 0;
    return ((curr - prev) / prev) * 100;
  };

  return {
    current,
    previous,
    growth: {
      revenueGrowthPct: pctChange(Number(current.netRevenue), Number(previous.netRevenue)),
      profitGrowthPct: pctChange(Number(current.netProfit), Number(previous.netProfit)),
      ordersGrowthPct: pctChange(current.ordersTotal, previous.ordersTotal),
      customerGrowthPct: pctChange(current.newCustomerCount, previous.newCustomerCount),
    },
  };
}

/**
 * Son N günün netRevenue-nu qaytarır — sadə xətti reqressiya ilə
 * növbəti 7 günün proqnozunu (forecast) hesablamaq üçün istifadə olunur.
 * (Tam forecast servisi Phase 3-də veriləcək, bu — DB tərəfi.)
 */
export async function getRevenueTimeseries(startDate: string, endDate: string) {
  return db
    .select({
      date: dailySnapshots.snapshotDate,
      netRevenue: dailySnapshots.netRevenue,
      ordersTotal: dailySnapshots.ordersTotal,
      netProfit: dailySnapshots.netProfit,
    })
    .from(dailySnapshots)
    .where(and(gte(dailySnapshots.snapshotDate, startDate), lt(dailySnapshots.snapshotDate, endDate)))
    .orderBy(dailySnapshots.snapshotDate);
}

export async function getTopProducts(startDate: string, endDate: string, limit = 10, orderByRevenue = true) {
  return db
    .select({
      productId: productDailyStats.productId,
      productName: products.name,
      totalQty: sql<number>`SUM(${productDailyStats.qtySold})`,
      totalRevenue: sql<string>`SUM(${productDailyStats.revenue})`,
    })
    .from(productDailyStats)
    .innerJoin(products, eq(productDailyStats.productId, products.id))
    .where(and(gte(productDailyStats.snapshotDate, startDate), lt(productDailyStats.snapshotDate, endDate)))
    .groupBy(productDailyStats.productId, products.name)
    .orderBy(orderByRevenue ? sql`SUM(${productDailyStats.revenue}) DESC` : sql`SUM(${productDailyStats.qtySold}) DESC`)
    .limit(limit);
}

export async function getLeastSellingProducts(startDate: string, endDate: string, limit = 10) {
  return db
    .select({
      productId: productDailyStats.productId,
      productName: products.name,
      totalQty: sql<number>`SUM(${productDailyStats.qtySold})`,
      totalRevenue: sql<string>`SUM(${productDailyStats.revenue})`,
    })
    .from(productDailyStats)
    .innerJoin(products, eq(productDailyStats.productId, products.id))
    .where(and(gte(productDailyStats.snapshotDate, startDate), lt(productDailyStats.snapshotDate, endDate)))
    .groupBy(productDailyStats.productId, products.name)
    .orderBy(sql`SUM(${productDailyStats.qtySold}) ASC`)
    .limit(limit);
}

export async function getCategoryBreakdown(startDate: string, endDate: string) {
  return db
    .select({
      categoryId: categoryDailyStats.categoryId,
      categoryName: categories.name,
      totalQty: sql<number>`SUM(${categoryDailyStats.qtySold})`,
      totalRevenue: sql<string>`SUM(${categoryDailyStats.revenue})`,
    })
    .from(categoryDailyStats)
    .innerJoin(categories, eq(categoryDailyStats.categoryId, categories.id))
    .where(and(gte(categoryDailyStats.snapshotDate, startDate), lt(categoryDailyStats.snapshotDate, endDate)))
    .groupBy(categoryDailyStats.categoryId, categories.name)
    .orderBy(sql`SUM(${categoryDailyStats.revenue}) DESC`);
}

export async function getHourlyHeatmap(startDate: string, endDate: string) {
  return db
    .select({
      hour: hourlySalesStats.hour,
      ordersCount: sql<number>`SUM(${hourlySalesStats.ordersCount})`,
      revenue: sql<string>`SUM(${hourlySalesStats.revenue})`,
    })
    .from(hourlySalesStats)
    .where(and(gte(hourlySalesStats.snapshotDate, startDate), lt(hourlySalesStats.snapshotDate, endDate)))
    .groupBy(hourlySalesStats.hour)
    .orderBy(hourlySalesStats.hour);
}

/**
 * Hər bir variant üçün son `days` gündəki satılan miqdarı (productDailyStats-dan)
 * cari stok (productVariants.stock) ilə birləşdirir. Bu, "sabaha stok
 * kifayət edəcəkmi?" hesablamasının DB tərəfidir — riyaziyyat forecast.ts-dədir.
 */
export async function getVariantSalesVelocity(days = 14) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = new Date().toISOString().slice(0, 10);

  return db
    .select({
      variantId: productVariants.id,
      productId: productVariants.productId,
      productName: products.name,
      variantName: productVariants.name,
      unit: productVariants.unit,
      currentStock: productVariants.stock,
      minStock: productVariants.minStock,
      qtySoldLastNDays: sql<number>`COALESCE(SUM(${productDailyStats.qtySold}), 0)`,
    })
    .from(productVariants)
    .innerJoin(products, eq(productVariants.productId, products.id))
    .leftJoin(
      productDailyStats,
      and(
        eq(productDailyStats.variantId, productVariants.id),
        gte(productDailyStats.snapshotDate, startStr),
        lt(productDailyStats.snapshotDate, endStr)
      )
    )
    .where(eq(products.archived, false))
    .groupBy(
      productVariants.id,
      productVariants.productId,
      products.name,
      productVariants.name,
      productVariants.unit,
      productVariants.stock,
      productVariants.minStock
    );
}

/** Ümumi (bütün məhsullar üzrə) son N günün gündəlik dövriyyəsi — forecast input-u */
export async function getDailyRevenueHistory(days = 30) {
  const start = new Date();
  start.setDate(start.getDate() - days);
  const startStr = start.toISOString().slice(0, 10);
  const endStr = new Date().toISOString().slice(0, 10);
  return getRevenueTimeseries(startStr, endStr);
}

export async function getCouponUsageTotals(startDate: string, endDate: string) {
  const [row] = await db
    .select({
      usageCount: sql<number>`COUNT(*)`,
      totalDiscount: sql<string>`COALESCE(SUM(${couponUsage.discountApplied}), 0)`,
    })
    .from(couponUsage)
    .innerJoin(orders, eq(couponUsage.orderId, orders.id))
    .where(and(gte(orders.createdAt, new Date(startDate)), lt(orders.createdAt, new Date(endDate))));
  return row;
}