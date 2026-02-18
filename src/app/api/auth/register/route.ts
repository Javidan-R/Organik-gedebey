// app/api/auth/register/route.ts
import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import bcrypt from "bcryptjs"
import { z } from "zod"

const registerSchema = z.object({
  email: z.string().email("Düzgün email daxil edin"),
  password: z.string().min(8, "Şifrə minimum 8 simvol olmalıdır"),
  firstName: z.string().min(2, "Ad minimum 2 simvol olmalıdır"),
  lastName: z.string().min(2, "Soyad minimum 2 simvol olmalıdır"),
  phone: z.string().optional()
})

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const validatedData = registerSchema.parse(body)

    // Check if user exists
    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [
          { email: validatedData.email },
          ...(validatedData.phone ? [{ phone: validatedData.phone }] : [])
        ]
      }
    })

    if (existingUser) {
      return NextResponse.json(
        { error: "Bu email və ya telefon artıq qeydiyyatdan keçib" },
        { status: 400 }
      )
    }

    // Hash password
    const password_hash = await bcrypt.hash(validatedData.password, 10)

    // Create user
    const user = await prisma.user.create({
      data: {
        email: validatedData.email,
        password_hash,
        first_name: validatedData.firstName,
        last_name: validatedData.lastName,
        phone: validatedData.phone,
        role: "CUSTOMER"
      },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true
      }
    })

    return NextResponse.json({
      message: "Qeydiyyat uğurla tamamlandı",
      user
    }, { status: 201 })

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validasiya xətası", details: error.errors },
        { status: 400 }
      )
    }

    console.error("Registration error:", error)
    return NextResponse.json(
      { error: "Qeydiyyat zamanı xəta baş verdi" },
      { status: 500 }
    )
  }
}