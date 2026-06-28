// src/app/api/admin/about-us/sections/route.ts
// Admin API for managing About Us sections

import { NextRequest, NextResponse } from 'next/server'

export async function GET(req: NextRequest) {
  try {
    const { db } = await import('@/lib/db')
    const { aboutUsSections } = await import('@/lib/db/schema')
    const { eq, and } = await import('drizzle-orm')

    const sections = await db
      .select()
      .from(aboutUsSections)
      .where(eq(aboutUsSections.isActive, true))
      .orderBy(aboutUsSections.displayOrder)

    return NextResponse.json(sections)
  } catch (error) {
    console.error('Error fetching about us sections:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { requireAdminAuth } = await import('@/lib/auth')
    await requireAdminAuth(req, ['ADMIN', 'SUPERADMIN', 'MANAGER'])

    const body = await req.json()
    const { db } = await import('@/lib/db')
    const { aboutUsSections } = await import('@/lib/db/schema')

    const newSection = await db
      .insert(aboutUsSections)
      .values({
        ...body,
        id: undefined,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json(newSection[0])
  } catch (error: any) {
    console.error('Error creating about us section:', error)
    if (error?.status === 401 || error?.status === 403) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    return NextResponse.json({ error: error?.message || 'Server xətası' }, { status: 500 })
  }
}
