// src/app/api/admin/products/[id]/compatibility/route.ts
// Product Compatibility API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { basketContents, categories, products } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params

    const product = await (db.query as any).products.findFirst({
      where: eq(products.id, id),
      with: {
        category: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    // Get compatible baskets
    const basketRelations = await (db.query as any).basketContents.findMany({
      where: eq(basketContents.content, id),
      with: {
        basketVariant: {
          with: {
            basket: {
              with: {
                category: true,
              },
            },
          },
        },
      },
    })

    const compatibleBaskets = basketRelations
      .map((item: any) => {
        const basket = item.basketVariant?.basket
        if (!basket) return null

        return {
          basketId: basket.id,
          basketName: basket.name,
          basketType: basket.type,
          basketSlug: basket.slug,
          isAvailable: basket.isActive && !basket.archived,
          basketPrice: item.basketVariant?.price || '0',
          basketDiscount: basket.discount || 0,
          basketStock: basket.stock || 0,
        }
      })
      .filter(Boolean)

    // Get category hierarchy
    const categoryHierarchy = {
      productId: id,
      categoryId: product.categoryId,
      categoryName: product.category?.name,
      categorySlug: product.category?.slug,
      categoryPath: await getCategoryPath(db, product.categoryId),
      parentCategoryId: product.category?.parentId,
      parentCategoryName: product.category?.parentId
        ? (await db.query.categories.findFirst({
            where: eq(categories.id, product.category.parentId),
          }))?.name
        : undefined,
      subcategories: await getSubcategories(db, product.categoryId),
    }

    // Get related products (same category)
    const relatedProducts = await db.query.products.findMany({
      where: and(
        eq(products.categoryId, product.categoryId),
        eq(products.archived, false),
        sql`${products.id} != ${id}`
      ),
      with: {
        category: true,
      },
      orderBy: [desc(products.createdAt)],
      limit: 10,
    })

    const formattedRelatedProducts = relatedProducts.map((p: any) => ({
      productId: p.id,
      productName: p.name,
      relation: 'cross_sell',
      confidence: 0.7, // Simplified confidence score
    }))

    const compatibility = {
      productId: id,
      productName: product.name,
      compatibleWith: {
        baskets: compatibleBaskets,
        categories: [categoryHierarchy],
        relatedProducts: formattedRelatedProducts,
      },
      incompatibleWith: {
        products: [],
        categories: [],
      },
    }

    return NextResponse.json({ compatibility })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product compatibility GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

async function getCategoryPath(db: any, categoryId: string): Promise<string[]> {
  const path: string[] = []
  let currentCategory = await (db.query as any).categories.findFirst({
    where: eq(categories.id, categoryId),
  })

  while (currentCategory) {
    path.unshift(currentCategory.name)
    if (currentCategory.parentId) {
      currentCategory = await (db.query as any).categories.findFirst({
        where: eq(categories.id, currentCategory.parentId),
      })
    } else {
      break
    }
  }

  return path
}

async function getSubcategories(db: any, categoryId: string) {
  const subcategories = await (db.query as any).categories.findMany({
    where: eq(categories.parentId, categoryId),
    with: {
      products: true,
    },
  })

  return subcategories.map((cat: any) => ({
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    productCount: cat.products?.filter((p: any) => !p.archived).length || 0,
  }))
}
