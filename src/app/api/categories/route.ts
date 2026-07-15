// src/app/api/categories/route.ts
// Optimallaşdırılmış – production-ready, TypeScript xətasız

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { categories, products } from '@/lib/db/schema';
import { eq, and, desc, sql, inArray } from 'drizzle-orm';
import { generateUniqueSlug } from '@/lib/slug';
import { logger } from '@/lib/logger';

// ─── GET ──────────────────────────────────────────────────────────────────
export async function GET() {
  try {
    // 1. Kateqoriyaları çək (aktive, arxivlənməmiş)
    const cats = await db.query.categories.findMany({
      where: and(
        eq(categories.archived, false),
        eq(categories.isActive, true)
      ),
      orderBy: [desc(categories.isFeatured), desc(categories.displayOrder), desc(categories.createdAt)],
      columns: {
        id: true,
        name: true,
        slug: true,
        description: true,
        imageUrl: true,
        imageId: true,
        imageAlt: true,
        color: true,
        icon: true,
        parentId: true,
        displayOrder: true,
        isFeatured: true,
        isActive: true,
        archived: true,
        metaTitle: true,
        metaDescription: true,
        metaKeywords: true,
        createdAt: true,
        updatedAt: true,
        createdBy: true,
        updatedBy: true,
      },
    });

    if (cats.length === 0) {
      return NextResponse.json([]);
    }

    // 2. Hər kateqoriya üçün məhsul sayını ayrıca sorgu ilə çək
    const categoryIds = cats.map((c) => c.id);
    
    // inArray istifadə edərək düzgün SQL IN yaradırıq
    const counts = await db
      .select({
        categoryId: products.categoryId,
        count: sql<number>`COUNT(*)`,
      })
      .from(products)
      .where(
        and(
          eq(products.archived, false),
          inArray(products.categoryId, categoryIds)
        )
      )
      .groupBy(products.categoryId);

    const countMap = new Map(counts.map((c) => [c.categoryId, c.count]));

    // 3. Formatla
    const formattedCats = cats.map((cat) => ({
      ...cat,
      productsCount: countMap.get(cat.id) || 0,
      _count: { products: countMap.get(cat.id) || 0 },
    }));

    // 4. Cache başlıqları
    const response = NextResponse.json(formattedCats);
    response.headers.set('Cache-Control', 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200');
    return response;
  } catch (error) {
    logger.error('GET /api/categories error:', { error });
    return NextResponse.json(
      { error: 'Server xətası', message: 'Kateqoriyalar yüklənərkən xəta baş verdi' },
      { status: 500 }
    );
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Validasiya (əsas sahələr)
    if (!body.name || body.name.trim().length < 2) {
      return NextResponse.json(
        { error: 'Kateqoriya adı ən az 2 simvol olmalıdır' },
        { status: 400 }
      );
    }

    const slug = body.slug || generateUniqueSlug(body.name);

    // Slug unikallığını yoxla
    const existing = await db.query.categories.findFirst({
      where: eq(categories.slug, slug),
    });
    if (existing) {
      return NextResponse.json(
        { error: 'Bu slug artıq istifadə olunur' },
        { status: 400 }
      );
    }

    const [newCat] = await db
      .insert(categories)
      .values({
        name: body.name.trim(),
        slug,
        description: body.description || null,
        imageUrl: body.imageUrl || body.image || null,
        imageId: body.imageId || null,
        imageAlt: body.imageAlt || null,
        color: body.color || null,
        icon: body.icon || null,
        parentId: body.parentId || null,
        displayOrder: body.displayOrder || 0,
        isFeatured: body.isFeatured || false,
        isActive: body.isActive ?? true,
        archived: false,
        metaTitle: body.metaTitle || null,
        metaDescription: body.metaDescription || null,
        metaKeywords: body.metaKeywords || null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    return NextResponse.json(newCat, { status: 201 });
  } catch (error) {
    logger.error('POST /api/categories error:', { error });
    return NextResponse.json(
      { error: 'Kateqoriya yaradıla bilmədi' },
      { status: 500 }
    );
  }
}