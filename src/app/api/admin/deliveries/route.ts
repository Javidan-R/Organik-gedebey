// src/app/api/admin/deliveries/route.ts
// Admin Deliveries API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { deliveries, orders, users } from '@/lib/db/schema'
import { eq, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const updateDeliverySchema = z.object({
  courierId: z.string().uuid().optional(),
  status: z.enum(['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED', 'RETURNED']).optional(),
  scheduledDate: z.string().optional(),
  scheduledTimeSlot: z.string().optional(),
  courierNotes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const courierId = searchParams.get('courierId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const conditions: any[] = []
    
    if (status) {
      conditions.push(eq(deliveries.status, status as any))
    }
    
    if (courierId) {
      conditions.push(eq(deliveries.courierId, courierId))
    }
    
    if (dateFrom) {
      conditions.push(gte(deliveries.scheduledDate, new Date(dateFrom)))
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(deliveries.scheduledDate, endDate))
    }

    const offset = (page - 1) * limit

    const deliveriesData = await (db.query as any).deliveries.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        order: {
          columns: {
            id: true,
            orderNumber: true,
            customerName: true,
            customerPhone: true,
            total: true,
            status: true,
          },
        },
        courier: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            phone: true,
          },
        },
        tracking: {
          orderBy: [desc(deliveryTracking.createdAt)],
        },
      },
      orderBy: [desc(deliveries.scheduledDate)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(deliveries)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      deliveries: deliveriesData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Deliveries GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const body = await request.json()
    const { deliveryId, ...updateData } = body

    if (!deliveryId) {
      return NextResponse.json({ error: 'Delivery ID tələb olunur' }, { status: 400 })
    }

    const validatedData = updateDeliverySchema.parse(updateData)

    const [updatedDelivery] = await db
      .update(deliveries)
      .set({
        ...validatedData,
        scheduledDate: validatedData.scheduledDate ? new Date(validatedData.scheduledDate) : undefined,
        updatedAt: new Date(),
      })
      .where(eq(deliveries.id, deliveryId))
      .returning()

    if (!updatedDelivery) {
      return NextResponse.json({ error: 'Çatdırılma tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ delivery: updatedDelivery })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Deliveries PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
