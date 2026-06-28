import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { products, categories, productImages, productTags, productVariants } from '@/lib/db/schema';
import { eq, and, desc, inArray } from 'drizzle-orm';

/**
 * GET /api/products/upcoming
 * Fetches upcoming products (products with 'upcoming' status tag)
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get('limit')) || 20, 50);
    const offset = Number(searchParams.get('offset')) || 0;

    // Fetch upcoming products
    const upcomingProducts = await db.query.products.findMany({
      where: and(
        eq(products.archived, false),
        // Check if product has 'upcoming' tag
        // Note: This requires a subquery or join with productTags
      ),
      with: {
        category: {
          columns: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: [productImages.displayOrder],
          limit: 1
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

    // Alternative approach using tag filtering
    const allProductsWithTags = await db.query.products.findMany({
      where: eq(products.archived, false),
      with: {
        tags: {
          columns: { tag: true }
        },
        category: {
          columns: { id: true, name: true, slug: true }
        },
        images: {
          orderBy: [productImages.displayOrder],
          limit: 1
        },
        variants: {
          where: eq(productVariants.isDefault, true),
          limit: 1
        }
      },
      orderBy: [desc(products.createdAt)]
    });

    // Filter products with 'upcoming' tag
    const filtered = allProductsWithTags
      .filter(p => p.tags?.some(t => t.tag === 'upcoming'))
      .slice(offset, offset + limit);

    // Normalize data
    const normalizedProducts = filtered.map(product => ({
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
      statusTags: product.tags?.filter(t => ['upcoming', 'newArrival'].includes(t)) || []
    }));

    return NextResponse.json({
      products: normalizedProducts,
      pagination: {
        total: filtered.length,
        limit,
        offset,
        hasMore: offset + limit < allProductsWithTags.filter(p => p.tags?.some(t => t.tag === 'upcoming')).length
      }
    });

  } catch (error) {
    console.error('[API] GET /api/products/upcoming error:', error);
    return NextResponse.json(
      { error: 'Server xətası', message: 'Gələcək məhsulları yükləmək mümkün olmadı' },
      { status: 500 }
    );
  }
}
