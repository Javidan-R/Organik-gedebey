// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, notifications, deliveries, adminLogs, inventoryLogs, productVariants, orderItems } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"

// ============================================
// Status constants
// ============================================
const VALID_STATUSES = [
  "PENDING",
  "CONFIRMED", 
  "PREPARING",
  "READY_FOR_DELIVERY",
  "OUT_FOR_DELIVERY",
  "DELIVERED",
  "CANCELLED",
] as const

type OrderStatus = typeof VALID_STATUSES[number]

const STATUS_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PREPARING", "CANCELLED"],
  PREPARING: ["READY_FOR_DELIVERY", "CANCELLED"],
  READY_FOR_DELIVERY: ["OUT_FOR_DELIVERY", "CANCELLED"],
  OUT_FOR_DELIVERY: ["DELIVERED", "CANCELLED"],
  DELIVERED: [], // Final state
  CANCELLED: [], // Final state
}

const STATUS_TIMESTAMP_MAP: Record<string, string> = {
  CONFIRMED: "confirmedAt",
  PREPARING: "preparingAt",
  READY_FOR_DELIVERY: "readyAt",
  OUT_FOR_DELIVERY: "outForDeliveryAt",
  DELIVERED: "deliveredAt",
  CANCELLED: "cancelledAt",
}

const DELIVERY_STATUS_MAP: Record<string, string> = {
  CONFIRMED: "ASSIGNED",
  PREPARING: "PENDING",
  READY_FOR_DELIVERY: "PICKED_UP",
  OUT_FOR_DELIVERY: "IN_TRANSIT",
  DELIVERED: "DELIVERED",
  CANCELLED: "FAILED",
}

