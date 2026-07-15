// src/app/api/admin/products/[id]/baskets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { baskets, basketProducts } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { z } from 'zod';

// ─── Schema ──────────────────────────────────────────────────────────────────
const addProductToBasketSchema = z.object({
  basketId: z.string().uuid(),
  basketVariantId: z.string().uuid().optional(),
  quantity: z.string().or(z.number()).default('1'),
  unit: z.string().default('əd'),
  displayOrder: z.number().default(0),
});

// ─── GET - Get baskets that contain this product ───────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const productId = params.id;

    // Find all baskets that contain this product
    const basketProductRelations = await db
      .select({
        basketId: basketProducts.basketId,
        basketVariantId: basketProducts.basketVariantId,
        productId: basketProducts.productId,
        productVariantId: basketProducts.productVariantId,
        quantity: basketProducts.quantity,
        unit: basketProducts.unit,
        displayOrder: basketProducts.displayOrder,
      })
      .from(basketProducts)
      .where(eq(basketProducts.productId, productId));

    if (basketProductRelations.length === 0) {
      return NextResponse.json({ baskets: [] });
    }

    // Get basket details
    const basketDetails = await db
      .select()
      .from(baskets)
      .where(eq(baskets.isActive, true));

    const enrichedBaskets = basketProductRelations.map((relation) => {
      const basket = basketDetails.find((b) => b.id === relation.basketId);
      return {
        ...relation,
        basket: basket || null,
      };
    });

    return NextResponse.json({ baskets: enrichedBaskets });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product baskets GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── POST - Add product to a basket ────────────────────────────────────────────
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const productId = params.id;
    const body = await request.json();
    const validatedData = addProductToBasketSchema.parse(body);

    // Verify basket exists
    const [basket] = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, validatedData.basketId))
      .limit(1);

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 });
    }

    // Check if product already in basket with same variant
    const existingRelations = await db
      .select()
      .from(basketProducts)
      .where(
        and(
          eq(basketProducts.basketId, validatedData.basketId),
          eq(basketProducts.productId, productId),
          validatedData.basketVariantId
            ? eq(basketProducts.basketVariantId, validatedData.basketVariantId)
            : undefined
        )
      );

    if (existingRelations.length > 0) {
      return NextResponse.json({ error: 'Məhsul artıq bu səbətdə var' }, { status: 409 });
    }

    // Add product to basket
    const [newRelation] = await db
      .insert(basketProducts)
      .values({
        basketId: validatedData.basketId,
        basketVariantId: validatedData.basketVariantId || null,
        productId,
        productVariantId: null, // Can be extended later
        quantity: validatedData.quantity.toString(),
        unit: validatedData.unit,
        displayOrder: validatedData.displayOrder,
      })
      .returning();

    return NextResponse.json({ relation: newRelation }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('Product baskets POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── DELETE - Remove product from a basket ───────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const productId = params.id;
    const { searchParams } = new URL(request.url);
    const basketId = searchParams.get('basketId');
    const basketVariantId = searchParams.get('basketVariantId');

    if (!basketId) {
      return NextResponse.json({ error: 'basketId tələb olunur' }, { status: 400 });
    }

    const conditions = [eq(basketProducts.basketId, basketId), eq(basketProducts.productId, productId)];
    if (basketVariantId) {
      conditions.push(eq(basketProducts.basketVariantId, basketVariantId));
    }

    await db
      .delete(basketProducts)
      .where(and(...conditions));

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product baskets DELETE error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}
