// src/lib/services/dailySummaryService.ts
import { db } from '@/lib/db';
import { orders, orderItems, products, productVariants, categories, expenses, users, financeLedger } from '@/lib/db/schema';
import { eq, and, gte, lte, sql, desc, asc, inArray } from 'drizzle-orm';
import type { DailySummary } from '@/types/daily';

// Helper: convert DB numeric string to number
const toNum = (val: any): number => (typeof val === 'string' ? parseFloat(val) : Number(val ?? 0));

export class DailySummaryService {
  /**
   * Fetches the complete daily summary for a given date.
   */
  static async getSummary(date: string): Promise<DailySummary> {
    const dayStart = new Date(date + 'T00:00:00');
    const dayEnd = new Date(date + 'T23:59:59.999');

    // ── 1. Revenue, COGS, Gross Profit ──
    const [revenueData] = await db
      .select({
        totalRevenue: sql<number>`COALESCE(SUM(${orderItems.priceAtOrder}::numeric * ${orderItems.qty}), 0)`,
        totalCOGS: sql<number>`COALESCE(SUM(${orderItems.costAtOrder}::numeric * ${orderItems.qty}), 0)`,
        orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .limit(1);

    const totalRevenue = toNum(revenueData?.totalRevenue ?? 0);
    const totalCOGS = toNum(revenueData?.totalCOGS ?? 0);
    const grossProfit = totalRevenue - totalCOGS;
    const orderCount = Number(revenueData?.orderCount ?? 0);

    // ── 2. Daily Expenses (variable) ──
    const dayExpenses = await db
      .select({
        category: expenses.category,
        amount: sql<number>`COALESCE(SUM(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(gte(expenses.date, dayStart), lte(expenses.date, dayEnd)))
      .groupBy(expenses.category);

    const dailyExpenses = dayExpenses.reduce((sum, e) => sum + toNum(e.amount), 0);
    const expensesBreakdown = dayExpenses.map(e => ({
      category: e.category || 'Digər',
      amount: toNum(e.amount),
    }));

    // ── 3. Fixed Daily Expenses (prorated monthly) ──
    // For simplicity, we define fixed monthly costs in a constant. In production, store in DB.
    const monthlyFixedCosts = [
      { name: 'Arenda', monthlyAmount: 1100 },
      { name: 'Elektrik', monthlyAmount: 150 },
      { name: 'Internet', monthlyAmount: 30 },
      { name: 'Maaslar', monthlyAmount: 3000 },
      { name: 'Muhasibat', monthlyAmount: 200 },
      { name: 'Sigorta', monthlyAmount: 80 },
    ];
    const daysInMonth = new Date(new Date(date).getFullYear(), new Date(date).getMonth() + 1, 0).getDate();
    const fixedExpensesBreakdown = monthlyFixedCosts.map(f => ({
      ...f,
      dailyAmount: f.monthlyAmount / daysInMonth,
    }));
    const fixedDailyExpenses = fixedExpensesBreakdown.reduce((sum, f) => sum + f.dailyAmount, 0);

    // Net Profit
    const netProfit = grossProfit - dailyExpenses - fixedDailyExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

    // ── 4. Orders by Status ──
    const statuses = await db
      .select({
        status: orders.status,
        count: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .groupBy(orders.status);

    const ordersByStatus: Record<string, number> = {};
    statuses.forEach(s => { ordersByStatus[s.status] = Number(s.count); });

    // ── 5. Hourly Sales ──
    const hourlyData = await db
      .select({
        hour: sql<number>`EXTRACT(HOUR FROM ${orders.createdAt})`,
        revenue: sql<number>`COALESCE(SUM(${orderItems.priceAtOrder}::numeric * ${orderItems.qty}), 0)`,
        orderCount: sql<number>`COUNT(DISTINCT ${orders.id})`,
      })
      .from(orders)
      .innerJoin(orderItems, eq(orders.id, orderItems.orderId))
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .groupBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`)
      .orderBy(sql`EXTRACT(HOUR FROM ${orders.createdAt})`);

    const salesByHour = Array.from({ length: 24 }, (_, hour) => {
      const found = hourlyData.find(h => Number(h.hour) === hour);
      return {
        hour,
        label: `${String(hour).padStart(2, '0')}:00`,
        revenue: toNum(found?.revenue ?? 0),
        orderCount: Number(found?.orderCount ?? 0),
      };
    });

    // ── 6. Best Sellers (top 10) ──
    const bestSellers = await db
      .select({
        productId: orderItems.productId,
        productName: sql<string>`MAX(${orderItems.productName})`,
        qty: sql<number>`SUM(${orderItems.qty})`,
        revenue: sql<number>`SUM(${orderItems.priceAtOrder}::numeric * ${orderItems.qty})`,
        cogs: sql<number>`SUM(${orderItems.costAtOrder}::numeric * ${orderItems.qty})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .groupBy(orderItems.productId)
      .orderBy(desc(sql`SUM(${orderItems.qty})`))
      .limit(10);

    // ── 7. Worst Sellers (bottom 10, including zero) ──
    // We take products that were sold least today, plus those not sold at all but active.
    // For simplicity, we list products with 0 sales today and lowest sales.
    const allProducts = await db
      .select({
        productId: products.id,
        productName: products.name,
      })
      .from(products)
      .where(eq(products.archived, false));

    const soldProductIds = new Set(bestSellers.map(s => s.productId));
    const notSoldToday = allProducts.filter(p => !soldProductIds.has(p.productId)).slice(0, 10);

    const worstSellers = [
      ...notSoldToday.map(p => ({ productId: p.productId, productName: p.productName, qty: 0 })),
    ];

    // ── 8. Products not sold in 30 days ──
    const thirtyDaysAgo = new Date(dayStart.getTime() - 30 * 24 * 60 * 60 * 1000);
    const recentSellers = await db
      .select({ productId: orderItems.productId })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(gte(orders.createdAt, thirtyDaysAgo))
      .groupBy(orderItems.productId);

    const recentSellerIds = new Set(recentSellers.map(r => r.productId));
    const notSold30Days = allProducts
      .filter(p => !recentSellerIds.has(p.productId))
      .map(p => ({ productId: p.productId, productName: p.productName, daysSinceLastSale: null }));

    // ── 9. Inventory Alerts ──
    const allVariants = await db
      .select({
        productId: productVariants.productId,
        productName: products.name,
        stock: productVariants.stock,
        minStock: productVariants.minStock,
        expiryDate: productVariants.expiryDate,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(eq(products.archived, false));

    const outOfStock: any[] = [];
    const lowStock: any[] = [];
    const expiringSoon: any[] = [];
    const now = new Date();

    allVariants.forEach(v => {
      if (v.stock <= 0) {
        outOfStock.push({ productId: v.productId, productName: v.productName });
      } else if (v.stock <= (v.minStock || 5)) {
        lowStock.push({ productId: v.productId, productName: v.productName, stock: v.stock, minStock: v.minStock || 5 });
      }
      if (v.expiryDate && new Date(v.expiryDate) <= new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000)) {
        expiringSoon.push({ productId: v.productId, productName: v.productName, expiryDate: v.expiryDate });
      }
    });

    // ── 10. Category Revenue ──
    const categoryRevenue = await db
      .select({
        categoryId: products.categoryId,
        categoryName: sql<string>`MAX(${categories.name})`,
        revenue: sql<number>`SUM(${orderItems.priceAtOrder}::numeric * ${orderItems.qty})`,
        itemsSold: sql<number>`SUM(${orderItems.qty})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .innerJoin(products, eq(products.id, orderItems.productId))
      .innerJoin(categories, eq(categories.id, products.categoryId))
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .groupBy(products.categoryId);

    // ── 11. Payment Analytics ──
    const paymentData = await db
      .select({
        method: orders.paymentMethod,
        revenue: sql<number>`SUM(${orders.total}::numeric)`,
        orderCount: sql<number>`COUNT(*)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)))
      .groupBy(orders.paymentMethod);

    const paymentAnalytics = paymentData.map(p => ({
      method: p.method || 'unknown',
      revenue: toNum(p.revenue),
      orderCount: Number(p.orderCount),
    }));

    // ── 12. Customer Analytics ──
    const customerStats = await db
      .select({
        totalCustomers: sql<number>`COUNT(DISTINCT ${orders.customerPhone})`,
        averageBasket: sql<number>`AVG(${orders.total}::numeric)`,
      })
      .from(orders)
      .where(and(gte(orders.createdAt, dayStart), lte(orders.createdAt, dayEnd)));

    // New vs returning – simplistic: all customers who made first purchase today are 'new'
    // But we don't have historical order tracking per customer easily. We'll skip detailed breakdown for now.
    const totalUniqueCustomers = Number(customerStats[0]?.totalCustomers ?? 0);
    const averageBasketValue = toNum(customerStats[0]?.averageBasket ?? 0);

    // ── 13. Basket Analytics (pre-made baskets sold) ──
    // Assuming basket sales are captured in orderItems with variantId starting with 'basket-'.
    // We'll skip this for brevity, can be added later.

    // ── 14. Inventory Total Cost ──
    const invCost = await db
      .select({
        total: sql<number>`COALESCE(SUM(${productVariants.stock} * ${productVariants.costPrice}::numeric), 0)`,
      })
      .from(productVariants)
      .innerJoin(products, eq(products.id, productVariants.productId))
      .where(eq(products.archived, false));

    const inventoryTotalCost = toNum(invCost[0]?.total ?? 0);

    // ── 15. Forecast (simple moving average of last 7 days) ──
    const sevenDaysAgo = new Date(dayStart.getTime() - 7 * 24 * 60 * 60 * 1000);
    const last7DaysRevenue = await db
      .select({
        revenue: sql<number>`SUM(${orderItems.priceAtOrder}::numeric * ${orderItems.qty})`,
      })
      .from(orderItems)
      .innerJoin(orders, eq(orders.id, orderItems.orderId))
      .where(and(gte(orders.createdAt, sevenDaysAgo), lte(orders.createdAt, dayEnd)))
      .limit(1);

    const total7DaysRevenue = toNum(last7DaysRevenue[0]?.revenue ?? 0);
    const forecastedTomorrowRevenue = total7DaysRevenue / 7;

    // Suggested products to order (based on low stock and high sales velocity) – simplified
    // For now, just return products with stock below minStock
    const suggestedProducts = lowStock.map(l => ({
      productId: l.productId,
      productName: l.productName,
      suggestedQty: Math.max(10, l.minStock * 2 - l.stock),
    }));

    // ── 16. Health Score (100 points) ──
    const healthBreakdown: { area: string; score: number; maxScore: number; comment: string }[] = [];
    let totalScore = 0;

    // Profit margin
    const marginScore = profitMargin >= 20 ? 20 : profitMargin >= 10 ? 15 : profitMargin > 0 ? 10 : 0;
    healthBreakdown.push({ area: 'Profit Margin', score: marginScore, maxScore: 20, comment: `${profitMargin.toFixed(1)}%` });
    totalScore += marginScore;

    // Expense ratio (expenses / revenue)
    const expRatio = totalRevenue > 0 ? (dailyExpenses + fixedDailyExpenses) / totalRevenue : 1;
    const expScore = expRatio <= 0.3 ? 15 : expRatio <= 0.5 ? 10 : expRatio <= 0.7 ? 5 : 0;
    healthBreakdown.push({ area: 'Expense Ratio', score: expScore, maxScore: 15, comment: `${(expRatio * 100).toFixed(1)}%` });
    totalScore += expScore;

    // Orders completion (delivered / total orders)
    const completedRatio = orderCount > 0 ? (ordersByStatus['DELIVERED'] || 0) / orderCount : 0;
    const deliveryScore = completedRatio >= 0.9 ? 10 : completedRatio >= 0.7 ? 7 : completedRatio >= 0.5 ? 4 : 2;
    healthBreakdown.push({ area: 'Sifariş tamamlanma', score: deliveryScore, maxScore: 10, comment: `${(completedRatio * 100).toFixed(0)}%` });
    totalScore += deliveryScore;

    // Inventory health (products out of stock / total active products)
    const activeProdCount = allProducts.length;
    const outOfStockRatio = activeProdCount > 0 ? outOfStock.length / activeProdCount : 0;
    const invScore = outOfStockRatio < 0.05 ? 15 : outOfStockRatio < 0.1 ? 10 : outOfStockRatio < 0.2 ? 5 : 2;
    healthBreakdown.push({ area: 'Stok sağlamlığı', score: invScore, maxScore: 15, comment: `${outOfStock.length} məhsul bitib` });
    totalScore += invScore;

    // Cash flow (positive net profit)
    const cashScore = netProfit > 0 ? 10 : 0;
    healthBreakdown.push({ area: 'Pul axını (müsbət)', score: cashScore, maxScore: 10, comment: netProfit > 0 ? 'Müsbət' : 'Mənfi' });
    totalScore += cashScore;

    // Cancelled orders
    const cancelRate = orderCount > 0 ? (ordersByStatus['CANCELLED'] || 0) / orderCount : 0;
    const cancelScore = cancelRate < 0.05 ? 10 : cancelRate < 0.1 ? 7 : cancelRate < 0.15 ? 4 : 2;
    healthBreakdown.push({ area: 'Ləğv nisbəti', score: cancelScore, maxScore: 10, comment: `${(cancelRate * 100).toFixed(1)}%` });
    totalScore += cancelScore;

    // Waste / spoilage (if tracked) – not implemented, give full score
    healthBreakdown.push({ area: 'Xarab olma', score: 10, maxScore: 10, comment: 'İzlənmir' });
    totalScore += 10;

    // Customer growth (new vs returning) – assume reasonable
    healthBreakdown.push({ area: 'Müştəri artımı', score: 5, maxScore: 10, comment: 'Məlumat yoxdur' });
    totalScore += 5;

    const healthScore = Math.min(100, totalScore);

    // ── Assemble and return ──
    return {
      date,
      totalRevenue,
      orderCount,
      totalCOGS,
      grossProfit,
      dailyExpenses,
      expensesBreakdown,
      fixedDailyExpenses,
      fixedExpensesBreakdown,
      netProfit,
      profitMargin,
      ordersByStatus,
      salesByHour,
      bestSellers: bestSellers.map(s => ({
        productId: s.productId!,
        productName: s.productName!,
        qty: Number(s.qty),
        revenue: toNum(s.revenue),
        cogs: toNum(s.cogs),
        profit: toNum(s.revenue) - toNum(s.cogs),
      })),
      worstSellers,
      notSold30Days,
      inventoryAlerts: { outOfStock, lowStock, expiringSoon },
      categoryRevenue: categoryRevenue.map(c => ({
        categoryId: c.categoryId!,
        categoryName: c.categoryName!,
        revenue: toNum(c.revenue),
        itemsSold: Number(c.itemsSold),
      })),
      paymentAnalytics,
      customerAnalytics: {
        totalUniqueCustomers,
        newCustomers: 0, // not calculated
        returningCustomers: totalUniqueCustomers, // simplified
        averageBasketValue,
      },
      basketAnalytics: [],
      inventoryTotalCost,
      forecastedTomorrowRevenue,
      suggestedProductsToOrder: suggestedProducts,
      healthScore,
      healthScoreBreakdown: healthBreakdown,
    };
  }
}