// src/app/api/auth/login/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    console.log('🔑 Login cəhdi:', email)

    // Validasiya
    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email və şifrə tələb olunur' },
        { status: 400 }
      )
    }

    // İstifadəçini database-dən tap
    const userList = await db
      .select()
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    const user = userList[0]
    console.log('👤 İstifadəçi:', user ? 'tapıldı' : 'tapılmadı')

    if (!user) {
      return NextResponse.json(
        { error: 'Email və ya şifrə yanlışdır' },
        { status: 401 }
      )
    }

    // Aktivlik yoxlaması
    if (user.isBlocked) {
      return NextResponse.json(
        { error: 'Hesabınız bloklanıb' },
        { status: 403 }
      )
    }

    // Şifrə yoxlaması
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash)
    console.log('🔐 Şifrə:', isPasswordValid ? 'doğrudur' : 'yanlışdır')

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: 'Email və ya şifrə yanlışdır' },
        { status: 401 }
      )
    }

    // Son giriş vaxtını yenilə
    await db
      .update(users)
      .set({ lastLoginAt: new Date() })
      .where(eq(users.id, user.id))

    const userData = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: user.role,
      phone: user.phone,
    }

    console.log('✅ Login uğurlu:', user.email, user.role)

    const response = NextResponse.json({
      success: true,
      message: 'Uğurla daxil oldunuz',
      user: userData,
    })

    // Auth cookie
    response.cookies.set('og_auth', JSON.stringify(userData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    // Admin cookie
    if (user.role === 'ADMIN' || user.role === 'MANAGER' || user.role === 'WAREHOUSE_STAFF') {
      response.cookies.set('og_admin', 'ok', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24,
      })
    }

    return response

  } catch (error) {
    console.error('❌ Login xətası:', error)
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    )
  }
}