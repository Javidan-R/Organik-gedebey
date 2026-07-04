// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { requireAuth, AuthError } from '@/lib/auth';
import { db } from '@/lib/db';
import {
  products,
  productVariants,
  productImages,
  productTags,
} from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { formatProductWithRelations } from '@/lib/utils/productFormatter';

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
  name: z.string().min(1),
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
  url: z.string().min(1),
  alt: z.string().optional(),
  displayOrder: z.number().optional(),
});

// ─── Update Schema ────────────────────────────────────────────
const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: coerceString,
  shortDescription: coerceString,
  categoryId: optionalUuid,
  basePrice: coerceNumber,
  costPrice: coerceNumber,
  discountType: discountTypeSchema,
  discountValue: coerceNumber,
  discountStart: coerceString,
  discountEnd: coerceString,
  unit: coerceString,
  grade: z.enum(['A', 'B', 'C', 'UNSORTED']).optional()
    .or(z.enum(['a', 'b', 'c', 'unsorted']).transform(v => v.toUpperCase())),
  minStock: coerceNumber,
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
  archived: coerceBoolean,
  metaTitle: coerceString,
  metaDescription: coerceString,
  metaKeywords: coerceStringArray,
  variants: z.array(variantSchema).optional(),
  images: z.array(imageSchema).optional(),
  tags: coerceStringArray,
});

// ─── GET ──────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN']);
    const { id } = await params;

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        images: true,
        variants: true,
        tags: true,
        reviews: true,
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }

    return NextResponse.json({ product: formatProductWithRelations(product) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product GET error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── PATCH ─────────────────────────────────────────────────────
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = await params;
    const body = await request.json();

    const parsed = updateProductSchema.safeParse(body);
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

    // ─── DB Update obyekti ────────────────────────────────────
    const dbUpdateData: any = { updatedAt: new Date() };

    const stringFields = [
      'name', 'slug', 'description', 'shortDescription', 'categoryId',
      'unit', 'grade', 'originRegion', 'supplier', 'storageConditions',
      'metaTitle', 'metaDescription', 'discountType',
      'proteinPer100g', 'carbsPer100g', 'fatPer100g'
    ];
    for (const field of stringFields) {
      if (data[field as keyof typeof data] !== undefined) {
        dbUpdateData[field] = data[field as keyof typeof data] ?? null;
      }
    }

    const numericFields = ['basePrice', 'costPrice', 'discountValue', 'minStock', 'shelfLifeDays', 'caloriesPer100g'];
    for (const field of numericFields) {
      if (data[field as keyof typeof data] !== undefined) {
        dbUpdateData[field] = data[field as keyof typeof data] !== null
          ? String(data[field as keyof typeof data])
          : null;
      }
    }

    const booleanFields = ['isOrganic', 'isGlutenFree', 'isVegan', 'isFeatured', 'isNewArrival', 'archived'];
    for (const field of booleanFields) {
      if (data[field as keyof typeof data] !== undefined) {
        dbUpdateData[field] = data[field as keyof typeof data] ?? false;
      }
    }

    if (data.discountStart !== undefined) {
      dbUpdateData.discountStart = data.discountStart ? new Date(data.discountStart) : null;
    }
    if (data.discountEnd !== undefined) {
      dbUpdateData.discountEnd = data.discountEnd ? new Date(data.discountEnd) : null;
    }
    if (data.metaKeywords !== undefined) {
      dbUpdateData.metaKeywords = data.metaKeywords ?? null;
    }

    // ─── Transaction ──────────────────────────────────────────
    await db.transaction(async (tx) => {
      await tx.update(products).set(dbUpdateData).where(eq(products.id, id));

      // Variants
      if (data.variants !== undefined) {
        await tx.delete(productVariants).where(eq(productVariants.productId, id));
        if (data.variants.length > 0) {
          await tx.insert(productVariants).values(
            data.variants.map((v, idx) => ({
              productId: id,
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
        }
      }

      // Images
      if (data.images !== undefined) {
        await tx.delete(productImages).where(eq(productImages.productId, id));
        if (data.images.length > 0) {
          await tx.insert(productImages).values(
            data.images.map((img, idx) => ({
              productId: id,
              url: img.url,
              altText: img.alt ?? null,
              displayOrder: img.displayOrder ?? idx,
            }))
          );
        }
      }

      // Tags
      if (data.tags !== undefined) {
        await tx.delete(productTags).where(eq(productTags.productId, id));
        if (data.tags.length > 0) {
          const uniqueTags = [...new Set(data.tags.map((t) => t.toLowerCase().trim()))];
          await tx.insert(productTags).values(
            uniqueTags.map((tag) => ({
              productId: id,
              tag,
            }))
          );
        }
      }
    });

    const fullProduct = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        variants: true,
        images: true,
        tags: true,
      },
    });

    if (!fullProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }

    return NextResponse.json({ product: formatProductWithRelations(fullProduct) });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product PATCH error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── DELETE ─────────────────────────────────────────────────────
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN']);
    const { id } = await params;

    const [deletedProduct] = await db
      .update(products)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();

    if (!deletedProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Məhsul uğurla arxivləşdirildi' });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error('Product DELETE error:', error);
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}