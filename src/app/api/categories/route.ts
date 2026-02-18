// app/api/categories/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { tempCategories } from '@/lib/db/temp-store'

// GET /api/categories
export async function GET() {
  try {
    const list = tempCategories.getAll().filter(c => !c.archived)
    return NextResponse.json({ categories: list })
  } catch (err) {
    return NextResponse.json({ error: 'Kateqoriyalar yüklənmədi' }, { status: 500 })
  }
}

// POST /api/categories
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    if (!body.id || !body.name || !body.slug) {
      return NextResponse.json({ error: 'id, name, slug mütləqdir' }, { status: 400 })
    }
    const saved = tempCategories.add(body)
    return NextResponse.json({ category: saved }, { status: 201 })
  } catch (err) {
    return NextResponse.json({ error: 'Kateqoriya əlavə edilmədi' }, { status: 500 })
  }
}