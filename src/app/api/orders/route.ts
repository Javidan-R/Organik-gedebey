// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  products,
  productVariants,
  users,
  inventoryLogs,
  notifications,
} from "@/lib/db/schema"
import { eq, and, desc, gte, lte, or, sql, like, inArray } from "drizzle-orm"
import { requireAuth } from "@/lib/auth" 
import { z } from "zod"

// ============================================
// GET /api/orders
// ============================================
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "MANAGER", "WAREHOUSE_STAFF"])
    const { searchParams } = new URL(request.url)
    
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    
    const conditions = []
    if (status && status !== "all") conditions.push(eq(orders.status, status as any))
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )
      )
    }
    if (dateFrom) conditions.push(gte(orders.createdAt, new Date(dateFrom)))
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(orders.createdAt, endDate))
    }

    const offset = (page - 1) * limit
    
    const ordersData = await db.query.orders.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: true,
        items: {
          with: {
            product: true,
            variant: true
          }
        }
      },
      orderBy: [desc(orders.createdAt)],
      limit,
      offset
    })

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0].count)

    return NextResponse.json({
      orders: ordersData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Orders GET error:", error)
    return NextResponse.json({ error: "Sifarişlər yüklənərkən xəta" }, { status: 500 })
  }
}

// ============================================
// POST /api/orders (Create Order)
// ============================================
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    qty: z.number().positive().int(),
  })).min(1, "Ən azı 1 məhsul olmalıdır"),
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional().nullable(),
  customerPhone: z.string().min(9),
  deliveryAddressText: z.string().min(5),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "BANK_TRANSFER"]),
  customerNotes: z.string().optional().nullable(),
})

export async function POST(request: NextRequest) {
  try {
    // İstifadəçi sessiyasını yoxla, amma məcburi deyil (qonaq sifarişi də ola bilər)
    let userId: string | null = null
    try {
      const session = await requireAuth()
      userId = session.user?.id || null
    } catch {
      // Qonaq sifarişi - userId null qalır
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)
    
    const variantIds = validatedData.items.map(item => item.variantId)
    
    // Variantları və məhsulları bazadan çək
    const variantsData = await db.query.productVariants.findMany({
      where: inArray(productVariants.id, variantIds),
      with: { product: true }
    })

    // Tapılmayan variant yoxlaması
    const foundIds = new Set(variantsData.map(v => v.id))
    const missingIds = variantIds.filter(id => !foundIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Variant tapılmadı: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }

    let subtotal = 0
    const itemsToInsert: Array<{
      productId: string
      variantId: string
      qty: number
      priceAtOrder: string
      subtotal: string
    }> = []

    // Validasiya və hesablama
    for (const item of validatedData.items) {
      const variant = variantsData.find(v => v.id === item.variantId)!
      
      // Stok yoxlaması
      if (variant.stock < item.qty) {
        return NextResponse.json(
          { error: `${variant.product.name} üçün kifayət qədər stok yoxdur. Mövcud: ${variant.stock}, Tələb: ${item.qty}` },
          { status: 400 }
        )
      }

      const price = parseFloat(variant.basePrice)
      const lineTotal = price * item.qty
      subtotal += lineTotal

      itemsToInsert.push({
        productId: variant.productId,
        variantId: variant.id,
        qty: item.qty,
        priceAtOrder: variant.basePrice,
        subtotal: lineTotal.toFixed(2),
      })
    }

    const deliveryFee = subtotal >= 50 ? 0 : 5
    const total = subtotal + deliveryFee
    const orderNumber = `ORG-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Transaction ilə bütün əməliyyatları yerinə yetir
    const result = await db.transaction(async (tx) => {
      // 1. Sifarişi yarat
      const [newOrder] = await tx.insert(orders).values({
        orderNumber,
        userId: userId, // string | null
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail || null,
        customerPhone: validatedData.customerPhone,
        deliveryAddressText: validatedData.deliveryAddressText,
        subtotal: subtotal.toFixed(2),
        discountAmount: "0",
        deliveryFee: deliveryFee.toFixed(2),
        total: total.toFixed(2),
        paymentMethod: validatedData.paymentMethod,
        customerNotes: validatedData.customerNotes || null,
        status: "PENDING",
        paymentStatus: "UNPAID",
      }).returning()

      // 2. Sifariş bəndlərini yarat
      if (itemsToInsert.length > 0) {
        await tx.insert(orderItems).values(
          itemsToInsert.map(item => ({
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: variantsData.find(v => v.productId === item.productId)?.product.name || 'Məhsul',
            variantName: variantsData.find(v => v.id === item.variantId)?.name || 'Variant',
            qty: item.qty,
            priceAtOrder: item.priceAtOrder,
            subtotal: item.subtotal,
            unit: variantsData.find(v => v.id === item.variantId)?.unit || 'ədəd',
          }))
        )
      }

      // 3. Stok yeniləmə və Log
      for (const item of validatedData.items) {
        const variant = variantsData.find(v => v.id === item.variantId)!
        const newStock = variant.stock - item.qty
        
        await tx.update(productVariants)
          .set({ stock: newStock })
          .where(eq(productVariants.id, variant.id))

        await tx.insert(inventoryLogs).values({
          productId: variant.productId,
          variantId: variant.id,
          type: "SALE",
          qtyChange: -item.qty,
          qtyBefore: variant.stock,
          qtyAfter: newStock,
          refType: "ORDER",
          refId: newOrder.id,
          notes: `Sifariş #${orderNumber}`,
        })
      }

      // 4. Bildiriş (yalnız qeydiyyatlı istifadəçilər üçün)
      if (userId) {
        await tx.insert(notifications).values({
          userId: userId,
          type: "ORDER",
          title: "Sifarişiniz qəbul edildi",
          message: `${orderNumber} nömrəli sifarişiniz hazırlanır. Cəmi: ${total.toFixed(2)} AZN`,
          refType: "ORDER",
          refId: newOrder.id,
          channel: "APP",
        })
      }

      return newOrder
    })

    // Sifarişi detalları ilə birlikdə qaytar
    const completeOrder = await db.query.orders.findFirst({
      where: eq(orders.id, result.id),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          }
        }
      }
    })

    return NextResponse.json(
      { 
        message: "Sifariş uğurla yaradıldı", 
        order: completeOrder 
      }, 
      { status: 201 }
    )
  } catch (error: any) {
    console.error("Order POST error:", error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasiya xətası", details: error },
        { status: 400 }
      )
    }
    
    return NextResponse.json(
      { error: error.message || "Sifariş yaradılarkən xəta baş verdi" },
      { status: 500 }
    )
  }
}