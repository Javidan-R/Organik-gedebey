// src/app/api/admin/logs/route.ts
// Admin Logs API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { adminLogs, users } from '@/lib/db/schema'
import { eq, desc, and, like, gte, lte, sql } from 'drizzle-orm'

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const userId = searchParams.get('userId')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')

    const conditions: any[] = []
    
    if (action) {
      conditions.push(like(adminLogs.action, `%${action}%`))
    }
    
    if (entityType) {
      conditions.push(eq(adminLogs.entityType, entityType))
    }
    
    if (userId) {
      conditions.push(eq(adminLogs.userId, userId))
    }
    
    if (dateFrom) {
      conditions.push(gte(adminLogs.createdAt, new Date(dateFrom)))
    }
    
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(adminLogs.createdAt, endDate))
    }

    const offset = (page - 1) * limit

    const logsData = await (db.query as any).adminLogs.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      with: {
        user: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            role: true,
          },
        },
      },
      orderBy: [desc(adminLogs.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql`count(*)` })
      .from(adminLogs)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      logs: logsData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Admin logs GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
