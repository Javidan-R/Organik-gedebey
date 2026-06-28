// src/app/api/admin/users/export/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { orders, users } from '@/lib/db/schema'
import { like, or, and, eq, gte, lte, sql } from 'drizzle-orm'
import { parse } from 'json2csv' // npm i json2csv

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const search = searchParams.get('search') || ''
  const role = searchParams.get('role') || ''
  const status = searchParams.get('status') || ''
  const minOrders = searchParams.get('minOrders')
  const dateFrom = searchParams.get('dateFrom')
  const dateTo = searchParams.get('dateTo')
  const sortBy = searchParams.get('sortBy') || 'createdAt'
  const sortOrder = searchParams.get('sortOrder') || 'desc'

  // Sorgu qur
  let query = db.select().from(users).$dynamic()
  const conditions = []

  if (search) {
    conditions.push(or(like(users.email, `%${search}%`), like(users.phone, `%${search}%`), like(users.firstName, `%${search}%`), like(users.lastName, `%${search}%`)))
  }
  if (role) conditions.push(eq(users.role, role as any))
  if (status === 'active') conditions.push(and(eq(users.isActive, true), eq(users.isBlocked, false)))
  if (status === 'blocked') conditions.push(eq(users.isBlocked, true))
  if (dateFrom) conditions.push(gte(users.createdAt, new Date(dateFrom)))
  if (dateTo) conditions.push(lte(users.createdAt, new Date(dateTo)))

  if (conditions.length) query = query.where(and(...conditions))

  // Sıralama
  const order = sortOrder === 'asc' ? sql`ASC` : sql`DESC`
  query = query.orderBy(sql`${sql.identifier(sortBy)} ${order}`)

  const usersData = await query

  // Hər istifadəçi üçün sifariş sayını əlavə et
  const usersWithOrders = await Promise.all(usersData.map(async (user) => {
    const [orderCount] = await db.select({ count: sql<number>`count(*)` }).from(orders).where(eq(orders.userId, user.id))
    return { ...user, orderCount: orderCount?.count || 0 }
  }))

  const csv = parse(usersWithOrders, { fields: ['id', 'firstName', 'lastName', 'email', 'phone', 'role', 'isBlocked', 'createdAt', 'orderCount'] })
  return new NextResponse(csv, {
    headers: { 'Content-Type': 'text/csv', 'Content-Disposition': 'attachment; filename=users.csv' }
  })
}