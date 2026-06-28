// src/app/api/admin/users/bulk/route.ts
// Admin Bulk User Operations API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { users, notifications } from '@/lib/db/schema'
import { inArray } from 'drizzle-orm'
import { z } from 'zod'

const bulkActionSchema = z.object({
  action: z.enum(['block', 'unblock', 'delete', 'activate']),
  userIds: z.array(z.string().uuid()).min(1, 'Ən azı bir istifadəçi seçilməlidir'),
  reason: z.string().optional(),
})

export async function POST(request: NextRequest) {
  try {
    const session = await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    const adminId = session.user?.id
    
    const body = await request.json()
    const validatedData = bulkActionSchema.parse(body)

    let result
    let message

    // Use transaction for atomic operations
    result = await db.transaction(async (tx) => {
      let updatedUsers
      
      switch (validatedData.action) {
        case 'block':
          updatedUsers = await tx
            .update(users)
            .set({
              isBlocked: true,
              blockedReason: validatedData.reason,
              isActive: false,
              updatedAt: new Date(),
            })
            .where(inArray(users.id, validatedData.userIds))
            .returning()
          message = `${updatedUsers.length} istifadəçi bloklandı`
          break

        case 'unblock':
          updatedUsers = await tx
            .update(users)
            .set({
              isBlocked: false,
              blockedReason: null,
              isActive: true,
              updatedAt: new Date(),
            })
            .where(inArray(users.id, validatedData.userIds))
            .returning()
          message = `${updatedUsers.length} istifadəçi blokdan çıxarıldı`
          break

        case 'activate':
          updatedUsers = await tx
            .update(users)
            .set({
              isActive: true,
              updatedAt: new Date(),
            })
            .where(inArray(users.id, validatedData.userIds))
            .returning()
          message = `${updatedUsers.length} istifadəçi aktiv edildi`
          break

        case 'delete':
          // Soft delete by setting isActive to false and isBlocked to true
          updatedUsers = await tx
            .update(users)
            .set({
              isActive: false,
              isBlocked: true,
              blockedReason: 'Silindi',
              updatedAt: new Date(),
            })
            .where(inArray(users.id, validatedData.userIds))
            .returning()
          message = `${updatedUsers.length} istifadəçi silindi`
          break

        default:
          throw new Error('Dəstəklənməyən əməliyyat')
      }

      // Create notifications for affected users
      if (validatedData.action === 'block' || validatedData.action === 'unblock') {
        const notificationValues = validatedData.userIds.map(userId => ({
          userId,
          type: 'SYSTEM' as const,
          title: validatedData.action === 'block' ? 'Hesabınız bloklandı' : 'Hesabınız aktiv edildi',
          message: validatedData.action === 'block'
            ? `Hesabınız bloklanıb. Səbəb: ${validatedData.reason || 'Bilinməyən'}`
            : 'Hesabınız yenidən aktiv edildi.',
          channel: 'APP' as const,
        }))
        await tx.insert(notifications).values(notificationValues)
      }

      // Create notification for admin
      await tx.insert(notifications).values({
        userId: adminId,
        type: 'SYSTEM' as const,
        title: 'Kütləvi əməliyyat tamamlandı',
        message: `${message}.`,
        channel: 'APP' as const,
      })

      return updatedUsers
    })

    return NextResponse.json({ 
      affectedUsers: result,
      message
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Bulk users POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
