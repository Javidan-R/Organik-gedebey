// src/app/api/account/addresses/[id]/route.ts
// User Address Details API

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { addresses, users } from '@/lib/db/schema'
import { eq, and } from 'drizzle-orm'
import { z } from 'zod'

const updateAddressSchema = z.object({
  type: z.enum(['HOME', 'WORK', 'OTHER']).optional(),
  label: z.string().optional(),
  fullName: z.string().min(2).optional(),
  phone: z.string().min(9).optional(),
  city: z.string().min(2).optional(),
  district: z.string().optional(),
  street: z.string().min(5).optional(),
  building: z.string().optional(),
  apartment: z.string().optional(),
  floor: z.string().optional(),
  postalCode: z.string().optional(),
  latitude: z.string().optional(),
  longitude: z.string().optional(),
  notes: z.string().optional(),
  isDefault: z.boolean().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookie = request.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = params

    const address = await db.query.addresses.findFirst({
      where: and(
        eq(addresses.id, id),
        eq(addresses.userId, payload.sub)
      ),
    })

    if (!address) {
      return NextResponse.json({ error: 'Ünvan tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ address })
  } catch (error) {
    console.error('[account/addresses/[id]] GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookie = request.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = params
    const body = await request.json()
    const validatedData = updateAddressSchema.parse(body)

    // If setting as default, unset other default addresses
    if (validatedData.isDefault) {
      await db
        .update(addresses)
        .set({ isDefault: false, updatedAt: new Date() })
        .where(and(
          eq(addresses.userId, payload.sub),
          eq(addresses.isDefault, true)
        ))
    }

    const [updatedAddress] = await db
      .update(addresses)
      .set({
        ...validatedData,
        updatedAt: new Date(),
      })
      .where(and(
        eq(addresses.id, id),
        eq(addresses.userId, payload.sub)
      ))
      .returning()

    if (!updatedAddress) {
      return NextResponse.json({ error: 'Ünvan tapılmadı' }, { status: 404 })
    }

    // If set as default, update user's default address
    if (validatedData.isDefault) {
      await db
        .update(users)
        .set({ defaultAddressId: id, updatedAt: new Date() })
        .where(eq(users.id, payload.sub))
    }

    return NextResponse.json({ address: updatedAddress })
  } catch (error) {
    console.error('[account/addresses/[id]] PATCH error:', error)
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.errors }, { status: 400 })
    }
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const cookie = request.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const { id } = params

    const [deletedAddress] = await db
      .delete(addresses)
      .where(and(
        eq(addresses.id, id),
        eq(addresses.userId, payload.sub)
      ))
      .returning()

    if (!deletedAddress) {
      return NextResponse.json({ error: 'Ünvan tapılmadı' }, { status: 404 })
    }

    // If this was the default address, update user's default address
    if (deletedAddress.isDefault) {
      const otherAddresses = await db.query.addresses.findMany({
        where: eq(addresses.userId, payload.sub),
        limit: 1,
      })

      if (otherAddresses.length > 0) {
        await db
          .update(users)
          .set({ defaultAddressId: otherAddresses[0].id, updatedAt: new Date() })
          .where(eq(users.id, payload.sub))
      } else {
        await db
          .update(users)
          .set({ defaultAddressId: null, updatedAt: new Date() })
          .where(eq(users.id, payload.sub))
      }
    }

    return NextResponse.json({ message: 'Ünvan uğurla silindi' })
  } catch (error) {
    console.error('[account/addresses/[id]] DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
