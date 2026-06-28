// src/app/api/admin/baskets/route.ts
// Admin Baskets API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { baskets, basketVariants } from '@/lib/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const createBasketSchema = z.object({
  name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  slug: z.string().min(2, 'Slug ən az 2 simvol olmalıdır'),
  tagline: z.string().optional(),
  description: z.string().min(10, 'Təsvir ən az 10 simvol olmalıdır'),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']),
  servings: z.string().optional(),
  unit: z.string().default('səbət'),
  origin: z.string().optional(),
  freshness: z.string().optional(),
  nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().default(false),
  trending: z.boolean().default(false),
  new: z.boolean().default(false),
  lowStock: z.boolean().default(false),
  stock: z.number().default(0),
  discount: z.number().default(0),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().default(0),
  isActive: z.boolean().default(true),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

const updateBasketSchema = z.object({
  name: z.string().min(2).optional(),
  slug: z.string().min(2).optional(),
  tagline: z.string().optional(),
  description: z.string().min(10).optional(),
  type: z.enum(['gence', 'gedebey', 'sheki', 'lenkaran', 'ramazan', 'custom']).optional(),
  servings: z.string().optional(),
  unit: z.string().optional(),
  origin: z.string().optional(),
  freshness: z.string().optional(),
  nutrition: z.array(z.string()).optional(),
  bestseller: z.boolean().optional(),
  trending: z.boolean().optional(),
  new: z.boolean().optional(),
  lowStock: z.boolean().optional(),
  stock: z.number().optional(),
  discount: z.number().optional(),
  highlights: z.array(z.string()).optional(),
  displayOrder: z.number().optional(),
  isActive: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const status = searchParams.get('status') // 'active', 'archived', 'all'
    const search = searchParams.get('search')

    const conditions: any[] = []
    
    if (type) {
      conditions.push(eq(baskets.type, type as any))
    }
    
    if (status === 'active') {
      conditions.push(eq(baskets.isActive, true))
    } else if (status === 'archived') {
      conditions.push(eq(baskets.archived, true))
    }
    
    if (search) {
      conditions.push(like(baskets.name, `%${search}%`))
    }

    const offset = (page - 1) * limit

    const basketsData = await (db.query as any).baskets.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        variants: true,
      },
      orderBy: [desc(baskets.displayOrder), desc(baskets.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(baskets)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      baskets: basketsData,
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
    console.error('Baskets GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const validatedData = createBasketSchema.parse(body)

    const [newBasket] = await db
      .insert(baskets)
      .values({
        ...validatedData,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ basket: newBasket }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Baskets POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
