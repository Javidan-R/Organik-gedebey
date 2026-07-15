// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import {
  orders,
  productVariants,
  products,
  inventoryLogs,
  notifications,
  financeLedger,
  financeAccounts,
  users,
} from '@/lib/db/schema';
import { eq, and, sql, inArray } from 'drizzle-orm';
import { requireAuth, AuthError } from '@/lib/auth';

const updateStatusSchema = z.object({
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]),
  cancellationReason: z.string().optional(),
});

async function lockAndReduceStock(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  variantId: string,
  qty: number,
  unit: string | null,
  orderId: string,
  orderNumber: string,
  userId: string,
  itemPrice: string
) {
  const [updated] = await tx
    .update(productVariants)
    .set({
      stock: sql`stock - ${qty}`,
      updatedAt: new Date(),
    })
    .where(and(eq(productVariants.id, variantId), sql`stock >= ${qty}`))
    .returning({ stock: productVariants.stock, productId: productVariants.productId });

  if (!updated) {
    throw new Error('Stok kifayət deyil və ya variant artıq dəyişdirilib');
  }

  const newStock = updated.stock;
  const oldStock = newStock + qty;

  await tx.insert(inventoryLogs).values({
    productId: updated.productId,
    variantId,
    type: 'SALE' as const,
    qtyChange: -qty,
    qtyBefore: oldStock,
    qtyAfter: newStock,
    unit: unit || 'ədəd',
    refType: 'ORDER' as const,
    refId: orderId,
    notes: `Sifariş #${orderNumber} təsdiqləndi`,
    createdBy: userId,
    createdAt: new Date(),
  });

  try {
    await tx
      .update(products)
      .set({
        // @ts-ignore – columns will be added later
        totalSold: sql`COALESCE(total_sold, 0) + ${qty}`,
        // @ts-ignore
        totalRevenue: sql`COALESCE(total_revenue, 0) + ${itemPrice}::numeric * ${qty}`,
        updatedAt: new Date(),
      })
      .where(eq(products.id, updated.productId));
  } catch (e) {
    console.warn('[status] products stats update skipped – columns may not exist yet');
  }
}

