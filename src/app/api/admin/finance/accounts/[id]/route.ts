// src/app/api/admin/finance/accounts/[id]/route.ts
// Admin Finance Account Details API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'

const updateAccountSchema = z.object({
  name: z.string().min(2).optional(),
  accountNumber: z.string().min(4).optional(),
  bankName: z.string().min(2).optional(),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'CREDIT']).optional(),
  balance: z.string().optional(),
  currency: z.string().optional(),
  isActive: z.boolean().optional(),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params

    const account = await (db.query as any).expenses.findFirst({
      where: eq(expenses.id, id),
    })

    if (!account) {
      return NextResponse.json({ error: 'Hesab tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ account })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance account GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { id } = params
    const body = await request.json()
    const validatedData = updateAccountSchema.parse(body)

    const [updatedAccount] = await db
      .update(expenses)
      .set({
        ...validatedData,
        description: validatedData.name,
        amount: validatedData.balance,
        paymentMethod: validatedData.accountType,
        updatedAt: new Date(),
      })
      .where(eq(expenses.id, id))
      .returning()

    if (!updatedAccount) {
      return NextResponse.json({ error: 'Hesab tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ account: updatedAccount })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Finance account PATCH error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const { id } = params

    const [deletedAccount] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning()

    if (!deletedAccount) {
      return NextResponse.json({ error: 'Hesab tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Hesab uğurla silindi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance account DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
