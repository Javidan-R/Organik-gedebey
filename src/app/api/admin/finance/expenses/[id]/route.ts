// src/app/api/admin/finance/expenses/[id]/route.ts
// Admin Finance Expense Details API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { z } from 'zod'
 
const updateExpenseSchema = z.object({
  category: z.enum(['SUPPLIES', 'DELIVERY', 'RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'OTHER']).optional(),
  description: z.string().min(5).optional(),
  amount: z.string().min(1).optional(),
  date: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
  notes: z.string().optional(),
})

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { id } = params

    const expense = await (db.query as any).expenses.findFirst({
      where: eq(expenses.id, id),
      with: {
        createdByUser: {
          columns: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    })

    if (!expense) {
      return NextResponse.json({ error: 'Xərc tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ expense })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance expense GET error:', error)
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
    const validatedData = updateExpenseSchema.parse(body)

    const updateData: any = {
      ...validatedData,
      updatedAt: new Date(),
    }

    if (validatedData.date) {
      updateData.date = new Date(validatedData.date)
    }

    const [updatedExpense] = await db
      .update(expenses)
      .set(updateData)
      .where(eq(expenses.id, id))
      .returning()

    if (!updatedExpense) {
      return NextResponse.json({ error: 'Xərc tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ expense: updatedExpense })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Finance expense PATCH error:', error)
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

    const [deletedExpense] = await db
      .delete(expenses)
      .where(eq(expenses.id, id))
      .returning()

    if (!deletedExpense) {
      return NextResponse.json({ error: 'Xərc tapılmadı' }, { status: 404 })
    }

    return NextResponse.json({ message: 'Xərc uğurla silindi' })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance expense DELETE error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
