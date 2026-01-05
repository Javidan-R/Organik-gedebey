'use server'

import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

const COOKIE_NAME = 'og_admin'

export async function setAdminSession(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true })
  res.cookies.set(COOKIE_NAME, 'ok', {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 8,
  })
  return res
}

export async function clearAdminSession(): Promise<NextResponse> {
  const res = NextResponse.json({ ok: true })
  res.cookies.delete(COOKIE_NAME)
  return res
}

export async function isAdminServer(): Promise<boolean> {
  const c = await cookies()
  return c.get(COOKIE_NAME)?.value === 'ok'
}
