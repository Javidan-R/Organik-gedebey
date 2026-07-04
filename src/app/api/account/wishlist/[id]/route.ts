import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { wishlist, products } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, ['CUSTOMER'])
    const { id: productId } = params

    // Check if product exists
    const [product] = await db
      .select()
      .from(products)
      .where(eq(products.id, productId))
      .limit(1)

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    // Add to wishlist
    const [newWishlistItem] = await db
      .insert(wishlist)
      .values({
        userId: user.id,
        productId: productId,
      })
      .returning()

    return NextResponse.json({ wishlistItem: newWishlistItem }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Add to wishlist error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const user = await requireAuth(request, ['CUSTOMER'])
    const { id: productId } = params

    const [deletedItem] = await db
      .delete(wishlist)
      .where(and(eq(wishlist.userId, user.id), eq(wishlist.productId, productId)))
      .returning()

    if (!deletedItem) {
      return NextResponse.json({ error: 'Wishlist elementi tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Remove from wishlist error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
