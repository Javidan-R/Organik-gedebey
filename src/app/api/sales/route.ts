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
import { eq, inArray } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"
import { z } from "zod"

// ============================================
// POST /api/sales (POS Satış)
// ============================================
const createSaleSchema = z.object({
  items: z.array(z.object({
    productId: z.string().uuid(),
    variantId: z.string().uuid(),
    productName: z.string().min(1),
    variantName: z.string().min(1),
    qty: z.number().positive().int(),
    unitPrice: z.number().positive(),
    lineTotal: z.number().positive(),
    unit: z.string().default("ədəd"),
    costPrice: z.number().optional(),
  })).min(1, "Ən azı 1 məhsul olmalıdır"),
  
  customerName: z.string().default("Walk-in Customer"),
  customerPhone: z.string().default(""),
  note: z.string().optional().nullable(),
  
  paymentMethod: z.enum(["cash", "card", "mixed"]),
  cashAmount: z.number().min(0).default(0),
  cardAmount: z.number().min(0).default(0),
})

export async function POST(request: NextRequest) {
  try {
    // Auth yoxlaması - yalnız admin, menecer və anbar işçiləri
    const session = await requireAuth(request, ["ADMIN", "MANAGER", "WAREHOUSE_STAFF"])
    const userId = session.user?.id
    
    if (!userId) {
      return NextResponse.json(
        { error: "İstifadəçi identifikasiyası tapılmadı" },
        { status: 401 }
      )
    }
    
    const body = await request.json()
    const validatedData = createSaleSchema.parse(body)
    
    // ==========================================
    // Ümumi məbləği hesabla
    // ==========================================
    const subtotal = validatedData.items.reduce(
      (sum, item) => sum + item.lineTotal, 
      0
    )
    
    // ==========================================
    // Ödəniş validasiyası
    // ==========================================
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
        { 
          error: `Ödəniş kifayət deyil. Tələb: ${subtotal.toFixed(2)} AZN, Ödənildi: ${totalPaid.toFixed(2)} AZN` 
        },
        { status: 400 }
      )
    }
    
    // ==========================================
    // Stok yoxlaması
    // ==========================================
    const variantIds = validatedData.items.map(item => item.variantId)
    
    // Drizzle `inArray` istifadə edərək variantları çək
    const variantsData = await db
      .select()
      .from(productVariants)
      .where(inArray(productVariants.id, variantIds))
    
    // Tapılmayan variantları yoxla
    const foundIds = new Set(variantsData.map(v => v.id))
    const missingVariants = validatedData.items.filter(
      item => !foundIds.has(item.variantId)
    )
    
    if (missingVariants.length > 0) {
      return NextResponse.json(
        { 
          error: `Variant tapılmadı: ${missingVariants.map(v => v.variantName).join(', ')}` 
        },
        { status: 400 }
      )
    }
    
    // Stok yetərliliyini yoxla
    for (const item of validatedData.items) {
      const variant = variantsData.find(v => v.id === item.variantId)!
      
      if (variant.stock < item.qty) {
        return NextResponse.json(
          { 
            error: `${item.productName} üçün kifayət qədər stok yoxdur. Mövcud: ${variant.stock}, Tələb: ${item.qty}` 
          },
          { status: 400 }
        )
      }
    }
    
    // ==========================================
    // Sifariş nömrəsi generasiya et
    // ==========================================
    const year = new Date().getFullYear()
    const timestamp = Date.now().toString().slice(-6)
    const random = Math.random().toString(36).substring(2, 5).toUpperCase()
    const orderNumber = `POS-${year}-${timestamp}-${random}`
    
    // ==========================================
    // Transaction: Satışı yarat, stoku yenilə, log yaz
    // ==========================================
    const result = await db.transaction(async (tx) => {
      
      // 1. Sifarişi yarat
      const [newOrder] = await tx
        .insert(orders)
        .values({
          orderNumber,
          userId: userId, // string (UUID)
          customerName: validatedData.customerName,
          customerPhone: validatedData.customerPhone,
          deliveryAddressText: "POS - Mağaza daxili satış",
          
          // Maliyyə
          subtotal: subtotal.toFixed(2),
          discountAmount: "0",
          deliveryFee: "0",
          total: subtotal.toFixed(2),
          
          // Ödəniş
          paymentMethod: validatedData.paymentMethod === "cash" 
            ? "CASH_ON_DELIVERY" 
            : validatedData.paymentMethod === "card" 
              ? "CARD" 
              : "BANK_TRANSFER",
          paymentStatus: "PAID",
          
          // Status - POS satışlar dərhal çatdırılır
          status: "DELIVERED",
          confirmedAt: new Date(),
          deliveredAt: new Date(),
          
          // Qeydlər
          customerNotes: validatedData.note || null,
          adminNotes: `POS satış. Nağd: ${actualCash} AZN, Kart: ${actualCard} AZN`,
        })
        .returning()
      
      // 2. Sifariş bəndlərini yarat
      await tx.insert(orderItems).values(
        validatedData.items.map(item => ({
          orderId: newOrder.id,
          productId: item.productId,
          variantId: item.variantId,
          productName: item.productName,
          variantName: item.variantName,
          qty: item.qty,
          unit: item.unit,
          priceAtOrder: item.unitPrice.toFixed(2),
          costAtOrder: item.costPrice ? item.costPrice.toFixed(2) : null,
          subtotal: item.lineTotal.toFixed(2),
        }))
      )
      
      // 3. Stoku yenilə və inventar loqlarını yaz
      for (const item of validatedData.items) {
        const variant = variantsData.find(v => v.id === item.variantId)!
        const newStock = variant.stock - item.qty
        
        // Stok yeniləmə
        await tx
          .update(productVariants)
          .set({ 
            stock: newStock,
            updatedAt: new Date()
          })
          .where(eq(productVariants.id, variant.id))
        
        // İnventar log
        await tx.insert(inventoryLogs).values({
          productId: item.productId,
          variantId: item.variantId,
          type: "SALE",
          qtyChange: -item.qty,
          qtyBefore: variant.stock,
          qtyAfter: newStock,
          unit: item.unit,
          refType: "ORDER",
          refId: newOrder.id,
          costPerUnit: item.costPrice ? item.costPrice.toFixed(2) : null,
          totalCost: item.costPrice ? (item.costPrice * item.qty).toFixed(2) : null,
          notes: `POS satış #${orderNumber}`,
          createdBy: userId,
        })
      }
      
      // 4. Admin log
      await tx.insert(adminLogs).values({
        userId: userId,
        action: "POS_SALE",
        entityType: "ORDER",
        entityId: newOrder.id,
        details: {
          orderNumber: newOrder.orderNumber,
          subtotal: subtotal.toFixed(2),
          total: subtotal.toFixed(2),
          itemCount: validatedData.items.length,
          paymentMethod: validatedData.paymentMethod,
          cashAmount: actualCash,
          cardAmount: actualCard,
          items: validatedData.items.map(item => ({
            productId: item.productId,
            variantId: item.variantId,
            productName: item.productName,
            variantName: item.variantName,
            qty: item.qty,
            unitPrice: item.unitPrice,
            lineTotal: item.lineTotal,
          })),
        },
      })
      
      return newOrder
    })
    
    // ==========================================
    // Cavab hazırla
    // ==========================================
    const change = Math.max(0, totalPaid - subtotal)
    
    // Satış detallarını əlavə et
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
    
    return NextResponse.json({
      success: true,
      message: "Satış uğurla tamamlandı",
      order: completeOrder,
      payment: {
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
        paid: totalPaid.toFixed(2),
        change: change.toFixed(2),
        method: validatedData.paymentMethod,
        cash: actualCash.toFixed(2),
        card: actualCard.toFixed(2),
      },
      receipt: {
        orderNumber: result.orderNumber,
        date: new Date().toISOString(),
        items: validatedData.items.map(item => ({
          productName: item.productName,
          variantName: item.variantName,
          qty: item.qty,
          unitPrice: item.unitPrice.toFixed(2),
          lineTotal: item.lineTotal.toFixed(2),
        })),
        subtotal: subtotal.toFixed(2),
        total: subtotal.toFixed(2),
        paid: totalPaid.toFixed(2),
        change: change.toFixed(2),
        paymentMethod: validatedData.paymentMethod,
      }
    }, { status: 201 })
    
  } catch (error) {
    // Zod validasiya xətası
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          error: "Validasiya xətası", 
          details: error.issues.map(e => ({
            field: e.path.join('.'),
            message: e.message,
          }))
        },
        { status: 400 }
      )
    }
    
    console.error("POS satış xətası:", error)
    return NextResponse.json(
      { error: "Satış tamamlanmadı. Zəhmət olmasa yenidən cəhd edin." },
      { status: 500 }
    )
  }
}