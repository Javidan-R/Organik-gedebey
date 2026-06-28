// src/app/api/admin/users/[id]/block/route.ts
// Admin User Block/Unblock API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, notifications } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const blockUserSchema = z.object({
  isBlocked: z.boolean(),
  reason: z.string().optional(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    const adminId = session.user?.id
    
    const { id } = params
    const body = await request.json()
    const validatedData = blockUserSchema.parse(body)

    // Use transaction for atomic operations
    const [updatedUser] = await db.transaction(async (tx) => {
      const [user] = await tx
        .update(users)
        .set({
          isBlocked: validatedData.isBlocked,
          blockedReason: validatedData.isBlocked ? validatedData.reason : null,
          isActive: !validatedData.isBlocked,
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
        title: validatedData.isBlocked ? 'Hesabınız bloklandı' : 'Hesabınız aktiv edildi',
        message: validatedData.isBlocked
          ? `Hesabınız bloklanıb. Səbəb: ${validatedData.reason || 'Bilinməyən'}`
          : 'Hesabınız yenidən aktiv edildi.',
        channel: 'APP',
      })

      // Create notification for admin
      await tx.insert(notifications).values({
        userId: adminId,
        type: 'SYSTEM',
        title: validatedData.isBlocked ? 'İstifadəçi bloklandı' : 'İstifadəçi aktiv edildi',
        message: `${user.firstName} ${user.lastName} (${user.email}) ${validatedData.isBlocked ? 'bloklandı' : 'aktiv edildi'}.`,
        channel: 'APP',
      })

      return user
    })

    return NextResponse.json({ 
      user: updatedUser,
      message: validatedData.isBlocked ? 'İstifadəçi uğurla bloklandı' : 'İstifadəçi uğurla aktiv edildi'
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.errors }, { status: 400 })
    }
    if (error instanceof Error && error.message === 'İstifadəçi tapılmadı') {
      return NextResponse.json({ error: 'İstifadəçi tapılmadı' }, { status: 404 })
    }
    console.error('User block POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
