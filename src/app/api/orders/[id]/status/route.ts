// src/app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { db } from '@/lib/db';
import { orders, orderItems, productVariants, inventoryLogs } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { verifyAdminToken, COOKIE_ADMIN } from '@/lib/auth/jwt';

const STATUS_TRANSITIONS: Record<string, string[]> = {
  'PENDING': ['CONFIRMED', 'CANCELLED'],
  'CONFIRMED': ['PREPARING', 'CANCELLED'],
  'PREPARING': ['READY_FOR_DELIVERY', 'CANCELLED'],
  'READY_FOR_DELIVERY': ['OUT_FOR_DELIVERY', 'CANCELLED'],
  'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED'],
  'DELIVERED': ['REFUNDED'],
  'CANCELLED': [],
  'REFUNDED': [],
  'FAILED': ['OUT_FOR_DELIVERY', 'CANCELLED'],
};

const STATUS_TIMESTAMPS: Record<string, string> = {
  'CONFIRMED': 'confirmedAt',
  'PREPARING': 'preparingAt',
  'READY_FOR_DELIVERY': 'readyAt',
  'OUT_FOR_DELIVERY': 'outForDeliveryAt',
  'DELIVERED': 'deliveredAt',
  'CANCELLED': 'cancelledAt',
};

const updateStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'PREPARING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CANCELLED', 'REFUNDED']),
  cancellationReason: z.string().optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookie = req.cookies.get(COOKIE_ADMIN);
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 });
    }
    const payload = await verifyAdminToken(cookie.value);
    if (!payload || !['ADMIN', 'MANAGER'].includes(payload.role)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    const body = await req.json();
    const { status, cancellationReason } = updateStatusSchema.parse(body);

    const order = await db.query.orders.findFirst({
      where: eq(orders.id, params.id),
      with: {
        items: {
          with: {
            variant: true,
          },
        },
      },
    });

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    const currentStatus = order.status;
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus] || [];
    if (!allowedTransitions.includes(status)) {
      return NextResponse.json(
        { error: `Cannot transition from ${currentStatus} to ${status}`, allowedTransitions },
        { status: 400 }
      );
    }

    const updateData: any = { status };
    const timestampField = STATUS_TIMESTAMPS[status];
    if (timestampField) updateData[timestampField] = new Date();
    if (status === 'CANCELLED' && cancellationReason) updateData.cancellationReason = cancellationReason;

    await db.transaction(async (tx) => {
      await tx.update(orders)
        .set({ ...updateData, updatedAt: new Date() })
        .where(eq(orders.id, params.id));

      if (status === 'CANCELLED' && currentStatus !== 'CANCELLED') {
        for (const item of order.items) {
          if (item.variantId && item.variant) {
            const currentStock = item.variant.stock;
            const qtyToRestore = item.qty;
            const newStock = currentStock + qtyToRestore;
            await tx.update(productVariants)
              .set({ stock: newStock, updatedAt: new Date() })
              .where(eq(productVariants.id, item.variantId));
            await tx.insert(inventoryLogs).values({
              productId: item.productId || null,
              variantId: item.variantId,
              type: 'RETURN',
              qtyChange: qtyToRestore,
              qtyBefore: currentStock,
              qtyAfter: newStock,
              unit: item.unit || 'ədəd',
              refType: 'ORDER',
              refId: params.id,
              notes: `Stock restored for cancelled order ${order.orderNumber}`,
              createdBy: payload.sub,
              createdAt: new Date(),
            });
          }
        }
      }
    });

    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, params.id),
      with: {
        items: {
          with: { variant: true },
        },
      },
    });

    return NextResponse.json({ order: updatedOrder });
  } catch (error) {
    console.error('[orders/[id]/status] error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid request data', details: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}