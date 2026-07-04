// src/app/api/admin/finance/purchases/route.ts
// Admin Finance Purchases API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { inventoryLogs, products, productVariants } from '@/lib/db/schema'
import { eq, gte, lte, sql, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const createPurchaseSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().optional(),
  qty: z.number().positive().int(),
  costPerUnit: z.string().min(1),
  supplier: z.string().optional(),
  notes: z.string().optional(),
  purchaseDate: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const type = searchParams.get('type')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const conditions = []
    if (type) conditions.push(eq(inventoryLogs.type, type as 'PURCHASE' | 'SALE' | 'RETURN' | 'ADJUSTMENT' | 'SPOILAGE' | 'TRANSFER'))
    if (dateFrom) conditions.push(gte(inventoryLogs.createdAt, new Date(dateFrom)))
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(inventoryLogs.createdAt, endDate))
    }
    if (search) {
      conditions.push(like(inventoryLogs.notes, `%${search}%`))
    }

    const offset = (page - 1) * limit

    const purchasesData = await db.query.inventoryLogs.findMany({
      where: and(
        conditions.length > 0 ? and(...conditions) : undefined,
        eq(inventoryLogs.type, 'PURCHASE')
      ),
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
            email: true,
          },
        },
      },
      orderBy: [desc(inventoryLogs.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(inventoryLogs)
      .where(and(
        conditions.length > 0 ? and(...conditions) : undefined,
        eq(inventoryLogs.type, 'PURCHASE')
      ))
    const count = Number(totalResult[0]?.count ?? 0)

    // Calculate purchase statistics
    const purchaseStats = await db
      .select({
        totalCost: sql<string>`COALESCE(SUM(CAST(${inventoryLogs.totalCost} AS DECIMAL)), '0')`,
        totalQty: sql<number>`SUM(ABS(${inventoryLogs.qtyChange}))`,
        count: sql<number>`COUNT(*)`,
      })
      .from(inventoryLogs)
      .where(and(
        conditions.length > 0 ? and(...conditions) : undefined,
        eq(inventoryLogs.type, 'PURCHASE')
      ))

    return NextResponse.json({
      purchases: purchasesData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      stats: purchaseStats[0] || { totalCost: '0', totalQty: 0, count: 0 },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance purchases GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const session = await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    const userId = session.user?.id

    const body = await request.json()
    const validatedData = createPurchaseSchema.parse(body)

    const result = await db.transaction(async (tx) => {
      // Get current stock
      const variant = await tx.query.productVariants.findFirst({
        where: eq(productVariants.id, validatedData.variantId || validatedData.productId),
      })

      if (!variant) {
        throw new Error('Variant tapılmadı')
      }

      const qtyBefore = variant.stock
      const qtyAfter = qtyBefore + validatedData.qty
      const totalCost = (parseFloat(validatedData.costPerUnit) * validatedData.qty).toFixed(2)

      // Update stock
      await tx
        .update(productVariants)
        .set({ 
          stock: qtyAfter,
          updatedAt: new Date(),
        })
        .where(eq(productVariants.id, variant.id))

      // Create inventory log
      const [log] = await tx
        .insert(inventoryLogs)
        .values({
          productId: validatedData.productId,
          variantId: validatedData.variantId || variant.id,
          type: 'PURCHASE',
          qtyChange: validatedData.qty,
          qtyBefore,
          qtyAfter,
          costPerUnit: validatedData.costPerUnit,
          totalCost,
          notes: validatedData.notes || `Təchizat: ${validatedData.supplier || 'Bilinməyən'}`,
          createdBy: userId,
          createdAt: validatedData.purchaseDate ? new Date(validatedData.purchaseDate) : new Date(),
        })
        .returning()

      return log
    })

    return NextResponse.json({ purchase: result }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.errors }, { status: 400 })
    }
    console.error('Finance purchases POST error:', error)
    return NextResponse.json({ error: error.message || 'Server xətası' }, { status: 500 })
  }
}