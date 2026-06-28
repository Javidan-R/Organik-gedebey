import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users, adminLogs } from '@/lib/db/schema'
import { eq, inArray } from 'drizzle-orm'

// POST /api/admin/users/bulk - Bulk operations on users
export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { action, userIds, adminId, data } = body

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      return NextResponse.json({ error: 'İstifadəçi ID-ləri tələb olunur' }, { status: 400 })
    }

    let result

    switch (action) {
      case 'block':
        result = await db.update(users)
          .set({
            isBlocked: true,
            blockedReason: data?.reason || 'Toplu bloklama',
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      case 'unblock':
        result = await db.update(users)
          .set({
            isBlocked: false,
            blockedReason: null,
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      case 'activate':
        result = await db.update(users)
          .set({
            isActive: true,
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      case 'deactivate':
        result = await db.update(users)
          .set({
            isActive: false,
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      case 'changeRole':
        if (!data?.role) {
          return NextResponse.json({ error: 'Rol tələb olunur' }, { status: 400 })
        }
        result = await db.update(users)
          .set({
            role: data.role,
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      case 'delete':
        result = await db.update(users)
          .set({
            isActive: false,
            isBlocked: true,
            blockedReason: 'Toplu silinmə',
            updatedAt: new Date()
          })
          .where(inArray(users.id, userIds))
          .returning()
        break

      default:
        return NextResponse.json({ error: 'Yanlış əməliyyat növü' }, { status: 400 })
    }

    // Log admin action
    await db.insert(adminLogs).values({
      userId: adminId || userIds[0],
      action: `BULK_${action.toUpperCase()}_USERS`,
      entityType: 'USER',
      entityId: userIds[0],
      details: { 
        affectedUsers: userIds.length,
        userIds 
      }
    })

    return NextResponse.json({
      success: true,
      message: `${userIds.length} istifadəçi üzərində əməliyyat uğurla yerinə yetirildi`,
      affectedCount: result.length
    })
  } catch (error) {
    console.error('POST /api/admin/users/bulk error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
