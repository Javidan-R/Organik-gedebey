// src/app/api/admin/products/route.ts
// Admin Products API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { products, categories } from '@/lib/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const createProductSchema = z.object({
  name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  slug: z.string().min(2, 'Slug ən az 2 simvol olmalıdır'),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  basePrice: z.string().min(1, 'Qiymət tələb olunur'),
  costPrice: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.string().optional(),
  discountStart: z.string().optional(),
  discountEnd: z.string().optional(),
  unit: z.string().default('ədəd'),
  grade: z.enum(['A', 'B', 'C', 'UNSORTED']).default('A'),
  minStock: z.number().default(10),
  originRegion: z.string().optional(),
  supplier: z.string().optional(),
  shelfLifeDays: z.number().optional(),
  storageConditions: z.string().optional(),
  isOrganic: z.boolean().default(false),
  isGlutenFree: z.boolean().default(false),
  isVegan: z.boolean().default(false),
  caloriesPer100g: z.number().optional(),
  proteinPer100g: z.string().optional(),
  carbsPer100g: z.string().optional(),
  fatPer100g: z.string().optional(),
  isFeatured: z.boolean().default(false),
  isNewArrival: z.boolean().default(false),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
})

const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  categoryId: z.string().uuid().optional(),
  basePrice: z.string().optional(),
  costPrice: z.string().optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.string().optional(),
  discountStart: z.string().optional(),
  discountEnd: z.string().optional(),
  unit: z.string().optional(),
  grade: z.enum(['A', 'B', 'C', 'UNSORTED']).optional(),
  minStock: z.number().optional(),
  originRegion: z.string().optional(),
  supplier: z.string().optional(),
  shelfLifeDays: z.number().optional(),
  storageConditions: z.string().optional(),
  isOrganic: z.boolean().optional(),
  isGlutenFree: z.boolean().optional(),
  isVegan: z.boolean().optional(),
  caloriesPer100g: z.number().optional(),
  proteinPer100g: z.string().optional(),
  carbsPer100g: z.string().optional(),
  fatPer100g: z.string().optional(),
  isFeatured: z.boolean().optional(),
  isNewArrival: z.boolean().optional(),
  archived: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.array(z.string()).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const status = searchParams.get('status') // 'active', 'archived', 'all'
    const search = searchParams.get('search')
    const grade = searchParams.get('grade')

    const conditions: any[] = []
    
    if (category) {
      conditions.push(eq(products.categoryId, category))
    }
    
    if (status === 'active') {
      conditions.push(eq(products.archived, false))
    } else if (status === 'archived') {
      conditions.push(eq(products.archived, true))
    }
    
    if (grade) {
      conditions.push(eq(products.grade, grade as any))
    }
    
    if (search) {
      conditions.push(like(products.name, `%${search}%`))
    }

    const offset = (page - 1) * limit

    const productsData = await (db.query as any).products.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        category: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        images: true,
        variants: true,
        tags: true,
      },
      orderBy: [desc(products.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(products)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      products: productsData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Products GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const validatedData = createProductSchema.parse(body)

    const [newProduct] = await db
      .insert(products)
      .values({
        ...validatedData,
        discountStart: validatedData.discountStart ? new Date(validatedData.discountStart) : null,
        discountEnd: validatedData.discountEnd ? new Date(validatedData.discountEnd) : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ product: newProduct }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Products POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
