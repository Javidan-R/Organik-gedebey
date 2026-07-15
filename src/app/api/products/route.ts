// src/app/api/products/route.ts
// Optimallaşdırılmış – production-ready, yüksək performans

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  products,
  categories,
  productImages,
  productVariants,
  productTags,
  reviews,
} from '@/lib/db/schema';
import { eq, desc, and, like, sql, or } from 'drizzle-orm';
import { formatProducts, getProductStockStatus } from '@/lib/utils/productFormatter';
import { logger } from '@/lib/logger';

// ─── Constants ────────────────────────────────────────────────────────────
const CACHE_CONTROL = {
  'Cache-Control': 'public, max-age=60, s-maxage=300, stale-while-revalidate=600',
};

const VALID_SORT_KEYS = ['newest', 'price_asc', 'price_desc', 'rating', 'popularity'] as const;
type SortKey = typeof VALID_SORT_KEYS[number];

const VALID_STOCK_FILTERS = ['all', 'in_stock', 'low_stock', 'out_of_stock'] as const;
type StockFilter = typeof VALID_STOCK_FILTERS[number];

// ─── Helper: Stock cəmi ──────────────────────────────────────────────────
function getStockSumSql() {
  return sql<number>`
    COALESCE(
      (SELECT SUM(${productVariants.stock}) 
       FROM ${productVariants} 
       WHERE ${productVariants.productId} = ${products.id}),
      0
    )
  `;
}

