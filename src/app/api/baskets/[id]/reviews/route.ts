// src/app/api/baskets/[id]/reviews/route.ts
// Basket reviews management

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketReviews, orderItems, orders } from '@/lib/db/schema'
import { eq, and, desc, avg, sql } from 'drizzle-orm'
import { requireAuth, AuthError } from '@/lib/auth'
import { z } from 'zod'

const reviewSchema = z.object({
  rating: z.number().min(1).max(5),
  title: z.string().max(255).optional(),
  comment: z.string().min(10).max(2000),
  images: z.array(z.string()).optional(),
})

// GET reviews for a basket
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const approvedOnly = searchParams.get('approved') !== 'false'

    const reviews = await db.query.basketReviews.findMany({
      where: and(
        eq(basketReviews.basketId, params.id),
        approvedOnly ? eq(basketReviews.isApproved, true) : undefined
      ),
      orderBy: [desc(basketReviews.createdAt)],
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            avatarUrl: true,
          },
        },
      },
    })

    // Calculate average rating
    const ratingResult = await db
      .select({ avg: avg(basketReviews.rating) })
      .from(basketReviews)
      .where(and(
        eq(basketReviews.basketId, params.id),
        eq(basketReviews.isApproved, true)
      ))

    return NextResponse.json({
      reviews,
      averageRating: ratingResult[0]?.avg || 0,
      totalReviews: reviews.length,
    })
  } catch (error) {
    console.error('[baskets/[id]/reviews] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// POST new review
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request, ['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPERADMIN'])
    const body = await request.json()
    const validatedData = reviewSchema.parse(body)

    // Check if basket exists
    const basket = await db.query.baskets.findFirst({
      where: eq(baskets.id, params.id),
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    // Check if user already reviewed this basket
    const existingReview = await db.query.basketReviews.findFirst({
      where: and(
        eq(basketReviews.basketId, params.id),
        eq(basketReviews.userId, session.user.id)
      ),
    })

    if (existingReview) {
      return NextResponse.json({ error: 'Artıq rəy yazmısınız' }, { status: 400 })
    }

    // Check if user purchased this basket
    const orderItem = await db.query.orderItems.findFirst({
      where: and(
        eq(orderItems.basketId, params.id),
        eq(orderItems.orderId, sql`${orderItems.orderId} IN (SELECT id FROM orders WHERE user_id = ${session.user.id})`)
      ),
    })

    const isVerifiedPurchase = !!orderItem

    // Create review
    const [newReview] = await db.insert(basketReviews).values({
      basketId: params.id,
      userId: session.user.id,
      orderId: orderItem?.orderId,
      rating: validatedData.rating,
      title: validatedData.title,
      comment: validatedData.comment,
      images: validatedData.images,
      isVerifiedPurchase,
      isApproved: true, // Auto-approve for now
    }).returning()

    // Update basket rating stats
    const ratingStats = await db
      .select({ 
        avg: avg(basketReviews.rating),
        count: sql<number>`COUNT(*)`
      })
      .from(basketReviews)
      .where(and(
        eq(basketReviews.basketId, params.id),
        eq(basketReviews.isApproved, true)
      ))

    await db.update(baskets)
      .set({
        averageRating: ratingStats[0]?.avg?.toString() || '0',
        reviewCount: ratingStats[0]?.count || 0,
      })
      .where(eq(baskets.id, params.id))

    return NextResponse.json({ review: newReview }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({
        error: 'Validation error',
        details: error.issues
      }, { status: 400 })
    }
    console.error('[baskets/[id]/reviews] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
