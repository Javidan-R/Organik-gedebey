// src/app/api/admin/reviews/route.ts
// Admin Reviews API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { reviews } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'
import { z } from 'zod'
import { sql } from 'drizzle-orm'

const updateReviewSchema = z.object({
  isApproved: z.boolean().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status') // 'approved', 'pending', 'all'
    const productId = searchParams.get('productId')

    const conditions: any[] = []
    
    if (status === 'approved') {
      conditions.push(eq(reviews.isApproved, true))
    } else if (status === 'pending') {
      conditions.push(eq(reviews.isApproved, false))
    }
    
    if (productId) {
      conditions.push(eq(reviews.productId, productId))
    }

    const offset = (page - 1) * limit

    const reviewsData = await (db.query as any).reviews.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        product: {
          columns: {
            id: true,
            name: true,
            slug: true,
          },
        },
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: [desc(reviews.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(reviews)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      reviews: reviewsData,
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
    console.error('Reviews GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const body = await request.json()
    const { reviewId, isApproved } = body

    if (!reviewId) {
      return NextResponse.json({ error: 'Review ID tələb olunur' }, { status: 400 })
    }

    const validatedData = updateReviewSchema.parse({ isApproved })

    const [updatedReview] = await db
      .update(reviews)
      .set({
        isApproved: validatedData.isApproved,
        updatedAt: new Date(),
      })
      .where(eq(reviews.id, reviewId))
      .returning()

    if (!updatedReview) {
      return NextResponse.json({ error: 'Rəy tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ review: updatedReview })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Reviews PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
