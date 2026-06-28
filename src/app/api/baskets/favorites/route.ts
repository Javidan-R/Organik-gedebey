// src/app/api/baskets/favorites/route.ts
// Get user's favorite baskets

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { basketFavorites } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['CUSTOMER', 'ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const favorites = await db.query.basketFavorites.findMany({
      where: eq(basketFavorites.userId, session.user.id),
      with: {
        basket: {
          with: {
            media: true,
            variants: true,
          },
        },
      },
      orderBy: [basketFavorites.createdAt],
    })

    return NextResponse.json({ 
      favorites: favorites.map((f: any) => f.basket) 
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[baskets/favorites] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
