import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, productImages, productTags, productVariants } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

// GET /api/products/:id
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    const product = await db.query.products.findFirst({
      where: eq(products.id, params.id),
      with: {
        category: true,
        images: true,
        tags: true,
        variants: true,
        reviews: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// PATCH /api/products/:id
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const body = await req.json()

    const updatedProduct = await db.transaction(async (tx) => {
      // 1. Əsas məhsul məlumatlarını yeniləyirik
      const [updated] = await tx
        .update(products)
        .set({
          name: body.name,
          slug: body.slug,
          description: body.description,
          basePrice: body.basePrice?.toString(),
          discountType: body.discountType,
          discountValue: body.discountValue?.toString(),
          unit: body.unit,
          archived: body.archived,
          originRegion: body.originRegion,
          categoryId: body.categoryId,
          updatedAt: new Date(),
        })
        .where(eq(products.id, params.id))
        .returning()

      if (!updated) return null

      // 2. Şəkilləri yeniləyirik (köhnələri silib yenilərini əlavə etmək ən sadə yoldur)
      if (body.images) {
        await tx.delete(productImages).where(eq(productImages.productId, params.id))
        if (body.images.length > 0) {
          await tx.insert(productImages).values(
            body.images.map((url: string, index: number) => ({
              productId: params.id,
              url,
              displayOrder: index,
            }))
          )
        }
      }

      // 3. Taqları yeniləyirik
      if (body.tags) {
        await tx.delete(productTags).where(eq(productTags.productId, params.id))
        if (body.tags.length > 0) {
          await tx.insert(productTags).values(
            body.tags.map((tag: string) => ({
              productId: params.id,
              tag,
            }))
          )
        }
      }

      // 4. Stok məlumatı gəlibsə, Default Variant-ı yeniləyirik
      if (body.stock !== undefined) {
        await tx
          .update(productVariants)
          .set({ 
            stock: body.stock,
            basePrice: body.basePrice?.toString() 
          })
          .where(eq(productVariants.productId, params.id))
      }

      return updated
    })

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('PATCH /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Yenilənmə xətası' }, { status: 500 })
  }
}

// DELETE /api/products/:id
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Cascade delete schema-da aktiv olduğu üçün productImages və productTags avtomatik silinəcək
    await db.delete(products).where(eq(products.id, params.id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Məhsul silinmədi' }, { status: 500 })
  }
}