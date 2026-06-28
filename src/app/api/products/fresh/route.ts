import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productImages, productTags, productVariants } from '@/lib/db/schema';
import { eq, and, desc, or, gt } from 'drizzle-orm';

/**
 * GET /api/products/fresh
 * Fetches fresh/new arrival products with optimized queries
 * Query params:
 * - limit: number of products to return (default: 20, max: 50)
 * - offset: pagination offset (default: 0)
 * - categorySlug: filter by category
 * - days: number of days to consider as "fresh" (default: 7)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Number(searchParams.get('offset')) || 0;
    const categorySlug = searchParams.get('categorySlug') || '';
    const days = Number(searchParams.get('days')) || 7;

    // Calculate date threshold for fresh products
    const dateThreshold = new Date();
    dateThreshold.setDate(dateThreshold.getDate() - days);
    const dateThresholdISO = dateThreshold.toISOString();

    // Build where clause
    const whereConditions = [
      eq(products.archived, false),
      or(
        eq(products.isNewArrival, true),
        gt(products.createdAt, dateThresholdISO)
      )
    ];

    // Add category filter if provided
    let categoryId: string | null = null;
    if (categorySlug) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
        columns: { id: true }
      });
      if (category) {
        categoryId = category.id;
        whereConditions.push(eq(products.categoryId, categoryId));
      } else {
        return NextResponse.json({ 
          products: [], 
          pagination: { total: 0, limit, offset },
          categories: [] 
        });
      }
    }

    // Fetch fresh products with optimized query
    const freshProducts = await db.query.products.findMany({
      where: and(...whereConditions),
      with: {
        category: {
          columns: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: [productImages.displayOrder],
          limit: 3
        },
        tags: {
          columns: { tag: true },
          limit: 10
        },
        variants: {
          where: eq(productVariants.isDefault, true),
          limit: 1
        }
      },
      orderBy: [desc(products.createdAt)],
      limit,
      offset
    });

    // Get total count for pagination
    const totalCount = await db
      .select({ count: products.id })
      .from(products)
      .where(and(...whereConditions));

    // Get unique categories from fresh products
    const categoryIds = [...new Set(freshProducts.map(p => p.categoryId).filter(Boolean))];
    const freshCategories = categoryIds.length > 0
      ? await db.query.categories.findMany({
          where: and(
            eq(categories.archived, false),
            eq(categories.isActive, true)
          ),
          columns: { id: true, name: true, slug: true }
        })
      : [];

    // Normalize product data for frontend
    const normalizedProducts = freshProducts.map(product => ({
      ...product,
      basePrice: typeof product.basePrice === 'string' 
        ? parseFloat(product.basePrice) 
        : (product.basePrice ?? 0),
      images: product.images?.map(img => ({
        id: img.id,
        url: img.url,
        alt: img.altText || product.name,
        displayOrder: img.displayOrder
      })) || [],
      tags: product.tags?.map(t => t.tag) || [],
      variants: product.variants?.map(v => ({
        ...v,
        basePrice: typeof v.basePrice === 'string' 
          ? parseFloat(v.basePrice) 
          : (v.basePrice ?? 0),
        costPrice: typeof v.costPrice === 'string'
          ? parseFloat(v.costPrice)
          : (v.costPrice ?? 0)
      })) || [],
      statusTags: product.isNewArrival 
        ? [...(product.tags?.filter(t => ['newArrival', 'featured', 'bestSeller'].includes(t)) || []), 'newArrival']
        : product.tags?.filter(t => ['newArrival', 'featured', 'bestSeller'].includes(t)) || []
    }));

    return NextResponse.json({
      products: normalizedProducts,
      pagination: {
        total: totalCount.length,
        limit,
        offset,
        hasMore: offset + limit < totalCount.length
      },
      categories: freshCategories,
      meta: {
        dateThreshold: dateThresholdISO,
        daysConsidered: days
      }
    });

  } catch (error) {
    console.error('[API] GET /api/products/fresh error:', error);
    return NextResponse.json(
      { error: 'Server xətası', message: 'Təzə məhsulları yükləmək mümkün olmadı' },
      { status: 500 }
    );
  }
}
