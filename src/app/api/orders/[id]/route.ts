// src/app/api/orders/[id]/route.ts
// Tək sifariş əməliyyatları

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, orderItems } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { requireAuth, AuthError } from '@/lib/auth'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req, ['ADMIN', 'MANAGER', 'COURIER', 'CUSTOMER'])
    
    const order = await (db.query as any).orders.findFirst({
      where: eq(orders.id, params.id),
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true
          }
        }
      }
    })

    if (!order) {
      return NextResponse.json({ error: 'Sifariş tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ order })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[orders/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req, ['ADMIN', 'MANAGER'])
    
    const body = await req.json()
    
    const [updatedOrder] = await db.update(orders)
      .set({
        status: body.status,
        paymentStatus: body.paymentStatus,
        courierId: body.courierId,
        trackingNumber: body.trackingNumber,
        estimatedDelivery: body.estimatedDelivery ? new Date(body.estimatedDelivery) : null,
        actualDelivery: body.actualDelivery ? new Date(body.actualDelivery) : null,
        customerNotes: body.customerNotes,
        adminNotes: body.adminNotes,
        confirmedAt: body.confirmedAt ? new Date(body.confirmedAt) : null,
        preparingAt: body.preparingAt ? new Date(body.preparingAt) : null,
        readyAt: body.readyAt ? new Date(body.readyAt) : null,
        outForDeliveryAt: body.outForDeliveryAt ? new Date(body.outForDeliveryAt) : null,
        deliveredAt: body.deliveredAt ? new Date(body.deliveredAt) : null,
        cancelledAt: body.cancelledAt ? new Date(body.cancelledAt) : null,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, params.id))
      .returning()

    const completeOrder = await (db.query as any).orders.findFirst({
      where: eq(orders.id, params.id),
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true
          }
        }
      }
    })

    return NextResponse.json({ order: completeOrder })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[orders/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(req, ['ADMIN'])
    
    await db.delete(orderItems).where(eq(orderItems.orderId, params.id))
    await db.delete(orders).where(eq(orders.id, params.id))
    
    return NextResponse.json({ success: true })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('[orders/[id]] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
