// src/app/api/baskets/[id]/route.ts
// Tək səbət əməliyyatları

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketMedia, basketVariants, basketContents, basketExtras } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const basket = await (db.query as any).baskets.findFirst({
      where: eq(baskets.id, params.id),
      with: {
        category: true,
        media: {
          orderBy: [basketMedia.displayOrder]
        },
        variants: {
          with: {
            contents: {
              orderBy: [basketContents.displayOrder]
            },
            extras: {
              orderBy: [basketExtras.displayOrder]
            }
          }
        }
      }
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ basket })
  } catch (error) {
    console.error('[baskets/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    const updatedBasket = await db.transaction(async (tx) => {
      // Əsas səbəti yenilə
      const basketResult: any[] = await tx.update(baskets)
        .set({
          name: body.name,
          slug: body.slug,
          tagline: body.tagline,
          description: body.description,
          categoryId: body.categoryId,
          type: body.type,
          servings: body.servings,
          unit: body.unit,
          origin: body.origin,
          freshness: body.freshness,
          nutrition: body.nutrition,
          bestseller: body.bestseller,
          trending: body.trending,
          new: body.new,
          lowStock: body.lowStock,
          stock: body.stock,
          discount: body.discount,
          highlights: body.highlights,
          displayOrder: body.displayOrder,
          isActive: body.isActive,
          archived: body.archived,
          metaTitle: body.metaTitle,
          metaDescription: body.metaDescription,
          seasonalStart: body.seasonalStart ? new Date(body.seasonalStart) : null,
          seasonalEnd: body.seasonalEnd ? new Date(body.seasonalEnd) : null,
          isSeasonal: body.isSeasonal,
        })
        .where(eq(baskets.id, params.id))
        .returning()

      if (!basketResult || !Array.isArray(basketResult) || basketResult.length === 0) throw new Error('Basket update failed')

      const updatedBasket = basketResult[0]!

      // Köhnə media və variantları sil
      await tx.delete(basketMedia).where(eq(basketMedia.basketId, params.id))
      await tx.delete(basketVariants).where(eq(basketVariants.basketId, params.id))

      // Yeni media əlavə et
      if (body.media && body.media.length > 0) {
        await tx.insert(basketMedia).values(
          body.media.map((media: any, index: number) => ({
            basketId: params.id,
            type: media.type,
            url: media.url,
            altText: media.altText || null,
            displayOrder: media.displayOrder !== undefined ? media.displayOrder : index,
          }))
        )
      }

      // Yeni variantları əlavə et
      if (body.variants && body.variants.length > 0) {
        for (const variant of body.variants) {
          const variantResult: any[] = await tx.insert(basketVariants).values({
            basketId: params.id,
            variant: variant.variant,
            price: typeof variant.price === 'number' ? variant.price.toString() : variant.price,
            originalPrice: variant.originalPrice 
              ? (typeof variant.originalPrice === 'number' ? variant.originalPrice.toString() : variant.originalPrice)
              : null,
            stock: variant.stock,
            gift: variant.gift || null,
          }).returning()

          if (!variantResult || !Array.isArray(variantResult) || variantResult.length === 0) continue

          const insertedVariant = variantResult[0]!

          if (variant.contents && variant.contents.length > 0) {
            await tx.insert(basketContents).values(
              variant.contents.map((content: string, index: number) => ({
                basketVariantId: insertedVariant.id,
                content,
                displayOrder: index,
              }))
            )
          }

          if (variant.extras && variant.extras.length > 0) {
            await tx.insert(basketExtras).values(
              variant.extras.map((extra: string, index: number) => ({
                basketVariantId: insertedVariant.id,
                extra,
                displayOrder: index,
              }))
            )
          }
        }
      }

      return updatedBasket
    })

    const completeBasket = await (db.query as any).baskets.findFirst({
      where: eq(baskets.id, updatedBasket.id),
      with: {
        category: true,
        media: {
          orderBy: [basketMedia.displayOrder]
        },
        variants: {
          with: {
            contents: {
              orderBy: [basketContents.displayOrder]
            },
            extras: {
              orderBy: [basketExtras.displayOrder]
            }
          }
        }
      }
    })

    return NextResponse.json({ basket: completeBasket })
  } catch (error) {
    console.error('[baskets/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await db.delete(baskets).where(eq(baskets.id, params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[baskets/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
