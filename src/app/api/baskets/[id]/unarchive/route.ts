// src/app/api/baskets/[id]/unarchive/route.ts
// Səbəti arxivdən çıxarma

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await db.update(baskets)
      .set({ archived: false })
      .where(eq(baskets.id, params.id))
      .returning()

    if (!result || result.length === 0) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ success: true, basket: result[0] })
  } catch (error) {
    console.error('[baskets/[id]/unarchive] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
