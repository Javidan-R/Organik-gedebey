// src/app/api/notifications/route.ts
// Admin bildirişlərini DB-dən qaytarır.

import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { notifications } from '@/lib/db/schema'
import { desc, eq } from 'drizzle-orm'
import { requireAdminAuth } from '@/lib/auth'
import { logger } from '@sentry/nextjs'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  try {
    await requireAdminAuth(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const data = await db
      .select()
      .from(notifications)
      .orderBy(desc(notifications.createdAt))
      .limit(50)

    return NextResponse.json({ notifications: data })
  } catch (err) {
    logger.error('[notifications] DB error:', { error: err })
    // DB xətasında fallback — boş array
    return NextResponse.json({ notifications: [] })
  }
}

export async function PATCH(req: NextRequest) {
  try {
    await requireAdminAuth(req)
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await req.json().catch(() => ({}))
  if (!id) return NextResponse.json({ error: 'ID tələb olunur' }, { status: 400 })

  try {
    await db.update(notifications).set({ isRead: true }).where(eq(notifications.id, id))
    return NextResponse.json({ success: true })
  } catch (err) {
    logger.error('[notifications/patch] error:', { error: err })
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
