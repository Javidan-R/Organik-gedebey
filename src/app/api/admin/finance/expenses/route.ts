// src/app/api/admin/finance/expenses/route.ts
// Admin Finance Expenses API

import { NextRequest, NextResponse } from 'next/server'
import { requireAuth, AuthError } from '@/lib/auth'
import { db } from '@/lib/db'
import { expenses } from '@/lib/db/schema'
import { eq, gte, lte, sql, desc, and, like } from 'drizzle-orm'
import { z } from 'zod'

const createExpenseSchema = z.object({
  category: z.enum(['SUPPLIES', 'DELIVERY', 'RENT', 'UTILITIES', 'SALARIES', 'MARKETING', 'OTHER']),
  description: z.string().min(5, 'Təsvir ən az 5 simvol olmalıdır'),
  amount: z.string().min(1, 'Məbləğ tələb olunur'),
  date: z.string().optional(),
  paymentMethod: z.string().optional(),
  receiptUrl: z.string().url().optional().or(z.literal('')),
})

export async function GET(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const category = searchParams.get('category')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const search = searchParams.get('search')

    const conditions: any[] = []
    if (category) conditions.push(eq(expenses.category, category as any))
    if (dateFrom) conditions.push(gte(expenses.date, new Date(dateFrom)))
    if (dateTo) {
      const endDate = new Date(dateTo)
      endDate.setHours(23, 59, 59, 999)
      conditions.push(lte(expenses.date, endDate))
    }
    if (search) {
      conditions.push(like(expenses.description, `%${search}%`))
    }

    const offset = (page - 1) * limit

    const expensesData = await (db.query as any).expenses.findMany({
      where: conditions.length > 0 ? and(...conditions) : undefined,
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
      orderBy: [desc(expenses.date)],
      limit,
      offset,
    })

    const totalResult = await db
      .select({ count: sql<number>`count(*)` })
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
    const count = Number(totalResult[0]?.count ?? 0)

    // Calculate totals by category
    const categoryTotals = await db
      .select({
        category: expenses.category,
        total: sql<string>`COALESCE(SUM(CAST(${expenses.amount} AS DECIMAL)), '0')`,
        count: sql<number>`COUNT(*)`,
      })
      .from(expenses)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .groupBy(expenses.category)

    return NextResponse.json({
      expenses: expensesData,
      pagination: {
        page,
        limit,
        total: count,
        totalPages: Math.ceil(count / limit),
      },
      categoryTotals,
    })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Finance expenses GET error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    
    const session = await requireAuth(request, ['ADMIN', 'MANAGER', 'SUPERADMIN'])
    const userId = session.user?.id

    const body = await request.json()
    const validatedData = createExpenseSchema.parse(body)

    const [newExpense] = await db
      .insert(expenses)
      .values({
        category: validatedData.category as any,
        description: validatedData.description,
        amount: validatedData.amount,
        date: validatedData.date ? new Date(validatedData.date) : new Date(),
        paymentMethod: validatedData.paymentMethod,
        receiptUrl: validatedData.receiptUrl || null,
        createdBy: userId,
      })
      .returning()

    return NextResponse.json({ expense: newExpense }, { status: 201 })
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Validasiya xətası', details: error.issues }, { status: 400 })
    }
    console.error('Finance expenses POST error:', error)
    return NextResponse.json({ error: 'Server xətası' }, { status: 500 })
  }
}
