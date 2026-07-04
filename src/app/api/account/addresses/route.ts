// src/app/api/account/addresses/route.ts
// İstifadəçinin ünvanları
 
import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'
import { db } from '@/lib/db'
import { addresses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function GET(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userAddresses = await db.query.addresses.findMany({
      where: eq(addresses.userId, payload.sub),
    })

    return NextResponse.json({ addresses: userAddresses })
  } catch (error) {
    console.error('[account/addresses] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const cookie = req.cookies.get(COOKIE_CUSTOMER)
    if (!cookie?.value) {
      return NextResponse.json({ error: 'Auth required' }, { status: 401 })
    }

    const payload = await verifyCustomerToken(cookie.value)
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const body = await req.json()
    const { title, fullName, phone, address, city, isDefault } = body

    if (!address || !city) {
      return NextResponse.json({ error: 'Ünvan və şəhər tələb olunur' }, { status: 400 })
    }

    const [newAddress] = await db
      .insert(addresses)
      .values({
        userId: payload.sub,
        title: title || 'Ev',
        fullName: fullName || '',
        phone: phone || '',
        address,
        city,
        isDefault: isDefault || false,
      })
      .returning()

    return NextResponse.json({ address: newAddress }, { status: 201 })
  } catch (error) {
    console.error('[account/addresses] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
