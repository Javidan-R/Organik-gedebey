// src/app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import {
  products,
  categories,
  productImages,
  productVariants,
  productTags,
  reviews,
  users,
} from '@/lib/db/schema';
import { eq, and, desc, sql, not } from 'drizzle-orm';
import { formatProductWithRelations, getProductStockStatus } from '@/lib/utils/productFormatter';

const CACHE_CONTROL = {
  'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=1200',
};

// ─── GET ──────────────────────────────────────────────────────────
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // ─── 1. Məhsulu gətir ──────────────────────────────────────
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
        images: {
          orderBy: [productImages.displayOrder],
        },
        variants: true,
        tags: true,
        reviews: {
          where: eq(reviews.isApproved, true),
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
          orderBy: [desc(reviews.createdAt)],
        },
      },
    });

    if (!product) {
      return NextResponse.json(
        { error: 'Məhsul tapılmadı', message: 'Axtardığınız məhsul mövcud deyil' },
        { status: 404 }
      );
    }

    // ─── 2. View count artır (asinxron, cavabı gözləmə) ──────────
    db.update(products)
      .set({ viewCount: sql`${products.viewCount} + 1` })
      .where(eq(products.id, id))
      .catch(() => {});

    // ─── 3. Formatla ─────────────────────────────────────────────
    const formatted = formatProductWithRelations(product);

    // ─── 4. Stock status əlavə et ────────────────────────────────
    const withStockStatus = {
      ...formatted,
      stockStatus: getProductStockStatus(formatted),
    };

    // ─── 5. Oxşar məhsullar (eyni kateqoriyadan) ─────────────────
    let relatedProducts: any[] = [];
    if (product.categoryId) {
      const related = await db.query.products.findMany({
        where: and(
          eq(products.archived, false),
          eq(products.categoryId, product.categoryId),
          not(eq(products.id, id))
        ),
        with: {
          images: {
            orderBy: [productImages.displayOrder],
            limit: 1,
          },
          variants: {
            where: eq(productVariants.isDefault, true),
            limit: 1,
          },
        },
        limit: 8,
        orderBy: [desc(products.createdAt)],
      });
      relatedProducts = related.map((p) => formatProductWithRelations(p));
    }

    // ─── 6. Son baxılanlar üçün məlumat (opsional) ─────────────
    const recentlyViewed = await db.query.products.findMany({
      where: and(
        eq(products.archived, false),
        not(eq(products.id, id))
      ),
      with: {
        images: {
          orderBy: [productImages.displayOrder],
          limit: 1,
        },
        variants: {
          where: eq(productVariants.isDefault, true),
          limit: 1,
        },
      },
      limit: 4,
      orderBy: [desc(products.viewCount)],
    });

    const recentlyViewedFormatted = recentlyViewed.map((p) => formatProductWithRelations(p));

    // ─── 7. SEO Metadata ──────────────────────────────────────────
    const seo = {
      title: product.metaTitle || `${product.name} - Yaylaq Organik Məhsullar`,
      description: product.metaDescription || product.shortDescription || `${product.name} - təbii, organik və keyfiyyətli kənd məhsulu.`,
      keywords: product.metaKeywords || [...(product.tags || []).map((t: any) => t.tag), product.name, 'organik', 'təbii'].join(', '),
      canonical: `/products/${product.slug}`,
      ogImage: product.images?.[0]?.url || '',
    };

    return NextResponse.json(
      {
        product: withStockStatus,
        relatedProducts,
        recentlyViewed: recentlyViewedFormatted,
        seo,
        meta: {
          totalReviews: withStockStatus.reviews?.length || 0,
          averageRating: withStockStatus.averageRating || 0,
          totalStock: withStockStatus.totalStock || 0,
          isInStock: (withStockStatus.totalStock || 0) > 0,
        },
      },
      { headers: CACHE_CONTROL }
    );
  } catch (error) {
    console.error('[API] /api/products/[id] error:', error);
    return NextResponse.json(
      { 
        error: 'Server xətası', 
        message: 'Məhsul məlumatları yüklənərkən xəta baş verdi',
        details: process.env.NODE_ENV === 'development' ? String(error) : undefined,
      },
      { status: 500 }
    );
  }
}

// ─── PATCH ─────────────────────────────────────────────────────────
export async function PATCH() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/admin/products/[id] for product updates.' },
    { status: 405 }
  );
}

// ─── DELETE ────────────────────────────────────────────────────────
export async function DELETE() {
  return NextResponse.json(
    { error: 'Method not allowed. Use /api/admin/products/[id] for product deletion.' },
    { status: 405 }
  );
}