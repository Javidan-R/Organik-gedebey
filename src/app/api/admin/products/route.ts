// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  products,
  productVariants,
  productImages,
  productTags,
} from '@/lib/db/schema';
import { eq, desc, and, like, sql } from 'drizzle-orm';
import { z } from 'zod';
import { formatProducts, formatProductWithRelations } from '@/lib/utils/productFormatter';

// ─── Coercion helpers ─────────────────────────────────────────
const coerceNumber = z.preprocess(
  (val) => (val === null || val === undefined || val === '' ? undefined : Number(val)),
  z.number().optional()
);

const coerceBoolean = z.preprocess(
  (val) => (val === null || val === undefined ? undefined : val === 'true' || val === true),
  z.boolean().optional()
);

const coerceString = z.preprocess(
  (val) => (val === null || val === undefined ? undefined : String(val)),
  z.string().optional()
);

const coerceStringArray = z.preprocess(
  (val) => (val === null || val === undefined ? undefined : Array.isArray(val) ? val : []),
  z.array(z.string()).optional()
);

const optionalUuid = z.preprocess(
  (val) => (val === '' || val === null || val === undefined ? undefined : val),
  z.string().uuid().optional()
);

// ✅ discountType üçün null və kiçik hərfləri idarə et
const discountTypeSchema = z.preprocess(
  (val) => {
    if (val === null || val === undefined || val === '') return undefined;
    const upper = String(val).toUpperCase();
    if (upper === 'PERCENTAGE' || upper === 'FIXED') return upper;
    return undefined;
  },
  z.enum(['PERCENTAGE', 'FIXED']).optional()
);

// ─── Variant Schema ──────────────────────────────────────────
const variantSchema = z.object({
  id: z.string().optional(),
  name: z.string().min(1, 'Variant adı tələb olunur'),
  price: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0)
  ),
  stock: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0)
  ),
  costPrice: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0)
  ).optional(),
  arrivalCost: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 0 : Number(v)),
    z.number().min(0)
  ).optional(),
  minStock: z.preprocess(
    (v) => (v === '' || v === null || v === undefined ? 10 : Number(v)),
    z.number().min(0)
  ).optional(),
  unit: z.string().optional(),
  grade: z.string().optional(),
  batchDate: z.string().optional(),
  isDefault: z.boolean().optional(),
});

const imageSchema = z.object({
  id: z.string().optional(),
  url: z.string().min(1, 'Şəkil URL-i tələb olunur'),
  alt: z.string().optional(),
  displayOrder: z.number().optional(),
});

// ─── Create Schema ────────────────────────────────────────────
const createProductSchema = z.object({
  name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  slug: z.string().min(2, 'Slug ən az 2 simvol olmalıdır'),
  description: coerceString,
  shortDescription: coerceString,
  categoryId: optionalUuid,
  basePrice: z.preprocess(
    (val) => (val === null || val === undefined ? undefined : Number(val)),
    z.number().min(0, 'Müsbət rəqəm olmalıdır')
  ),
  costPrice: coerceNumber,
  discountType: discountTypeSchema,
  discountValue: coerceNumber,
  discountStart: coerceString,
  discountEnd: coerceString,
  unit: z.string().default('ədəd'),
  grade: z.enum(['A', 'B', 'C', 'UNSORTED']).default('A')
    .or(z.enum(['a', 'b', 'c', 'unsorted']).transform(v => v.toUpperCase())),
  minStock: z.preprocess(
    (val) => (val === null || val === undefined ? 10 : Number(val)),
    z.number().default(10)
  ),
  originRegion: coerceString,
  supplier: coerceString,
  shelfLifeDays: coerceNumber,
  storageConditions: coerceString,
  isOrganic: coerceBoolean,
  isGlutenFree: coerceBoolean,
  isVegan: coerceBoolean,
  caloriesPer100g: coerceNumber,
  proteinPer100g: coerceString,
  carbsPer100g: coerceString,
  fatPer100g: coerceString,
  isFeatured: coerceBoolean,
  isNewArrival: coerceBoolean,
  metaTitle: coerceString,
  metaDescription: coerceString,
  metaKeywords: coerceStringArray,
  variants: z.array(variantSchema).min(1, 'Ən azı 1 variant olmalıdır'),
  images: z.array(imageSchema).optional(),
  tags: coerceStringArray,
});

