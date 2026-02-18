// app/api/orders/[id]/status/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { orders, notifications, deliveries } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(["ADMIN", "MANAGER", "COURIER"])
    
    const { status, notes } = await request.json()
    
    // Get current order
    const [currentOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
      .limit(1)
    
    if (!currentOrder) {
      return NextResponse.json(
        { error: "Sifariş tapılmadı" },
        { status: 404 }
      )
    }
    
    // Update order
    const updateData: any = {
      status,
      updatedAt: new Date(),
    }
    
    // Set timestamp based on status
    const statusTimestampMap: Record<string, string> = {
      CONFIRMED: "confirmedAt",
      PREPARING: "preparingAt",
      READY_FOR_DELIVERY: "readyAt",
      OUT_FOR_DELIVERY: "outForDeliveryAt",
      DELIVERED: "deliveredAt",
      CANCELLED: "cancelledAt",
    }
    
    if (statusTimestampMap[status]) {
      updateData[statusTimestampMap[status]] = new Date()
    }
    
    if (status === "CANCELLED" && notes) {
      updateData.cancellationReason = notes
    }
    
    if (notes && status !== "CANCELLED") {
      updateData.adminNotes = notes
    }
    
    // Update in transaction
    await db.transaction(async (tx) => {
      // Update order
      await tx
        .update(orders)
        .set(updateData)
        .where(eq(orders.id, params.id))
      
      // Create notification
      if (currentOrder.userId) {
        await tx.insert(notifications).values({
          userId: currentOrder.userId,
          type: "ORDER",
          title: "Sifariş statusu yeniləndi",
          message: `Sifarişiniz (#${currentOrder.orderNumber}) indi "${getStatusText(status)}" statusundadır`,
          refType: "order",
          refId: currentOrder.id,
        })
      }
      
      // Update delivery if exists
      const [delivery] = await tx
        .select()
        .from(deliveries)
        .where(eq(deliveries.orderId, params.id))
        .limit(1)
      
      if (delivery) {
        const deliveryStatusMap: Record<string, string> = {
          CONFIRMED: "ASSIGNED",
          PREPARING: "ASSIGNED",
          READY_FOR_DELIVERY: "PICKED_UP",
          OUT_FOR_DELIVERY: "IN_TRANSIT",
          DELIVERED: "DELIVERED",
          CANCELLED: "FAILED",
        }
        
        if (deliveryStatusMap[status]) {
          await tx
            .update(deliveries)
            .set({ status: deliveryStatusMap[status] })
            .where(eq(deliveries.id, delivery.id))
        }
      }
    })
    
    // Fetch updated order
    const [updatedOrder] = await db
      .select()
      .from(orders)
      .where(eq(orders.id, params.id))
    
    return NextResponse.json({
      message: "Status uğurla yeniləndi",
      order: updatedOrder,
    })
    
  } catch (error) {
    console.error("Order status update error:", error)
    return NextResponse.json(
      { error: "Status yenilənərkən xəta" },
      { status: 500 }
    )
  }
}

function getStatusText(status: string): string {
  const statusTexts: Record<string, string> = {
    PENDING: "Gözləyir",
    CONFIRMED: "Təsdiqləndi",
    PREPARING: "Hazırlanır",
    READY_FOR_DELIVERY: "Çatdırılmağa hazırdır",
    OUT_FOR_DELIVERY: "Yoldadır",
    DELIVERED: "Çatdırıldı",
    CANCELLED: "Ləğv edildi",
  }
  return statusTexts[status] || status
}