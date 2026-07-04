// src/app/api/admin/finance/payments/[id]/route.ts
// Admin Finance Payment Details API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { orders } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
 
const updatePaymentSchema = z.object({
  paymentStatus: z.enum(['UNPAID', 'PAID', 'PARTIALLY_REFUNDED', 'REFUNDED']).optional(),
  paymentMethod: z.enum(['CASH_ON_DELIVERY', 'CARD', 'BANK_TRANSFER']).optional(),
  adminNotes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params

    const payment = await db.query.orders.findFirst({
      where: eq(orders.id, id),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          },
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
              },
            },
            variant: {
              columns: {
                id: true,
                name: true,
                sku: true,
              },
            },
          },
        },
      },
    })

    if (!payment) {
      return NextResponse.json({ error: 'Ödəniş tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ payment })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance payment GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { id } = params
    const body = await request.json()
    const validatedData = updatePaymentSchema.parse(body)

    const [updatedPayment] = await db
      .update(orders)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(orders.id, id))
      .returning()

    if (!updatedPayment) {
      return NextResponse.json({ error: 'Ödəniş tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ payment: updatedPayment })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Finance payment PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
