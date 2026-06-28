// src/app/api/admin/finance/accounts/route.ts
// Admin Finance Accounts API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq, sql, desc, and } from 'drizzle-orm'
import { z } from 'zod'

const createAccountSchema = z.object({
  name: z.string().min(2, 'Ad ən az 2 simvol olmalıdır'),
  accountNumber: z.string().min(4, 'Hesab nömrəsi tələb olunur'),
  bankName: z.string().min(2, 'Bank adı tələb olunur'),
  accountType: z.enum(['CHECKING', 'SAVINGS', 'CREDIT']),
  balance: z.string().default('0'),
  currency: z.string().default('AZN'),
  isActive: z.boolean().default(true),
  notes: z.string().optional(),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const isActive = searchParams.get('isActive')
    const accountType = searchParams.get('accountType')

    const conditions = []
    if (isActive !== null) conditions.push(eq(expenses.category, isActive === 'true' ? 'SUPPLIES' : 'OTHER' as any))
    if (accountType) conditions.push(eq(expenses.category, accountType as any))

    const offset = (page - 1) * limit

    // Since we don't have a dedicated accounts table, we'll use expenses as a placeholder
    // In a real implementation, you'd have an accounts table
    const accountsData = await (db.query as any).expenses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
      orderBy: [desc(expenses.createdAt)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    return NextResponse.json({
      accounts: accountsData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance accounts GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'SUPERADMIN'])
    
    const body = await request.json()
    const validatedData = createAccountSchema.parse(body)

    // Placeholder implementation - in real app, use accounts table
    const [newAccount] = await db
      .insert(expenses)
      .values({
        category: 'SUPPLIES',
        description: validatedData.name,
        amount: validatedData.balance,
        date: new Date(),
        paymentMethod: validatedData.accountType,
        receiptUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning()

    return NextResponse.json({ account: newAccount }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Finance accounts POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
