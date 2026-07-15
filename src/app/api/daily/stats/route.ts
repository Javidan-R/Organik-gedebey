// src/app/api/daily/stats/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  productVariants,
  financeLedger,
  expenses,
} from '@/lib/db/schema';
import { eq, and, gte, lt, sql, inArray } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const dateParam = searchParams.get('date');
    if (!dateParam) {
      return NextResponse.json({ error: 'Tarix tələb olunur' }, { status: 400 });
    }

    const startOfDay = new Date(dateParam);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateParam);
    endOfDay.setHours(23, 59, 59, 999);

    // ─── Günlük sifarişlər (ən ümumi məlumat) ──────────────────────────────
    const dayOrders = await db
      .select({
        id: orders.id,
        orderNumber: orders.orderNumber,
        total: orders.total,
        status: orders.status,
        createdAt: orders.createdAt,
      })
      .from(orders)
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lt(orders.createdAt, endOfDay),
          inArray(
            orders.status,
            [
              'PENDING',
              'CONFIRMED',
              'PREPARING',
              'READY_FOR_DELIVERY',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
              'REFUNDED',
            ] as const
          )
        )
      );

    // ─── Məhsul üzrə satış qırılımı (orderItems + productVariants) ─────────
    const productSales = await db
      .select({
        productId: orderItems.productId,
        productName: orderItems.productName,
        variantId: orderItems.variantId,
        variantName: sql<string | null>`MAX(${orderItems.variantName})`,
        totalQty: sql<number>`SUM(${orderItems.qty})`,
        totalRevenue: sql<number>`SUM(${orderItems.subtotal})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orderItems.orderId, orders.id))
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .where(
        and(
          gte(orders.createdAt, startOfDay),
          lt(orders.createdAt, endOfDay),
          inArray(
            orders.status,
            [
              'PENDING',
              'CONFIRMED',
              'PREPARING',
              'READY_FOR_DELIVERY',
              'OUT_FOR_DELIVERY',
              'DELIVERED',
              'CANCELLED',
              'REFUNDED',
            ] as const
          )
        )
      )
      .groupBy(orderItems.productId, orderItems.productName, orderItems.variantId)
      .orderBy(sql`SUM(${orderItems.qty}) DESC`);

    // ─── Günlük maliyyə hərəkətləri (gəlir) ───────────────────────────────
    const dayLedger = await db
      .select({
        amount: financeLedger.amount,
        type: financeLedger.type,
      })
      .from(financeLedger)
      .where(
        and(
          gte(financeLedger.date, startOfDay),
          lt(financeLedger.date, endOfDay),
          eq(financeLedger.type, 'in')
        )
      );

    // ─── Günlük xərclər ──────────────────────────────────────────────────
    const dayExpenses = await db
      .select({
        amount: expenses.amount,
      })
      .from(expenses)
      .where(
        and(
          gte(expenses.date, startOfDay),
          lt(expenses.date, endOfDay)
        )
      );

    // ─── Özət ─────────────────────────────────────────────────────────────
    const totalSales = dayOrders.reduce((sum, o) => sum + Number(o.total), 0);
    const totalExpenses = dayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
    const totalFinanceIn = dayLedger.reduce((sum, l) => sum + Number(l.amount), 0);
    const profit = totalSales - totalExpenses;

    return NextResponse.json({
      date: dateParam,
      summary: {
        totalSales,
        totalExpenses,
        totalFinanceIn,
        profit,
        orderCount: dayOrders.length,
        productCount: productSales.length,
      },
      orders: dayOrders,
      productSales,
      ledger: dayLedger,
      expenses: dayExpenses,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[daily/stats] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}