// app/api/deliveries/route.ts
import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { deliveries, orders, users } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"
import { requireAuth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(["ADMIN", "MANAGER", "COURIER"])
    
    const { searchParams } = new URL(request.url)
    const status = searchParams.get("status")
    const courierId = searchParams.get("courierId")
    
    // Build query
    const conditions = []
    
    if (status && status !== "all") {
      conditions.push(eq(deliveries.status, status))
    }
    
    if (courierId) {
      conditions.push(eq(deliveries.courierId, courierId))
    }
    
    // For couriers, only show their deliveries
    if (session.user.role === "COURIER") {
      conditions.push(eq(deliveries.courierId, session.user.id))
    }
    
    const deliveriesData = await db
      .select({
        delivery: deliveries,
        order: orders,
        courier: users,
      })
      .from(deliveries)
      .leftJoin(orders, eq(deliveries.orderId, orders.id))
      .leftJoin(users, eq(deliveries.courierId, users.id))
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(deliveries.createdAt))
    
    return NextResponse.json({
      deliveries: deliveriesData.map(d => ({
        ...d.delivery,
        order: d.order,
        courier: d.courier ? {
          id: d.courier.id,
          firstName: d.courier.firstName,
          lastName: d.courier.lastName,
          phone: d.courier.phone,
        } : null,
      })),
    })
  } catch (error) {
    console.error("Deliveries GET error:", error)
    return NextResponse.json(
      { error: "Çatdırılmalar yüklənərkən xəta" },
      { status: 500 }
    )
  }
}