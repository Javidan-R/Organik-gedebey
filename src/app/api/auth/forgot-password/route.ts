import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { users } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email tələb olunur' },
        { status: 400 }
      )
    }

    // İstifadəçini tap
    const [user] = await db
      .select({ id: users.id, email: users.email, firstName: users.firstName })
      .from(users)
      .where(eq(users.email, email.toLowerCase().trim()))
      .limit(1)

    if (!user) {
      // Təhlükəsizlik üçün eyni mesajı qaytar
      return NextResponse.json({
        success: true,
        message: 'Əgər bu email sistemdə mövcuddursa, şifrə bərpası linki göndəriləcək',
      })
    }

    // TODO: Real email göndərişi
    // resetToken yarat, email göndər
    
    console.log(`Password reset requested for: ${user.email} (${user.id})`)

    return NextResponse.json({
      success: true,
      message: 'Şifrə bərpası linki emailinizə göndərildi',
    })

  } catch (error) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Server xətası baş verdi' },
      { status: 500 }
    )
  }
}