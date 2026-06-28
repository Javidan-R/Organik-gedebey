// src/app/api/account/social/route.ts
// İstifadəçi sosial media əlaqələri

import { NextRequest, NextResponse } from 'next/server'
import { verifyCustomerToken, COOKIE_CUSTOMER } from '@/lib/auth/jwt'

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

    // TODO: Social media connections implementasiyası
    return NextResponse.json({
      social: {
        connected: [],
        available: ['google', 'facebook', 'instagram'],
      },
    })
  } catch (error) {
    console.error('[account/social] error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
