// src/app/api/admin/orders/custom/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { products, productVariants, users, orders, orderItems } from '@/lib/db/schema';
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { carts, cartItems } from '@/lib/db/schema/carts';

const quoteItemSchema = z.object({
  id: z.string().uuid(),
  adminPrice: z.number().min(0).optional(),
  isAvailable: z.boolean().optional(),
});

const patchSchema = z.object({
  action: z.enum(['quote', 'confirm', 'cancel']),
  items: z.array(quoteItemSchema).optional(),
  deliveryDate: z.string().optional(),
  deliveryTimeSlot: z.string().optional(),
  adminNote: z.string().optional(),
});

async function loadFullCart(id: string) {
  const [cart] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
  if (!cart) return null;

  const items = await db.select().from(cartItems).where(eq(cartItems.cartId, id));
  const [user] = await db.select().from(users).where(eq(users.id, cart.userId)).limit(1);

  const productIds = [...new Set(items.map((i) => i.productId).filter(Boolean))] as string[];
  const variantIds = [...new Set(items.map((i) => i.variantId).filter(Boolean))] as string[];

  const [productRows, variantRows] = await Promise.all([
    productIds.length ? db.select().from(products).where(inArray(products.id, productIds)) : Promise.resolve([]),
    variantIds.length ? db.select().from(productVariants).where(inArray(productVariants.id, variantIds)) : Promise.resolve([]),
  ]);
  const productMap = new Map(productRows.map((p) => [p.id, p]));
  const variantMap = new Map(variantRows.map((v) => [v.id, v]));

  const enrichedItems = items.map((i) => {
    const product = i.productId ? productMap.get(i.productId) : undefined;
    const variant = i.variantId ? variantMap.get(i.variantId) : undefined;
    const catalogPrice = variant?.basePrice != null ? Number(variant.basePrice) : Number(product?.basePrice ?? 0);
    return {
      ...i,
      productName: i.isCustom ? i.customName : product?.name ?? 'Silinmiş məhsul',
      catalogPrice: i.isCustom ? null : catalogPrice,
      costPrice: variant?.costPrice != null ? Number(variant.costPrice) : null,
    };
  });

  return { ...cart, user, items: enrichedItems };
}

