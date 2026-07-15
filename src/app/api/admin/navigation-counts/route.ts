// src/app/api/admin/navigation-counts/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, products, productVariants, users } from '@/lib/db/schema';
import { eq, and, sql } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';

/**
 * Helper: run a counting query safely; return 0 on any error.
 */
async function safeCount(promise: Promise<number>): Promise<number> {
  try {
    return await promise;
  } catch (error) {
    console.warn('[nav-counts] Query failed, returning 0:', error);
    return 0;
  }
}

export async function GET(request: NextRequest) {
  try {
    // Auth – only admin roles
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER', 'WAREHOUSE_STAFF']);

    // Pending orders
    const pendingOrders = safeCount(
      db
        .select({ count: sql<number>`count(*)` })
        .from(orders)
        .where(eq(orders.status, 'PENDING'))
        .then(r => Number(r[0]?.count ?? 0))
    );

    // Low‑stock products (distinct products that have any variant with stock ≤ 5)
    const lowStockProducts = safeCount(
      db
        .select({ count: sql<number>`count(distinct ${productVariants.productId})` })
        .from(productVariants)
        .where(sql`${productVariants.stock} <= 5`)
        .then(r => Number(r[0]?.count ?? 0))
    );

    // Unread WhatsApp messages – if the table/column doesn't exist, returns 0
    const unreadMessages = safeCount(
      (async () => {
        try {
          // Dynamic import to avoid build errors if the schema doesn't export it
          const { whatsappMessages } = await import('@/lib/db/schema');
          const result = await db
            .select({ count: sql<number>`count(*)` })
            .from(whatsappMessages)
            .where(eq(whatsappMessages.isRead, false));
          return Number(result[0]?.count ?? 0);
        } catch {
          return 0; // table or column doesn't exist
        }
      })()
    );

    // Active users
    const activeUsers = safeCount(
      db
        .select({ count: sql<number>`count(*)` })
        .from(users)
        .where(and(eq(users.isActive, true), eq(users.isBlocked, false)))
        .then(r => Number(r[0]?.count ?? 0))
    );

    // Resolve all counts in parallel
    const [
      pendingOrdersCount,
      lowStockProductsCount,
      unreadMessagesCount,
      activeUsersCount,
    ] = await Promise.all([pendingOrders, lowStockProducts, unreadMessages, activeUsers]);

    const response = NextResponse.json({
      pendingOrders: pendingOrdersCount,
      lowStockProducts: lowStockProductsCount,
      unreadMessages: unreadMessagesCount,
      activeUsers: activeUsersCount,
    });

    // Cache for 30 seconds, revalidate in background
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=30, stale-while-revalidate=60'
    );

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }

    console.error('[nav-counts] GET error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}