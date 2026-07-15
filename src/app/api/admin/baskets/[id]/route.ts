// src/app/api/admin/baskets/[id]/route.ts
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
import { eq, inArray } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// Zod Validation Schema (PATCH üçün)
// ═══════════════════════════════════════════════════════════════
const updateBasketSchema = z.object({
  name: z.string().min(2, 'Ad ən azı 2 simvol olmalıdır').optional(),
  slug: z.string().min(2, 'Slug ən azı 2 simvol olmalıdır').optional(),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Təsvir ən azı 10 simvol olmalıdır').optional(),
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
  stock: z.number().min(0).optional(),
  discount: z.number().min(0).max(100).optional(),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  archived: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z.array(
    z.object({
      id: z.string().optional(),
      variant: z.enum(['econom', 'standard', 'premium']),
      price: z.string().min(1),
      originalPrice: z.string().optional(),
      stock: z.number().min(0).default(0),
      gift: z.string().optional(),
      contents: z.array(
        z.object({
          id: z.string().optional(),
          content: z.string(),
          displayOrder: z.number().optional(),
        })
      ).optional(),
      extras: z.array(
        z.object({
          id: z.string().optional(),
          extra: z.string(),
          displayOrder: z.number().optional(),
        })
      ).optional(),
    })
  ).optional(),
  products: z.array(
    z.object({
      productId: z.string().uuid(),
      productVariantId: z.string().uuid().nullable().optional(),
      quantity: z.string().default('1'),
      unit: z.string().default('əd'),
      displayOrder: z.number().optional(),
    })
  ).optional(),
  media: z
    .array(
      z.object({
        type: z.enum(['image', 'video']),
        url: z.string().url(),
        altText: z.string().optional(),
        displayOrder: z.number().optional(),
      })
    )
    .optional(),
});

