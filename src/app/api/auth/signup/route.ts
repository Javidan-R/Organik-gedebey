// app/api/auth/signup/route.ts
import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, phone } = await req.json()

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Bütün xanaları doldurun' }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: 'Şifrə ən azı 6 simvol olmalıdır' }, { status: 400 })
    }

    // Mock: Check if user exists
    // In production: Check database

    const userId = Math.random().toString(36).slice(2)
    
    const response = NextResponse.json({
      user: { id: userId, email, name, role: 'customer' },
      message: 'Qeydiyyat uğurlu oldu'
    })

    response.cookies.set('og_auth', JSON.stringify({ email, role: 'customer' }), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7,
    })

    return response
  } catch (error) {
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// app/api/auth/logout/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// import { NextResponse } from 'next/server'
// 
// export async function POST() {
//   const response = NextResponse.json({ message: 'Uğurla çıxış edildi' })
//   response.cookies.delete('og_auth')
//   return response
// }

// ═══════════════════════════════════════════════════════════════════════════
// app/api/auth/me/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// import { NextRequest, NextResponse } from 'next/server'
// 
// export async function GET(req: NextRequest) {
//   const cookie = req.cookies.get('og_auth')
//   
//   if (!cookie) {
//     return NextResponse.json({ user: null }, { status: 401 })
//   }
// 
//   try {
//     const auth = JSON.parse(cookie.value)
//     return NextResponse.json({
//       user: {
//         id: Math.random().toString(36).slice(2),
//         email: auth.email,
//         role: auth.role,
//         name: auth.email.split('@')[0],
//       }
//     })
//   } catch {
//     return NextResponse.json({ user: null }, { status: 401 })
//   }
// }

// ═══════════════════════════════════════════════════════════════════════════
// app/api/auth/forgot-password/route.ts
// ═══════════════════════════════════════════════════════════════════════════
// import { NextRequest, NextResponse } from 'next/server'
// 
// export async function POST(req: NextRequest) {
//   try {
//     const { email } = await req.json()
// 
//     if (!email) {
//       return NextResponse.json({ error: 'Email tələb olunur' }, { status: 400 })
//     }
// 
//     // Mock: Send reset email
//     // In production: Generate token, send email with reset link
//     
//     return NextResponse.json({
//       message: 'Şifrə bərpası linki emailinizə göndərildi'
//     })
//   } catch (error) {
//     return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
//   }
// }