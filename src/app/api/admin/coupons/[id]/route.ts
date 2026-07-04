// src/app/api/admin/coupons/[id]/route.ts
// Admin Coupon API - Individual Coupon Operations

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { coupons, couponUsage } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
 
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

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params
    
    const coupon = await db.query.coupons.findFirst({
      where: eq(coupons.id, id),
    })

    if (!coupon) {
      return NextResponse.json({ error: 'Kupon tapılmadı' }, { status: 404 })
    }

    // Get usage statistics
    const usageStats = await db
      .select({ count: sql`count(*)` })
      .from(couponUsage)
      .where(eq(couponUsage.couponId, id))

    return NextResponse.json({ 
      coupon,
      usageCount: Number(usageStats[0]?.count ?? 0)
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Coupon GET error:', error)
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
    const validatedData = updateCouponSchema.parse(body)

    const [updatedCoupon] = await db
      .update(coupons)
      .set({
        ...validatedData,
        code: validatedData.code ? validatedData.code.toUpperCase() : undefined,
        validFrom: validatedData.validFrom ? new Date(validatedData.validFrom) : undefined,
        validUntil: validatedData.validUntil ? new Date(validatedData.validUntil) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(coupons.id, id))
      .returning()

    if (!updatedCoupon) {
      return NextResponse.json({ error: 'Kupon tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ coupon: updatedCoupon })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Coupon PATCH error:', error)
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

    const [deletedCoupon] = await db
      .update(coupons)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(coupons.id, id))
      .returning()

    if (!deletedCoupon) {
      return NextResponse.json({ error: 'Kupon tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Kupon uğurla silindi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Coupon DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
