import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, addresses, orders, notifications, adminLogs } from '@/lib/db/schema'
import { eq, and, desc, count, sql } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

// GET /api/admin/users/[id] - Get single user with full details
export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await db.query.users.findFirst({
      where: eq(users.id, params.id),
      with: {
        addresses: {
          orderBy: [desc(addresses.isDefault)]
        },
        orders: {
          orderBy: [desc(orders.createdAt)],
          limit: 10
        },
        notifications: {
          orderBy: [desc(notifications.createdAt)],
          limit: 10
        }
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    // Get order statistics
    const orderStats = await db
      .select({
        total: count(),
        totalSpent: sql<number>`COALESCE(SUM(${orders.total}), 0)`
      })
      .from(orders)
      .where(eq(orders.userId, params.id))

    return NextResponse.json({
      ...user,
      statistics: {
        totalOrders: orderStats[0].total,
        totalSpent: orderStats[0].totalSpent
      }
    })
  } catch (error) {
    console.error('GET /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// PUT /api/admin/users/[id] - Update user
export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json()
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, params.id)
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    // Check email uniqueness if changing email
    if (body.email && body.email !== existingUser.email) {
      const emailExists = await db.query.users.findFirst({
        where: eq(users.email, body.email)
      })
      if (emailExists) {
        return NextResponse.json(
          { error: 'Bu email artıq mövcuddur' },
          { status: 409 }
        )
      }
    }

    // Hash password if provided
    let passwordHash = existingUser.passwordHash
    if (body.password) {
      passwordHash = await bcrypt.hash(body.password, 10)
    }

    // Update user
    const [updatedUser] = await db.update(users)
      .set({
        email: body.email || existingUser.email,
        phone: body.phone !== undefined ? body.phone : existingUser.phone,
        passwordHash,
        firstName: body.firstName || existingUser.firstName,
        lastName: body.lastName || existingUser.lastName,
        role: body.role || existingUser.role,
        avatarUrl: body.avatarUrl !== undefined ? body.avatarUrl : existingUser.avatarUrl,
        isActive: body.isActive !== undefined ? body.isActive : existingUser.isActive,
        isBlocked: body.isBlocked !== undefined ? body.isBlocked : existingUser.isBlocked,
        blockedReason: body.blockedReason !== undefined ? body.blockedReason : existingUser.blockedReason,
        defaultAddressId: body.defaultAddressId !== undefined ? body.defaultAddressId : existingUser.defaultAddressId,
        updatedAt: new Date()
      })
      .where(eq(users.id, params.id))
      .returning()

    // Log admin action
    await db.insert(adminLogs).values({
      userId: body.adminId || params.id,
      action: 'UPDATE_USER',
      entityType: 'USER',
      entityId: params.id,
      details: { changes: body }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('PUT /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// DELETE /api/admin/users/[id] - Delete user (soft delete)
export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const existingUser = await db.query.users.findFirst({
      where: eq(users.id, params.id)
    })

    if (!existingUser) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    // Soft delete - mark as inactive and blocked
    await db.update(users)
      .set({
        isActive: false,
        isBlocked: true,
        blockedReason: 'İstifadəçi silindi',
        updatedAt: new Date()
      })
      .where(eq(users.id, params.id))

    // Log admin action
    const { searchParams } = new URL(req.url)
    const adminId = searchParams.get('adminId')
    
    await db.insert(adminLogs).values({
      userId: adminId || params.id,
      action: 'DELETE_USER',
      entityType: 'USER',
      entityId: params.id,
      details: { deletedUserEmail: existingUser.email }
    })

    return NextResponse.json({ success: true, message: 'İstifadəçi uğurla silindi' })
  } catch (error) {
    console.error('DELETE /api/admin/users/[id] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