// ─── GET ──────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');
    const category = searchParams.get('category');
    const status = searchParams.get('status');
    const search = searchParams.get('search');

    const conditions = [];
    if (category) conditions.push(eq(products.categoryId, category));
    if (status === 'active') conditions.push(eq(products.archived, false));
    else if (status === 'archived') conditions.push(eq(products.archived, true));
    if (search) conditions.push(like(products.name, `%${search}%`));

    const offset = (page - 1) * limit;

    const productsData = await db.query.products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: desc(products.createdAt),
      limit,
      offset,
      with: {
        variants: true,
        images: true,
        tags: true,
      },
    });

    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined);

    const total = Number(countResult[0]?.count ?? 0);

    const formatted = formatProducts(productsData);

    return NextResponse.json({
      products: formatted,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Products GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── POST ─────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const body = await request.json();

    const parsed = createProductSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Validasiya xətası',
          details: parsed.error.issues.map(i => ({
            path: i.path.join('.'),
            message: i.message,
          })),
        },
        { status: 400 }
      );
    }

    const data = parsed.data;

    const newProduct = await db.transaction(async (tx) => {
      // 1. Product
      const [insertedProduct] = await tx
        .insert(products)
        .values({
          name: data.name as string,
          slug: data.slug as string,
          description: data.description ?? null,
          shortDescription: data.shortDescription ?? null,
          categoryId: data.categoryId ?? null,
          basePrice: data.basePrice != null ? String(data.basePrice) : '0',
          costPrice: data.costPrice != null ? String(data.costPrice) : null,
          discountType: data.discountType ?? null,
          discountValue: data.discountValue != null ? String(data.discountValue) : null,
          discountStart: data.discountStart ? new Date(data.discountStart) : null,
          discountEnd: data.discountEnd ? new Date(data.discountEnd) : null,
          unit: data.unit || 'ədəd',
          grade: data.grade || 'A',
          minStock: data.minStock ?? 10,
          originRegion: data.originRegion ?? null,
          supplier: data.supplier ?? null,
          shelfLifeDays: data.shelfLifeDays ?? null,
          storageConditions: data.storageConditions ?? null,
          isOrganic: data.isOrganic ?? false,
          isGlutenFree: data.isGlutenFree ?? false,
          isVegan: data.isVegan ?? false,
          caloriesPer100g: data.caloriesPer100g ?? null,
          proteinPer100g: data.proteinPer100g ?? null,
          carbsPer100g: data.carbsPer100g ?? null,
          fatPer100g: data.fatPer100g ?? null,
          isFeatured: data.isFeatured ?? false,
          isNewArrival: data.isNewArrival ?? false,
          metaTitle: data.metaTitle ?? null,
          metaDescription: data.metaDescription ?? null,
          metaKeywords: data.metaKeywords ?? null,
          archived: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .returning();

      if (!insertedProduct) throw new Error('Məhsul yaradılmadı');

      // 2. Variants
      await tx.insert(productVariants).values(
        data.variants.map((v, idx) => ({
          productId: insertedProduct.id,
          name: v.name,
          basePrice: String(v.price),
          costPrice: v.costPrice != null ? String(v.costPrice) : null,
          arrivalCost: v.arrivalCost != null ? String(v.arrivalCost) : null,
          stock: v.stock ?? 0,
          minStock: v.minStock ?? 10,
          unit: v.unit ?? 'ədəd',
          grade: (v.grade as any) ?? 'A',
          batchDate: v.batchDate ? new Date(v.batchDate) : null,
          isDefault: v.isDefault ?? idx === 0,
        }))
      );

      // 3. Images
      if (data.images && data.images.length > 0) {
        await tx.insert(productImages).values(
          data.images.map((img, idx) => ({
            productId: insertedProduct.id,
            url: img.url,
            altText: img.alt ?? null,
            displayOrder: img.displayOrder ?? idx,
          }))
        );
      }

      // 4. Tags
      if (data.tags && data.tags.length > 0) {
        const uniqueTags = [...new Set(data.tags.map((t) => t.toLowerCase().trim()))];
        await tx.insert(productTags).values(
          uniqueTags.map((tag) => ({
            productId: insertedProduct.id,
            tag,
          }))
        );
      }

      return insertedProduct;
    });

    const fullProduct = await db.query.products.findFirst({
      where: eq(products.id, newProduct.id),
      with: {
        variants: true,
        images: true,
        tags: true,
      },
    });

    if (!fullProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }

    return NextResponse.json(
      { product: formatProductWithRelations(fullProduct) },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Products POST error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}