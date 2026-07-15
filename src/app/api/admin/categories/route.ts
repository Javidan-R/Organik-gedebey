// src/app/api/admin/categories/route.ts
// Production-ready, tam, qısaldılmamış versiya
// Düzəliş: eq(categories.parentId, null) → isNull(categories.parentId)

import { NextRequest, NextResponse } from 'next/server';
import { revalidateTag } from 'next/cache';
import { requireAuth, AuthError } from '@/lib/auth-helpers';
import { db } from '@/lib/db';
import { categories } from '@/lib/db/schema';
import { eq, desc, like, or, and, isNull } from 'drizzle-orm';
import { generateCategorySlug } from '@/lib/category-helpers';
import { logger } from '@/lib/logger';
import type { CategoryCreateInput } from '@/types/category';
import { z } from 'zod';

// ─── Validasiya Schema (təkmilləşdirilmiş) ──────────────────────────────────
const createCategorySchema = z.object({
  name: z.string().min(2, 'Kateqoriya adı ən az 2 simvol olmalıdır').max(255),
  slug: z.string().min(2).max(255).optional(),
  description: z.string().nullable().optional(),
  imageUrl: z.string().url('Şəkil URL-i etibarlı olmalıdır').nullable().optional(),
  imageId: z.string().nullable().optional(),
  imageAlt: z.string().max(255).nullable().optional(),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Rəng HEX formatında olmalıdır').nullable().optional(),
  icon: z.string().nullable().optional(),
  parentId: z.string().uuid('Parent ID UUID formatında olmalıdır').nullable().optional(),
  displayOrder: z.number().int().min(0).default(0),
  isFeatured: z.boolean().default(false),
  isActive: z.boolean().default(true),
  metaTitle: z.string().max(255).nullable().optional(),
  metaDescription: z.string().max(500).nullable().optional(),
  metaKeywords: z.string().max(255).nullable().optional(),
});

const updateCategorySchema = createCategorySchema.partial().extend({
  archived: z.boolean().optional(),
});

// ─── GET: Kateqoriyaları listələ (caching ilə) ──────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const searchParams = request.nextUrl.searchParams;
    const search = searchParams.get('search');
    const parentId = searchParams.get('parentId');
    const isActive = searchParams.get('isActive');
    const isFeatured = searchParams.get('isFeatured');
    const archived = searchParams.get('archived');
    const limit = Math.min(Number(searchParams.get('limit')) || 50, 100);
    const offset = Number(searchParams.get('offset')) || 0;

    let conditions = [];

    if (search) {
      const searchTerm = `%${search}%`;
      conditions.push(
        or(
          like(categories.name, searchTerm),
          like(categories.slug, searchTerm),
          like(categories.description, searchTerm)
        )
      );
    }

    // ✅ Düzəliş: parentId null olduqda isNull istifadə edilir
    if (parentId === 'null') {
      conditions.push(isNull(categories.parentId));
    } else if (parentId) {
      conditions.push(eq(categories.parentId, parentId));
    }

    if (isActive !== null && isActive !== undefined) {
      conditions.push(eq(categories.isActive, isActive === 'true'));
    }

    if (isFeatured !== null && isFeatured !== undefined) {
      conditions.push(eq(categories.isFeatured, isFeatured === 'true'));
    }

    if (archived !== null && archived !== undefined) {
      conditions.push(eq(categories.archived, archived === 'true'));
    }

    const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

    const [items, totalResult] = await Promise.all([
      db.query.categories.findMany({
        where: whereClause,
        with: {
          products: {
            columns: { id: true },
          },
          parent: true,
        },
        orderBy: [desc(categories.isFeatured), desc(categories.displayOrder), desc(categories.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: categories.id }).from(categories).where(whereClause),
    ]);

    const total = totalResult.length;

    const formattedItems = items.map((cat) => ({
      ...cat,
      productsCount: cat.products?.length || 0,
      _count: { products: cat.products?.length || 0 },
    }));

    const response = NextResponse.json({
      items: formattedItems,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      },
    });

    // Cache başlıqları – 5 dəqiqə cache, stale-while-revalidate
    response.headers.set(
      'Cache-Control',
      'public, s-maxage=300, stale-while-revalidate=600'
    );
    response.headers.set('CDN-Cache-Control', 'public, s-maxage=600');
    response.headers.set('Vercel-CDN-Cache-Control', 'public, s-maxage=600');

    return response;
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Admin categories GET error:', { error });
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 });
  }
}

// ─── POST: Yeni kateqoriya yarat ─────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const body = await request.json();
    const validated = createCategorySchema.parse(body);

    // Slug avtomatik yarat (əgər verilməyibsə)
    let slug = validated.slug;
    if (!slug) {
      const existingSlugs = await db
        .select({ slug: categories.slug })
        .from(categories);
      const slugList = existingSlugs.map((s) => s.slug);
      slug = generateCategorySlug(validated.name, slugList);
    }

    // Əgər parentId varsa, mövcudluğunu yoxla
    if (validated.parentId) {
      const parent = await db.query.categories.findFirst({
        where: eq(categories.id, validated.parentId),
      });
      if (!parent) {
        return NextResponse.json(
          { error: 'Seçilmiş ana kateqoriya tapılmadı' },
          { status: 400 }
        );
      }
    }

    const [newCategory] = await db
      .insert(categories)
      .values({
        name: validated.name,
        slug,
        description: validated.description || null,
        imageUrl: validated.imageUrl || null,
        imageId: validated.imageId || null,
        imageAlt: validated.imageAlt || null,
        color: validated.color || null,
        icon: validated.icon || null,
        parentId: validated.parentId || null,
        displayOrder: validated.displayOrder || 0,
        isFeatured: validated.isFeatured ?? false,
        isActive: validated.isActive ?? true,
        archived: false,
        metaTitle: validated.metaTitle || null,
        metaDescription: validated.metaDescription || null,
        metaKeywords: validated.metaKeywords || null,
        createdBy: user.id,
        updatedBy: user.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    // Cache-i invalid et – Next.js 16 tələblərinə uyğun olaraq ikinci arqument əlavə edilir
    revalidateTag('categories', 'default');
    revalidateTag('category-tree', 'default');

    return NextResponse.json(newCategory, { status: 201 });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasiya xətası', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Admin categories POST error:', { error });
    return NextResponse.json({ error: 'Kateqoriya yaradıla bilmədi' }, { status: 500 });
  }
}

