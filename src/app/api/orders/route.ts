// src/app/api/orders/route.ts
// FULL FILE – includes GET and POST with fixes

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  productVariants,
  inventoryLogs,
  notifications,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, or, sql, like, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { requireAdminAuth, optionalAuth, AuthError } from '@/lib/auth';

// ─── GET ──────────────────────────────────────────────────────────────────────

export async function GET(request: NextRequest) {
  try {
    await requireAdminAuth(request, ['ADMIN', 'MANAGER', 'COURIER']);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    const conditions = [];
    if (status && status !== 'all') conditions.push(eq(orders.status, status as any));
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )
      );
    }
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, endDate));
    }

    const offset = (page - 1) * limit;
    const ordersData = await (db.query as any).orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true,
          },
        },
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    });

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const count = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      orders: ordersData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Orders GET error:', error);
    return NextResponse.json({ error: 'Sifarişlər yüklənərkən xəta' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────────────────────

const createOrderSchema = z.object({
  id: z.string().uuid().optional(),
  deliveryAddressText: z.string().min(5).optional(),
  address: z.string().optional(),
  orderNumber: z.string().optional(),
  userId: z.string().uuid().nullable().optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email().nullable().optional(),
  customerPhone: z.string().min(9),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  subtotal: z.string(),
  discountAmount: z.string(),
  deliveryFee: z.string(),
  total: z.string(),
  couponCode: z.string().nullable().optional(),
  couponDiscount: z.string(),
  status: z.enum([
    'PENDING',
    'CONFIRMED',
    'PREPARING',
    'READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY',
    'DELIVERED',
    'CANCELLED',
    'REFUNDED',
  ]).optional(),
  paymentStatus: z.enum(['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD', 'BANK_TRANSFER']),
  deliveryDate: z.string().nullable().optional(),
  deliveryTimeSlot: z.string().nullable().optional(),
  courierId: z.string().uuid().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  actualDelivery: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  preparingAt: z.string().nullable().optional(),
  readyAt: z.string().nullable().optional(),
  outForDeliveryAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  items: z
    .array(
      z.object({
        id: z.string().uuid().optional(),
        productId: z.string().uuid(),
        variantId: z.string().uuid().nullable().or(z.literal('default')),
        productName: z.string(),
        variantName: z.string().nullable(),
        qty: z.number().positive().int(),
        unit: z.string().nullable(),
        priceAtOrder: z.string(),
        costAtOrder: z.string().nullable(),
        subtotal: z.string(),
        createdAt: z.string().optional(),
      })
    )
    .min(1, 'Ən azı 1 məhsul olmalıdır'),
  note: z.string().nullable().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // ✅ FIX: Use optionalAuth instead of requireAuth
    const { user } = await optionalAuth(request);
    const userId = user?.id || null;

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    // ✅ Normalize address
    const deliveryAddressText = validatedData.deliveryAddressText || validatedData.address || '';
    if (!deliveryAddressText) {
      return NextResponse.json(
        { error: 'Çatdırılma ünvanı tələb olunur' },
        { status: 400 }
      );
    }

    // ─── Resolve variants ──────────────────────────────────────────────────────
    const variantIds: string[] = [];
    const itemsWithResolvedVariants = await Promise.all(
      validatedData.items.map(async (item) => {
        if (item.variantId === 'default' || !item.variantId) {
          const defaultVariant = await (db.query as any).productVariants.findFirst({
            where: and(
              eq(productVariants.productId, item.productId),
              eq(productVariants.isDefault, true)
            ),
          });
          if (!defaultVariant) {
            throw new Error(`Default variant not found for product ${item.productId}`);
          }
          variantIds.push(defaultVariant.id);
          return { ...item, variantId: defaultVariant.id };
        }
        variantIds.push(item.variantId!);
        return item;
      })
    );

    // ─── Validate stock ────────────────────────────────────────────────────────
    const variantsData = await (db.query as any).productVariants.findMany({
      where: inArray(productVariants.id, variantIds),
      with: { product: true },
    });

    const foundIds = new Set(variantsData.map((v: any) => v.id));
    const missingIds = variantIds.filter((id) => !foundIds.has(id));
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Variant tapılmadı: ${missingIds.join(', ')}` },
        { status: 400 }
      );
    }

    for (const item of itemsWithResolvedVariants) {
      const variant = variantsData.find((v: any) => v.id === item.variantId);
      if (!variant) continue;
      if (variant.stock < item.qty) {
        return NextResponse.json(
          {
            error: `${variant.product.name} üçün kifayət qədər stok yoxdur. Mövcud: ${variant.stock}, Tələb: ${item.qty}`,
          },
          { status: 400 }
        );
      }
    }

    // ─── Generate order number ─────────────────────────────────────────────────
    const orderNumber =
      validatedData.orderNumber ||
      `ORG-${Date.now().toString().slice(-8)}-${Math.random()
        .toString(36)
        .substring(2, 6)
        .toUpperCase()}`;

    // ─── Transaction ──────────────────────────────────────────────────────────
    const result = await db.transaction(async (tx) => {
      // Insert order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: validatedData.id,
          orderNumber,
          userId: validatedData.userId || userId,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          deliveryAddressId: validatedData.deliveryAddressId,
          deliveryAddressText,
          address: validatedData.address || deliveryAddressText,
          subtotal: validatedData.subtotal,
          discountAmount: validatedData.discountAmount,
          deliveryFee: validatedData.deliveryFee,
          total: validatedData.total,
          couponCode: validatedData.couponCode,
          couponDiscount: validatedData.couponDiscount,
          status: validatedData.status || 'PENDING',
          paymentStatus: validatedData.paymentStatus || 'UNPAID',
          paymentMethod: validatedData.paymentMethod,
          deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
          deliveryTimeSlot: validatedData.deliveryTimeSlot,
          courierId: validatedData.courierId,
          trackingNumber: validatedData.trackingNumber,
          estimatedDelivery: validatedData.estimatedDelivery
            ? new Date(validatedData.estimatedDelivery)
            : null,
          actualDelivery: validatedData.actualDelivery
            ? new Date(validatedData.actualDelivery)
            : null,
          customerNotes: validatedData.customerNotes,
          adminNotes: validatedData.adminNotes,
          cancellationReason: validatedData.cancellationReason,
          rating: validatedData.rating,
          confirmedAt: validatedData.confirmedAt ? new Date(validatedData.confirmedAt) : null,
          preparingAt: validatedData.preparingAt ? new Date(validatedData.preparingAt) : null,
          readyAt: validatedData.readyAt ? new Date(validatedData.readyAt) : null,
          outForDeliveryAt: validatedData.outForDeliveryAt
            ? new Date(validatedData.outForDeliveryAt)
            : null,
          deliveredAt: validatedData.deliveredAt ? new Date(validatedData.deliveredAt) : null,
          cancelledAt: validatedData.cancelledAt ? new Date(validatedData.cancelledAt) : null,
          createdAt: validatedData.createdAt ? new Date(validatedData.createdAt) : new Date(),
          updatedAt: validatedData.updatedAt ? new Date(validatedData.updatedAt) : new Date(),
        })
        .returning();

      if (!newOrder) throw new Error('Sifariş yaradıla bilmədi');

      // Insert order items
      if (validatedData.items.length > 0) {
        await tx.insert(orderItems).values(
          validatedData.items.map((item: any) => ({
            id: item.id,
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            qty: item.qty,
            unit: item.unit,
            priceAtOrder: item.priceAtOrder,
            costAtOrder: item.costAtOrder,
            subtotal: item.subtotal,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          }))
        );
      }

      // Update stock and create inventory logs
      for (const item of itemsWithResolvedVariants) {
        const variant = variantsData.find((v: any) => v.id === item.variantId);
        if (!variant) continue;
        const newStock = variant.stock - item.qty;
        await tx
          .update(productVariants)
          .set({ stock: newStock, updatedAt: new Date() })
          .where(eq(productVariants.id, variant.id));

        await tx.insert(inventoryLogs).values({
          productId: variant.productId,
          variantId: variant.id,
          type: 'SALE',
          qtyChange: -item.qty,
          qtyBefore: variant.stock,
          qtyAfter: newStock,
          unit: variant.unit || 'ədəd',
          refType: 'ORDER',
          refId: newOrder.id,
          notes: `Sifariş #${orderNumber}`,
          createdBy: userId || undefined,
          createdAt: new Date(),
        });
      }

      // ─── Admin notification (best effort) ──────────────────────────────────
      try {
        const admins = await tx
          .select({ id: users.id })
          .from(users)
          .where(inArray(users.role, ['ADMIN', 'SUPERADMIN', 'MANAGER'] as any));

        if (admins.length > 0) {
          await tx.insert(notifications).values(
            admins.map((a) => ({
              userId: a.id,
              type: 'ORDER',
              title: `Yeni sifariş #${orderNumber}`,
              message: `${validatedData.customerName} - ${validatedData.total} ₼`,
              refType: 'ORDER',
              refId: newOrder.id,
              channel: 'APP',
              createdAt: new Date(),
            }))
          );
        }
      } catch (notifyError) {
        // Non-critical, log but don't fail transaction
        console.warn('[order] Notification failed:', notifyError);
      }

      return newOrder;
    });

    // ─── Fetch complete order ─────────────────────────────────────────────────
    const completeOrder = await (db.query as any).orders.findFirst({
      where: eq(orders.id, result.id),
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

    return NextResponse.json(
      { message: 'Sifariş uğurla yaradıldı', order: completeOrder },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('Order POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasiya xətası', details: error.issues },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: error.message || 'Sifariş yaradılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}