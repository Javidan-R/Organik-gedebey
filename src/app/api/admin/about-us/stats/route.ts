// src/app/api/admin/about-us/stats/route.ts
// Admin API for managing About Us stats

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const { aboutUsStats } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const stats = await db
      .select()
      .from(aboutUsStats)
      .where(eq(aboutUsStats.isActive, true))
      .orderBy(aboutUsStats.displayOrder)

    return NextResponse.json(stats)
  } catch (error) {
    console.error('Error fetching about us stats:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { requireAdminAuth } = await import('@/lib/auth')
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER'])

    const body = await req.json()
    const { db } = await import('@/lib/db')
    const { aboutUsStats } = await import('@/lib/db/schema')

    const newStat = await db
      .insert(aboutUsStats)
      .values({
        ...body,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newStat[0])
  } catch (error: any) {
    console.error('Error creating about us stat:', error)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || 'Server xətası' }, { status: 500 })
  }
}
