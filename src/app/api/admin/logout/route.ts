// src/app/api/admin/logout/route.ts
// Admin Logout API

import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { COOKIE_ADMIN } from '@/lib/auth/jwt'

export async function POST() {
  try {
    const cookieStore = await cookies()
    
    // Clear the admin cookie
    cookieStore.delete(COOKIE_ADMIN)
    
    return NextResponse.json({ 
      message: 'Uğurla çıxış edildi',
      success: true 
    })
  } catch (error) {
    console.error('Admin logout error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