export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);
    const { id } = await params;
    const full = await loadFullCart(id);
    if (!full) return NextResponse.json({ error: 'Sorğu tapılmadı' }, { status: 404 });
    return NextResponse.json({ order: full });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Custom order GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = await params;
    const body = await request.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Validasiya xətası', details: parsed.error.issues }, { status: 400 });
    }
    const data = parsed.data;

    const [cart] = await db.select().from(carts).where(eq(carts.id, id)).limit(1);
    if (!cart) return NextResponse.json({ error: 'Sorğu tapılmadı' }, { status: 404 });

    // ─── 1) QUOTE: admin hər item-ə qiymət/mövcudluq təyin edir ─────────
    if (data.action === 'quote') {
      if (data.items) {
        for (const item of data.items) {
          const updates: any = {};
          if (item.adminPrice !== undefined) updates.adminPrice = String(item.adminPrice);
          if (item.isAvailable !== undefined) updates.isAvailable = item.isAvailable;
          if (Object.keys(updates).length > 0) {
            await db.update(cartItems).set(updates).where(eq(cartItems.id, item.id));
          }
        }
      }

      const allItems = await db.select().from(cartItems).where(eq(cartItems.cartId, id));
      const productIds = [...new Set(allItems.map((i) => i.productId).filter(Boolean))] as string[];
      const variantIds = [...new Set(allItems.map((i) => i.variantId).filter(Boolean))] as string[];
      const [productRows, variantRows] = await Promise.all([
        productIds.length ? db.select().from(products).where(inArray(products.id, productIds)) : Promise.resolve([]),
        variantIds.length ? db.select().from(productVariants).where(inArray(productVariants.id, variantIds)) : Promise.resolve([]),
      ]);
      const productMap = new Map(productRows.map((p) => [p.id, p]));
      const variantMap = new Map(variantRows.map((v) => [v.id, v]));

      let totalQuoted = 0;
      for (const item of allItems) {
        if (item.isCustom) {
          if (item.isAvailable === false) continue; // tapılmayan məhsul cəmə daxil edilmir
          const price = item.adminPrice != null ? Number(item.adminPrice) : 0;
          totalQuoted += price * item.quantity;
        } else {
          const variant = item.variantId ? variantMap.get(item.variantId) : undefined;
          const product = item.productId ? productMap.get(item.productId) : undefined;
          const price = item.adminPrice != null
            ? Number(item.adminPrice)
            : (variant?.basePrice != null ? Number(variant.basePrice) : Number(product?.basePrice ?? 0));
          totalQuoted += price * item.quantity;
        }
      }

      const [updated] = await db
        .update(carts)
        .set({
          status: 'quoted',
          totalQuoted: totalQuoted.toFixed(2),
          deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : cart.deliveryDate,
          deliveryTimeSlot: data.deliveryTimeSlot ?? cart.deliveryTimeSlot,
          adminNote: data.adminNote ?? cart.adminNote,
          quotedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(carts.id, id))
        .returning();

      const full = await loadFullCart(updated.id);
      return NextResponse.json({ order: full });
    }

    // ─── 2) CANCEL ────────────────────────────────────────────────────
    if (data.action === 'cancel') {
      const [updated] = await db
        .update(carts)
        .set({ status: 'cancelled', updatedAt: new Date() })
        .where(eq(carts.id, id))
        .returning();
      const full = await loadFullCart(updated.id);
      return NextResponse.json({ order: full });
    }

    // ─── 3) CONFIRM: real sifariş yaradırıq ────────────────────────────
    if (data.action === 'confirm') {
      const full = await loadFullCart(id);
      if (!full) return NextResponse.json({ error: 'Sorğu tapılmadı' }, { status: 404 });

      const includedItems = full.items.filter((i) => i.isAvailable !== false);
      if (includedItems.length === 0) {
        return NextResponse.json({ error: 'Sifarişə daxil ediləcək heç bir məhsul yoxdur' }, { status: 400 });
      }

      const result = await db.transaction(async (tx) => {
        const orderNumber = `CUSTOM-${Date.now().toString(36).toUpperCase()}`;
        const total = includedItems.reduce((sum, item) => {
          const price = item.isCustom
            ? Number(item.adminPrice ?? 0)
            : Number(item.adminPrice ?? item.catalogPrice ?? 0);
          return sum + price * item.quantity;
        }, 0);

        const customerFullName = full.user
          ? `${full.user.firstName || ''} ${full.user.lastName || ''}`.trim()
          : 'Müştəri';

        const [newOrder] = await tx
          .insert(orders)
          .values({
            orderNumber,
            userId: full.userId,
            customerName: customerFullName || 'Müştəri',
            customerPhone: full.customerPhone,
            deliveryAddressText: 'Əlaqə zamanı dəqiqləşdiriləcək',
            subtotal: total.toFixed(2),
            discountAmount: '0',
            deliveryFee: '0',
            total: total.toFixed(2),
            status: 'PENDING',
            paymentStatus: 'UNPAID',
            paymentMethod: 'CASH_ON_DELIVERY',
            customerNotes: full.customerNote ?? null,
            adminNotes: data.adminNote ?? full.adminNote ?? null,
            deliveryDate: data.deliveryDate ? new Date(data.deliveryDate) : full.deliveryDate,
            deliveryTimeSlot: data.deliveryTimeSlot ?? full.deliveryTimeSlot,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        await tx.insert(orderItems).values(
          includedItems.map((item) => {
            const price = item.isCustom
              ? Number(item.adminPrice ?? 0)
              : Number(item.adminPrice ?? item.catalogPrice ?? 0);
            return {
              orderId: newOrder.id,
              productId: item.isCustom ? null : item.productId,
              variantId: item.isCustom ? null : item.variantId,
              productName: item.productName,
              variantName: null,
              qty: item.quantity,
              priceAtOrder: price.toFixed(2),
              costAtOrder: (item.costPrice ?? 0).toFixed(2),
              subtotal: (price * item.quantity).toFixed(2),
              createdAt: new Date(),
            };
          })
        );

        const [updatedCart] = await tx
          .update(carts)
          .set({
            status: 'confirmed',
            orderId: newOrder.id,
            confirmedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(carts.id, id))
          .returning();

        return { newOrder, updatedCart };
      });

      const finalCart = await loadFullCart(result.updatedCart.id);
      return NextResponse.json({ order: finalCart, createdOrder: result.newOrder });
    }

    return NextResponse.json({ error: 'Bilinməyən əməliyyat' }, { status: 400 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Custom order PATCH error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}