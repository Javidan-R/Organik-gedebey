import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketMedia, basketVariants, basketContents, basketExtras } from '@/lib/db/schema'
import { eq, and, or, like, desc } from 'drizzle-orm'
import { generateUniqueSlug } from '@/lib/slug'
import { z } from 'zod'

// Validation schemas
const basketMediaSchema = z.object({
  type: z.enum(['image', 'video']).default('image'),
  url: z.string().url(),
  altText: z.string().nullable(),
  displayOrder: z.number().optional(),
})

const basketContentSchema = z.array(z.string())

const basketExtraSchema = z.array(z.string())

const basketVariantSchema = z.object({
  variant: z.enum(['econom', 'standard', 'premium']),
  price: z.string().or(z.number()),
  originalPrice: z.string().or(z.number()).nullable(),
  stock: z.number().min(0).default(0),
  gift: z.string().nullable().optional(),
  contents: basketContentSchema.optional(),
  extras: basketExtraSchema.optional(),
})

const createBasketSchema = z.object({
  name: z.string().min(2).max(255),
  slug: z.string().optional(),
  tagline: z.string().max(500).optional(),
  description: z.string().min(10),
  categoryId: z.string().uuid().optional(),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']).default('custom'),
  servings: z.string().max(100).optional(),
  unit: z.string().max(50).default('səbət'),
  origin: z.string().max(255).optional(),
  freshness: z.string().max(255).optional(),
  nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().default(false),
  trending: z.boolean().default(false),
  new: z.boolean().default(false),
  lowStock: z.boolean().default(false),
  stock: z.number().min(0).default(0),
  discount: z.number().min(0).max(100).default(0),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  archived: z.boolean().default(false),
  metaTitle: z.string().max(255).optional(),
  metaDescription: z.string().optional(),
  seasonalStart: z.string().datetime().optional(),
  seasonalEnd: z.string().datetime().optional(),
  isSeasonal: z.boolean().default(false),
  media: z.array(basketMediaSchema).optional(),
  variants: z.array(basketVariantSchema).optional(),
})

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const type = searchParams.get('type') || ''
  const showArchived = searchParams.get('showArchived') === 'true'
  const page = parseInt(searchParams.get('page') || '1')
  const limit = parseInt(searchParams.get('limit') || '50')
  const offset = (page - 1) * limit
  
  try {
    const whereClause = []
    
    // Arxivlənmiş səbətlər üçün filtr
    if (!showArchived) whereClause.push(eq(baskets.archived, false))
    
    // Tip filtr
    if (type) {
      const validTypes = ['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom'] as const
      if (validTypes.includes(type as any)) {
        whereClause.push(eq(baskets.type, type as any))
      }
    }

    // Axtarış
    if (search) {
      whereClause.push(
        or(
          like(baskets.name, `%${search}%`),
          like(baskets.description, `%${search}%`),
          like(baskets.tagline, `%${search}%`)
        )
      )
    }

    // Get total count for pagination
    const countResult = await db
      .select({ count: baskets.id })
      .from(baskets)
      .where(and(...whereClause))
    
    const total = countResult.length

    // Get paginated results
    const list = await (db.query as any).baskets.findMany({
      where: and(...whereClause),
      with: {
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
      },
      orderBy: [desc(baskets.displayOrder), desc(baskets.createdAt)],
      limit,
      offset,
    })

    return NextResponse.json({ 
      baskets: list, 
      pagination: { 
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      } 
    })
  } catch (error) {
    console.error('GET /api/baskets error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Validate input
    const validatedData = createBasketSchema.parse(body)

    const newBasket = await db.transaction(async (tx) => {
      // 1. Əsas səbəti yaradın
      const insertedBaskets: any[] = await tx.insert(baskets).values({
        name: validatedData.name,
        slug: validatedData.slug || generateUniqueSlug(validatedData.name),
        tagline: validatedData.tagline || '',
        description: validatedData.description,
        categoryId: validatedData.categoryId || null,
        type: validatedData.type,
        servings: validatedData.servings || null,
        unit: validatedData.unit,
        origin: validatedData.origin || null,
        freshness: validatedData.freshness || null,
        nutrition: validatedData.nutrition || [],
        bestseller: validatedData.bestseller,
        trending: validatedData.trending,
        new: validatedData.new,
        lowStock: validatedData.lowStock,
        stock: validatedData.stock,
        discount: validatedData.discount,
        highlights: validatedData.highlights || [],
        displayOrder: validatedData.displayOrder,
        isActive: validatedData.isActive,
        archived: validatedData.archived,
        metaTitle: validatedData.metaTitle || null,
        metaDescription: validatedData.metaDescription || null,
        seasonalStart: validatedData.seasonalStart ? new Date(validatedData.seasonalStart) : null,
        seasonalEnd: validatedData.seasonalEnd ? new Date(validatedData.seasonalEnd) : null,
        isSeasonal: validatedData.isSeasonal,
      }).returning()

      if (!insertedBaskets || !Array.isArray(insertedBaskets) || insertedBaskets.length === 0) {
        throw new Error('Basket insertion failed')
      }

      const newBasket = insertedBaskets[0]!

      // 2. Media (şəkil/video) əlavə edin
      if (validatedData.media && validatedData.media.length > 0) {
        await tx.insert(basketMedia).values(
          validatedData.media.map((media: any, index: number) => ({
            basketId: newBasket.id,
            type: media.type,
            url: media.url,
            altText: media.altText || null,
            displayOrder: media.displayOrder !== undefined ? media.displayOrder : index,
          }))
        )
      }

      // 3. Variantları əlavə edin
      if (validatedData.variants && validatedData.variants.length > 0) {
        for (const variant of validatedData.variants) {
          const variantResult: any[] = await tx.insert(basketVariants).values({
            basketId: newBasket.id,
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

          // 4. Variant məzmununu əlavə edin
          if (variant.contents && variant.contents.length > 0) {
            await tx.insert(basketContents).values(
              variant.contents.map((content, index) => ({
                basketVariantId: insertedVariant.id,
                content,
                displayOrder: index,
              }))
            )
          }

          // 5. Variant bonuslarını əlavə edin
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

      return newBasket
    })

    // Tam məlumatı geri qaytarmaq
    const completeBasket = await (db.query as any).baskets.findFirst({
      where: eq(baskets.id, newBasket.id),
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

    return NextResponse.json(completeBasket, { status: 201 })
  } catch (error) {
    console.error('POST /api/baskets error:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    
    return NextResponse.json({ error: 'Xəta baş verdi' }, { status: 500 })
  }
}