// ─── PUT: Kateqoriyanı yenilə ────────────────────────────────────────────────
export async function PUT(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER']);

    const body = await request.json();
    const { id, ...updateData } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'Kateqoriya ID-si tələb olunur' },
        { status: 400 }
      );
    }

    const validated = updateCategorySchema.parse(updateData);

    // Mövcudluğunu yoxla
    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
    });
    if (!existing) {
      return NextResponse.json({ error: 'Kateqoriya tapılmadı' }, { status: 404 });
    }

    // Slug unikallığını yoxla (dəyişirsə)
    if (validated.slug && validated.slug !== existing.slug) {
      const duplicate = await db.query.categories.findFirst({
        where: and(eq(categories.slug, validated.slug), eq(categories.id, id)),
      });
      if (duplicate) {
        return NextResponse.json(
          { error: 'Bu slug artıq istifadə olunur' },
          { status: 400 }
        );
      }
    }

    // Parent özünə bağlanmağa qarşı yoxlama
    if (validated.parentId && validated.parentId === id) {
      return NextResponse.json(
        { error: 'Kateqoriya özünə ana kateqoriya ola bilməz' },
        { status: 400 }
      );
    }

    const updatePayload: any = {
      updatedBy: user.id,
      updatedAt: new Date(),
    };

    // Yalnız göndərilmiş sahələri yenilə
    if (validated.name !== undefined) updatePayload.name = validated.name;
    if (validated.slug !== undefined) updatePayload.slug = validated.slug;
    if (validated.description !== undefined) updatePayload.description = validated.description;
    if (validated.imageUrl !== undefined) updatePayload.imageUrl = validated.imageUrl;
    if (validated.imageId !== undefined) updatePayload.imageId = validated.imageId;
    if (validated.imageAlt !== undefined) updatePayload.imageAlt = validated.imageAlt;
    if (validated.color !== undefined) updatePayload.color = validated.color;
    if (validated.icon !== undefined) updatePayload.icon = validated.icon;
    if (validated.parentId !== undefined) updatePayload.parentId = validated.parentId;
    if (validated.displayOrder !== undefined) updatePayload.displayOrder = validated.displayOrder;
    if (validated.isFeatured !== undefined) updatePayload.isFeatured = validated.isFeatured;
    if (validated.isActive !== undefined) updatePayload.isActive = validated.isActive;
    if (validated.archived !== undefined) updatePayload.archived = validated.archived;
    if (validated.metaTitle !== undefined) updatePayload.metaTitle = validated.metaTitle;
    if (validated.metaDescription !== undefined) updatePayload.metaDescription = validated.metaDescription;
    if (validated.metaKeywords !== undefined) updatePayload.metaKeywords = validated.metaKeywords;

    const [updated] = await db
      .update(categories)
      .set(updatePayload)
      .where(eq(categories.id, id))
      .returning();

    // Cache-i invalid et
    revalidateTag('categories', 'default');
    revalidateTag('category-tree', 'default');

    return NextResponse.json(updated);
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validasiya xətası', details: error.issues },
        { status: 400 }
      );
    }
    logger.error('Admin categories PUT error:', { error });
    return NextResponse.json({ error: 'Kateqoriya yenilənə bilmədi' }, { status: 500 });
  }
}

// ─── DELETE: Kateqoriyanı arxivlə və ya sil (permanent) ─────────────────────
export async function DELETE(request: NextRequest) {
  try {
    const { user } = await requireAuth(request, ['ADMIN', 'SUPERADMIN']);

    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get('id');
    const permanent = searchParams.get('permanent') === 'true';

    if (!id) {
      return NextResponse.json(
        { error: 'Kateqoriya ID-si tələb olunur' },
        { status: 400 }
      );
    }

    const existing = await db.query.categories.findFirst({
      where: eq(categories.id, id),
      with: {
        children: { columns: { id: true } },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: 'Kateqoriya tapılmadı' }, { status: 404 });
    }

    if (existing.children && existing.children.length > 0 && !permanent) {
      return NextResponse.json(
        {
          error: 'Bu kateqoriyanın alt kateqoriyaları var. Əvvəlcə onları silin və ya daşıyın.',
          hasChildren: true,
        },
        { status: 400 }
      );
    }

    if (permanent) {
      // Tam sil (cascade)
      await db.delete(categories).where(eq(categories.id, id));
    } else {
      // Arxivlə
      await db
        .update(categories)
        .set({
          archived: true,
          isActive: false,
          updatedBy: user.id,
          updatedAt: new Date(),
        })
        .where(eq(categories.id, id));
    }

    // Cache-i invalid et
    revalidateTag('categories', 'default');
    revalidateTag('category-tree', 'default');

    return NextResponse.json({
      success: true,
      permanent,
      id,
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    logger.error('Admin categories DELETE error:', { error });
    return NextResponse.json({ error: 'Kateqoriya silinə bilmədi' }, { status: 500 });
  }
}