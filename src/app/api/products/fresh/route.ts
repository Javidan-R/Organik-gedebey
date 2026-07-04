// src/app/api/products/fresh/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productImages, productVariants } from '@/lib/db/schema';
import { eq, and, desc, or, gt, sql, SQL } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);
    const categorySlug = searchParams.get('categorySlug') || '';
    const days = Number(searchParams.get('days')) || 7;

    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateThresholdISO = dateThreshold.toISOString();

    const whereConditions: SQL[] = [
      eq(products.archived, false),
      or(
        eq(products.isNewArrival, true),
        gt(products.createdAt, dateThresholdISO)
      )!,
    ];

    if (categorySlug) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
        columns: { id: true },
      });
      if (!category) {
        return NextResponse.json({
          products: [],
          pagination: { total: 0, limit, offset, hasMore: false },
          categories: [],
        });
      }
      whereConditions.push(eq(products.categoryId, category.id));
    }

    const finalWhere = and(...whereConditions);

    const [freshProducts, totalRow] = await Promise.all([
      db.query.products.findMany({
        where: finalWhere,
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          images: { orderBy: [productImages.displayOrder], limit: 3 },
          tags: { columns: { tag: true }, limit: 10 },
          variants: { where: eq(productVariants.isDefault, true), limit: 1 },
        },
        orderBy: [desc(products.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(finalWhere),
    ]);

    const total = totalRow[0]?.count ?? 0;

    const categoryIds = [...new Set(freshProducts.map(p => p.categoryId).filter(Boolean))] as string[];
    const freshCategories = categoryIds.length > 0
      ? await db.query.categories.findMany({
          where: and(eq(categories.archived, false), eq(categories.isActive, true)),
          columns: { id: true, name: true, slug: true },
        })
      : [];

    const normalizedProducts = freshProducts.map(product => ({
      ...product,
      basePrice: typeof product.basePrice === 'string'
        ? parseFloat(product.basePrice)
        : (product.basePrice ?? 0),
      images: product.images?.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.altText || product.name,
        displayOrder: img.displayOrder,
      })) || [],
      tags: product.tags?.map(t => t.tag) || [],
      variants: product.variants?.map(v => ({
        ...v,
        basePrice: typeof v.basePrice === 'string' ? parseFloat(v.basePrice) : (v.basePrice ?? 0),
        costPrice: typeof v.costPrice === 'string' ? parseFloat(v.costPrice) : (v.costPrice ?? 0),
      })) || [],
      statusTags: product.isNewArrival
        ? [...(product.tags?.map(t => t.tag).filter((t: string) => ['newArrival', 'featured', 'bestSeller'].includes(t)) || []), 'newArrival']
        : product.tags?.map(t => t.tag).filter((t: string) => ['newArrival', 'featured', 'bestSeller'].includes(t)) || [],
    }));

    return NextResponse.json({
      products: normalizedProducts,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
      categories: freshCategories,
      meta: { dateThreshold: dateThresholdISO, daysConsidered: days },
    });
  } catch (error) {
    console.error('[API] GET /api/products/fresh error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Server xətası', message: 'Təzə məhsulları yükləmək mümkün olmadı' },
      { status: 500 }
    );
  }
}