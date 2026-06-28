// src/app/api/account/wishlist/route.ts
// İstifadəçinin istək siyahısı

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { wishlist, products } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const wishlistItems = await db.query.wishlist.findMany({
      where: eq(wishlist.userId, payload.sub),
      with: {
        product: true,
      },
    })

    return NextResponse.json({ items: wishlistItems })
  } catch (error) {
    console.error('[account/wishlist] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { productId } = body

    if (!productId) {
      return NextResponse.json({ error: 'ProductId tələb olunur' }, { status: 400 })
    }

    // Check if already in wishlist
    const [existing] = await db
      .select()
      .from(wishlist)
      .where(and(eq(wishlist.userId, payload.sub), eq(wishlist.productId, productId)))
      .limit(1)

    if (existing) {
      return NextResponse.json({ error: 'Artıq istək siyahısında var' }, { status: 409 })
    }

    const [newItem] = await db
      .insert(wishlist)
      .values({
        userId: payload.sub,
        productId,
      })
      .returning()

    return NextResponse.json({ item: newItem }, { status: 201 })
  } catch (error) {
    console.error('[account/wishlist] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const productId = searchParams.get('productId')

    if (!productId) {
      return NextResponse.json({ error: 'ProductId tələb olunur' }, { status: 400 })
    }

    await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, payload.sub), eq(wishlist.productId, productId)))

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[account/wishlist] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