// ============================================
// PATCH /api/orders/[id]/status
// ============================================
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    // Auth yoxlaması
    const session = await requireAuth(["ADMIN", "MANAGER", "COURIER"])
    const userId = session.user?.id

    if (!userId) {
      return NextResponse.json(
        { error: "İstifadəçi identifikasiyası tapılmadı" },
        { status: 401 }
      )
    }

    // Next.js 15+ - params Promise kimi gəlir
    const { id: orderId } = await context.params

    if (!orderId) {
      return NextResponse.json(
        { error: "Sifariş ID tələb olunur" },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { status, notes } = body

    // ==========================================
    // Validasiya
    // ==========================================
    if (!status || !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { 
          error: "Yanlış status",
          validStatuses: VALID_STATUSES 
        },
        { status: 400 }
      )
    }

    // ==========================================
    // Cari sifarişi tap
    // ==========================================
    const currentOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        items: true,
        delivery: true,
      }
    })

    if (!currentOrder) {
      return NextResponse.json(
        { error: "Sifariş tapılmadı" },
        { status: 404 }
      )
    }

    // ==========================================
    // Status keçid validasiyası
    // ==========================================
    const currentStatus = currentOrder.status as OrderStatus
    const allowedTransitions = STATUS_TRANSITIONS[currentStatus]

    if (allowedTransitions.length > 0 && !allowedTransitions.includes(status as OrderStatus)) {
      return NextResponse.json(
        { 
          error: `Status keçidi mümkün deyil: ${currentStatus} → ${status}`,
          allowedTransitions: allowedTransitions,
          currentStatus: currentStatus,
        },
        { status: 400 }
      )
    }

    // ==========================================
    // Update data hazırla
    // ==========================================
    const updateData: Record<string, any> = {
      status,
      updatedAt: new Date(),
    }

    // Status-a uyğun timestamp əlavə et
    if (STATUS_TIMESTAMP_MAP[status]) {
      updateData[STATUS_TIMESTAMP_MAP[status]] = new Date()
    }

    // Payment status avtomatik yeniləmə
    if (status === "DELIVERED") {
      updateData.paymentStatus = "PAID"
    }

    // Qeydlər
    if (status === "CANCELLED") {
      updateData.cancellationReason = notes || "Status yeniləməsi ilə ləğv edildi"
    } else if (notes) {
      updateData.adminNotes = currentOrder.adminNotes 
        ? `${currentOrder.adminNotes}\n[${new Date().toISOString()}] ${notes}`
        : `[${new Date().toISOString()}] ${notes}`
    }

    // ==========================================
    // Transaction: Status yenilə, stock qaytar (əgər ləğv olunursa)
    // ==========================================
    await db.transaction(async (tx) => {
      
      // 1. Sifarişi yenilə
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, orderId))

      // 2. Əgər ləğv olunursa, stoku geri qaytar
      if (status === "CANCELLED" && currentOrder.items) {
        for (const item of currentOrder.items) {
          if (item.variantId) {
            const [variant] = await tx
              .select()
              .from(productVariants)
              .where(eq(productVariants.id, item.variantId))
              .limit(1)

            if (variant) {
              const newStock = variant.stock + item.qty

              await tx
                .update(productVariants)
                .set({ 
                  stock: newStock,
                  updatedAt: new Date()
                })
                .where(eq(productVariants.id, item.variantId))

              // İnventar log
              await tx.insert(inventoryLogs).values({
                productId: item.productId!,
                variantId: item.variantId,
                type: "RETURN",
                qtyChange: item.qty,
                qtyBefore: variant.stock,
                qtyAfter: newStock,
                unit: item.unit || "ədəd",
                refType: "ORDER",
                refId: currentOrder.id,
                notes: `Sifariş ləğv edildi - #${currentOrder.orderNumber}`,
                createdBy: userId,
              })
            }
          }
        }
      }

      // 3. Bildiriş göndər
      if (currentOrder.userId) {
        const statusText = getStatusText(status)
        const orderRef = currentOrder.orderNumber

        let notificationMessage = ""
        switch (status) {
          case "CONFIRMED":
            notificationMessage = `Sifarişiniz (#${orderRef}) təsdiqləndi! Hazırlanmağa başlayırıq.`
            break
          case "PREPARING":
            notificationMessage = `Sifarişiniz (#${orderRef}) hazırlanır.`
            break
          case "READY_FOR_DELIVERY":
            notificationMessage = `Sifarişiniz (#${orderRef}) çatdırılmağa hazırdır.`
            break
          case "OUT_FOR_DELIVERY":
            notificationMessage = `Sifarişiniz (#${orderRef}) yoldadır! Tezliklə sizdə olacaq.`
            break
          case "DELIVERED":
            notificationMessage = `Sifarişiniz (#${orderRef}) çatdırıldı! Afiyət olsun! 🌿`
            break
          case "CANCELLED":
            notificationMessage = `Sifarişiniz (#${orderRef}) ləğv edildi. Sualınız varsa bizimlə əlaqə saxlayın.`
            break
          default:
            notificationMessage = `Sifariş statusu yeniləndi: ${statusText}`
        }

        await tx.insert(notifications).values({
          userId: currentOrder.userId,
          type: "ORDER",
          title: `Sifariş ${statusText.toLowerCase()}`,
          message: notificationMessage,
          refType: "ORDER",
          refId: currentOrder.id,
          channel: "APP",
        })
      }

   
      // 5. Admin log
      await tx.insert(adminLogs).values({
        userId: userId,
        action: `ORDER_STATUS_${status}`,
        entityType: "ORDER",
        entityId: orderId,
        details: {
          orderNumber: currentOrder.orderNumber,
          previousStatus: currentStatus,
          newStatus: status,
          notes: notes || null,
          updatedBy: session.user?.email || userId,
        },
      })
    })

    // ==========================================
    // Yenilənmiş sifarişi qaytar
    // ==========================================
    const updatedOrder = await db.query.orders.findFirst({
      where: eq(orders.id, orderId),
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true,
          }
        },
        items: {
          with: {
            product: {
              columns: {
                id: true,
                name: true,
                slug: true,
              }
            },
            variant: {
              columns: {
                id: true,
                name: true,
                stock: true,
              }
            }
          }
        },
        delivery: true,
      }
    })

    return NextResponse.json({
      success: true,
      message: `Status "${getStatusText(status)}" olaraq yeniləndi`,
      order: updatedOrder,
      statusChange: {
        from: currentStatus,
        to: status,
        timestamp: new Date().toISOString(),
      }
    })

  } catch (error) {
    console.error("Order status update error:", error)
    return NextResponse.json(
      { error: "Status yenilənərkən gözlənilməz xəta baş verdi" },
      { status: 500 }
    )
  }
}

// ============================================
// Köməkçi funksiya
// ============================================
function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    PENDING: "Gözləmədə",
    CONFIRMED: "Təsdiqləndi",
    PREPARING: "Hazırlanır",
    READY_FOR_DELIVERY: "Çatdırılmağa hazır",
    OUT_FOR_DELIVERY: "Yolda",
    DELIVERED: "Çatdırıldı",
    CANCELLED: "Ləğv edildi",
    REFUNDED: "Geri qaytarıldı",
  }
  return statusTexts[status] || status
}