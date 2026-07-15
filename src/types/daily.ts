// src/types/daily.ts (extended)
export interface DailySummary {
  date: string;
  // Revenue
  totalRevenue: number;
  orderCount: number;
  // COGS
  totalCOGS: number;
  // Gross Profit
  grossProfit: number;
  // Expenses (variable)
  dailyExpenses: number;
  expensesBreakdown: { category: string; amount: number }[];
  // Fixed daily expenses (prorated monthly fixed costs)
  fixedDailyExpenses: number;
  fixedExpensesBreakdown: { name: string; monthlyAmount: number; dailyAmount: number }[];
  // Net Profit
  netProfit: number;
  profitMargin: number; // percentage
  // Orders breakdown
  ordersByStatus: Record<string, number>; // status -> count
  // Hourly sales
  salesByHour: { hour: number; label: string; revenue: number; orderCount: number }[];
  // Best selling products (top 10)
  bestSellers: { productId: string; productName: string; qty: number; revenue: number; cogs: number; profit: number }[];
  // Worst selling products (bottom 10, including zero)
  worstSellers: { productId: string; productName: string; qty: number }[];
  // Products not sold in last 30 days
  notSold30Days: { productId: string; productName: string; daysSinceLastSale: number | null }[];
  // Inventory alerts
  inventoryAlerts: {
    outOfStock: { productId: string; productName: string }[];
    lowStock: { productId: string; productName: string; stock: number; minStock: number }[];
    expiringSoon: { productId: string; productName: string; expiryDate: string }[];
  };
  // Category revenue
  categoryRevenue: { categoryId: string; categoryName: string; revenue: number; itemsSold: number }[];
  // Payment analytics
  paymentAnalytics: { method: string; revenue: number; orderCount: number }[];
  // Customer analytics
  customerAnalytics: {
    totalUniqueCustomers: number;
    newCustomers: number;
    returningCustomers: number;
    averageBasketValue: number;
  };
  // Basket analytics (pre-made baskets sold today)
  basketAnalytics: { basketId: string; basketName: string; qtySold: number; revenue: number }[];
  // Inventory total cost
  inventoryTotalCost: number;
  // Forecast (simple moving average)
  forecastedTomorrowRevenue: number;
  suggestedProductsToOrder: { productId: string; productName: string; suggestedQty: number }[];
  // Business health score
  healthScore: number;
  healthScoreBreakdown: { area: string; score: number; maxScore: number; comment: string }[];
}