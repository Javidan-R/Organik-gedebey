// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  productVariants,
  users,
  inventoryLogs,
  notifications,
} from "@/lib/db/schema"
import { eq, and, desc, gte, lte, or, sql, like, inArray } from "drizzle-orm"
import { requireAuth, AuthError } from "@/lib/auth" 
import { z } from "zod"

// ============================================
// GET /api/orders
// ============================================
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ["ADMIN", "MANAGER", "COURIER"])
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
    
    const ordersData = await (db.query as any).orders.findMany({
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
    const count = Number(totalResult[0]?.count ?? 0)

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
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error("Orders GET error:", error)
    return NextResponse.json({ error: "Sifarişlər yüklənərkən xəta" }, { status: 500 })
  }
}

// ============================================
// POST /api/orders (Create Order)
// ============================================
const createOrderSchema = z.object({
  id: z.string().uuid().optional(),
  address: z.string().nullable().optional(),
  orderNumber: z.string().optional(),
  userId: z.string().uuid().nullable().optional(),
  customerName: z.string().min(2),
  customerEmail: z.string().email().nullable().optional(),
  customerPhone: z.string().min(9),
  deliveryAddressId: z.string().uuid().nullable().optional(),
  deliveryAddressText: z.string().min(5),
  subtotal: z.string(),
  discountAmount: z.string(),
  deliveryFee: z.string(),
  total: z.string(),
  couponCode: z.string().nullable().optional(),
  couponDiscount: z.string(),
  status: z.enum(["PENDING", "CONFIRMED", "PREPARING", "READY_FOR_DELIVERY", "OUT_FOR_DELIVERY", "DELIVERED", "CANCELLED", "REFUNDED"]).optional(),
  paymentStatus: z.enum(["UNPAID", "PAID", "PARTIALLY_REFUNDED", "REFUNDED"]).optional(),
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "BANK_TRANSFER"]),
  deliveryDate: z.string().nullable().optional(),
  deliveryTimeSlot: z.string().nullable().optional(),
  courierId: z.string().uuid().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  estimatedDelivery: z.string().nullable().optional(),
  actualDelivery: z.string().nullable().optional(),
  customerNotes: z.string().nullable().optional(),
  adminNotes: z.string().nullable().optional(),
  cancellationReason: z.string().nullable().optional(),
  rating: z.number().nullable().optional(),
  confirmedAt: z.string().nullable().optional(),
  preparingAt: z.string().nullable().optional(),
  readyAt: z.string().nullable().optional(),
  outForDeliveryAt: z.string().nullable().optional(),
  deliveredAt: z.string().nullable().optional(),
  cancelledAt: z.string().nullable().optional(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
  items: z.array(z.object({
    id: z.string().uuid().optional(),
    productId: z.string().uuid(),
    variantId: z.string().uuid().nullable().or(z.literal('default')),
    productName: z.string(),
    variantName: z.string().nullable(),
    qty: z.number().positive().int(),
    unit: z.string().nullable(),
    priceAtOrder: z.string(),
    costAtOrder: z.string().nullable(),
    subtotal: z.string(),
    createdAt: z.string().optional(),
  })).min(1, "Ən azı 1 məhsul olmalıdır"),
  note: z.string().nullable().optional(),
})

