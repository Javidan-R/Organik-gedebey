// src/app/api/admin/products/[id]/route.ts
// Admin Product API - Individual Product Operations

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

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
        images: true,
        variants: true,
        tags: true,
        reviews: true,
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ product })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product GET error:', error)
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
    const validatedData = updateProductSchema.parse(body)

    const [updatedProduct] = await db
      .update(products)
      .set({
        ...validatedData,
        discountStart: validatedData.discountStart ? new Date(validatedData.discountStart) : undefined,
        discountEnd: validatedData.discountEnd ? new Date(validatedData.discountEnd) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(products.id, id))
      .returning()

    if (!updatedProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ product: updatedProduct })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Product PATCH error:', error)
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

    const [deletedProduct] = await db
      .update(products)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning()

    if (!deletedProduct) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Məhsul uğurla arxivləşdirildi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
