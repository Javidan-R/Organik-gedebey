import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'

export async function POST(req: NextRequest) {
  try {
    const { email, password, firstName, lastName, phone } = await req.json()

    // Validasiya
    if (!email || !password || !firstName || !lastName) {
      return NextResponse.json(
        { error: 'Bütün məcburi xanaları doldurun' },
        { status: 400 }
      )
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: 'Şifrə ən azı 6 simvol olmalıdır' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: 'Düzgün email ünvanı daxil edin' },
        { status: 400 }
      )
    }

    // Email unikallığını yoxla
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (existingUser) {
      return NextResponse.json(
        { error: 'Bu email artıq qeydiyyatdan keçib' },
        { status: 409 }
      )
    }

    // Telefon unikallığını yoxla
    if (phone) {
      const [existingPhone] = await db
        .select({ id: users.id })
        .from(users)
        .where(eq(users.phone, phone))
        .limit(1)

      if (existingPhone) {
        return NextResponse.json(
          { error: 'Bu telefon nömrəsi artıq qeydiyyatdan keçib' },
          { status: 409 }
        )
      }
    }

    // Şifrəni hash-lə
    const passwordHash = await bcrypt.hash(password, 12)

    // İstifadəçini yarat
    const [newUser] = await db
      .insert(users)
      .values({
        email: email.toLowerCase().trim(),
        passwordHash,
        firstName,
        lastName,
        phone: phone || null,
        role: 'CUSTOMER',
        isEmailVerified: false,
        isActive: true,
      })
      .returning()

    // Cavab hazırla
    const userData = {
      id: newUser.id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      role: newUser.role,
      phone: newUser.phone,
    }

    const response = NextResponse.json({
      success: true,
      message: 'Qeydiyyat uğurla tamamlandı',
      user: userData,
    }, { status: 201 })

    // Cookie set et
    response.cookies.set('og_auth', JSON.stringify({
      id: newUser.id,
      email: newUser.email,
      role: newUser.role,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response

  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    )
  }
}