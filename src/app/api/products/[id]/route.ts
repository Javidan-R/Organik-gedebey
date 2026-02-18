// app/api/products/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { tempProducts } from '@/lib/db/temp-store'
import type { Product } from '@/types/products'

// GET /api/products/:id
export async function GET(_: NextRequest, { params }: { params: { id: string } }) {
  const product = tempProducts.getById(params.id)
  if (!product) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })
  return NextResponse.json({ product })
}

// PATCH /api/products/:id  ← ProductEditModal buraya yazır (mövcud məhsul)
export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const existing = tempProducts.getById(params.id)
    if (!existing) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })

    const body = await req.json() as Partial<Product>
    const updated = tempProducts.update({ ...existing, ...body, id: params.id })
    return NextResponse.json({ product: updated })
  } catch (err) {
    console.error('PATCH /api/products/:id error:', err)
    return NextResponse.json({ error: 'Yenilənmədi' }, { status: 500 })
  }
}

// DELETE /api/products/:id
export async function DELETE(_: NextRequest, { params }: { params: { id: string } }) {
  tempProducts.delete(params.id)
  return NextResponse.json({ success: true })
}