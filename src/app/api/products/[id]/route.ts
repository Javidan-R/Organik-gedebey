import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, productImages, productTags, productVariants } from '@/lib/db/schema'
import { eq, and, inArray } from 'drizzle-orm'

// Discount type mapper
const mapDiscountType = (type: string | undefined): string | null => {
  if (!type) return null;
  const lower = type.toLowerCase();
  if (lower === 'percentage') return 'PERCENTAGE';
  if (lower === 'fixed') return 'FIXED';
  return (type === 'PERCENTAGE' || type === 'FIXED') ? type : null;
};

// Tarixləri təhlükəsiz şəkildə ISO string-ə çevir
const toISOStringSafe = (value: any): string | null => {
  if (!value) return null;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return new Date(value).toISOString();
  return null;
};

export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: { category: true, images: true, tags: true, variants: true, reviews: true },
    })
    if (!product) return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    return NextResponse.json({ product })
  } catch (error) {
    console.error('GET /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: productId } = await params
    if (!productId) {
      return NextResponse.json({ error: 'Məhsul ID-si tələb olunur' }, { status: 400 })
    }

    const body = await req.json()

    // 1. Məhsul əsas məlumatları (tarix yoxdur, təhlükəsiz)
    const updateData: any = {
      name: body.name ?? '',
      slug: body.slug ?? '',
      description: body.description ?? '',
      categoryId: body.categoryId ?? null,
      basePrice: body.basePrice?.toString() ?? '0',
      discountType: mapDiscountType(body.discountType),
      discountValue: body.discountValue?.toString() ?? null,
      unit: body.unit ?? 'ədəd',
      originRegion: body.originRegion ?? null,
      archived: body.archived ?? false,
      isFeatured: body.isFeatured ?? false,
      updatedAt: new Date(), // Date obyekti – Drizzle avtomatik çevirir
    }
    if (body.isSeasonal !== undefined) updateData.isSeasonal = body.isSeasonal
    if (body.isOrganic !== undefined) updateData.isOrganic = body.isOrganic

    await db.update(products).set(updateData).where(eq(products.id, productId))

    // 2. Şəkillər
    await db.delete(productImages).where(eq(productImages.productId, productId))
    if (body.images && body.images.length > 0) {
      await db.insert(productImages).values(
        body.images.map((url: string, idx: number) => ({
          productId,
          url,
          displayOrder: idx,
        }))
      )
    }

    // 3. Taqlar
    await db.delete(productTags).where(eq(productTags.productId, productId))
    if (body.tags && body.tags.length > 0) {
      await db.insert(productTags).values(
        body.tags.map((tag: string) => ({
          productId,
          tag: tag.toLowerCase().trim(),
        }))
      )
    }

    // 4. Variantlar – tarix sahələrini təhlükəsiz işlə
    const incomingVariants = body.variants || []
    const existingVariants = await db
      .select({ id: productVariants.id })
      .from(productVariants)
      .where(eq(productVariants.productId, productId))
    const existingIds = new Set(existingVariants.map(v => v.id))
    const incomingIds = new Set(incomingVariants.map((v: any) => v.id).filter(Boolean))

    const toDelete = [...existingIds].filter(id => !incomingIds.has(id))
    if (toDelete.length > 0) {
      await db.delete(productVariants).where(
        and(eq(productVariants.productId, productId), inArray(productVariants.id, toDelete))
      )
    }

    for (const variant of incomingVariants) {
      // Tarixləri təhlükəsiz çevir
      const createdAtSafe = variant.createdAt ? new Date(variant.createdAt) : new Date()
      const batchDateSafe = variant.batchDate ? variant.batchDate : new Date().toISOString().split('T')[0]

      const variantData = {
        productId,
        name: variant.name || 'Standart',
        stock: variant.stock ?? 0,
        basePrice: (variant.price ?? 0).toString(),
        costPrice: (variant.costPrice ?? 0).toString(),
        arrivalCost: (variant.arrivalCost ?? 0).toString(),
        minStock: variant.minStock ?? 10,
        grade: variant.grade ?? 'A',
        unit: variant.unit ?? body.unit ?? 'ədəd',
        batchDate: batchDateSafe,
        label: variant.label || variant.name,
        isDefault: variant.isDefault ?? false,
        createdAt: createdAtSafe, // Date obyekti – Drizzle işləyəcək
      }

      if (variant.id && existingIds.has(variant.id)) {
        await db.update(productVariants).set(variantData).where(eq(productVariants.id, variant.id))
      } else {
        await db.insert(productVariants).values(variantData)
      }
    }

    // Yenilənmiş məhsulu geri qaytar
    const updatedProduct = await db.query.products.findFirst({
      where: eq(products.id, productId),
      with: { images: true, tags: true, variants: true, category: true, reviews: true },
    })

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    console.error('PATCH /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Yenilənmə xətası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id } = await params
    await db.delete(products).where(eq(products.id, id))
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('DELETE /api/products/[id] error:', error)
    return NextResponse.json({ error: 'Məhsul silinmədi' }, { status: 500 })
  }
}