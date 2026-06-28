// src/app/api/admin/baskets/[id]/route.ts
// Admin Basket API - Individual Basket Operations

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { baskets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

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
  archived: z.boolean().optional(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params
    
    const basket = await (db.query as any).baskets.findFirst({
      where: eq(baskets.id, id),
      with: {
        variants: true,
      },
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ basket })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Basket GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { id } = params
    const body = await request.json()
    const validatedData = updateBasketSchema.parse(body)

    const [updatedBasket] = await db
      .update(baskets)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(baskets.id, id))
      .returning()

    if (!updatedBasket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ basket: updatedBasket })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Basket PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { id } = params

    const [deletedBasket] = await db
      .update(baskets)
      .set({ archived: true, isActive: false, updatedAt: new Date() })
      .where(eq(baskets.id, id))
      .returning()

    if (!deletedBasket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Səbət uğurla arxivləşdirildi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Basket DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
