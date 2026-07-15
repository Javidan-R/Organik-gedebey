// ============================================================
// src/lib/db/schema/analytics.ts
// PHASE 1 — BI / Analytics aggregation tables
// ============================================================
//
// Bu cədvəllər "operational" cədvəllərin (orders, orderItems, expenses,
// financePurchases, couponUsage, inventoryLogs) gündəlik aggregasiya
// nəticələrini saxlayır. Dashboard bu cədvəllərdən oxuyur, RAW cədvəllər
// üzərində real-time full-scan etmir.
//
// Doldurulma üsulu (Phase 2-də veriləcək):
//   - Hər gün 00:05-də cron/job vasitəsilə əvvəlki günün snapshot-u yazılır
//   - Admin panelindən "Bu günü yenidən hesabla" düyməsi ilə manual refresh
//
// ============================================================

import {
  pgTable,
  uuid,
  date,
  integer,
  decimal,
  timestamp,
  index,
  uniqueIndex,
} from 'drizzle-orm/pg-core';
import { products, productVariants } from './products';
import { categories } from './categories';

// ────────────────────────────────────────────────────────────
// 1) GÜNLÜK ÜMUMİ SNAPSHOT (bir sətir = bir gün)
// ────────────────────────────────────────────────────────────
export const dailySnapshots = pgTable(
  'daily_snapshots',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotDate: date('snapshot_date').notNull(),

    // Sifariş sayları (status üzrə)
    ordersTotal: integer('orders_total').default(0).notNull(),
    ordersPending: integer('orders_pending').default(0).notNull(),
    ordersConfirmed: integer('orders_confirmed').default(0).notNull(),
    ordersPreparing: integer('orders_preparing').default(0).notNull(),
    ordersReadyForDelivery: integer('orders_ready_for_delivery').default(0).notNull(),
    ordersOutForDelivery: integer('orders_out_for_delivery').default(0).notNull(),
    ordersDelivered: integer('orders_delivered').default(0).notNull(),
    ordersCancelled: integer('orders_cancelled').default(0).notNull(),
    ordersRefunded: integer('orders_refunded').default(0).notNull(),

    // Məhsul / satış həcmi
    itemsSoldTotal: integer('items_sold_total').default(0).notNull(),

    // Maliyyə
    grossRevenue: decimal('gross_revenue', { precision: 12, scale: 2 }).default('0').notNull(), // sum(orderItems.subtotal)
    discountTotal: decimal('discount_total', { precision: 12, scale: 2 }).default('0').notNull(), // orders.discountAmount
    couponDiscountTotal: decimal('coupon_discount_total', { precision: 12, scale: 2 }).default('0').notNull(),
    deliveryFeeTotal: decimal('delivery_fee_total', { precision: 12, scale: 2 }).default('0').notNull(),
    netRevenue: decimal('net_revenue', { precision: 12, scale: 2 }).default('0').notNull(), // sum(orders.total) — CANCELLED/REFUNDED xaric
    cogsTotal: decimal('cogs_total', { precision: 12, scale: 2 }).default('0').notNull(), // sum(qty * costAtOrder)
    grossProfit: decimal('gross_profit', { precision: 12, scale: 2 }).default('0').notNull(), // netRevenue - cogsTotal
    expensesTotal: decimal('expenses_total', { precision: 12, scale: 2 }).default('0').notNull(),
    purchasesTotal: decimal('purchases_total', { precision: 12, scale: 2 }).default('0').notNull(),
    netProfit: decimal('net_profit', { precision: 12, scale: 2 }).default('0').notNull(), // grossProfit - expensesTotal

    // Müştəri
    customerCountTotal: integer('customer_count_total').default(0).notNull(),
    newCustomerCount: integer('new_customer_count').default(0).notNull(),
    returningCustomerCount: integer('returning_customer_count').default(0).notNull(),

    // Törəmə göstəricilər (query-də hər dəfə hesablamamaq üçün saxlanılır)
    avgOrderValue: decimal('avg_order_value', { precision: 12, scale: 2 }).default('0').notNull(),
    avgBasketSize: decimal('avg_basket_size', { precision: 12, scale: 2 }).default('0').notNull(),

    computedAt: timestamp('computed_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (table) => ({
    dateIdx: uniqueIndex('daily_snapshots_date_idx').on(table.snapshotDate),
  })
);

// ────────────────────────────────────────────────────────────
// 2) MƏHSUL ÜZRƏ GÜNLÜK STATS (bir sətir = gün + məhsul + variant)
// ────────────────────────────────────────────────────────────
export const productDailyStats = pgTable(
  'product_daily_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotDate: date('snapshot_date').notNull(),
    productId: uuid('product_id').notNull().references(() => products.id, { onDelete: 'cascade' }),
    variantId: uuid('variant_id').references(() => productVariants.id, { onDelete: 'cascade' }),

    qtySold: integer('qty_sold').default(0).notNull(),
    revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0').notNull(),
    ordersCount: integer('orders_count').default(0).notNull(),
    viewCountSnapshot: integer('view_count_snapshot').default(0).notNull(), // products.viewCount həmin gündə

    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => ({
    dateProductVariantIdx: uniqueIndex('product_daily_stats_date_product_variant_idx').on(
      table.snapshotDate,
      table.productId,
      table.variantId
    ),
    productIdx: index('product_daily_stats_product_idx').on(table.productId),
    dateIdx: index('product_daily_stats_date_idx').on(table.snapshotDate),
  })
);

// ────────────────────────────────────────────────────────────
// 3) KATEQORİYA ÜZRƏ GÜNLÜK STATS
// ────────────────────────────────────────────────────────────
export const categoryDailyStats = pgTable(
  'category_daily_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotDate: date('snapshot_date').notNull(),
    categoryId: uuid('category_id').notNull().references(() => categories.id, { onDelete: 'cascade' }),

    qtySold: integer('qty_sold').default(0).notNull(),
    revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0').notNull(),
    ordersCount: integer('orders_count').default(0).notNull(),

    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => ({
    dateCategoryIdx: uniqueIndex('category_daily_stats_date_category_idx').on(
      table.snapshotDate,
      table.categoryId
    ),
    dateIdx: index('category_daily_stats_date_idx').on(table.snapshotDate),
  })
);

// ────────────────────────────────────────────────────────────
// 4) SAATLIQ SATIŞ STATS (heat-map / "ən çox sifariş hansı saatda" üçün)
// ────────────────────────────────────────────────────────────
export const hourlySalesStats = pgTable(
  'hourly_sales_stats',
  {
    id: uuid('id').primaryKey().defaultRandom(),
    snapshotDate: date('snapshot_date').notNull(),
    hour: integer('hour').notNull(), // 0-23
    ordersCount: integer('orders_count').default(0).notNull(),
    revenue: decimal('revenue', { precision: 12, scale: 2 }).default('0').notNull(),
    computedAt: timestamp('computed_at').defaultNow().notNull(),
  },
  (table) => ({
    dateHourIdx: uniqueIndex('hourly_sales_stats_date_hour_idx').on(table.snapshotDate, table.hour),
  })
);