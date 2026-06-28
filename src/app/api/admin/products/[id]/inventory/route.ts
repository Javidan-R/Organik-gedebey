// src/app/api/admin/products/[id]/inventory/route.ts
// Product Inventory Status API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { productVariants, inventoryLogs, products } from '@/lib/db/schema'
import { eq, desc, and, gte } from 'drizzle-orm'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    
    const { id } = params

    const product = await db.query.products.findFirst({
      where: eq(products.id, id),
      with: {
        variants: {
          orderBy: [desc(productVariants.createdAt)],
        },
      },
    })

    if (!product) {
      return NextResponse.json({ error: 'Məhsul tapılmadı' }, { status: 404 })
    }

    const totalStock = product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) || 0
    const needsRestock = totalStock < (product.minStock || 10)

    const variants = product.variants?.map((variant: any) => {
      const stock = variant.stock || 0
      const minStock = variant.minStock || 10
      let status: 'in_stock' | 'low_stock' | 'out_of_stock'

      if (stock === 0) {
        status = 'out_of_stock'
      } else if (stock < minStock) {
        status = 'low_stock'
      } else {
        status = 'in_stock'
      }

      return {
        variantId: variant.id,
        variantName: variant.name,
        sku: variant.sku,
        stock,
        minStock,
        status,
        batchDate: variant.batchDate,
        expiryDate: variant.expiryDate,
      }
    }) || []

    const overallStatus: 'in_stock' | 'low_stock' | 'out_of_stock' =
      totalStock === 0 ? 'out_of_stock' : needsRestock ? 'low_stock' : 'in_stock'

    const inventoryStatus = {
      productId: id,
      productName: product.name,
      variants,
      overallStatus,
      totalStock,
      needsRestock,
    }

    return NextResponse.json({ inventoryStatus })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product inventory GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    
    const { id } = params
    const body = await request.json()
    const { variantId, qtyChange, type, notes, costPerUnit } = body

    if (!variantId || !qtyChange || !type) {
      return NextResponse.json({ error: 'Variant ID, miqdar və növ tələb olunur' }, { status: 400 })
    }

    const variant = await db.query.productVariants.findFirst({
      where: eq(productVariants.id, variantId),
    })

    if (!variant) {
      return NextResponse.json({ error: 'Variant tapılmadı' }, { status: 404 })
    }

    const qtyBefore = variant.stock || 0
    const qtyAfter = qtyBefore + qtyChange

    if (qtyAfter < 0) {
      return NextResponse.json({ error: 'Stok mənfi ola bilməz' }, { status: 400 })
    }

    // Update variant stock
    const [updatedVariant] = await db
      .update(productVariants)
      .set({ stock: qtyAfter, updatedAt: new Date() })
      .where(eq(productVariants.id, variantId))
      .returning()

    // Create inventory log
    const session = await requireAuth(request, ['ADMIN', 'MANAGER', 'WAREHOUSE_STAFF', 'SUPERADMIN'])
    const userId = session.user?.id

    await db.insert(inventoryLogs).values({
      productId: id,
      variantId,
      type,
      qtyChange,
      qtyBefore,
      qtyAfter,
      costPerUnit,
      totalCost: costPerUnit ? (parseFloat(costPerUnit) * Math.abs(qtyChange)).toString() : null,
      notes,
      createdBy: userId,
      createdAt: new Date(),
    })

    return NextResponse.json({ variant: updatedVariant })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Product inventory POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
