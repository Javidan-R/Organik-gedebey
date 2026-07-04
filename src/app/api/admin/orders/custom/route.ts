// src/app/api/admin/orders/custom/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { orders, orderItems } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';
import { z } from 'zod';

const createCustomOrderSchema = z.object({
  customerName: z.string().min(1),
  customerPhone: z.string().min(1),
  deliveryMethod: z.enum(['pickup', 'delivery']),
  address: z.string().optional(),
  note: z.string().optional(),
  items: z.array(z.object({
    productName: z.string(),
    quantity: z.number().min(1),
    price: z.number().optional(),
    note: z.string().optional(),
  })),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);

    const customOrders = await db
      .select()
      .from(orders)
      .where(sql`${orders.adminNotes} IS NOT NULL AND ${orders.adminNotes} LIKE '%CUSTOM ORDER%'`)
      .orderBy(desc(orders.createdAt));

    return NextResponse.json({ orders: customOrders });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Custom orders GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);

    const body = await request.json();
    const validated = createCustomOrderSchema.parse(body);

    const orderId = crypto.randomUUID();
    const orderNumber = `CUS-${orderId.slice(0, 8).toUpperCase()}`;
    const now = new Date();

    // Admin qeydlərinə xüsusi sifariş olduğunu yazırıq
    const adminNoteText = `CUSTOM ORDER - ${validated.customerName} | ${validated.items.map(i => `${i.productName} x${i.quantity}`).join(', ')}${validated.note ? ' | Qeyd: ' + validated.note : ''}`;

    const [newOrder] = await db
      .insert(orders)
      .values({
        id: orderId,
        orderNumber: orderNumber,
        customerName: validated.customerName,
        customerPhone: validated.customerPhone,
        deliveryAddressText: validated.deliveryMethod === 'delivery' ? (validated.address || 'Ünvan qeyd edilməyib') : 'Özü götürmə',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'CASH_ON_DELIVERY',
        subtotal: '0',
        total: '0',
        deliveryFee: '0',
        discountAmount: '0',
        couponDiscount: '0',
        customerNotes: validated.note || null,
        adminNotes: adminNoteText,
        createdAt: now,
        updatedAt: now,
      })
      .returning();

    if (newOrder) {
      const orderItemsValues = validated.items.map((item) => ({
        orderId: newOrder.id,
        productId: null,
        variantId: null,
        productName: item.productName,
        variantName: null,
        qty: item.quantity,
        priceAtOrder: item.price ? item.price.toString() : '0',
        costAtOrder: '0',
        subtotal: ((item.price || 0) * item.quantity).toString(),
        unit: null,
        createdAt: now,
      }));

      await db.insert(orderItems).values(orderItemsValues);
    }

    return NextResponse.json({ order: newOrder }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('Custom order POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}