export async function POST(request: NextRequest) {
  try {
    // İstifadəçi sessiyasını yoxla, amma məcburi deyil (qonaq sifarişi də ola bilər)
    let userId: string | null = null
    try {
      const session = await requireAuth(request)
      userId = session.user?.id || null
    } catch {
      // Qonaq sifarişi - userId null qalır
    }

    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)
    
    // Handle 'default' variantId by fetching the default variant for each product
    const variantIds: string[] = []
    const itemsWithResolvedVariants = await Promise.all(validatedData.items.map(async (item) => {
      if (item.variantId === 'default' || !item.variantId) {
        // Fetch the default variant for this product
        const defaultVariant = await (db.query as any).productVariants.findFirst({
          where: and(
            eq(productVariants.productId, item.productId),
            eq(productVariants.isDefault, true)
          )
        }) as any
        if (!defaultVariant) {
          throw new Error(`Default variant not found for product ${item.productId}`)
        }
        variantIds.push(defaultVariant.id)
        return { ...item, variantId: defaultVariant.id }
      }
      variantIds.push(item.variantId!)
      return item
    }))
    
    // Variantları və məhsulları bazadan çək
    const variantsData = await (db.query as any).productVariants.findMany({
      where: inArray(productVariants.id, variantIds),
      with: { product: true }
    }) as any

    // Tapılmayan variant yoxlaması
    const foundIds = new Set(variantsData.map((v: any) => v.id))
    const missingIds = variantIds.filter((id: string) => !foundIds.has(id))
    if (missingIds.length > 0) {
      return NextResponse.json(
        { error: `Variant tapılmadı: ${missingIds.join(', ')}` },
        { status: 400 }
      )
    }

    // Stok yoxlaması
    for (const item of itemsWithResolvedVariants) {
      const variant = variantsData.find((v: any) => v.id === item.variantId)
      if (!variant) continue
      
      if (variant.stock < item.qty) {
        return NextResponse.json(
          { error: `${variant.product.name} üçün kifayət qədər stok yoxdur. Mövcud: ${variant.stock}, Tələb: ${item.qty}` },
          { status: 400 }
        )
      }
    }

    // Order number generate et (əgər təqdim edilməyibsə)
    const orderNumber = validatedData.orderNumber || `ORG-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`

    // Transaction ilə bütün əməliyyatları yerinə yetir
    const result = await db.transaction(async (tx) => {
      // 1. Sifarişi yarat
      const [newOrder] = await tx.insert(orders).values({
        id: validatedData.id,
        orderNumber,
        userId: validatedData.userId || userId,
        customerName: validatedData.customerName,
        customerEmail: validatedData.customerEmail,
        customerPhone: validatedData.customerPhone,
        deliveryAddressId: validatedData.deliveryAddressId,
        deliveryAddressText: validatedData.deliveryAddressText,
        address: validatedData.address,
        subtotal: validatedData.subtotal,
        discountAmount: validatedData.discountAmount,
        deliveryFee: validatedData.deliveryFee,
        total: validatedData.total,
        couponCode: validatedData.couponCode,
        couponDiscount: validatedData.couponDiscount,
        status: validatedData.status || "PENDING",
        paymentStatus: validatedData.paymentStatus || "UNPAID",
        paymentMethod: validatedData.paymentMethod,
        deliveryDate: validatedData.deliveryDate ? new Date(validatedData.deliveryDate) : null,
        deliveryTimeSlot: validatedData.deliveryTimeSlot,
        courierId: validatedData.courierId,
        trackingNumber: validatedData.trackingNumber,
        estimatedDelivery: validatedData.estimatedDelivery ? new Date(validatedData.estimatedDelivery) : null,
        actualDelivery: validatedData.actualDelivery ? new Date(validatedData.actualDelivery) : null,
        customerNotes: validatedData.customerNotes,
        adminNotes: validatedData.adminNotes,
        cancellationReason: validatedData.cancellationReason,
        rating: validatedData.rating,
        confirmedAt: validatedData.confirmedAt ? new Date(validatedData.confirmedAt) : null,
        preparingAt: validatedData.preparingAt ? new Date(validatedData.preparingAt) : null,
        readyAt: validatedData.readyAt ? new Date(validatedData.readyAt) : null,
        outForDeliveryAt: validatedData.outForDeliveryAt ? new Date(validatedData.outForDeliveryAt) : null,
        deliveredAt: validatedData.deliveredAt ? new Date(validatedData.deliveredAt) : null,
        cancelledAt: validatedData.cancelledAt ? new Date(validatedData.cancelledAt) : null,
        createdAt: validatedData.createdAt ? new Date(validatedData.createdAt) : new Date(),
        updatedAt: validatedData.updatedAt ? new Date(validatedData.updatedAt) : new Date(),
      }).returning()

      if (!newOrder) {
        throw new Error("Sifariş yaradıla bilmədi")
      }

      // 2. Sifariş bəndlərini yarat
      if (validatedData.items.length > 0) {
        await tx.insert(orderItems).values(
          validatedData.items.map((item: any) => ({
            id: item.id,
            orderId: newOrder.id,
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            qty: item.qty,
            unit: item.unit,
            priceAtOrder: item.priceAtOrder,
            costAtOrder: item.costAtOrder,
            subtotal: item.subtotal,
            createdAt: item.createdAt ? new Date(item.createdAt) : new Date(),
          }))
        )
      }

      // 3. Stok yeniləmə və Log
      for (const item of itemsWithResolvedVariants) {
        const variant = variantsData.find((v: any) => v.id === item.variantId)
        if (!variant) continue
        
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

        // Stok tükənmə bildirişi (yalnız stok 0 olduqda)
        if (newStock === 0) {
          const product = variantsData.find((v: any) => v.id === item.variantId)?.product
          if (product) {
            // Admin istifadəçilərini tap
            const adminUsers = await tx.select({ id: users.id, email: users.email })
              .from(users)
              .where(or(eq(users.role, 'ADMIN'), eq(users.role, 'MANAGER')))

            // Hər admin üçün bildiriş yarat
            for (const admin of adminUsers) {
              await tx.insert(notifications).values({
                userId: admin.id,
                type: "PRODUCT",
                title: "⚠️ Stok tükəndi!",
                message: `${product.name} (${variant.name}) stoku tükəndi. Təcili sifariş etmək lazımdır.`,
                refType: "PRODUCT",
                refId: variant.productId,
                channel: "APP",
              })
            }
          }
        }
      }

      // 4. Bildiriş (yalnız qeydiyyatlı istifadəçilər üçün)
      if (userId) {
        await tx.insert(notifications).values({
          userId: userId,
          type: "ORDER",
          title: "Sifarişiniz qəbul edildi",
          message: `${orderNumber} nömrəli sifarişiniz hazırlanır. Cəmi: ${validatedData.total} AZN`,
          refType: "ORDER",
          refId: newOrder.id,
          channel: "APP",
        })
      }

      return newOrder
    })

    // Sifarişi detalları ilə birlikdə qaytar
    const completeOrder = await (db.query as any).orders.findFirst({
      where: eq(orders.id, result.id),
      with: {
        items: {
          with: {
            product: true,
            variant: true,
          }
        }
      }
    }) as any

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