async function getOrCreateAccount(
  tx: Parameters<Parameters<typeof db.transaction>[0]>[0],
  type: string,
  name: string
): Promise<string> {
  const [existing] = await tx
    .select({ id: financeAccounts.id })
    .from(financeAccounts)
    .where(eq(financeAccounts.type, type as any))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await tx
    .insert(financeAccounts)
    .values({ name, type: type as any, currency: 'AZN' })
    .returning({ id: financeAccounts.id });

  if (!created) throw new Error('Maliyyə hesabı yaradıla bilmədi');
  return created.id;
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { user } = await requireAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const body = await req.json();
    const { status: newStatus, cancellationReason } = updateStatusSchema.parse(body);

    // 1. Fetch current order
    const order = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      columns: {
        id: true,
        orderNumber: true,
        status: true,
        userId: true,
        total: true,
        paymentMethod: true,
        customerName: true,
      },
      with: {
        items: {
          columns: {
            id: true,
            productId: true,
            variantId: true,
            qty: true,
            unit: true,
            priceAtOrder: true,
            productName: true,
          },
          with: {
            variant: {
              columns: { id: true, stock: true, productId: true },
            },
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Sifariş tapılmadı' }, { status: 404 });
    }

    const currentStatus = order.status;

    // ✅ IDEMPOTENCY CHECK: if already in target status, return success without changes
    if (currentStatus === newStatus) {
      return NextResponse.json({
        success: true,
        order: order, // can return current order without re‑fetching
      });
    }

    const allowedTransitions: Record<string, string[]> = {
      PENDING: ['CONFIRMED', 'CANCELLED'],
      CONFIRMED: ['PREPARING', 'CANCELLED'],
      PREPARING: ['READY_FOR_DELIVERY', 'CANCELLED'],
      READY_FOR_DELIVERY: ['OUT_FOR_DELIVERY', 'CANCELLED'],
      OUT_FOR_DELIVERY: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['REFUNDED'],
      CANCELLED: [],
      REFUNDED: [],
    };

    const allowed = allowedTransitions[currentStatus] || [];
    if (!allowed.includes(newStatus)) {
      return NextResponse.json(
        {
          error: `Status keçidi mümkün deyil (${currentStatus} -> ${newStatus})`,
          allowedTransitions: allowed,
        },
        { status: 400 }
      );
    }

    if (newStatus === 'CANCELLED' && !cancellationReason) {
      return NextResponse.json(
        { error: 'Ləğv səbəbi tələb olunur' },
        { status: 400 }
      );
    }

    // 2. Execute transaction with optimistic concurrency control
    try {
      await db.transaction(async (tx) => {
        const [updatedOrder] = await tx
          .update(orders)
          .set({
            status: newStatus,
            updatedAt: new Date(),
            ...(newStatus === 'CANCELLED'
              ? { cancellationReason, cancelledAt: new Date() }
              : {}),
            ...(newStatus === 'CONFIRMED' ? { confirmedAt: new Date() } : {}),
            ...(newStatus === 'PREPARING' ? { preparingAt: new Date() } : {}),
            ...(newStatus === 'READY_FOR_DELIVERY' ? { readyAt: new Date() } : {}),
            ...(newStatus === 'OUT_FOR_DELIVERY' ? { outForDeliveryAt: new Date() } : {}),
            ...(newStatus === 'DELIVERED' ? { deliveredAt: new Date() } : {}),
          })
          .where(and(eq(orders.id, id), eq(orders.status, currentStatus)))
          .returning({ id: orders.id });

        if (!updatedOrder) {
          throw new Error('Sifariş artıq dəyişdirilib – səhifəni yeniləyin');
        }

        // 3. Side effects (stock, finance, notifications) – only if status really changed
        if (newStatus === 'CONFIRMED') {
          for (const item of order.items) {
            if (item.variantId && item.variant) {
              await lockAndReduceStock(
                tx,
                item.variantId,
                item.qty,
                item.unit,
                id,
                order.orderNumber,
                user.id,
                item.priceAtOrder
              );
            }
          }

          const accountType = order.paymentMethod === 'CARD' ? 'pos' : 'cash';
          const accountName = accountType === 'pos' ? 'Kart Hesabı' : 'Nağd Kassa';
          const accountId = await getOrCreateAccount(tx, accountType, accountName);

          await tx.insert(financeLedger).values({
            date: new Date(),
            accountId,
            type: 'in' as const,
            amount: order.total,
            refKind: 'order' as const,
            refId: id,
            memo: `Sifariş #${order.orderNumber} – ${order.customerName}`,
            createdAt: new Date(),
          });
        }

        if (
          newStatus === 'CANCELLED' &&
          ['CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY'].includes(currentStatus)
        ) {
          for (const item of order.items) {
            if (item.variantId && item.variant) {
              const [restored] = await tx
                .update(productVariants)
                .set({
                  stock: sql`stock + ${item.qty}`,
                  updatedAt: new Date(),
                })
                .where(eq(productVariants.id, item.variantId))
                .returning({
                  stock: productVariants.stock,
                  productId: productVariants.productId,
                });

              if (restored) {
                const newStock = restored.stock;
                const oldStock = newStock - item.qty;
                await tx.insert(inventoryLogs).values({
                  productId: restored.productId,
                  variantId: item.variantId,
                  type: 'RETURN' as const,
                  qtyChange: item.qty,
                  qtyBefore: oldStock,
                  qtyAfter: newStock,
                  unit: item.unit || 'ədəd',
                  refType: 'ORDER' as const,
                  refId: id,
                  notes: `Sifariş #${order.orderNumber} ləğv edildi – stok bərpası`,
                  createdBy: user.id,
                  createdAt: new Date(),
                });

                try {
                  await tx
                    .update(products)
                    .set({
                      // @ts-ignore
                      totalSold: sql`GREATEST(COALESCE(total_sold, 0) - ${item.qty}, 0)`,
                      // @ts-ignore
                      totalRevenue: sql`GREATEST(COALESCE(total_revenue, 0) - ${item.priceAtOrder}::numeric * ${item.qty}, 0)`,
                      updatedAt: new Date(),
                    })
                    .where(eq(products.id, restored.productId));
                } catch (e) {
                  console.warn('[status] products stats rollback skipped');
                }
              }
            }
          }

          if (currentStatus === 'CONFIRMED') {
            const accountType = order.paymentMethod === 'CARD' ? 'pos' : 'cash';
            const accountName = accountType === 'pos' ? 'Kart Hesabı' : 'Nağd Kassa';
            const accountId = await getOrCreateAccount(tx, accountType, accountName);

            await tx.insert(financeLedger).values({
              date: new Date(),
              accountId,
              type: 'out' as const,
              amount: order.total,
              refKind: 'order' as const,
              refId: id,
              memo: `Sifariş #${order.orderNumber} ləğv – GƏLİR İPTALI`,
              createdAt: new Date(),
            });
          }
        }

        // Notifications
        const customerMsgMap: Record<string, string> = {
          CONFIRMED: 'Sifarişiniz təsdiqləndi ✅',
          PREPARING: 'Sifarişiniz hazırlanır 🧑‍🍳',
          READY_FOR_DELIVERY: 'Sifarişiniz çatdırılmağa hazırdır 📦',
          OUT_FOR_DELIVERY: 'Sifarişiniz yoldadır 🚀',
          DELIVERED: 'Sifarişiniz çatdırıldı 🤝',
          CANCELLED: `Sifarişiniz ləğv edildi ❌ Səbəb: ${cancellationReason ?? '—'}`,
        };

        const customerMessage = customerMsgMap[newStatus];
        if (order.userId && customerMessage) {
          await tx.insert(notifications).values({
            userId: order.userId,
            type: 'ORDER_STATUS_CHANGED' as const,
            title: `Sifariş #${order.orderNumber}`,
            message: customerMessage,
            refType: 'ORDER' as const,
            refId: id,
            channel: 'APP' as const,
            createdAt: new Date(),
          });
        }

        const admins = await tx
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.role, ['ADMIN', 'SUPERADMIN', 'MANAGER']));

        if (admins.length > 0) {
          const adminMsg = `Sifariş #${order.orderNumber} statusu dəyişdi: ${currentStatus} → ${newStatus}`;
          const adminNotifications: typeof notifications.$inferInsert[] = admins.map((a) => ({
            userId: a.id,
            type: 'ORDER_STATUS_CHANGED' as const,
            title: 'Status yeniləndi',
            message: adminMsg,
            refType: 'ORDER' as const,
            refId: id,
            channel: 'APP' as const,
            createdAt: new Date(),
          }));
          await tx.insert(notifications).values(adminNotifications);
        }
      });
    } catch (txError) {
      // Optimistic lock failure: order was changed concurrently
      if (txError instanceof Error && txError.message.includes('artıq dəyişdirilib')) {
        // Re‑fetch order to see if it now has the desired status
        const refreshed = await db.query.orders.findFirst({
          where: eq(orders.id, id),
          columns: { status: true },
        });

        if (refreshed && refreshed.status === newStatus) {
          // Someone else already did the work – return success
          return NextResponse.json({
            success: true,
            order: null, // frontend can re‑fetch
          });
        }

        // Otherwise, it's a genuine conflict – return 409
        return NextResponse.json(
          { error: 'Sifariş artıq dəyişdirilib – səhifəni yeniləyin' },
          { status: 409 }
        );
      }

      throw txError; // re‑throw other errors
    }

    // 4. Return refreshed order
    const refreshedOrder = await db.query.orders.findFirst({
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

    return NextResponse.json({
      success: true,
      order: refreshedOrder,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Yanlış sorğu formatı', details: error.issues },
        { status: 400 }
      );
    }
    if (
      error instanceof Error &&
      (error.message.includes('kifayət deyil') || error.message.includes('stok'))
    ) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    console.error('[orders/[id]/status] PATCH error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}