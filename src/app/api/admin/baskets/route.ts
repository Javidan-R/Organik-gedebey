// src/app/api/admin/baskets/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import { baskets, basketVariants, basketContents, basketExtras, basketMedia, basketProducts } from '@/lib/db/schema';
import { eq, and, desc, like, inArray, sql } from 'drizzle-orm';
import { z } from 'zod';

const createBasketSchema = z.object({
  name: z.string().min(2), slug: z.string().min(2), tagline: z.string().optional(), description: z.string().min(10),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']),
  servings: z.string().optional(), unit: z.string().default('səbət'), origin: z.string().optional(),
  freshness: z.string().optional(), nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().default(false), trending: z.boolean().default(false), new: z.boolean().default(false),
  lowStock: z.boolean().default(false), stock: z.number().default(0), discount: z.number().default(0),
  highlights: z.array(z.string()).optional(), displayOrder: z.number().default(0), isActive: z.boolean().default(true),
  metaTitle: z.string().optional(), metaDescription: z.string().optional(),
  variants: z.array(z.any()).optional(), products: z.array(z.any()).optional(),
});

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);
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
    const basketsData = await db.select().from(baskets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(baskets.displayOrder), desc(baskets.createdAt))
      .limit(limit).offset(offset);

    const basketIds = basketsData.map(b => b.id);
    const mediaData = basketIds.length ? await db.select().from(basketMedia).where(inArray(basketMedia.basketId, basketIds)) : [];
    const variantData = basketIds.length ? await db.select().from(basketVariants).where(inArray(basketVariants.basketId, basketIds)) : [];
    const productData = basketIds.length ? await db.select().from(basketProducts).where(inArray(basketProducts.basketId, basketIds)) : [];

    const variantIds = variantData.map(v => v.id);
    const contentsData = variantIds.length ? await db.select().from(basketContents).where(inArray(basketContents.basketVariantId, variantIds)) : [];
    const extrasData = variantIds.length ? await db.select().from(basketExtras).where(inArray(basketExtras.basketVariantId, variantIds)) : [];

    const enrichedBaskets = basketsData.map(basket => ({
      ...basket,
      media: mediaData.filter(m => m.basketId === basket.id),
      variants: variantData.filter(v => v.basketId === basket.id).map(v => ({
        ...v,
        contents: contentsData.filter(c => c.basketVariantId === v.id),
        extras: extrasData.filter(e => e.basketVariantId === v.id),
      })),
      products: productData.filter(p => p.basketId === basket.id),
    }));

    const totalResult = await db.select({ count: sql<number>`count(*)` }).from(baskets)
      .where(conditions.length > 0 ? and(...conditions) : undefined);
    const total = Number(totalResult[0]?.count ?? 0);

    return NextResponse.json({ baskets: enrichedBaskets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    console.error('Admin baskets GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const body = await request.json();
    const validatedData = createBasketSchema.parse(body);
    const [newBasket] = await db.insert(baskets).values({
      name: validatedData.name, slug: validatedData.slug, tagline: validatedData.tagline || '',
      description: validatedData.description, type: validatedData.type,
      servings: validatedData.servings || '', unit: validatedData.unit || 'səbət',
      origin: validatedData.origin || '', freshness: validatedData.freshness || '',
      nutrition: validatedData.nutrition || [], bestseller: validatedData.bestseller ?? false,
      trending: validatedData.trending ?? false, new: validatedData.new ?? false,
      lowStock: validatedData.lowStock ?? false, stock: validatedData.stock ?? 0,
      discount: validatedData.discount ?? 0, highlights: validatedData.highlights || [],
      displayOrder: validatedData.displayOrder || 0, isActive: validatedData.isActive ?? true,
      metaTitle: validatedData.metaTitle || '', metaDescription: validatedData.metaDescription || '',
      createdAt: new Date(), updatedAt: new Date(),
    }).returning();

    if (!newBasket) throw new Error('Basket yaradılmadı');
    const basketId = newBasket.id;

    if (validatedData.variants?.length) {
      for (const v of validatedData.variants) {
        const [variant] = await db.insert(basketVariants).values({
          basketId, variant: v.variant, price: v.price, originalPrice: v.originalPrice || null,
          stock: v.stock || 0, gift: v.gift || null, createdAt: new Date(), updatedAt: new Date(),
        }).returning();
        if (variant && v.contents?.length) await db.insert(basketContents).values(v.contents.map((c: any, i: number) => ({ basketVariantId: variant.id, content: c.content || c, displayOrder: i })));
        if (variant && v.extras?.length) await db.insert(basketExtras).values(v.extras.map((e: any, i: number) => ({ basketVariantId: variant.id, extra: e.extra || e, displayOrder: i })));
      }
    }
    if (validatedData.products?.length) {
      await db.insert(basketProducts).values(validatedData.products.map((p: any) => ({
        basketId, productId: p.productId, productVariantId: p.productVariantId || null,
        quantity: p.quantity || '1', unit: p.unit || 'əd', displayOrder: p.displayOrder || 0,
      })));
    }

    const fullBasket = await db.select().from(baskets).where(eq(baskets.id, basketId)).then(async ([b]) => {
      if (!b) throw new Error('Basket tapılmadı');
      const variants = await db.select().from(basketVariants).where(eq(basketVariants.basketId, basketId));
      const variantIds = variants.map(v => v.id);
      const contents = variantIds.length ? await db.select().from(basketContents).where(inArray(basketContents.basketVariantId, variantIds)) : [];
      const extras = variantIds.length ? await db.select().from(basketExtras).where(inArray(basketExtras.basketVariantId, variantIds)) : [];
      const bp = await db.select().from(basketProducts).where(eq(basketProducts.basketId, basketId));
      const media = await db.select().from(basketMedia).where(eq(basketMedia.basketId, basketId));
      return { ...b, variants: variants.map(v => ({ ...v, contents: contents.filter(c => c.basketVariantId === v.id), extras: extras.filter(e => e.basketVariantId === v.id) })), products: bp, media };
    });

    return NextResponse.json({ basket: fullBasket }, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) return NextResponse.json({ error: error.message }, { status: error.status });
    if (error instanceof z.ZodError) return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 });
    console.error('Baskets POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}