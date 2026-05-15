import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get('og_auth')

    if (!cookie?.value) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    let authData: { id: string; email: string; role: string }
    try {
      authData = JSON.parse(cookie.value)
    } catch {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    if (!authData.id) {
      return NextResponse.json({ user: null }, { status: 401 })
    }

    // İstifadəçini database-dən tap
    const [user] = await db
      .select({
        id: users.id,
        email: users.email,
        firstName: users.firstName,
        lastName: users.lastName,
        role: users.role,
        phone: users.phone,
        avatarUrl: users.avatarUrl,
        isEmailVerified: users.isEmailVerified,
        totalOrders: users.totalOrders,
        totalSpent: users.totalSpent,
        loyaltyPoints: users.loyaltyPoints,
        lastLoginAt: users.lastLoginAt,
        createdAt: users.createdAt,
        isBlocked: users.isBlocked,
      })
      .from(users)
      .where(eq(users.id, authData.id))
      .limit(1)

    if (!user || user.isBlocked) {
      const response = NextResponse.json({ user: null }, { status: 401 })
      response.cookies.delete('og_auth')
      return response
    }

    return NextResponse.json({
      user: {
        ...user,
        totalSpent: parseFloat(user.totalSpent || '0'),
      }
    })

  } catch (error) {
    console.error('Me error:', error)
    return NextResponse.json({ user: null }, { status: 500 })
  }
}