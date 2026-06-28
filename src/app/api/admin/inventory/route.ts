// src/app/api/admin/inventory/route.ts
// Admin Inventory API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventoryLogs, products, productVariants } from '@/lib/db/schema'
import { eq, desc, and, gte, lte } from 'drizzle-orm'
import { z } from 'zod'

const createInventoryLogSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  type: z.enum(['PURCHASE', 'SALE', 'RETURN', 'ADJUSTMENT', 'SPOILAGE', 'TRANSFER']),
  qtyChange: z.number(),
  notes: z.string().optional(),
  costPerUnit: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const productId = searchParams.get('productId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const conditions: any[] = []
    
    if (type) {
      conditions.push(eq(inventoryLogs.type, type as any))
    }
    
    if (productId) {
      conditions.push(eq(inventoryLogs.productId, productId))
    }
    
    if (dateFrom) {
      conditions.push(gte(inventoryLogs.createdAt, new Date(dateFrom)))
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(inventoryLogs.createdAt, endDate))
    }

    const offset = (page - 1) * limit

    const logsData = await (db.query as any).inventoryLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
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
        createdByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: [desc(inventoryLogs.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(inventoryLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      logs: logsData,
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
    console.error('Inventory GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    
    const session = await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    const userId = session.user?.id

    const body = await request.json()
    const validatedData = createInventoryLogSchema.parse(body)

    // Get current stock
    const variant = validatedData.variantId
      ? await db.query.productVariants.findFirst({
          where: eq(productVariants.id, validatedData.variantId),
        })
      : null

    if (!variant && validatedData.variantId) {
      return NextResponse.json({ error: 'Variant tapılmadı' }, { status: 404 })
    }

    const qtyBefore = variant?.stock ?? 0
    const qtyAfter = qtyBefore + validatedData.qtyChange

    if (qtyAfter < 0) {
      return NextResponse.json({ error: 'Stok mənfi ola bilməz' }, { status: 400 })
    }

    // Create inventory log
    const [newLog] = await db
      .insert(inventoryLogs)
      .values({
        productId: validatedData.productId,
        variantId: validatedData.variantId,
        type: validatedData.type,
        qtyChange: validatedData.qtyChange,
        qtyBefore,
        qtyAfter,
        costPerUnit: validatedData.costPerUnit,
        totalCost: validatedData.costPerUnit 
          ? (parseFloat(validatedData.costPerUnit) * Math.abs(validatedData.qtyChange)).toString()
          : null,
        notes: validatedData.notes,
        createdBy: userId,
        createdAt: new Date(),
      })
      .returning()

    // Update variant stock if variantId is provided
    if (validatedData.variantId) {
      await db
        .update(productVariants)
        .set({ stock: qtyAfter, updatedAt: new Date() })
        .where(eq(productVariants.id, validatedData.variantId))
    }

    return NextResponse.json({ log: newLog }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Inventory POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
