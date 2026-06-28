// src/app/api/admin/products/[id]/orders/route.ts
// Product-Order Relationship API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { orderItems, orders, users, productVariants } from '@/lib/db/schema'
import { eq, desc, and } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const status = searchParams.get('status')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const conditions: any[] = [eq(orderItems.productId, id)]
    
    if (status) {
      conditions.push(eq(orders.status, status as any))
    }
    
    if (dateFrom) {
      conditions.push(and(...conditions, eq(orders.createdAt, new Date(dateFrom))))
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(and(...conditions, eq(orders.createdAt, endDate)))
    }

    const offset = (page - 1) * limit

    const orderRelations = await (db.query as any).orderItems.findMany({
      where: conditions.length > 1 ? and(...conditions) : conditions[0],
      with: {
        order: {
          with: {
            user: {
              columns: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
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
      orderBy: [desc(orders.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(orderItems)
      .where(conditions.length > 1 ? and(...conditions) : conditions[0])
    const count = Number(totalResult[0]?.count ?? 0)

    const formattedRelations = orderRelations.map((item: any) => ({
      productId: id,
      orderId: item.orderId,
      orderNumber: item.order?.orderNumber,
      orderDate: item.order?.createdAt,
      quantity: item.quantity,
      priceAtPurchase: item.price,
      variantId: item.variantId,
      variantName: item.variant?.name,
      customerName: item.order?.customerName,
      customerEmail: item.order?.customerEmail,
      orderStatus: item.order?.status,
    }))

    return NextResponse.json({
      relations: formattedRelations,
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
    console.error('Product orders GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
