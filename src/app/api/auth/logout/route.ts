// src/app/api/auth/logout/route.ts
// Müştəri çıxışı.

import { NextResponse } from 'next/server'
import { COOKIE_CUSTOMER } from '@/lib/auth/jwt'

export async function POST() {
  const response = NextResponse.json({ success: true })
  response.cookies.delete(COOKIE_CUSTOMER)
  return response
}
