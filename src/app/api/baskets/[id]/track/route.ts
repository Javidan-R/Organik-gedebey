// src/app/api/baskets/[id]/track/route.ts
// Basket analytics tracking

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketAnalytics } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const trackSchema = {
  eventType: ['view', 'click', 'add_to_cart', 'purchase'],
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { eventType, userId, sessionId, metadata } = body

    // Validate event type
    if (!trackSchema.eventType.includes(eventType)) {
      return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
    }

    // Check if basket exists
    const basket = await db.query.baskets.findFirst({
      where: eq(baskets.id, params.id),
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    // Track event
    await db.insert(basketAnalytics).values({
      basketId: params.id,
      userId: userId || null,
      sessionId: sessionId || null,
      eventType,
      metadata: metadata || null,
    })

    // Update view count for view events
    if (eventType === 'view') {
      await db.update(baskets)
        .set({ viewCount: (basket.viewCount || 0) + 1 })
        .where(eq(baskets.id, params.id))
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[baskets/[id]/track] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