// ═══════════════════════════════════════════════════════════════
// GET /api/admin/baskets/[id] – Tək basketi detalları ilə gətir
// ═══════════════════════════════════════════════════════════════
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);
    const { id } = params;

    const basket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, id))
      .then(async ([b]) => {
        if (!b) return null;
        const variants = await db
          .select()
          .from(basketVariants)
          .where(eq(basketVariants.basketId, id));
        const variantIds = variants.map((v) => v.id);
        const contents = variantIds.length
          ? await db
              .select()
              .from(basketContents)
              .where(inArray(basketContents.basketVariantId, variantIds))
          : [];
        const extras = variantIds.length
          ? await db
              .select()
              .from(basketExtras)
              .where(inArray(basketExtras.basketVariantId, variantIds))
          : [];
        const products = await db
          .select()
          .from(basketProducts)
          .where(eq(basketProducts.basketId, id));
        const media = await db
          .select()
          .from(basketMedia)
          .where(eq(basketMedia.basketId, id));

        return {
          ...b,
          variants: variants.map((v) => ({
            ...v,
            contents: contents.filter((c) => c.basketVariantId === v.id),
            extras: extras.filter((e) => e.basketVariantId === v.id),
          })),
          products,
          media,
        };
      });

    if (!basket) {
      return NextResponse.json(
        { error: 'Səbət tapılmadı' },
        { status: 404 }
      );
    }

    return NextResponse.json({ basket });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error(`[Basket ${params.id} GET]`, error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// PATCH /api/admin/baskets/[id] – Basketi yenilə
// ═══════════════════════════════════════════════════════════════
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = params;

    // Body-ni parse et
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Yanlış JSON formatı' },
        { status: 400 }
      );
    }

    // Validasiya
    const parsed = updateBasketSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn(`[Basket ${id} PATCH] Validation error`, {
        issues: parsed.error.issues,
      });
      return NextResponse.json(
        {
          error: 'Validasiya xətası',
          details: parsed.error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }

    const validatedData = parsed.data;

    // Basketin mövcudluğunu yoxla
    const [existingBasket] = await db
      .select({ id: baskets.id })
      .from(baskets)
      .where(eq(baskets.id, id))
      .limit(1);

    if (!existingBasket) {
      return NextResponse.json(
        { error: 'Səbət tapılmadı' },
        { status: 404 }
      );
    }

    // Slug unikallığını yoxla (əgər slug dəyişirsə)
    if (validatedData.slug) {
      const [slugExists] = await db
        .select({ id: baskets.id })
        .from(baskets)
        .where(eq(baskets.slug, validatedData.slug))
        .limit(1);
      if (slugExists && slugExists.id !== id) {
        return NextResponse.json(
          { error: 'Bu slug artıq mövcuddur' },
          { status: 409 }
        );
      }
    }

    // Transaction ilə yeniləməni həyata keçir
    await db.transaction(async (tx) => {
      // 1. Əsas basket məlumatlarını yenilə
      await tx
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
        .where(eq(baskets.id, id));

      // 2. Variantları yenilə (köhnələri sil, yenilərini əlavə et)
      if (validatedData.variants !== undefined) {
        await tx
          .delete(basketVariants)
          .where(eq(basketVariants.basketId, id));

        if (validatedData.variants.length > 0) {
          for (const v of validatedData.variants) {
            const [variant] = await tx
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

            if (variant) {
              if (v.contents?.length) {
                await tx.insert(basketContents).values(
                  v.contents.map((c: any, i: number) => ({
                    basketVariantId: variant.id,
                    content: c.content,
                    displayOrder: c.displayOrder ?? i,
                  }))
                );
              }
              if (v.extras?.length) {
                await tx.insert(basketExtras).values(
                  v.extras.map((e: any, i: number) => ({
                    basketVariantId: variant.id,
                    extra: e.extra,
                    displayOrder: e.displayOrder ?? i,
                  }))
                );
              }
            }
          }
        }
      }

      // 3. Məhsul tərkibini yenilə
      if (validatedData.products !== undefined) {
        await tx
          .delete(basketProducts)
          .where(eq(basketProducts.basketId, id));

        if (validatedData.products.length > 0) {
          await tx.insert(basketProducts).values(
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
      if (validatedData.media !== undefined) {
    await tx.delete(basketMedia).where(eq(basketMedia.basketId, id));
    if (validatedData.media.length > 0) {
      await tx.insert(basketMedia).values(
        validatedData.media.map((m, index) => ({
          basketId: id,
          type: m.type,
          url: m.url,
          altText: m.altText || null,
          displayOrder: m.displayOrder ?? index,
        }))
      );
    }
  }

    });

    // Yenilənmiş tam məlumatı qaytar
    const fullBasket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, id))
      .then(async ([b]) => {
        if (!b) throw new Error('Basket tapılmadı');
        const variants = await db
          .select()
          .from(basketVariants)
          .where(eq(basketVariants.basketId, id));
        const variantIds = variants.map((v) => v.id);
        const contents = variantIds.length
          ? await db
              .select()
              .from(basketContents)
              .where(inArray(basketContents.basketVariantId, variantIds))
          : [];
        const extras = variantIds.length
          ? await db
              .select()
              .from(basketExtras)
              .where(inArray(basketExtras.basketVariantId, variantIds))
          : [];
        const products = await db
          .select()
          .from(basketProducts)
          .where(eq(basketProducts.basketId, id));
        const media = await db
          .select()
          .from(basketMedia)
          .where(eq(basketMedia.basketId, id));

        return {
          ...b,
          variants: variants.map((v) => ({
            ...v,
            contents: contents.filter((c) => c.basketVariantId === v.id),
            extras: extras.filter((e) => e.basketVariantId === v.id),
          })),
          products,
          media,
        };
      });

    return NextResponse.json({ basket: fullBasket });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          error: 'Validasiya xətası',
          details: error.issues.map((issue) => ({
            path: issue.path.join('.'),
            message: issue.message,
          })),
        },
        { status: 400 }
      );
    }
    logger.error(`[Basket ${params.id} PATCH]`, error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// DELETE /api/admin/baskets/[id] – Basketi arxivləşdir
// ═══════════════════════════════════════════════════════════════
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = params;

    // Basketin mövcudluğunu yoxla
    const [existingBasket] = await db
      .select({ id: baskets.id })
      .from(baskets)
      .where(eq(baskets.id, id))
      .limit(1);

    if (!existingBasket) {
      return NextResponse.json(
        { error: 'Səbət tapılmadı' },
        { status: 404 }
      );
    }

    await db
      .update(baskets)
      .set({
        archived: true,
        isActive: false,
        updatedAt: new Date(),
      })
      .where(eq(baskets.id, id));

    return NextResponse.json({
      message: 'Səbət uğurla arxivləşdirildi',
      success: true,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error(`[Basket ${params.id} DELETE]`, error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}