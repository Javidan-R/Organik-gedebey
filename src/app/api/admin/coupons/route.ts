// src/app/api/admin/coupons/route.ts
// Admin Coupons API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { coupons } from '@/lib/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const createCouponSchema = z.object({
  code: z.string().min(3, 'Kod ən az 3 simvol olmalıdır'),
  discountType: z.enum(['PERCENTAGE', 'FIXED']),
  discountValue: z.string().min(1, 'Endirim dəyəri tələb olunur'),
  minOrderAmount: z.string().optional(),
  maxDiscountAmount: z.string().optional(),
  usageLimit: z.number().optional(),
  usagePerUser: z.number().default(1),
  applicableTo: z.enum(['all', 'categories', 'products']).default('all'),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().default(true),
})

const updateCouponSchema = z.object({
  code: z.string().min(3).optional(),
  discountType: z.enum(['PERCENTAGE', 'FIXED']).optional(),
  discountValue: z.string().optional(),
  minOrderAmount: z.string().optional(),
  maxDiscountAmount: z.string().optional(),
  usageLimit: z.number().optional(),
  usagePerUser: z.number().optional(),
  applicableTo: z.enum(['all', 'categories', 'products']).optional(),
  categoryIds: z.array(z.string()).optional(),
  productIds: z.array(z.string()).optional(),
  validFrom: z.string().optional(),
  validUntil: z.string().optional(),
  isActive: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'active', 'expired', 'all'
    const search = searchParams.get('search')

    const conditions: any[] = []
    
    if (status === 'active') {
      conditions.push(eq(coupons.isActive, true))
    } else if (status === 'expired') {
      conditions.push(eq(coupons.isActive, false))
    }
    
    if (search) {
      conditions.push(like(coupons.code, `%${search}%`))
    }

    const offset = (page - 1) * limit

    const couponsData = await db
      .select()
      .from(coupons)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(coupons.createdAt))
      .limit(limit)
      .offset(offset)

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(coupons)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      coupons: couponsData,
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
    console.error('Coupons GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const validatedData = createCouponSchema.parse(body)

    const [newCoupon] = await db
      .insert(coupons)
      .values({
        code: validatedData.code.toUpperCase(),
        discountType: validatedData.discountType,
        discountValue: validatedData.discountValue,
        minOrderAmount: validatedData.minOrderAmount,
        maxDiscountAmount: validatedData.maxDiscountAmount,
        usageLimit: validatedData.usageLimit,
        usagePerUser: validatedData.usagePerUser,
        applicableTo: validatedData.applicableTo,
        categoryIds: validatedData.categoryIds,
        productIds: validatedData.productIds,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : null,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : null,
        isActive: validatedData.isActive,
        totalUsed: 0,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ coupon: newCoupon }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Coupons POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
