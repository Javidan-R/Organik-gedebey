// app/api/sales/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  productVariants,
  products,
  inventoryLogs,
  adminLogs,
} from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    productName: z.string(),
    variantName: z.string(),
    qty: z.number().positive(),
    unitPrice: z.number().positive(),
    lineTotal: z.number().positive(),
    unit: z.string(),
    costPrice: z.number().optional(),
  })).min(1),
  
  customerName: z.string().default("Walk-in Customer"),
  customerPhone: z.string().default(""),
  note: z.string().optional(),
  
  paymentMethod: z.enum(["cash", "card", "mixed"]),
  cashAmount: z.number().default(0),
  cardAmount: z.number().default(0),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "MANAGER", "WAREHOUSE_STAFF"])
    
    const body = await request.json()
    const validatedData = createSaleSchema.parse(body)
    
    // Calculate totals
    const subtotal = validatedData.items.reduce((sum, item) => sum + item.lineTotal, 0)
    
    // Validate payment
    let actualCash = 0
    let actualCard = 0
    
    if (validatedData.paymentMethod === "cash") {
      actualCash = validatedData.cashAmount
    } else if (validatedData.paymentMethod === "card") {
      actualCard = validatedData.cardAmount
    } else if (validatedData.paymentMethod === "mixed") {
      actualCash = validatedData.cashAmount
      actualCard = validatedData.cardAmount
    }
    
    const totalPaid = actualCash + actualCard
    
    if (totalPaid < subtotal) {
      return NextResponse.json(
        { error: `Ödəniş kifayət deyil. Tələb: ${subtotal.toFixed(2)}, Ödənildi: ${totalPaid.toFixed(2)}` },
        { status: 400 }
      )
    }
    
    // Check stock availability
    const variantIds = validatedData.items.map(item => item.variantId)
    const variantsData = await db
      .select()
      .from(productVariants)
      .where(sql`${productVariants.id} IN ${variantIds}`)
    
    for (const item of validatedData.items) {
      const variant = variantsData.find(v => v.id === item.variantId)
      if (!variant) {
        return NextResponse.json(
          { error: `Variant tapılmadı: ${item.variantName}` },
          { status: 400 }
        )
      }
      
      if (variant.stock < item.qty) {
        return NextResponse.json(
          { error: `Stok yetərli deyil: ${item.productName} (Var: ${variant.stock}, Tələb: ${item.qty})` },
          { status: 400 }
        )
      }
    }
    
    // Generate order number for POS
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    const orderNumber = `POS-${year}-${timestamp}`
    
    // Create sale in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          deliveryAddressText: "POS Sale - In Store",
          subtotal: subtotal.toString(),
          total: subtotal.toString(),
          paymentMethod: validatedData.paymentMethod.toUpperCase() as any,
          status: "DELIVERED", // POS sales are immediate
          paymentStatus: "PAID",
          deliveredAt: new Date(),
          customerNotes: validatedData.note,
        })
        .returning()
      
      // 2. Create order items
      await tx.insert(orderItems).values(
        validatedData.items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          qty: item.qty,
          unit: item.unit,
          priceAtOrder: item.unitPrice.toString(),
          costAtOrder: item.costPrice?.toString(),
          subtotal: item.lineTotal.toString(),
        }))
      )
      
      // 3. Update stock and log inventory
      for (const item of validatedData.items) {
        const variant = variantsData.find(v => v.id === item.variantId)
        if (variant) {
          const newStock = variant.stock - item.qty
          
          await tx
            .update(productVariants)
            .set({ stock: newStock })
            .where(eq(productVariants.id, variant.id))
          
          await tx.insert(inventoryLogs).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "SALE",
            qtyChange: -item.qty,
            qtyBefore: variant.stock,
            qtyAfter: newStock,
            refType: "order",
            refId: newOrder.id,
            costPerUnit: item.costPrice?.toString(),
            totalCost: item.costPrice ? (item.costPrice * item.qty).toString() : null,
            createdBy: session.user.id,
          })
        }
      }
      
      // 4. Log admin action
      await tx.insert(adminLogs).values({
        userId: session.user.id,
        action: "pos_sale",
        entityType: "order",
        entityId: newOrder.id,
        details: {
          orderNumber: newOrder.orderNumber,
          total: subtotal,
          itemCount: validatedData.items.length,
        },
      })
      
      return newOrder
    })
    
    const change = totalPaid - subtotal
    
    return NextResponse.json({
      success: true,
      message: "Satış uğurla tamamlandı",
      order: result,
      payment: {
        total: subtotal,
        paid: totalPaid,
        change: change > 0 ? change : 0,
        method: validatedData.paymentMethod,
        cash: actualCash,
        card: actualCard,
      },
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasiya xətası", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("POS sale error:", error)
    return NextResponse.json(
      { error: "Satış tamamlanmadı" },
      { status: 500 }
    )
  }
}