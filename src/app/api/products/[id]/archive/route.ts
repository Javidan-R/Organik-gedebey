import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { products } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
  try {
    // Məhsulu tapırıq və arxivləyirik
    const result = await db
      .update(products)
      .set({ archived: true, updatedAt: new Date() })
      .where(eq(products.id, params.id))
      .returning({ id: products.id })

    if (result.length === 0) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ success: true, message: 'Məhsul arxivləndi' })
  } catch (error) {
    console.error('Archive error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}