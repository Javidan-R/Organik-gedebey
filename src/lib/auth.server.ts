'use server'
 
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import { signAdminToken, verifyAdminToken, COOKIE_ADMIN } from '@/lib/auth/jwt'
import { adminCookieOptions } from '@/lib/auth/server'
import { logger } from '@/lib/logger'

export async function setAdminSession(userId: string, email: string, name: string, role: string): Promise<NextResponse> {
  try {
    const token = await signAdminToken({ sub: userId, email, name, role: role as any })
    const res = NextResponse.json({ ok: true })
    res.cookies.set(COOKIE_ADMIN, token, adminCookieOptions)
    return res
  } catch (error) {
    logger.error('Failed to set admin session', { error })
    return NextResponse.json({ error: 'Failed to create session' }, { status: 500 })
  }
}

export async function clearAdminSession(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_ADMIN)
  return res
}

export async function isAdminServer(): Promise<boolean> {
  try {
    const c = await cookies()
    const token = c.get(COOKIE_ADMIN)?.value
    if (!token) return false
    
    const payload = await verifyAdminToken(token)
    return payload !== null
  } catch (error) {
    logger.error('Admin session verification failed', { error })
    return false
  }
}
