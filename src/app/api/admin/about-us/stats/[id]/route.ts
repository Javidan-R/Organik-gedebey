// src/app/api/admin/about-us/stats/[id]/route.ts
// Admin API for managing individual About Us stats

import { NextRequest, NextResponse } from 'next/server'

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { requireAdminAuth } = await import('@/lib/auth')
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER'])

    const body = await req.json()
    const { db } = await import('@/lib/db')
    const { aboutUsStats } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const updated = await db
      .update(aboutUsStats)
      .set({
        ...body,
        id: undefined,
        updatedAt: new Date(),
      })
      .where(eq(aboutUsStats.id, params.id))
      .returning()

    if (!updated[0]) {
      return NextResponse.json({ error: 'Statistika tapılmadı' }, { status: 404 })
    }

    return NextResponse.json(updated[0])
  } catch (error: any) {
    console.error('Error updating about us stat:', error)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { requireAdminAuth } = await import('@/lib/auth')
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER'])

    const { db } = await import('@/lib/db')
    const { aboutUsStats } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    await db.delete(aboutUsStats).where(eq(aboutUsStats.id, params.id))

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting about us stat:', error)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || 'Server xətası' }, { status: 500 })
  }
}
