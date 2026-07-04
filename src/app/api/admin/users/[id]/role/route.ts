// src/app/api/admin/users/[id]/role/route.ts
// Admin User Role Update API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateRoleSchema = z.object({
  role: z.enum(['CUSTOMER', 'COURIER', 'WAREHOUSE_STAFF', 'MANAGER', 'ADMIN', 'SUPERADMIN']),
  reason: z.string().optional(),
})
 
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    const adminId = session.user?.id
    const adminRole = session.user?.role
    
    const { id } = params
    const body = await request.json()
    const validatedData = updateRoleSchema.parse(body)

    // Check permissions - only SUPERADMIN can assign SUPERADMIN role
    if (validatedData.role === 'SUPERADMIN' && adminRole !== 'SUPERADMIN') {
      return NextResponse.json({ error: 'Siz SUPERADMIN rolu təyin edə bilməzsiniz' }, { status: 403 })
    }

    // Prevent self-role change
    if (id === adminId) {
      return NextResponse.json({ error: 'Öz rolunuzu dəyişə bilməzsiniz' }, { status: 400 })
    }

    // Use transaction for atomic operations
    const [updatedUser] = await db.transaction(async (tx) => {
      // Check if target user exists
      const targetUser = await (db.query as any).users.findFirst({
        where: eq(users.id, id),
      })

      if (!targetUser) {
        throw new Error('İstifadəçi tapılmadı')
      }

      const [user] = await tx
        .update(users)
        .set({
          role: validatedData.role,
          updatedAt: new Date(),
        })
        .where(eq(users.id, id))
        .returning()

      if (!user) {
        throw new Error('İstifadəçi tapılmadı')
      }

      // Create notification for the user
      await tx.insert(notifications).values({
        userId: id,
        type: 'SYSTEM',
        title: 'Rolunuz dəyişdirildi',
        message: `Yeni rolunuz: ${validatedData.role}. ${validatedData.reason || ''}`,
        channel: 'APP',
      })

      // Create notification for admin
      await tx.insert(notifications).values({
        userId: adminId,
        type: 'SYSTEM',
        title: 'İstifadəçi rolu dəyişdirildi',
        message: `${user.firstName} ${user.lastName} (${user.email}) rolu ${validatedData.role} olaraq dəyişdirildi.`,
        channel: 'APP',
      })

      return user
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: 'İstifadəçi rolu uğurla dəyişdirildi'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'İstifadəçi tapılmadı') {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }
    console.error('User role PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
