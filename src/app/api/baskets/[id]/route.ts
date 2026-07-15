// src/app/api/baskets/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  baskets,
  basketVariants,
  basketContents,
  basketExtras,
  basketMedia,
  basketProducts,
} from '@/lib/db/schema';
import { eq, sql, inArray } from 'drizzle-orm';
import { z } from 'zod';

const updateBasketSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10).optional(),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']).optional(),
  servings: z.string().optional(),
  unit: z.string().optional(),
  origin: z.string().optional(),
  freshness: z.string().optional(),
  nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().optional(),
  trending: z.boolean().optional(),
  new: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  stock: z.number().optional(),
  discount: z.number().optional(),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  archived: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z.array(z.any()).optional(),
  products: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  const { id } = params;
  try {
    const [basket] = await db.select().from(baskets).where(eq(baskets.id, id));
    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 });
    }

    const variants = await db.select().from(basketVariants).where(eq(basketVariants.basketId, id));
    const variantIds = variants.map(v => v.id);
    const contents = variantIds.length
      ? await db.select().from(basketContents).where(inArray(basketContents.basketVariantId, variantIds))
      : [];
    const extras = variantIds.length
      ? await db.select().from(basketExtras).where(inArray(basketExtras.basketVariantId, variantIds))
      : [];
    const products = await db.select().from(basketProducts).where(eq(basketProducts.basketId, id));
    const media = await db.select().from(basketMedia).where(eq(basketMedia.basketId, id));

    const enriched = {
      ...basket,
      variants: variants.map(v => ({
        ...v,
        contents: contents.filter(c => c.basketVariantId === v.id),
        extras: extras.filter(e => e.basketVariantId === v.id),
      })),
      products,
      media,
    };

    return NextResponse.json({ basket: enriched });
  } catch (error) {
    logger.error(`Public basket ${id} GET error`, error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}
// ─── PATCH ────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 TƏHLÜKƏSİZLİK: Yalnız ADMIN və SUPERADMIN
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const { id } = params;
    const body = await request.json();
    const validatedData = updateBasketSchema.parse(body);

    const [updatedBasket] = await db
      .update(baskets)
      .set({
        name: validatedData.name,
        slug: validatedData.slug,
        tagline: validatedData.tagline,
        description: validatedData.description,
        type: validatedData.type,
        servings: validatedData.servings,
        unit: validatedData.unit,
        origin: validatedData.origin,
        freshness: validatedData.freshness,
        nutrition: validatedData.nutrition,
        bestseller: validatedData.bestseller,
        trending: validatedData.trending,
        new: validatedData.new,
        lowStock: validatedData.lowStock,
        stock: validatedData.stock,
        discount: validatedData.discount,
        highlights: validatedData.highlights,
        displayOrder: validatedData.displayOrder,
        isActive: validatedData.isActive,
        archived: validatedData.archived,
        metaTitle: validatedData.metaTitle,
        metaDescription: validatedData.metaDescription,
        updatedAt: new Date(),
      })
      .where(eq(baskets.id, id))
      .returning();

    if (!updatedBasket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 });
    }

    if (validatedData.variants) {
      await db.delete(basketVariants).where(eq(basketVariants.basketId, id));
      for (const v of validatedData.variants) {
        const [variant] = await db
          .insert(basketVariants)
          .values({
            basketId: id,
            variant: v.variant,
            price: v.price,
            originalPrice: v.originalPrice || null,
            stock: v.stock || 0,
            gift: v.gift || null,
            createdAt: new Date(),
            updatedAt: new Date(),
          })
          .returning();

        if (variant && v.contents?.length) {
          await db.insert(basketContents).values(
            v.contents.map((c: any, i: number) => ({
              basketVariantId: variant.id,
              content: c.content || c,
              displayOrder: i,
            }))
          );
        }
        if (variant && v.extras?.length) {
          await db.insert(basketExtras).values(
            v.extras.map((e: any, i: number) => ({
              basketVariantId: variant.id,
              extra: e.extra || e,
              displayOrder: i,
            }))
          );
        }
      }
    }

    if (validatedData.products) {
      await db.delete(basketProducts).where(eq(basketProducts.basketId, id));
      if (validatedData.products.length > 0) {
        await db.insert(basketProducts).values(
          validatedData.products.map((p: any) => ({
            basketId: id,
            productId: p.productId,
            productVariantId: p.productVariantId || null,
            quantity: p.quantity || '1',
            unit: p.unit || 'əd',
            displayOrder: p.displayOrder || 0,
          }))
        );
      }
    }

    const fullBasket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, id))
      .then(async ([b]) => {
        if (!b) throw new Error('Basket tapılmadı');
        const variants = await db.select().from(basketVariants).where(eq(basketVariants.basketId, id));
        const variantIds = variants.map((v) => v.id);
        const contents =
          variantIds.length > 0
            ? await db.select().from(basketContents).where(inArray(basketContents.basketVariantId, variantIds))
            : [];
        const extras =
          variantIds.length > 0
            ? await db.select().from(basketExtras).where(inArray(basketExtras.basketVariantId, variantIds))
            : [];
        const bp = await db.select().from(basketProducts).where(eq(basketProducts.basketId, id));
        const media = await db.select().from(basketMedia).where(eq(basketMedia.basketId, id));
        return {
          ...b,
          variants: variants.map((v) => ({
            ...v,
            contents: contents.filter((c) => c.basketVariantId === v.id),
            extras: extras.filter((e) => e.basketVariantId === v.id),
          })),
          products: bp,
          media,
        };
      });

    return NextResponse.json({ basket: fullBasket });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    }
    console.error('Basket PATCH error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── DELETE ───────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 🔒 TƏHLÜKƏSİZLİK: Yalnız ADMIN və SUPERADMIN
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const { id } = params;

    const [deletedBasket] = await db
      .update(baskets)
      .set({ archived: true, isActive: false, updatedAt: new Date() })
      .where(eq(baskets.id, id))
      .returning();

    if (!deletedBasket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 });
    }
    return NextResponse.json({ message: 'Səbət uğurla arxivləşdirildi' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Basket DELETE error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}