// src/app/api/baskets/[id]/favorites/route.ts
// Basket favorites management

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketFavorites } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { requireAuth, AuthError } from '@/lib/auth'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request, ['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    // Check if basket exists
    const basket = await db.query.baskets.findFirst({
      where: eq(baskets.id, params.id),
    })
 
    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    // Check if already favorited
    const existing = await db.query.basketFavorites.findFirst({
      where: and(
        eq(basketFavorites.userId, session.user.id),
        eq(basketFavorites.basketId, params.id)
      ),
    })

    if (existing) {
      // Remove favorite
      await db.delete(basketFavorites).where(eq(basketFavorites.id, existing.id))
      
      // Update favorite count
      await db.update(baskets)
        .set({ favoriteCount: (basket.favoriteCount || 0) - 1 })
        .where(eq(baskets.id, params.id))

      return NextResponse.json({ favorited: false })
    }

    // Add favorite
    await db.insert(basketFavorites).values({
      userId: session.user.id,
      basketId: params.id,
    })

    // Update favorite count
    await db.update(baskets)
      .set({ favoriteCount: (basket.favoriteCount || 0) + 1 })
      .where(eq(baskets.id, params.id))

    return NextResponse.json({ favorited: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[baskets/[id]/favorites] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request, ['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const favorite = await db.query.basketFavorites.findFirst({
      where: and(
        eq(basketFavorites.userId, session.user.id),
        eq(basketFavorites.basketId, params.id)
      ),
    })

    return NextResponse.json({ favorited: !!favorite })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[baskets/[id]/favorites] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
