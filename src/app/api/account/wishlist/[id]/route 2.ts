import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { wishlist } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { getCustomerFromRequest } from '@/lib/auth/server'

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.insert(wishlist).values({ userId: customer.sub, productId: params.id }).onConflictDoNothing()
  return NextResponse.json({ success: true })
}

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const customer = getCustomerFromRequest(req)
  if (!customer) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  await db.delete(wishlist).where(and(eq(wishlist.userId, customer.sub), eq(wishlist.productId, params.id)))
  return NextResponse.json({ success: true })
}