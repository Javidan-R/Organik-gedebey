// src/app/api/admin/users/route.ts
// Admin Users CRUD API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users,notifications, userRoleEnum } from '@/lib/db/schema'
import { eq, like, or, desc, asc, and, sql } from 'drizzle-orm'
import { z } from 'zod'

// Validation schemas
const createUserSchema = z.object({
  email: z.string().email('Düzgün email formatı daxil edin'),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'Ad mütləqdir'),
  lastName: z.string().min(1, 'Soyad mütləqdir'),
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN']),
  password: z.string().min(6, 'Şifrə ən azı 6 simvol olmalıdır'),
  isActive: z.boolean().default(true),
})

const updateUserSchema = z.object({
  email: z.string().email('Düzgün email formatı daxil edin').optional(),
  phone: z.string().optional(),
  firstName: z.string().min(1, 'Ad mütləqdir').optional(),
  lastName: z.string().min(1, 'Soyad mütləqdir').optional(),
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN']).optional(),
  isActive: z.boolean().optional(),
})

// GET - Fetch users with filtering, sorting, and pagination
export async function GET(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN', 'MANAGER'])
    
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const role = searchParams.get('role') || ''
    const status = searchParams.get('status') || 'all'
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit

    // Build conditions
    const conditions: any[] = []
    
    if (search) {
      conditions.push(
        or(
          like(users.email, `%${search}%`),
          like(users.firstName, `%${search}%`),
          like(users.lastName, `%${search}%`),
          like(users.phone, `%${search}%`)
        )
      )
    }
    
    if (role) {
conditions.push(eq(users.role, role as typeof userRoleEnum.enumValues[number]))
    }
    
    if (status === 'active') {
      conditions.push(and(eq(users.isActive, true), eq(users.isBlocked, false)))
    } else if (status === 'blocked') {
      conditions.push(eq(users.isBlocked, true))
    }

    // Build order by
    const orderByColumn = sortBy === 'firstName' ? users.firstName 
                        : sortBy === 'lastName' ? users.lastName
                        : sortBy === 'email' ? users.email
                        : sortBy === 'role' ? users.role
                        : users.createdAt
    
    const orderByDirection = sortOrder === 'asc' ? asc : desc

    // Fetch users with counts
    const usersData = await db.query.users.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        addresses: {
          columns: {
            id: true,
          },
        },
        _count: {
          select: {
            orders: true,
            notifications: true,
          },
        },
      },
      orderBy: [orderByDirection(orderByColumn)],
      limit,
      offset,
    })

    // Fetch statistics
    const [totalCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(conditions.length > 0 ? and(...conditions) : undefined)

    const [activeCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(and(eq(users.isActive, true), eq(users.isBlocked, false)))

    const [blockedCount] = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(eq(users.isBlocked, true))

    const statistics = {
      total: totalCount?.count || 0,
      active: activeCount?.count || 0,
      blocked: blockedCount?.count || 0,
    }

    return NextResponse.json({
      users: usersData,
      statistics,
      pagination: {
        page,
        limit,
        total: statistics.total,
        totalPages: Math.ceil(statistics.total / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Users GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// POST - Create new user
export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    const adminId = session.user.id
    
    const body = await request.json()
    const validatedData = createUserSchema.parse(body)

    // Hash password
const bcrypt = await import('bcryptjs')
    const passwordHash = await bcrypt.hash(validatedData.password, 10)

    const [newUser] = await db
      .insert(users)
      .values({
        email: validatedData.email,
        phone: validatedData.phone || null,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        role: validatedData.role,
        passwordHash,
        isActive: validatedData.isActive,
        isBlocked: !validatedData.isActive,
      })
      .returning()

    // Create notification for admin
    await db.insert(notifications).values({
      userId: adminId,
      type: 'SYSTEM',
      title: 'Yeni istifadəçi yaradıldı',
      message: `${validatedData.firstName} ${validatedData.lastName} (${validatedData.email}) uğurla yaradıldı.`,
      channel: 'APP',
    })

    return NextResponse.json({
      user: newUser,
      message: 'İstifadəçi uğurla yaradıldı',
    }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Users POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// PATCH - Update user (bulk update not supported, use individual user routes)
export async function PATCH(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const { id, ...updateData } = body
    
    if (!id) {
      return NextResponse.json({ error: 'İstifadəçi ID mütləqdir' }, { status: 400 })
    }

    const validatedData = updateUserSchema.parse(updateData)

    // Check if trying to assign SUPERADMIN role
    if (validatedData.role === 'SUPERADMIN' && session.user.role !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Siz SUPERADMIN rolu təyin edə bilməzsiniz' }, { status: 403 })
    }

    // Prevent self-role change
    if (id === session.user.id && validatedData.role && validatedData.role !== session.user.role) {
      return NextResponse.json({ error: 'Öz rolunuzu dəyişə bilməzsiniz' }, { status: 400 })
    }

    const [updatedUser] = await db
      .update(users)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (!updatedUser) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    // Create notification for admin
    await db.insert(notifications).values({
      userId: session.user.id,
      type: 'SYSTEM',
      title: 'İstifadəçi yeniləndi',
      message: `${updatedUser.firstName} ${updatedUser.lastName} (${updatedUser.email}) məlumatları yeniləndi.`,
      channel: 'APP',
    })

    return NextResponse.json({
      user: updatedUser,
      message: 'İstifadəçi uğurla yeniləndi',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Users PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// DELETE - Delete user (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json({ error: 'İstifadəçi ID mütləqdir' }, { status: 400 })
    }

    // Prevent self-deletion
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Özünüzü silə bilməzsiniz' }, { status: 400 })
    }

    const [deletedUser] = await db
      .update(users)
      .set({
        isActive: false,
        isBlocked: true,
        blockedReason: 'Silindi',
        updatedAt: new Date(),
      })
      .where(eq(users.id, id))
      .returning()

    if (!deletedUser) {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }

    // Create notification for admin
    await db.insert(notifications).values({
      userId: session.user.id,
      type: 'SYSTEM',
      title: 'İstifadəçi silindi',
      message: `${deletedUser.firstName} ${deletedUser.lastName} (${deletedUser.email}) silindi.`,
      channel: 'APP',
    })

    return NextResponse.json({
      user: deletedUser,
      message: 'İstifadəçi uğurla silindi',
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Users DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}