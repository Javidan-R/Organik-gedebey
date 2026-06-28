// src/app/api/baskets/[id]/analytics/route.ts
// Basket analytics summary

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketAnalytics, basketReviews, basketFavorites } from '@/lib/db/schema'
import { eq, and, sql, desc, gte } from 'drizzle-orm'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])

    const { searchParams } = new URL(request.url)
    const period = searchParams.get('period') || '30d'

    // Calculate date range
    const now = new Date()
    let startDate: Date
    switch (period) {
      case '7d':
        startDate = new Date(now.setDate(now.getDate() - 7))
        break
      case '30d':
        startDate = new Date(now.setDate(now.getDate() - 30))
        break
      case '90d':
        startDate = new Date(now.setDate(now.getDate() - 90))
        break
      default:
        startDate = new Date(now.setDate(now.getDate() - 30))
    }

    // Get basket details
    const basket = await db.query.baskets.findFirst({
      where: eq(baskets.id, params.id),
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    // Get analytics events
    const events = await db.query.basketAnalytics.findMany({
      where: and(
        eq(basketAnalytics.basketId, params.id),
        gte(basketAnalytics.createdAt, startDate)
      ),
    })

    // Calculate metrics
    const views = events.filter(e => e.eventType === 'view').length
    const clicks = events.filter(e => e.eventType === 'click').length
    const addToCart = events.filter(e => e.eventType === 'add_to_cart').length
    const purchases = events.filter(e => e.eventType === 'purchase').length

    const conversionRate = views > 0 ? (purchases / views) * 100 : 0

    // Get reviews stats
    const reviews = await db.query.basketReviews.findMany({
      where: eq(basketReviews.basketId, params.id),
    })

    const avgRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0

    // Get favorites count
    const favorites = await db.query.basketFavorites.findMany({
      where: eq(basketFavorites.basketId, params.id),
    })

    return NextResponse.json({
      basket: {
        id: basket.id,
        name: basket.name,
        viewCount: basket.viewCount,
        soldCount: basket.soldCount,
        averageRating: basket.averageRating,
        reviewCount: basket.reviewCount,
        favoriteCount: basket.favoriteCount,
      },
      analytics: {
        period,
        dateRange: {
          start: startDate.toISOString(),
          end: new Date().toISOString(),
        },
        metrics: {
          views,
          clicks,
          addToCart,
          purchases,
          conversionRate: parseFloat(conversionRate.toFixed(2)),
        },
        reviews: {
          total: reviews.length,
          averageRating: parseFloat(avgRating.toFixed(2)),
        },
        favorites: {
          total: favorites.length,
        },
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[baskets/[id]/analytics] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
