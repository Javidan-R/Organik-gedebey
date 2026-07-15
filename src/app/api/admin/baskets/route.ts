// src/app/api/admin/baskets/route.ts
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
import { eq, and, desc, like, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';
import { logger } from '@/lib/logger';

// ═══════════════════════════════════════════════════════════════
// Zod Validation Schema
// ═══════════════════════════════════════════════════════════════
const createBasketSchema = z.object({
  name: z.string().min(2, 'Ad ən azı 2 simvol olmalıdır'),
  slug: z.string().min(2, 'Slug ən azı 2 simvol olmalıdır'),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Təsvir ən azı 10 simvol olmalıdır'),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']),
  servings: z.string().optional(),
  unit: z.string().default('səbət'),
  origin: z.string().optional(),
  freshness: z.string().optional(),
  nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().default(false),
  trending: z.boolean().default(false),
  new: z.boolean().default(false),
  lowStock: z.boolean().default(false),
  stock: z.number().default(0),
  discount: z.number().min(0).max(100).default(0),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  variants: z
    .array(
      z.object({
        variant: z.enum(['econom', 'standard', 'premium']),
        price: z.string().min(1),
        originalPrice: z.string().optional(),
        stock: z.number().min(0).default(0),
        gift: z.string().optional(),
        contents: z
          .array(
            z.object({
              content: z.string(),
              displayOrder: z.number().optional(),
            })
          )
          .optional(),
        extras: z
          .array(
            z.object({
              extra: z.string(),
              displayOrder: z.number().optional(),
            })
          )
          .optional(),
      })
    )
    .optional(),
  products: z
    .array(
      z.object({
        productId: z.string().uuid(),
        productVariantId: z.string().uuid().nullable().optional(),
        quantity: z.string().default('1'),
        unit: z.string().default('əd'),
        displayOrder: z.number().optional(),
      })
    )
    .optional(),
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
// GET /api/admin/baskets
// ═══════════════════════════════════════════════════════════════
export async function GET(request: NextRequest) {
  try {
    // Auth yoxlaması
    await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const type = searchParams.get('type');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions: any[] = [];
    if (type) conditions.push(eq(baskets.type, type as any));
    if (status === 'active') conditions.push(eq(baskets.isActive, true));
    else if (status === 'archived') conditions.push(eq(baskets.archived, true));
    if (search) conditions.push(like(baskets.name, `%${search}%`));

    const offset = (page - 1) * limit;

    const basketsData = await db
      .select()
      .from(baskets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(baskets.displayOrder), desc(baskets.createdAt))
      .limit(limit)
      .offset(offset);

    // Əlaqəli məlumatları səmərəli şəkildə çəkək
    const basketIds = basketsData.map((b) => b.id);
    const mediaData = basketIds.length
      ? await db
          .select()
          .from(basketMedia)
          .where(inArray(basketMedia.basketId, basketIds))
      : [];
    const variantData = basketIds.length
      ? await db
          .select()
          .from(basketVariants)
          .where(inArray(basketVariants.basketId, basketIds))
      : [];
    const productData = basketIds.length
      ? await db
          .select()
          .from(basketProducts)
          .where(inArray(basketProducts.basketId, basketIds))
      : [];

    const variantIds = variantData.map((v) => v.id);
    const contentsData = variantIds.length
      ? await db
          .select()
          .from(basketContents)
          .where(inArray(basketContents.basketVariantId, variantIds))
      : [];
    const extrasData = variantIds.length
      ? await db
          .select()
          .from(basketExtras)
          .where(inArray(basketExtras.basketVariantId, variantIds))
      : [];

    const enrichedBaskets = basketsData.map((basket) => ({
      ...basket,
      media: mediaData.filter((m) => m.basketId === basket.id),
      variants: variantData
        .filter((v) => v.basketId === basket.id)
        .map((v) => ({
          ...v,
          contents: contentsData.filter(
            (c) => c.basketVariantId === v.id
          ),
          extras: extrasData.filter(
            (e) => e.basketVariantId === v.id
          ),
        })),
      products: productData.filter((p) => p.basketId === basket.id),
    }));

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(baskets)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({
      baskets: enrichedBaskets,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error('[Admin Baskets GET]', error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}

// ═══════════════════════════════════════════════════════════════
// POST /api/admin/baskets
// ═══════════════════════════════════════════════════════════════
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

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
    const parsed = createBasketSchema.safeParse(body);
    if (!parsed.success) {
      logger.warn('[Admin Baskets POST] Validation error', {
        issues: parsed.error.issues,
        body: JSON.stringify(body),
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

    // Slug unikallığını yoxla
    const existing = await db
      .select({ id: baskets.id })
      .from(baskets)
      .where(eq(baskets.slug, validatedData.slug))
      .limit(1);
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'Bu slug artıq mövcuddur' },
        { status: 409 }
      );
    }

    // Basket yarat (transaction ilə)
    const result = await db.transaction(async (tx) => {
      // 1. Əsas basketi yarat
      const [newBasket] = await tx
        .insert(baskets)
        .values({
          name: validatedData.name,
          slug: validatedData.slug,
          tagline: validatedData.tagline || '',
          description: validatedData.description,
          type: validatedData.type,
          servings: validatedData.servings || '',
          unit: validatedData.unit || 'səbət',
          origin: validatedData.origin || '',
          freshness: validatedData.freshness || '',
          nutrition: validatedData.nutrition || [],
          bestseller: validatedData.bestseller ?? false,
          trending: validatedData.trending ?? false,
          new: validatedData.new ?? false,
          lowStock: validatedData.lowStock ?? false,
          stock: validatedData.stock ?? 0,
          discount: validatedData.discount ?? 0,
          highlights: validatedData.highlights || [],
          displayOrder: validatedData.displayOrder || 0,
          isActive: validatedData.isActive ?? true,
          metaTitle: validatedData.metaTitle || '',
          metaDescription: validatedData.metaDescription || '',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!newBasket) {
        throw new Error('Basket yaradıla bilmədi');
      }

      const basketId = newBasket.id;

      // 2. Variantları əlavə et
      if (validatedData.variants?.length) {
        for (const v of validatedData.variants) {
          const [variant] = await tx
            .insert(basketVariants)
            .values({
              basketId,
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
            await tx.insert(basketContents).values(
              v.contents.map((c: any, i: number) => ({
                basketVariantId: variant.id,
                content: c.content,
                displayOrder: c.displayOrder ?? i,
              }))
            );
          }
          if (variant && v.extras?.length) {
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

      // 3. Məhsul tərkibini əlavə et
      if (validatedData.products?.length) {
        await tx.insert(basketProducts).values(
          validatedData.products.map((p: any) => ({
            basketId,
            productId: p.productId,
            productVariantId: p.productVariantId || null,
            quantity: p.quantity || '1',
            unit: p.unit || 'əd',
            displayOrder: p.displayOrder || 0,
          }))
        );
      }
// ✅ MEDIA əlavə et
  if (validatedData.media?.length) {
    await db.insert(basketMedia).values(
      validatedData.media.map((m, index) => ({
        basketId,
        type: m.type,
        url: m.url,
        altText: m.altText || null,
        displayOrder: m.displayOrder ?? index,
      }))
    );
  }
      return newBasket;
    });

    // Tam məlumatı qaytar
    const fullBasket = await db
      .select()
      .from(baskets)
      .where(eq(baskets.id, result.id))
      .then(async ([b]) => {
        if (!b) throw new Error('Basket tapılmadı');
        const variants = await db
          .select()
          .from(basketVariants)
          .where(eq(basketVariants.basketId, b.id));
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
          .where(eq(basketProducts.basketId, b.id));
        const media = await db
          .select()
          .from(basketMedia)
          .where(eq(basketMedia.basketId, b.id));

        return {
          ...b,
          variants: variants.map((v) => ({
            ...v,
            contents: contents.filter(
              (c) => c.basketVariantId === v.id
            ),
            extras: extras.filter(
              (e) => e.basketVariantId === v.id
            ),
          })),
          products,
          media,
        };
      });

    return NextResponse.json({ basket: fullBasket }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.status }
      );
    }
    logger.error('[Admin Baskets POST]', error);
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    );
  }
}