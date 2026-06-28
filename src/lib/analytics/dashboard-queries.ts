import { db } from '@/lib/db'
import { orders, orderItems, users } from '@/lib/db/schema'
import { and, count, desc, eq, gte, notInArray, sql } from 'drizzle-orm'

const EXCLUDED_STATUSES = ['CANCELLED', 'REFUNDED'] as const

function startOfDay(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), d.getDate())
}

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getAdminDashboardStats() {
  const now = new Date()
  const today = startOfDay(now)
  const monthStart = startOfMonth(now)
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

  const revenueFilter = notInArray(orders.status, [...EXCLUDED_STATUSES])

  const [[todayRow], [monthRow], [customerRow], [pendingRow]] = await Promise.all([
    db
      .select({
        orders: count(),
        revenue: sql<string>`coalesce(sum(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, today), revenueFilter)),

    db
      .select({
        orders: count(),
        revenue: sql<string>`coalesce(sum(${orders.total}::numeric), 0)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, monthStart), revenueFilter)),

    db
      .select({ count: count() })
      .from(users)
      .where(eq(users.role, 'CUSTOMER')),

    db
      .select({ count: count() })
      .from(orders)
      .where(eq(orders.status, 'PENDING')),
  ])

  const dailyRevenue = await db
    .select({
      date: sql<string>`to_char(date_trunc('day', ${orders.createdAt}), 'YYYY-MM-DD')`,
      revenue: sql<string>`coalesce(sum(${orders.total}::numeric), 0)`,
      orders: count(),
    })
    .from(orders)
    .where(and(gte(orders.createdAt, thirtyDaysAgo), revenueFilter))
    .groupBy(sql`date_trunc('day', ${orders.createdAt})`)
    .orderBy(sql`date_trunc('day', ${orders.createdAt})`)

  const topProducts = await db
    .select({
      name: orderItems.productName,
      revenue: sql<string>`coalesce(sum(${orderItems.subtotal}::numeric), 0)`,
      qty: sql<number>`coalesce(sum(${orderItems.qty}), 0)`,
    })
    .from(orderItems)
    .innerJoin(orders, eq(orderItems.orderId, orders.id))
    .where(revenueFilter)
    .groupBy(orderItems.productName)
    .orderBy(desc(sql`sum(${orderItems.subtotal}::numeric)`))
    .limit(5)

  const recentOrders = await db.query.orders.findMany({
    columns: {
      id: true,
      orderNumber: true,
      total: true,
      status: true,
      createdAt: true,
      customerName: true,
    },
    orderBy: (o, { desc: d }) => [d(o.createdAt)],
    limit: 8,
  })

  return {
    kpis: {
      todayRevenue: Number(todayRow?.revenue ?? 0),
      todayOrders: Number(todayRow?.orders ?? 0),
      monthRevenue: Number(monthRow?.revenue ?? 0),
      monthOrders: Number(monthRow?.orders ?? 0),
      totalCustomers: Number(customerRow?.count ?? 0),
      pendingOrders: Number(pendingRow?.count ?? 0),
    },
    dailyRevenue: dailyRevenue.map((r) => ({
      date: r.date,
      revenue: Number(r.revenue),
      orders: Number(r.orders),
    })),
    topProducts: topProducts.map((p) => ({
      name: p.name,
      revenue: Number(p.revenue),
      qty: Number(p.qty),
    })),
    recentOrders: recentOrders.map((o) => ({
      id: o.id,
      orderNumber: o.orderNumber,
      total: Number(o.total),
      status: o.status,
      createdAt: o.createdAt?.toISOString() ?? '',
      customerName: o.customerName,
    })),
  }
}

