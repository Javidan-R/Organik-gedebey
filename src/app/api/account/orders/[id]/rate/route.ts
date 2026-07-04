import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { getCustomerFromRequest } from '@/lib/auth/server'
import { z } from 'zod'

// Validation schema for rating
const ratingSchema = z.object({
  rating: z.number().int().min(1).max(5),
})

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const customer = getCustomerFromRequest(req)
    if (!customer) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const validatedData = ratingSchema.parse(body)

    // Check if order exists and belongs to the customer
    const order = await db
      .select()
      .from(orders)
      .where(and(
        eq(orders.id, params.id),
        eq(orders.userId, customer.sub)
      ))
      .limit(1)
      .then((rows) => rows[0] || null)

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Check if order is delivered before allowing rating
    if (order.status !== 'DELIVERED') {
      return NextResponse.json({ 
        error: 'Order must be delivered before rating' 
      }, { status: 400 })
    }

    // Update order rating
    await db.update(orders)
      .set({ rating: validatedData.rating })
      .where(eq(orders.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid rating. Must be between 1 and 5', details: error.issues },
        { status: 400 }
      )
    }

    console.error('Order rating error:', error)
    return NextResponse.json({ error: 'Failed to rate order' }, { status: 500 })
  }
}