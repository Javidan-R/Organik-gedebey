import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    
    // Check if basket exists first by attempting update
    const [basket] = await db.update(baskets)
      .set({ 
        archived: false,
        updatedAt: new Date()
      })
      .where(eq(baskets.id, id))
      .returning()

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json(basket)
  } catch (error) {
    console.error('POST /api/baskets/[id]/unarchive error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
