// src/app/api/orders/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { orders, orderItems, inventoryLogs, notifications, financeLedger } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireAuth, optionalAuth, AuthError } from '@/lib/auth';

// ─── GET: Sifarişi gətir ───────────────────────────────────────────────────
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const auth = await optionalAuth(req);
    const user = auth.user;
    const isAdmin = user?.role && ['ADMIN', 'SUPERADMIN', 'MANAGER', 'COURIER'].includes(user.role);
    const userId = user?.id ?? null;

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sifariş tapılmadı' }, { status: 404 });
    }

    // Müştəri yalnız öz sifarişini görə bilər
    if (!isAdmin && userId && order.userId && order.userId !== userId) {
      return NextResponse.json({ error: 'Bu sifarişi görmək üçün icazəniz yoxdur' }, { status: 403 });
    }

    if (!isAdmin && !userId) {
      return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
    }

    return NextResponse.json({ order });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[orders/[id]] GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── DELETE: Sifarişi sil (yalnız ADMIN) ─────────────────────────────────
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Yalnız ADMIN sifarişi silə bilər
    await requireAuth(req, ['ADMIN']);

    // Transaction ilə asılı cədvəlləri də sil
    await db.transaction(async (tx) => {
      // 1. Sifariş maddələrini sil (cascade olmadıqda manual)
      await tx.delete(orderItems).where(eq(orderItems.orderId, id));

      // 2. İnventar loglarını sil (əgər varsa)
      try {
        await tx.delete(inventoryLogs).where(eq(inventoryLogs.refId, id));
      } catch {
        // inventoryLogs cədvəli olmaya bilər, skip
      }

      // 3. Bildirişləri sil
      try {
        await tx.delete(notifications).where(eq(notifications.refId, id));
      } catch {
        // notifications olmaya bilər
      }

      // 4. Maliyyə qeydlərini sil
      try {
        await tx.delete(financeLedger).where(eq(financeLedger.refId, id));
      } catch {
        // financeLedger olmaya bilər
      }

      // 5. Sifarişi sil
      await tx.delete(orders).where(eq(orders.id, id));
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('[orders/[id]] DELETE error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}