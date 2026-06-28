// src/app/api/admin/settings/route.ts
// Admin Settings API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { settings } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateSettingsSchema = z.object({
  siteName: z.string().optional(),
  siteDescription: z.string().optional(),
  contactEmail: z.string().email().optional(),
  contactPhone: z.string().optional(),
  socialLinks: z.record(z.string(), z.string()).optional(),
  deliverySettings: z.object({
    freeDeliveryThreshold: z.string().optional(),
    deliveryFee: z.string().optional(),
    deliveryZones: z.array(z.any()).optional(),
  }).optional(),
  paymentSettings: z.object({
    cashOnDelivery: z.boolean().optional(),
    cardPayment: z.boolean().optional(),
    bankTransfer: z.boolean().optional(),
  }).optional(),
  notificationSettings: z.object({
    emailNotifications: z.boolean().optional(),
    smsNotifications: z.boolean().optional(),
    pushNotifications: z.boolean().optional(),
  }).optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    // Get all settings
    const allSettings = await (db.query as any).settings.findMany()

    // Convert to key-value object
    const settingsObj = allSettings.reduce((acc: Record<string, any>, setting: any) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json({ settings: settingsObj })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Settings GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const validatedData = updateSettingsSchema.parse(body)

    // Update or insert settings
    const updates = Object.entries(validatedData).map(async ([key, value]) => {
      const existing = await (db.query as any).settings.findFirst({
        where: eq(settings.key, key),
      })

      if (existing) {
        return db
          .update(settings)
          .set({ value, updatedAt: new Date() })
          .where(eq(settings.key, key))
      } else {
        return db
          .insert(settings)
          .values({ key, value, updatedAt: new Date() })
      }
    })

    await Promise.all(updates)

    return NextResponse.json({ message: 'Tənzimləmələr uğurla yeniləndi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Settings POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