export async function getCustomerAnalytics(userId: string) {
  const userOrders = await db.query.orders.findMany({
    where: and(eq(orders.userId, userId), notInArray(orders.status, ['CANCELLED', 'REFUNDED'])),
    with: {
      items: {
        with: {
          product: {
            columns: { id: true, categoryId: true },
            with: {
              category: { columns: { id: true, name: true } },
            },
          },
        },
      },
    },
    orderBy: (o, { desc: d }) => [d(o.createdAt)],
  })

  const delivered = userOrders.filter((o) => o.status === 'DELIVERED')
  const totalSpent = delivered.reduce((s, o) => s + Number(o.total), 0)
  const orderCount = userOrders.length
  const deliveredCount = delivered.length
  const averageOrderValue = deliveredCount > 0 ? totalSpent / deliveredCount : 0
  const loyaltyPoints = delivered.reduce((s, o) => s + Math.floor(Number(o.total) * 10), 0)

  const categoryMap = new Map<string, number>()
  for (const order of delivered) {
    for (const item of order.items) {
      const catName = item.product?.category?.name ?? 'Digər'
      categoryMap.set(catName, (categoryMap.get(catName) ?? 0) + Number(item.subtotal))
    }
  }

  const categoryTotal = Array.from(categoryMap.values()).reduce((a, b) => a + b, 0)
  const categoryBreakdown = Array.from(categoryMap.entries())
    .map(([label, amount]) => ({
      label,
      amount,
      pct: categoryTotal > 0 ? Math.round((amount / categoryTotal) * 100) : 0,
    }))
    .sort((a, b) => b.amount - a.amount)

  return {
    totalSpent,
    orderCount,
    deliveredCount,
    averageOrderValue,
    loyaltyPoints,
    categoryBreakdown,
  }
}

export async function getCustomerLoyalty(userId: string) {
  const [user] = await db
    .select({
      loyaltyPoints: users.loyaltyPoints,
      firstName: users.firstName,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  const analytics = await getCustomerAnalytics(userId)
  const points = Math.max(user?.loyaltyPoints ?? 0, analytics.loyaltyPoints)
  const referralCode = `OG-${userId.replace(/-/g, '').slice(-6).toUpperCase()}`

  return {
    points,
    referralCode,
    referralReward: 50,
    earnedFromOrders: analytics.loyaltyPoints,
  }
}

export async function getCustomerSecurity(
  userId: string,
  userAgent: string | null
) {
  const [user] = await db
    .select({
      isEmailVerified: users.isEmailVerified,
      isPhoneVerified: users.isPhoneVerified,
      lastLoginAt: users.lastLoginAt,
      createdAt: users.createdAt,
      email: users.email,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1)

  if (!user) return null

  let score = 20
  const tips: string[] = []

  if (user.isEmailVerified) score += 25
  else tips.push('Email ünvanınızı doğrulayın')

  if (user.isPhoneVerified) score += 25
  else tips.push('Telefon nömrənizi doğrulayın')

  if (user.lastLoginAt) {
    const daysSinceLogin = (Date.now() - user.lastLoginAt.getTime()) / (1000 * 60 * 60 * 24)
    if (daysSinceLogin <= 30) score += 20
    else tips.push('Son günlər hesaba daxil olmamısınız')
  } else {
    tips.push('Hesaba daxil olaraq aktivliyi artırın')
  }

  const accountAgeDays = (Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24)
  if (accountAgeDays >= 30) score += 10

  score = Math.min(100, score)

  const device = parseUserAgent(userAgent)

  return {
    score,
    maxScore: 100,
    twoFactorEnabled: false,
    tips,
    email: user.email,
    isEmailVerified: user.isEmailVerified,
    isPhoneVerified: user.isPhoneVerified,
    lastLoginAt: user.lastLoginAt?.toISOString() ?? null,
    sessions: [
      {
        id: 'current',
        device: device.label,
        location: 'Azərbaycan',
        time: 'İndi',
        current: true,
      },
    ],
  }
}

function parseUserAgent(ua: string | null): { label: string } {
  if (!ua) return { label: 'Naməlum cihaz' }
  if (ua.includes('iPhone') || ua.includes('iPad')) return { label: 'Safari / iOS' }
  if (ua.includes('Android')) return { label: 'Chrome / Android' }
  if (ua.includes('Firefox')) return { label: 'Firefox' }
  if (ua.includes('Chrome')) return { label: 'Chrome' }
  if (ua.includes('Safari')) return { label: 'Safari' }
  return { label: 'Brauzer' }
}
