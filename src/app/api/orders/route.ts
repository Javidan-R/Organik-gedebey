// app/api/orders/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import {
  orders,
  orderItems,
  products,
  productVariants,
  users,
  addresses,
  inventoryLogs,
  notifications,
  adminLogs,
} from "@/lib/db/schema"
import { eq, and, desc, gte, lte, or, sql, like } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

// ============================================
// GET /api/orders
// ============================================
export async function GET(request: NextRequest) {
  try {
    // Auth check
    const session = await requireAuth(["ADMIN", "MANAGER", "WAREHOUSE_STAFF"])
    
    const { searchParams } = new URL(request.url)
    
    // Parse filters
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "50")
    const status = searchParams.get("status")
    const search = searchParams.get("search")
    const dateFrom = searchParams.get("dateFrom")
    const dateTo = searchParams.get("dateTo")
    const userId = searchParams.get("userId")
    
    // Build conditions
    const conditions = []
    
    if (status && status !== "all") {
      conditions.push(eq(orders.status, status))
    }
    
    if (search) {
      conditions.push(
        or(
          like(orders.orderNumber, `%${search}%`),
          like(orders.customerName, `%${search}%`),
          like(orders.customerPhone, `%${search}%`)
        )
      )
    }
    
    if (dateFrom) {
      conditions.push(gte(orders.createdAt, new Date(dateFrom)))
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(orders.createdAt, endDate))
    }
    
    if (userId) {
      conditions.push(eq(orders.userId, userId))
    }
    
    // Query orders with user info
    const offset = (page - 1) * limit
    
    const ordersData = await db
      .select({
        order: orders,
        user: users,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(orders.createdAt))
      .limit(limit)
      .offset(offset)
    
    // Get order items for each order
    const orderIds = ordersData.map(o => o.order.id)
    
    const itemsData = await db
      .select({
        item: orderItems,
        product: products,
        variant: productVariants,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .where(sql`${orderItems.orderId} IN ${orderIds}`)
    
    // Group items by order
    const ordersWithItems = ordersData.map(({ order, user }) => {
      const items = itemsData
        .filter(i => i.item.orderId === order.id)
        .map(i => ({
          ...i.item,
          product: i.product,
          variant: i.variant,
        }))
      
      return {
        ...order,
        user: user ? {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone,
        } : null,
        items,
      }
    })
    
    // Count total
    const [{ count }] = await db
      .select({ count: sql<number>`count(*)` })
      .from(orders)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    
    return NextResponse.json({
      orders: ordersWithItems,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    console.error("Orders GET error:", error)
    return NextResponse.json(
      { error: "Sifarişlər yüklənərkən xəta" },
      { status: 500 }
    )
  }
}

// ============================================
// POST /api/orders (Create Order)
// ============================================
const createOrderSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid().optional(),
    qty: z.number().positive().int(),
  })).min(1, "Ən azı 1 məhsul olmalıdır"),
  
  customerName: z.string().min(2),
  customerEmail: z.string().email().optional(),
  customerPhone: z.string().min(9),
  
  deliveryAddressId: z.string().uuid().optional(),
  deliveryAddress: z.object({
    fullName: z.string(),
    phone: z.string(),
    city: z.string(),
    street: z.string(),
    building: z.string().optional(),
    apartment: z.string().optional(),
    notes: z.string().optional(),
  }).optional(),
  
  paymentMethod: z.enum(["CASH_ON_DELIVERY", "CARD", "BANK_TRANSFER"]),
  couponCode: z.string().optional(),
  customerNotes: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    
    // Parse and validate
    const body = await request.json()
    const validatedData = createOrderSchema.parse(body)
    
    // Fetch products and variants
    const productIds = validatedData.items.map(item => item.productId)
    const variantIds = validatedData.items
      .filter(item => item.variantId)
      .map(item => item.variantId!)
    
    const [productsData, variantsData] = await Promise.all([
      db.select().from(products).where(sql`${products.id} IN ${productIds}`),
      variantIds.length > 0
        ? db.select().from(productVariants).where(sql`${productVariants.id} IN ${variantIds}`)
        : [],
    ])
    
    // Calculate totals and validate stock
    let subtotal = 0
    const orderItemsData = []
    
    for (const item of validatedData.items) {
      const product = productsData.find(p => p.id === item.productId)
      if (!product) {
        return NextResponse.json(
          { error: `Məhsul tapılmadı: ${item.productId}` },
          { status: 400 }
        )
      }
      
      const variant = item.variantId
        ? variantsData.find(v => v.id === item.variantId)
        : variantsData.find(v => v.productId === product.id && v.isDefault)
      
      if (!variant) {
        return NextResponse.json(
          { error: `Variant tapılmadı: ${product.name}` },
          { status: 400 }
        )
      }
      
      // Check stock
      if (variant.stock < item.qty) {
        return NextResponse.json(
          { error: `Stok yetərli deyil: ${product.name} (Var: ${variant.stock}, Tələb: ${item.qty})` },
          { status: 400 }
        )
      }
      
      const price = parseFloat(variant.price)
      const itemSubtotal = price * item.qty
      subtotal += itemSubtotal
      
      orderItemsData.push({
        productId: product.id,
        variantId: variant.id,
        productName: product.name,
        variantName: variant.name,
        qty: item.qty,
        unit: variant.unit,
        priceAtOrder: price.toString(),
        costAtOrder: variant.costPrice,
        subtotal: itemSubtotal.toString(),
      })
    }
    
    // Apply coupon if provided
    let couponDiscount = 0
    let validCoupon = null
    
    if (validatedData.couponCode) {
      const [coupon] = await db
        .select()
        .from(coupons)
        .where(
          and(
            eq(coupons.code, validatedData.couponCode),
            eq(coupons.isActive, true)
          )
        )
        .limit(1)
      
      if (coupon) {
        // Check validity dates
        const now = new Date()
        if (coupon.validFrom && new Date(coupon.validFrom) > now) {
          return NextResponse.json(
            { error: "Kupon hələ aktiv deyil" },
            { status: 400 }
          )
        }
        if (coupon.validUntil && new Date(coupon.validUntil) < now) {
          return NextResponse.json(
            { error: "Kuponun müddəti bitib" },
            { status: 400 }
          )
        }
        
        // Check min order amount
        if (coupon.minOrderAmount && subtotal < parseFloat(coupon.minOrderAmount)) {
          return NextResponse.json(
            { error: `Minimum sifariş məbləği ${coupon.minOrderAmount} AZN olmalıdır` },
            { status: 400 }
          )
        }
        
        // Calculate discount
        if (coupon.discountType === "PERCENTAGE") {
          couponDiscount = subtotal * (parseFloat(coupon.discountValue) / 100)
        } else {
          couponDiscount = parseFloat(coupon.discountValue)
        }
        
        // Apply max discount
        if (coupon.maxDiscountAmount) {
          couponDiscount = Math.min(couponDiscount, parseFloat(coupon.maxDiscountAmount))
        }
        
        validCoupon = coupon
      }
    }
    
    // Calculate delivery fee
    const deliveryFee = subtotal >= 50 ? 0 : 5 // Free delivery over 50 AZN
    
    const total = subtotal - couponDiscount + deliveryFee
    
    // Generate order number
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    const orderNumber = `ORG-${year}-${timestamp}`
    
    // Create order in transaction
    const result = await db.transaction(async (tx) => {
      // 1. Create order
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: session?.user?.id,
          customerName: validatedData.customerName,
          customerEmail: validatedData.customerEmail,
          customerPhone: validatedData.customerPhone,
          deliveryAddressId: validatedData.deliveryAddressId,
          deliveryAddressText: validatedData.deliveryAddress
            ? JSON.stringify(validatedData.deliveryAddress)
            : "",
          subtotal: subtotal.toString(),
          discountAmount: "0",
          deliveryFee: deliveryFee.toString(),
          total: total.toString(),
          couponCode: validCoupon?.code,
          couponDiscount: couponDiscount.toString(),
          paymentMethod: validatedData.paymentMethod,
          customerNotes: validatedData.customerNotes,
        })
        .returning()
      
      // 2. Create order items
      await tx.insert(orderItems).values(
        orderItemsData.map(item => ({
          orderId: newOrder.id,
          ...item,
        }))
      )
      
      // 3. Update stock
      for (const item of orderItemsData) {
        const variant = variantsData.find(v => v.id === item.variantId)
        if (variant) {
          const newStock = variant.stock - item.qty
          
          await tx
            .update(productVariants)
            .set({ stock: newStock })
            .where(eq(productVariants.id, variant.id))
          
          // 4. Log inventory
          await tx.insert(inventoryLogs).values({
            productId: item.productId,
            variantId: item.variantId,
            type: "SALE",
            qtyChange: -item.qty,
            qtyBefore: variant.stock,
            qtyAfter: newStock,
            refType: "order",
            refId: newOrder.id,
            costPerUnit: item.costAtOrder,
            totalCost: item.costAtOrder
              ? (parseFloat(item.costAtOrder) * item.qty).toString()
              : null,
            createdBy: session?.user?.id,
          })
        }
      }
      
      // 5. Record coupon usage
      if (validCoupon) {
        await tx.insert(couponUsage).values({
          couponId: validCoupon.id,
          userId: session?.user?.id,
          orderId: newOrder.id,
          discountApplied: couponDiscount.toString(),
        })
        
        await tx
          .update(coupons)
          .set({ totalUsed: validCoupon.totalUsed + 1 })
          .where(eq(coupons.id, validCoupon.id))
      }
      
      // 6. Update user stats
      if (session?.user?.id) {
        const [user] = await tx
          .select()
          .from(users)
          .where(eq(users.id, session.user.id))
          .limit(1)
        
        if (user) {
          await tx
            .update(users)
            .set({
              totalOrders: user.totalOrders + 1,
              totalSpent: (parseFloat(user.totalSpent) + total).toString(),
            })
            .where(eq(users.id, user.id))
        }
      }
      
      // 7. Create notification
      if (session?.user?.id) {
        await tx.insert(notifications).values({
          userId: session.user.id,
          type: "ORDER",
          title: "Sifarişiniz qəbul edildi",
          message: `Sifariş nömrəsi: ${orderNumber}. Cəmi: ${total.toFixed(2)} AZN`,
          refType: "order",
          refId: newOrder.id,
        })
      }
      
      return newOrder
    })
    
    // Fetch complete order with items
    const [completeOrder] = await db
      .select({
        order: orders,
        user: users,
      })
      .from(orders)
      .leftJoin(users, eq(orders.userId, users.id))
      .where(eq(orders.id, result.id))
    
    const items = await db
      .select({
        item: orderItems,
        product: products,
        variant: productVariants,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .leftJoin(productVariants, eq(orderItems.variantId, productVariants.id))
      .where(eq(orderItems.orderId, result.id))
    
    return NextResponse.json({
      message: "Sifariş uğurla yaradıldı",
      order: {
        ...completeOrder.order,
        user: completeOrder.user,
        items: items.map(i => ({
          ...i.item,
          product: i.product,
          variant: i.variant,
        })),
      },
    }, { status: 201 })
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasiya xətası", details: error.errors },
        { status: 400 }
      )
    }
    
    console.error("Order creation error:", error)
    return NextResponse.json(
      { error: "Sifariş yaradılarkən xəta baş verdi" },
      { status: 500 }
    )
  }
}