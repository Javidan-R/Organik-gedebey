// ============================================================
// src/app/api/cart/route.ts – Müştəri səbəti (Cart) API
// ============================================================

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { carts, cartItems, products, productVariants } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt';

// ─── Schema ──────────────────────────────────────────────────────────────────
const addItemSchema = z.object({
  productId: z.string().optional(),
  variantId: z.string().optional(),
  customName: z.string().optional(),
  customPrice: z.number().optional(),
  quantity: z.number().min(1).default(1),
  note: z.string().optional(),
});

const updateItemSchema = z.object({
  quantity: z.number().min(1),
});

// ─── Köməkçi – istifadəçi ID-si ──────────────────────────────────────────
async function getUserId(request: NextRequest): Promise<string | null> {
  const cookie = request.cookies.get(COOKIE_CUSTOMER);
  if (!cookie?.value) return null;
  const payload = await verifyCustomerToken(cookie.value);
  return payload?.sub || null;
}

// ─── GET – Səbəti oxu ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
  }

  try {
    let cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
      .then(rows => rows[0]);

    if (!cart) {
      // Yeni səbət yarat
      const [newCart] = await db
        .insert(carts)
        .values({
          userId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      cart = newCart;
    }

    // Səbət bəndlərini çək
    const items = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.cartId, cart.id));

    // Hər bənd üçün məhsul və variant məlumatlarını əlavə et
    const enrichedItems = await Promise.all(
      items.map(async (item) => {
        let product = null;
        let variant = null;
        if (item.productId) {
          product = await db.select().from(products).where(eq(products.id, item.productId)).then(rows => rows[0] || null);
        }
        if (item.variantId) {
          variant = await db.select().from(productVariants).where(eq(productVariants.id, item.variantId)).then(rows => rows[0] || null);
        }
        return { ...item, product, variant };
      })
    );

    return NextResponse.json({
      cart: {
        ...cart,
        items: enrichedItems,
      },
    });
  } catch (error) {
    console.error('Cart GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── POST – Səbətə əlavə et ──────────────────────────────────────────────
export async function POST(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const validated = addItemSchema.parse(body);

    // Aktiv səbəti tap
    let cart = await db
      .select()
      .from(carts)
      .where(and(eq(carts.userId, userId), eq(carts.status, 'active')))
      .then(rows => rows[0]);

    if (!cart) {
      const [newCart] = await db
        .insert(carts)
        .values({
          userId,
          status: 'active',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      cart = newCart;
    }

    // Əgər custom məhsuldursa (productId yoxdur)
    if (!validated.productId && validated.customName && validated.customPrice) {
      // Custom məhsulu birbaşa əlavə et
      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          customName: validated.customName,
          customPrice: validated.customPrice,
          quantity: validated.quantity,
          note: validated.note || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return NextResponse.json({ item: newItem }, { status: 201 });
    }

    // Mövcud məhsul
    if (!validated.productId) {
      return NextResponse.json({ error: 'Məhsul ID-si tələb olunur' }, { status: 400 });
    }

    // Eyni məhsul/variant artıq səbətdə varmı?
    const existing = await db
      .select()
      .from(cartItems)
      .where(
        and(
          eq(cartItems.cartId, cart.id),
          eq(cartItems.productId, validated.productId),
          validated.variantId ? eq(cartItems.variantId, validated.variantId) : sql`true`
        )
      )
      .then(rows => rows[0]);

    if (existing) {
      // Miqdarı artır
      const [updated] = await db
        .update(cartItems)
        .set({ quantity: existing.quantity + validated.quantity, updatedAt: new Date() })
        .where(eq(cartItems.id, existing.id))
        .returning();
      return NextResponse.json({ item: updated });
    } else {
      const [newItem] = await db
        .insert(cartItems)
        .values({
          cartId: cart.id,
          productId: validated.productId,
          variantId: validated.variantId || null,
          quantity: validated.quantity,
          note: validated.note || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();
      return NextResponse.json({ item: newItem }, { status: 201 });
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('Cart POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── PATCH – Səbət bəndini yenilə ──────────────────────────────────────────
export async function PATCH(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'itemId tələb olunur' }, { status: 400 });
    }

    const body = await request.json();
    const validated = updateItemSchema.parse(body);

    // Bəndin sahibini yoxla
    const item = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .then(rows => rows[0]);

    if (!item) {
      return NextResponse.json({ error: 'Bənd tapılmadı' }, { status: 404 });
    }

    const cart = await db
      .select()
      .from(carts)
      .where(eq(carts.id, item.cartId))
      .then(rows => rows[0]);

    if (!cart || cart.userId !== userId) {
      return NextResponse.json({ error: 'Icazə yoxdur' }, { status: 403 });
    }

    const [updated] = await db
      .update(cartItems)
      .set({ quantity: validated.quantity, updatedAt: new Date() })
      .where(eq(cartItems.id, itemId))
      .returning();

    return NextResponse.json({ item: updated });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('Cart PATCH error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── DELETE – Səbət bəndini sil ────────────────────────────────────────────
export async function DELETE(request: NextRequest) {
  const userId = await getUserId(request);
  if (!userId) {
    return NextResponse.json({ error: 'Giriş tələb olunur' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get('itemId');
    if (!itemId) {
      return NextResponse.json({ error: 'itemId tələb olunur' }, { status: 400 });
    }

    const item = await db
      .select()
      .from(cartItems)
      .where(eq(cartItems.id, itemId))
      .then(rows => rows[0]);

    if (!item) {
      return NextResponse.json({ error: 'Bənd tapılmadı' }, { status: 404 });
    }

    const cart = await db
      .select()
      .from(carts)
      .where(eq(carts.id, item.cartId))
      .then(rows => rows[0]);

    if (!cart || cart.userId !== userId) {
      return NextResponse.json({ error: 'Icazə yoxdur' }, { status: 403 });
    }

    await db.delete(cartItems).where(eq(cartItems.id, itemId));
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Cart DELETE error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}