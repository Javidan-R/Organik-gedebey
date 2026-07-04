// src/app/api/admin/users/export/route.ts
// Admin Users Export API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, orders } from '@/lib/db/schema'
import { eq, desc } from 'drizzle-orm'
 
export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const format = searchParams.get('format') || 'json'
    const role = searchParams.get('role')
    const isActive = searchParams.get('isActive')

    const conditions: any[] = []
    if (role) conditions.push(eq(users.role, role as any))
    if (isActive !== null) conditions.push(eq(users.isActive, isActive === 'true'))

    const usersData = await (db.query as any).users.findMany({
      where: conditions.length > 0 ? conditions[0] : undefined,
      with: {
        addresses: {
          columns: {
            id: true,
            city: true,
            street: true,
            isDefault: true,
          },
        },
        orders: {
          columns: {
            id: true,
            total: true,
            status: true,
            createdAt: true,
          },
          orderBy: [desc(orders.createdAt)],
          limit: 5,
        },
      },
      orderBy: [desc(users.createdAt)],
    })

    // Transform data for export
    const exportData = usersData.map((user: any) => ({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isBlocked: user.isBlocked,
      isEmailVerified: user.isEmailVerified,
      isPhoneVerified: user.isPhoneVerified,
      totalOrders: user.totalOrders,
      totalSpent: user.totalSpent,
      loyaltyPoints: user.loyaltyPoints,
      createdAt: user.createdAt,
      lastLoginAt: user.lastLoginAt,
      addresses: user.addresses,
      recentOrders: user.orders,
    }))

    if (format === 'csv') {
      // Convert to CSV
      const headers = Object.keys(exportData[0] || {}).join(',')
      const rows = exportData.map((user: any) => 
        Object.values(user).map(val => 
          typeof val === 'object' ? JSON.stringify(val).replace(/"/g, '""') : val
        ).join(',')
      )
      const csv = [headers, ...rows].join('\n')

      return new NextResponse(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename=users-export.csv',
        },
      })
    }

    return NextResponse.json({ 
      users: exportData,
      total: exportData.length,
      exportedAt: new Date().toISOString()
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Users export GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
