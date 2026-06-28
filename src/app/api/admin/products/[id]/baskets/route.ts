// src/app/api/admin/products/[id]/baskets/route.ts
// Product-Basket Relationship API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { basketContents } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params

    // Find all baskets that contain this product
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

    const formattedRelations = basketRelations
      .map((item: any) => {
        const basket = item.basketVariant?.basket
        if (!basket) return null

        return {
          productId: id,
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

    return NextResponse.json({ relations: formattedRelations })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product baskets GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
