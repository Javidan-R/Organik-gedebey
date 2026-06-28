// src/app/api/admin/about-us/regions/route.ts
// Admin API for managing About Us regions

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const { aboutUsRegions } = await import('@/lib/db/schema')
    const { eq } = await import('drizzle-orm')

    const regions = await db
      .select()
      .from(aboutUsRegions)
      .where(eq(aboutUsRegions.isActive, true))
      .orderBy(aboutUsRegions.displayOrder)

    return NextResponse.json(regions)
  } catch (error) {
    console.error('Error fetching about us regions:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { requireAdminAuth } = await import('@/lib/auth')
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER'])

    const body = await req.json()
    const { db } = await import('@/lib/db')
    const { aboutUsRegions } = await import('@/lib/db/schema')

    const newRegion = await db
      .insert(aboutUsRegions)
      .values({
        ...body,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newRegion[0])
  } catch (error: any) {
    console.error('Error creating about us region:', error)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || 'Server xətası' }, { status: 500 })
  }
}
