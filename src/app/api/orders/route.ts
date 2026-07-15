// src/app/api/orders/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  orders,
  orderItems,
  productVariants,
  users,
} from '@/lib/db/schema';
import { eq, and, desc, gte, lte, sql, like, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { resolveVariant } from '@/lib/utils/variant-utils';
import { fromDisplayStatus } from '@/lib/utils/order-utils';
import type { OrderStatus } from '@/types/orders';
import { NotificationEvents } from '@/lib/services/notificationEvents';
import { AuthError, optionalAuth } from '@/lib/auth';

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const auth = await optionalAuth(request);
    const isAdmin = auth.user?.role && ['ADMIN', 'SUPERADMIN', 'MANAGER', 'COURIER'].includes(auth.user.role);
    const userId = auth.user?.id ?? null;

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const statusParam = searchParams.get('status');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');

    let dbStatus: OrderStatus | undefined;
    if (statusParam && statusParam !== 'all') {
      dbStatus = fromDisplayStatus(statusParam as any) as OrderStatus;
    }

    const conditions: Array<
      ReturnType<typeof eq> | ReturnType<typeof like> | ReturnType<typeof gte> | ReturnType<typeof lte>
    > = [];

    if (dbStatus) conditions.push(eq(orders.status, dbStatus));

    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)));
    if (dateTo) {
      const endDate = new Date(dateTo);
      endDate.setHours(23, 59, 59, 999);
      conditions.push(lte(orders.createdAt, endDate));
    }

    if (!isAdmin && userId) {
      conditions.push(eq(orders.userId, userId));
    } else if (!isAdmin && !userId) {
      return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;
    const offset = (page - 1) * limit;

    const ordersData = await db.query.orders.findMany({
      where: whereClause,
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

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(whereClause);
    const count = Number(countResult[0]?.count ?? 0);

    return NextResponse.json({
      orders: ordersData,
      pagination: { page, limit, total: count, totalPages: Math.ceil(count / limit) },
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
    'PENDING','CONFIRMED','PREPARING','READY_FOR_DELIVERY',
    'OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUNDED'
  ]).optional(),
  paymentStatus: z.enum(['UNPAID','PAID','PARTIALLY_REFUNDED','REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY','CARD','BANK_TRANSFER']),
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
  items: z.array(
    z.object({
      id: z.string().uuid().optional(),
      productId: z.string().uuid(),
      variantId: z.string().uuid().nullable().optional().or(z.literal('default')).default('default'),
      productName: z.string(),
      variantName: z.string().nullable(),
      qty: z.number().positive().int(),
      unit: z.string().nullable(),
      priceAtOrder: z.string(),
      costAtOrder: z.string().nullable(),
      subtotal: z.string(),
      createdAt: z.string().optional(),
    })
  ).min(1, 'Ən azı 1 məhsul olmalıdır'),
  note: z.string().nullable().optional(),
});

type OrderItemInput = z.infer<typeof createOrderSchema>['items'][number];
type ResolvedOrderItem = OrderItemInput & {
  variantId: string;
  productId: string;
  priceAtOrder: string;
  stock: number;
  unit: string | null;
  isProductFallback: boolean;
  costPrice?: number;
};

export async function POST(request: NextRequest) {
  try {
    const auth = await optionalAuth(request);
    const authenticatedUserId = auth?.user?.id ?? null;

    const body = await request.json();
    const validatedData = createOrderSchema.parse(body);

    const deliveryAddressText = validatedData.deliveryAddressText || validatedData.address || '';
    if (!deliveryAddressText) {
      return NextResponse.json({ error: 'Çatdırılma ünvanı tələb olunur' }, { status: 400 });
    }

    const resolvedItems: ResolvedOrderItem[] = await Promise.all(
      validatedData.items.map(async (item) => {
        const resolved = await resolveVariant(item.productId, item.variantId);
        return {
          ...item,
          variantId: resolved.variantId,
          productId: resolved.productId,
          priceAtOrder: resolved.price.toFixed(2),
          stock: resolved.stock,
          unit: resolved.unit || item.unit,
          isProductFallback: resolved.isProductFallback,
          costPrice: resolved.costPrice,
        };
      })
    );

    const variantIds = resolvedItems
      .filter((item) => !item.isProductFallback)
      .map((item) => item.variantId)
      .filter((id): id is string => !!id);

    let variantsData: Array<{ id: string; productId: string; stock: number; unit: string | null }> = [];
    if (variantIds.length > 0) {
      variantsData = await db.query.productVariants.findMany({
        where: inArray(productVariants.id, variantIds),
        columns: { id: true, productId: true, stock: true, unit: true },
      });
    }

    const variantMap = new Map(variantsData.map((v) => [v.id, v]));

    for (const item of resolvedItems) {
      let availableStock = item.stock;
      if (!item.isProductFallback) {
        const variant = variantMap.get(item.variantId);
        if (variant) {
          availableStock = variant.stock;
        } else {
          return NextResponse.json({ error: `Variant ${item.variantId} tapılmadı` }, { status: 400 });
        }
      }
      if (availableStock < item.qty) {
        const productName = item.productName || 'Məhsul';
        return NextResponse.json(
          { error: `${productName} üçün kifayət qədər stok yoxdur. Mövcud: ${availableStock}, Tələb: ${item.qty}` },
          { status: 400 }
        );
      }
    }

    const orderNumber =
      validatedData.orderNumber ||
      `ORG-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    const result = await db.transaction(async (tx) => {
      const [newOrder] = await tx
        .insert(orders)
        .values({
          id: validatedData.id,
          orderNumber,
          userId: validatedData.userId || authenticatedUserId,
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
          estimatedDelivery: validatedData.estimatedDelivery ? new Date(validatedData.estimatedDelivery) : null,
          actualDelivery: validatedData.actualDelivery ? new Date(validatedData.actualDelivery) : null,
          customerNotes: validatedData.customerNotes,
          adminNotes: validatedData.adminNotes,
          cancellationReason: validatedData.cancellationReason,
          rating: validatedData.rating,
          confirmedAt: validatedData.confirmedAt ? new Date(validatedData.confirmedAt) : null,
          preparingAt: validatedData.preparingAt ? new Date(validatedData.preparingAt) : null,
          readyAt: validatedData.readyAt ? new Date(validatedData.readyAt) : null,
          outForDeliveryAt: validatedData.outForDeliveryAt ? new Date(validatedData.outForDeliveryAt) : null,
          deliveredAt: validatedData.deliveredAt ? new Date(validatedData.deliveredAt) : null,
          cancelledAt: validatedData.cancelledAt ? new Date(validatedData.cancelledAt) : null,
          createdAt: validatedData.createdAt ? new Date(validatedData.createdAt) : new Date(),
          updatedAt: validatedData.updatedAt ? new Date(validatedData.updatedAt) : new Date(),
        })
        .returning();

      if (!newOrder) throw new Error('Sifariş yaradıla bilmədi');

      if (validatedData.items.length > 0) {
        await tx.insert(orderItems).values(
          validatedData.items.map((item, index) => {
            const resolved = resolvedItems[index];
            if (!resolved) throw new Error('Resolved variant not found');
            return {
              id: item.id,
              orderId: newOrder.id,
              productId: item.productId,
              variantId: resolved.variantId,
              productName: item.productName,
              variantName: item.variantName,
              qty: item.qty,
              unit: resolved.unit || item.unit,
              priceAtOrder: resolved.priceAtOrder,
              costAtOrder: item.costAtOrder || (resolved.costPrice ? resolved.costPrice.toFixed(2) : null),
              subtotal: item.subtotal || (parseFloat(resolved.priceAtOrder) * item.qty).toFixed(2),
              createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
            };
          })
        );
      }

      return newOrder;
    });

    // ─── Order yaradıldıqdan sonra adminlərə notification göndər ───
    try {
      // Bütün admin rollu istifadəçiləri tap
      const adminUsers = await db
        .select({ id: users.id })
        .from(users)
        .where(inArray(users.role, ['ADMIN', 'SUPERADMIN', 'MANAGER']));

      if (adminUsers.length > 0) {
        // Hər admin üçün ayrıca notification yarat
        for (const admin of adminUsers) {
          await NotificationEvents.orderCreated({
            userId: admin.id,
            orderId: result.id,
          });
        }
      }
    } catch (notifyError) {
      console.warn('[order] Notification failed:', notifyError);
      // Bildiriş xətası sifariş yaradılmasına mane olmur
    }

    const completeOrder = await db.query.orders.findFirst({
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
  } catch (error) {
    console.error('Order POST error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Sifariş yaradılarkən xəta baş verdi' },
      { status: 500 }
    );
  }
}