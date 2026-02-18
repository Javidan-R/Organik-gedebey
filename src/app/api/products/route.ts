// app/api/products/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { tempProducts } from '@/lib/db/temp-store'
import type { Product } from '@/types/products'

// GET /api/products
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url)
    const search = searchParams.get('search') ?? ''
    const categoryId = searchParams.get('categoryId') ?? ''
    const showArchived = searchParams.get('showArchived') === 'true'

    let list = tempProducts.getAll()

    if (!showArchived) list = list.filter(p => !p.archived)
    if (categoryId)   list = list.filter(p => p.categoryId === categoryId)
    if (search) {
      const s = search.toLowerCase()
      list = list.filter(p =>
        p.name.toLowerCase().includes(s) ||
        p.description?.toLowerCase().includes(s) ||
        p.tags?.some(t => t.toLowerCase().includes(s))
      )
    }

    return NextResponse.json({
      products: list,
      pagination: { total: list.length, page: 1, limit: list.length, totalPages: 1 },
    })
  } catch (err) {
    console.error('GET /api/products error:', err)
    return NextResponse.json({ error: 'Məhsullar yüklənmədi' }, { status: 500 })
  }
}

// POST /api/products  ← ProductEditModal buraya yazır (yeni məhsul)
export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as Product

    if (!body.id || !body.name) {
      return NextResponse.json({ error: 'id və name mütləqdir' }, { status: 400 })
    }

    const saved = tempProducts.add(body)
    return NextResponse.json({ product: saved }, { status: 201 })
  } catch (err) {
    console.error('POST /api/products error:', err)
    return NextResponse.json({ error: 'Məhsul əlavə edilmədi' }, { status: 500 })
  }
}