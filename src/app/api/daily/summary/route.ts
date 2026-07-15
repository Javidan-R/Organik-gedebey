import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  expenses,
  financePurchases,
  financeAccounts,
} from '@/lib/db/schema';
import { dailySummaries } from '@/lib/db/schema/daily';
import { eq, and, sql, gte, lt, inArray } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';
import { z } from 'zod';

/**
 * Safe wrapper for any database query.
 * If the query throws, it logs the error and returns the fallback value.
 */
async function safeQuery<T>(promise: Promise<T>, fallback: T, context: string): Promise<T> {
  try {
    return await promise;
  } catch (error) {
    console.error(`[daily-summary] ${context} failed:`, error);
    return fallback;
  }
}

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get('date');
    if (!dateStr) {
      return NextResponse.json({ error: 'Tarix tələb olunur' }, { status: 400 });
    }

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return NextResponse.json({ error: 'Tarix formatı yanlışdır (YYYY-MM-DD)' }, { status: 400 });
    }

    const startOfDay = new Date(dateStr);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Step 1 – Saved summary
    const savedSummary = await safeQuery(
      db
        .select()
        .from(dailySummaries)
        .where(eq(dailySummaries.date, dateStr))
        .then((rows) => rows[0] ?? null),
      null,
      'Fetch saved summary'
    );

    // Step 2 – Orders
    const rawOrders = await safeQuery(
      db
        .select({
          id: orders.id,
          orderNumber: orders.orderNumber,
          customerName: orders.customerName,
          customerPhone: orders.customerPhone,
          status: orders.status,
          total: orders.total,
          paymentMethod: orders.paymentMethod,
          createdAt: orders.createdAt,
          discountAmount: orders.discountAmount,
          deliveryFee: orders.deliveryFee,
          subtotal: orders.subtotal,
          couponDiscount: orders.couponDiscount,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        )
        .orderBy(orders.createdAt),
      [] as any[],
      'Fetch orders'
    );

    const orderIds = rawOrders.map((o: any) => o.id);

    // Step 3 – Order items (only if orders exist)
    let orderItemsList: any[] = [];
    if (orderIds.length > 0) {
      orderItemsList = await safeQuery(
        db
          .select({
            id: orderItems.id,
            orderId: orderItems.orderId,
            productName: orderItems.productName,
            variantName: orderItems.variantName,
            qty: orderItems.qty,
            priceAtOrder: orderItems.priceAtOrder,
            subtotal: orderItems.subtotal,
            costAtOrder: orderItems.costAtOrder,
            productId: orderItems.productId,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds)),
        [] as any[],
        'Fetch order items'
      );
    }

    // Enrich orders
    const orderMap = new Map(rawOrders.map((o: any) => [o.id, { ...o, items: [] as any[] }]));
    orderItemsList.forEach((item: any) => {
      const order = orderMap.get(item.orderId);
      if (order) order.items.push(item);
    });
    const enrichedOrders = Array.from(orderMap.values());

    // Step 4 – Sales aggregation
    const salesTotal = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(total), 0)::numeric` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        )
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Sales total'
    );

    const orderCount = enrichedOrders.length;
    const avgTicket = orderCount > 0 ? salesTotal / orderCount : 0;

    // Discount / delivery / coupon totals
    const totalDiscount = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(discount_amount), 0)::numeric` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        )
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Discount total'
    );

    const totalDelivery = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(delivery_fee), 0)::numeric` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        )
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Delivery total'
    );

    const totalCoupon = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(coupon_discount), 0)::numeric` })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        )
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Coupon total'
    );

    // Customer count
    const customerCount = await safeQuery(
      db
        .select({ count: sql<number>`COUNT(DISTINCT customer_name)::int` })
        .from(orders)
        .where(and(gte(orders.createdAt, startOfDay), lt(orders.createdAt, endOfDay)))
        .then((rows) => Number(rows[0]?.count ?? 0)),
      0,
      'Customer count'
    );

    // Purchases total
    const purchasesTotal = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(unit_cost * qty), 0)::numeric` })
        .from(financePurchases)
        .where(and(gte(financePurchases.date, startOfDay), lt(financePurchases.date, endOfDay)))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Purchases total'
    );

    // Expenses total
    const expensesTotal = await safeQuery(
      db
        .select({ total: sql<number>`COALESCE(SUM(amount), 0)::numeric` })
        .from(expenses)
        .where(and(gte(expenses.date, startOfDay), lt(expenses.date, endOfDay)))
        .then((rows) => Number(rows[0]?.total ?? 0)),
      0,
      'Expenses total'
    );

    // Payment breakdown
    const paymentAgg = await safeQuery(
      db
        .select({
          cash: sql<number>`COALESCE(SUM(CASE WHEN payment_method='CASH_ON_DELIVERY' THEN total ELSE 0 END), 0)`,
          card: sql<number>`COALESCE(SUM(CASE WHEN payment_method='CARD' THEN total ELSE 0 END), 0)`,
        })
        .from(orders)
        .where(
          and(
            gte(orders.createdAt, startOfDay),
            lt(orders.createdAt, endOfDay),
            sql`status NOT IN ('PENDING','CANCELLED')`
          )
        ),
      { cash: 0, card: 0 },
      'Payment breakdown'
    );
    const cashPayments = Number(paymentAgg.cash ?? 0);
    const cardPayments = Number(paymentAgg.card ?? 0);

    // System profit
    const systemProfit = salesTotal - purchasesTotal - expensesTotal;

    // Cash balances (safe)
    const cashBalances = await safeQuery(
      db
        .select({
          id: financeAccounts.id,
          name: financeAccounts.name,
          type: financeAccounts.type,
          balance: financeAccounts.balance,
        })
        .from(financeAccounts)
        .where(inArray(financeAccounts.type, ['cash', 'pos', 'bank'] as any)),
      [] as any[],
      'Cash balances'
    );

    const systemBalances = (cashBalances || []).map((b: any) => ({
      id: b.id,
      name: b.name,
      type: (b.type as string) || 'unknown',
      balance: Number(b.balance ?? 0),
    }));

    // Product breakdown (only if there are orders)
    let productBreakdown: { productName: string; totalQty: number; totalRevenue: number }[] = [];
    if (orderIds.length > 0) {
      productBreakdown = await safeQuery(
        db
          .select({
            productName: orderItems.productName,
            totalQty: sql<number>`SUM(${orderItems.qty})::int`,
            totalRevenue: sql<number>`SUM(${orderItems.subtotal})::numeric`,
          })
          .from(orderItems)
          .where(inArray(orderItems.orderId, orderIds))
          .groupBy(orderItems.productName)
          .orderBy(sql`SUM(${orderItems.subtotal}) DESC`)
          .then((rows) =>
            rows.map((row) => ({
              productName: row.productName || 'Naməlum',
              totalQty: Number(row.totalQty ?? 0),
              totalRevenue: Number(row.totalRevenue ?? 0),
            }))
          ),
        [],
        'Product breakdown'
      );
    }

    // Hourly sales
    const hourlyBuckets = Array.from({ length: 24 }, (_, hour) => ({
      hour,
      label: `${hour}:00`,
      sales: 0,
      orders: 0,
    }));
    enrichedOrders.forEach((order: any) => {
      const date = new Date(order.createdAt);
      if (isNaN(date.getTime())) return;
      const h = date.getHours();
      if (h >= 0 && h < 24) {
        hourlyBuckets[h].sales += Number(order.total);
        hourlyBuckets[h].orders += 1;
      }
    });

    // Computed differences
    let diffSales = 0,
      diffCustomers = 0,
      diffKassa = 0,
      realProfit = 0,
      kassaReal = 0;
    if (savedSummary) {
      diffSales = Number(savedSummary.realSales ?? 0) - salesTotal;
      diffCustomers = (savedSummary.realCustomers ?? 0) - customerCount;
      kassaReal =
        Number(savedSummary.realCashEnd ?? 0) +
        Number(savedSummary.realPos ?? 0) +
        Number(savedSummary.realBank ?? 0);
      const sysTotal = systemBalances.reduce((sum: number, b: any) => sum + (b.balance ?? 0), 0);
      diffKassa = kassaReal - sysTotal;
      realProfit =
        Number(savedSummary.realSales ?? 0) -
        Number(savedSummary.realPurchases ?? 0) -
        Number(savedSummary.realExpenses ?? 0);
    }

    return NextResponse.json({
      date: dateStr,
      saved: savedSummary,
      orders: enrichedOrders,
      system: {
        salesTotal,
        orderCount,
        customerCount,
        purchasesTotal,
        expensesTotal,
        systemProfit,
        avgTicket,
        totalDiscount,
        totalDelivery,
        totalCoupon,
        cashPayments,
        cardPayments,
        systemBalances,
        productBreakdown,
        hourlySales: hourlyBuckets,
      },
      computed: {
        diffSales,
        diffCustomers,
        diffKassa,
        realProfit,
        kassaReal,
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[daily-summary] Unhandled error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── PUT (upsert) ────────────────────────────────────────────────────────────
const upsertSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  realCustomers: z.number().int().optional(),
  realSales: z.number().optional(),
  realPurchases: z.number().optional(),
  realExpenses: z.number().optional(),
  realCashStart: z.number().optional(),
  realCashEnd: z.number().optional(),
  realPos: z.number().optional(),
  realBank: z.number().optional(),
  note: z.string().optional(),
});

export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const body = await request.json();
    const parsed = upsertSchema.parse(body);

    const [existing] = await safeQuery(
      db.select().from(dailySummaries).where(eq(dailySummaries.date, parsed.date)),
      [] as any[],
      'Fetch existing summary for PUT'
    );

    let result;
    if (existing) {
      [result] = await safeQuery(
        db
          .update(dailySummaries)
          .set({ ...parsed, userId: user.id, updatedAt: new Date() })
          .where(eq(dailySummaries.id, existing.id))
          .returning(),
        [] as any[],
        'Update daily summary'
      );
    } else {
      [result] = await safeQuery(
        db
          .insert(dailySummaries)
          .values({ ...parsed, userId: user.id, updatedAt: new Date() })
          .returning(),
        [] as any[],
        'Insert daily summary'
      );
    }

    return NextResponse.json(result ?? null);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('[daily-summary] PUT error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}