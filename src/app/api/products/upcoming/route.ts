// src/app/api/products/upcoming/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, productImages, productTags, productVariants } from '@/lib/db/schema';
import { eq, and, desc, exists, sql } from 'drizzle-orm';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Math.max(Number(searchParams.get('offset')) || 0, 0);

    const whereCondition = and(
      eq(products.archived, false),
      exists(
        db.select({ id: productTags.id })
          .from(productTags)
          .where(and(
            eq(productTags.productId, products.id),
            eq(productTags.tag, 'upcoming')
          ))
      )
    );

    const [upcomingProducts, totalRow] = await Promise.all([
      db.query.products.findMany({
        where: whereCondition,
        with: {
          category: { columns: { id: true, name: true, slug: true } },
          images: { orderBy: [productImages.displayOrder], limit: 1 },
          tags: { columns: { tag: true }, limit: 10 },
          variants: { where: eq(productVariants.isDefault, true), limit: 1 },
        },
        orderBy: [desc(products.createdAt)],
        limit,
        offset,
      }),
      db.select({ count: sql<number>`count(*)::int` }).from(products).where(whereCondition),
    ]);

    const total = totalRow[0]?.count ?? 0;

    const normalizedProducts = upcomingProducts.map(product => ({
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
    }));

    return NextResponse.json({
      products: normalizedProducts,
      pagination: { total, limit, offset, hasMore: offset + limit < total },
    });
  } catch (error) {
    console.error('[API] GET /api/products/upcoming error:', error instanceof Error ? error.message : error);
    return NextResponse.json(
      { error: 'Server xətası', message: 'Gələcək məhsulları yükləmək mümkün olmadı' },
      { status: 500 }
    );
  }
}