// ─── GET ──────────────────────────────────────────────────────────────────
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);

    // ─── Pagination ──────────────────────────────────────────────────────
    const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get('limit') || '20')));
    const offset = (page - 1) * limit;

    // ─── Filters ──────────────────────────────────────────────────────────
    const search = searchParams.get('search') || '';
    const categorySlug = searchParams.get('category') || '';
    const sortKey = (searchParams.get('sort') as SortKey) || 'newest';
    const stockFilter = (searchParams.get('stock') as StockFilter) || 'all';
    const discountOnly = searchParams.get('discount') === 'true';
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const minRating = searchParams.get('minRating') ? parseFloat(searchParams.get('minRating')!) : undefined;
    const featured = searchParams.get('featured') === 'true';
    const organic = searchParams.get('organic') === 'true';
    const newArrival = searchParams.get('new') === 'true';

    // ─── Build Where Conditions ──────────────────────────────────────────
    const conditions = [eq(products.archived, false)];

    // Axtarış
    if (search) {
      const term = `%${search}%`;
      conditions.push(
        or(
          like(products.name, term),
          like(products.slug, term),
          like(products.description, term),
          sql`EXISTS (SELECT 1 FROM ${productTags} WHERE ${productTags.productId} = ${products.id} AND ${productTags.tag} ILIKE ${term})`
        )
      );
    }

    // Kateqoriya (slug ilə)
    if (categorySlug) {
      const category = await db.query.categories.findFirst({
        where: eq(categories.slug, categorySlug),
        columns: { id: true },
      });
      if (category) {
        conditions.push(eq(products.categoryId, category.id));
      } else {
        // Kateqoriya tapılmadısa boş cavab
        return NextResponse.json({
          products: [],
          pagination: { page, limit, total: 0, totalPages: 0 },
          meta: { totalStock: 0, averagePrice: 0, minPrice: 0, maxPrice: 0 },
        });
      }
    }

    // Qiymət aralığı
    if (minPrice !== undefined && !isNaN(minPrice)) {
      conditions.push(sql`${products.basePrice} >= ${minPrice}`);
    }
    if (maxPrice !== undefined && !isNaN(maxPrice)) {
      conditions.push(sql`${products.basePrice} <= ${maxPrice}`);
    }

    // Xüsusi filtrlər
    if (featured) conditions.push(eq(products.isFeatured, true));
    if (organic) conditions.push(eq(products.isOrganic, true));
    if (newArrival) conditions.push(eq(products.isNewArrival, true));

    // Endirim
    if (discountOnly) {
      conditions.push(
        sql`${products.discountType} IS NOT NULL AND ${products.discountValue} IS NOT NULL AND ${products.discountValue} > 0`
      );
    }

    // Stok filtri (variantların cəmi ilə)
    if (stockFilter !== 'all') {
      const stockSum = getStockSumSql();
      if (stockFilter === 'in_stock') {
        conditions.push(sql`${stockSum} > 0`);
      } else if (stockFilter === 'low_stock') {
        conditions.push(sql`${stockSum} > 0 AND ${stockSum} <= COALESCE(${products.minStock}, 10)`);
      } else if (stockFilter === 'out_of_stock') {
        conditions.push(sql`${stockSum} = 0`);
      }
    }

    // Reytinq (ortalama)
    if (minRating !== undefined && !isNaN(minRating) && minRating > 0) {
      conditions.push(
        sql`
          COALESCE(
            (SELECT AVG(${reviews.rating}) 
             FROM ${reviews} 
             WHERE ${reviews.productId} = ${products.id} 
               AND ${reviews.isApproved} = true),
            0
          ) >= ${minRating}
        `
      );
    }

    const finalWhere = and(...conditions);

    // ─── Sort ──────────────────────────────────────────────────────────────
    const getOrderBy = () => {
      switch (sortKey) {
        case 'price_asc':
          return [products.basePrice];
        case 'price_desc':
          return [desc(products.basePrice)];
        case 'popularity':
          return [desc(products.viewCount)];
        case 'rating':
          // Reytinq üzrə sortlama – mürəkkəb olduğu üçün client tərəfdə edilə bilər,
          // lakin biz SQL-də subquery ilə də edə bilərik. İndi sadəcə createdAt ilə saxlayırıq.
          return [desc(products.createdAt)];
        case 'newest':
        default:
          return [desc(products.createdAt)];
      }
    };

    // ─── Main Query ──────────────────────────────────────────────────────
    const productsData = await db.query.products.findMany({
      where: finalWhere,
      orderBy: getOrderBy(),
      limit,
      offset,
      with: {
        category: true,
        images: {
          orderBy: [productImages.displayOrder],
        },
        variants: true,
        tags: true,
        reviews: {
          where: eq(reviews.isApproved, true),
          columns: {
            rating: true,
            comment: true,
            createdAt: true,
          },
        },
      },
    });

    // ─── Total Count ──────────────────────────────────────────────────────
    const countResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(products)
      .where(finalWhere);

    const total = Number(countResult[0]?.count ?? 0);

    // ─── Stats ────────────────────────────────────────────────────────────
    const statsResult = await db
      .select({
        totalStock: sql<number>`COALESCE(SUM(${products.basePrice}), 0)`,
        minPrice: sql<number>`MIN(${products.basePrice})`,
        maxPrice: sql<number>`MAX(${products.basePrice})`,
        avgPrice: sql<number>`AVG(${products.basePrice})`,
      })
      .from(products)
      .where(finalWhere);

    const stats = statsResult[0] || { totalStock: 0, minPrice: 0, maxPrice: 0, avgPrice: 0 };

    // ─── Format ──────────────────────────────────────────────────────────
    const formatted = formatProducts(productsData);
    const withStockStatus = formatted.map((p) => ({
      ...p,
      stockStatus: getProductStockStatus(p),
    }));

    return NextResponse.json(
      {
        products: withStockStatus,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
        meta: {
          totalStock: stats.totalStock ?? 0,
          averagePrice: stats.avgPrice ?? 0,
          minPrice: stats.minPrice ?? 0,
          maxPrice: stats.maxPrice ?? 0,
        },
      },
      { headers: CACHE_CONTROL }
    );
  } catch (error) {
    logger.error('[API] /api/products error:', { error });
    return NextResponse.json(
      {
        error: 'Server xətası',
        message: 'Məhsullar yüklənərkən xəta baş verdi',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── POST ──────────────────────────────────────────────────────────────────
export async function POST() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/admin/products for product creation.' },
    { status: 405 }
  );
}