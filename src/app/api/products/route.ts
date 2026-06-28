import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products, categories, productImages, productTags, productVariants } from '@/lib/db/schema'
import { eq, and, or, like, ilike, desc, exists } from 'drizzle-orm'
import { generateUniqueSlug } from '@/lib/slug'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const categorySlug = searchParams.get('categorySlug') || ''
  const showArchived = searchParams.get('showArchived') === 'true'
  try {
    const whereClause = []
    
    // Arxivlənmiş məhsullar üçün filtr
    if (!showArchived) whereClause.push(eq(products.archived, false))
    
    if (categorySlug) {
      const cat = await (db.query as any).categories.findFirst({
        where: eq(categories.slug, categorySlug)
      })
      if (cat) {
        whereClause.push(eq(products.categoryId, cat.id))
      } else {
        return NextResponse.json({ products: [], pagination: { total: 0 } })
      }
    }

    if (search) {
      whereClause.push(
        or(
          like(products.name, `%${search}%`),
          like(products.description, `%${search}%`),
          exists(
            db.select()
              .from(productTags)
              .where(
                and(
                  eq(productTags.productId, products.id),
                  ilike(productTags.tag, `%${search}%`)
                )
              )
          )
        )
      )
    }

    const list = await (db.query as any).products.findMany({
      where: and(...whereClause),
      with: {
        category: true,
        reviews: true,
        images: true, // productImages cədvəli ilə əlaqə
        tags: true,   // productTags cədvəli ilə əlaqə
      },
      orderBy: [desc(products.createdAt)],
    })

    return NextResponse.json({ products: list, pagination: { total: list.length } })
  } catch (error) {
    console.error('GET /api/products error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
// app/api/products/route.ts daxilində POST funksiyasının sonu

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Handle categoryId - if it's not a UUID, look up by slug
    let categoryId = body.categoryId || null
    if (categoryId && typeof categoryId === 'string' && !categoryId.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const category = await (db.query as any).categories.findFirst({
        where: eq(categories.slug, categoryId)
      })
      if (category) {
        categoryId = category.id
      } else {
        categoryId = null
      }
    }

    const newProduct = await db.transaction(async (tx) => {
      // 1. Əsas məhsulu yaradın
      const [insertedProduct] = await tx.insert(products).values({
        name: body.name,
        slug: body.slug || generateUniqueSlug(body.name),
        description: body.description || '',
        basePrice: body.basePrice?.toString() || "0",
        unit: body.unit || 'ədəd',
        categoryId,
      }).returning()

      // 2. Şəkilləri əlavə edin
      if (body.images && body.images.length > 0 && insertedProduct) {
        await tx.insert(productImages).values(
          body.images.map((url: string, index: number) => ({
            productId: insertedProduct.id,
            url,
            displayOrder: index,
          }))
        )
      }

      // 3. Taqları əlavə edin
      if (body.tags && body.tags.length > 0 && insertedProduct) {
        const uniqueTags = [...new Set(body.tags)];
        await tx.insert(productTags).values(
          uniqueTags.map((tag: string) => ({
            productId: insertedProduct.id,
            tag,
          }))
        )
      }

      // 4. Default variant yaradın (stock üçün)
      if (insertedProduct) {
        await tx.insert(productVariants).values({
          productId: insertedProduct.id,
          name: 'Standart',
          stock: body.stock || 0,
          basePrice: body.basePrice?.toString() || "0",
          isDefault: true
        })
      }

      return insertedProduct
    })

    // --- Sizin istədiyiniz hissə: Tam məlumatı geri qaytarmaq ---
    if (!newProduct) {
      return NextResponse.json({ error: 'Məhsul yaradıla bilmədi' }, { status: 500 })
    }
    const completeProduct = await (db.query as any).products.findFirst({
      where: eq(products.id, newProduct.id),
      with: {
        images: true,
        tags: true,
        variants: true,
        category: true
      }
    }) 

    return NextResponse.json(completeProduct, { status: 201 })
  } catch (error) {
    console.error('POST /api/products error:', error)
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 })
  }
}