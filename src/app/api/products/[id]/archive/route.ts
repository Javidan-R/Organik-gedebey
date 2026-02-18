// app/api/products/[id]/archive/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { tempProducts } from '@/lib/db/temp-store'

export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
  const existing = tempProducts.getById(params.id)
  if (!existing) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })
  tempProducts.archive(params.id)
  return NextResponse.json({ success: true })
}

// ─────────────────────────────────────────────────────────
// app/api/products/[id]/unarchive/route.ts
// (Bu faylı ayrı yaradın: app/api/products/[id]/unarchive/route.ts)
// ─────────────────────────────────────────────────────────
// import { NextRequest, NextResponse } from 'next/server'
// import { tempProducts } from '@/lib/db/temp-store'
// 
// export async function PATCH(_: NextRequest, { params }: { params: { id: string } }) {
//   const existing = tempProducts.getById(params.id)
//   if (!existing) return NextResponse.json({ error: 'Tapılmadı' }, { status: 404 })
//   tempProducts.unarchive(params.id)
//   return NextResponse.json({ success: true })
// }