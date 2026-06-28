// src/app/api/baskets/by-slug/route.ts
// Slug ilə səbət tapmaq

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { baskets, basketMedia, basketContents, basketExtras } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    const basket = await (db.query as any).baskets.findFirst({
      where: eq(baskets.slug, params.slug),
      with: {
        media: {
          orderBy: [basketMedia.displayOrder]
        },
        variants: {
          with: {
            contents: {
              orderBy: [basketContents.displayOrder]
            },
            extras: {
              orderBy: [basketExtras.displayOrder]
            }
          }
        }
      }
    })

    if (!basket) {
      return NextResponse.json({ error: 'Səbət tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ basket })
  } catch (error) {
    console.error('[baskets/by-slug] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
