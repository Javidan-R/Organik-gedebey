'use client';

import { useState, useMemo, useCallback } from 'react';
import { nanoid } from 'nanoid';
import jsPDF from 'jspdf';
import * as XLSX from 'xlsx';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  Legend,
  PieChart as RePieChart,
  Pie,
  Cell,
} from 'recharts';
import {
  TrendingUp,
  Wallet,
  ShoppingBag,
  Coins,
  CalendarDays,
  CalendarClock,
  CalendarRange,
  Leaf,
  NotebookPen,
  Banknote,
  CreditCard,
  HandCoins,
  PackageSearch,
  BarChart3,
  Percent,
  LineChart as LineChartIcon,
} from 'lucide-react';
import { useApp } from '@/lib/store';
import ScenarioSimulator from '@/components/admin/finance/ScenarioSimulator';
import FinanceSelect from '@/components/atoms/finance/FinanceSelect';
import { FinanceChannelCard } from '@/components/atoms/finance/FinanceChannelCard';
import { KpiCard } from '@/components/atoms/finance/KpiCard';
import { FinanceRangeCard } from '@/components/atoms/finance/FinanceRangeCard';
import { Input } from '@/components/atoms/input';
import AiInsightPanel from '@/components/admin/molecules/AiInsightPanel';
import InventorySummary from '@/components/admin/molecules/InventorySummary';
import BudgetVsActual from '@/components/admin/finance/BudgetVsActual';
import BudgetModal from '@/components/admin/finance/BudgetModal';
import CashFlowForecast from '@/components/admin/finance/CashFlowForecast';
import FinancialHealthScore from '@/components/admin/finance/FinancialHealthScore';
import ROISimulator from '@/components/admin/finance/ROISimulator';
import InventoryFinancialImpact from '@/components/admin/finance/InventoryFinancialImpact';
import DateRangeFilter from '@/components/admin/finance/DateRangeFilter';
import ExportButtons from '@/components/admin/finance/ExportButtons';
import WarningPanel from '@/components/admin/finance/WarningPanel';
import type {
  Budget,
  BudgetComparison,
  CashFlowProjection,
  CampaignROI,
  AiInsight,
  InventoryStats,
} from '@/types/finance';

// --------------------------------------------
// CONSTS & TYPES
// --------------------------------------------

export const EXPENSE_CATEGORIES = [
  'mal alışı',
  'nəqliyyat',
  'işçi haqqı',
  'marketinq',
  'kirayə',
  'kommunal',
  'POS komissiyası',
  'bank komissiyası',
  'yanacaq',
  'əlavə xərc',
  'avadanlıq təmiri',
  'paketləmə',
  'IT xərcləri',
  'təmizlik',
  'ofis ləvazimatı',
  'zay məhsul',
  'digər',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export type Expense = {
  id: string;
  amount: number;
  date: string; // YYYY-MM-DD
  category: ExpenseCategory;
  description?: string;
};

type DailyLog = {
  id: string;
  date: string; // YYYY-MM-DD
  cashIn: number;
  cardIn: number;
  bankIn: number;
  debtGiven: number;
  debtCollected: number;
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  note?: string;
};

export type RangeStats = {
  income: number;
  exp: number;
  profit: number;
  margin: number;
};

export type ChannelTotals = {
  cash: number;
  card: number;
  bank: number;
};

export type TopProductRow = {
  productId: string;
  name: string;
  categoryName: string;
  soldQty: number;
  revenue: number;
  grossProfit: number;
  grossMargin: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const inLastDays = (iso: string, d: number) =>
  Date.now() - new Date(iso).getTime() <= d * DAY_MS;
const inRange = (iso: string, from: Date, to: Date) => {
  const t = new Date(iso).getTime();
  return t >= from.getTime() && t <= to.getTime() + DAY_MS - 1;
};

const PIE_COLORS = [
  '#22c55e',
  '#0ea5e9',
  '#eab308',
  '#ef4444',
  '#6366f1',
  '#14b8a6',
  '#f97316',
  '#a855f7',
];

const formatCurrency = (value: number) => `${value.toFixed(2)} ₼`;

const orderRevenue = (items: { priceAtOrder?: number; qty?: number }[]) =>
  items.reduce((s, it) => s + (it.priceAtOrder ?? 0) * (it.qty || 0), 0);

// --------------------------------------------
// AI GENERATOR
// --------------------------------------------

function generateAiInsight(opts: {
  monthLabel: string;
  monthlyStats: RangeStats;
  expensePie: { name: string; value: number }[];
  channelTotals: ChannelTotals;
  logs: DailyLog[];
}): AiInsight {
  const { monthLabel, monthlyStats, expensePie, channelTotals, logs } = opts;
  const { income, exp, profit, margin } = monthlyStats;
  const topCats = [...expensePie].sort((a, b) => b.value - a.value).slice(0, 3);
  const totalChannel =
    channelTotals.cash + channelTotals.card + channelTotals.bank || 1;
  const cashShare = (channelTotals.cash / totalChannel) * 100;
  const cardShare = (channelTotals.card / totalChannel) * 100;
  const bankShare = (channelTotals.bank / totalChannel) * 100;
  const avgDailyProfit =
    logs.length > 0
      ? logs.reduce((s, l) => s + l.netProfit, 0) / logs.length
      : 0;

  const mainSummary = `Bu ay (${monthLabel}) qeydə alınan ümumi satış gəliri təxminən ${formatCurrency(
    income,
  )}, xərclər isə ${formatCurrency(exp)} təşkil edir. Təxmini xalis mənfəət ${formatCurrency(
    profit,
  )}, marja isə ${margin.toFixed(1)}% civarındadır. ${
    logs.length
      ? `Gündəlik orta mənfəət təxminən ${formatCurrency(
          avgDailyProfit,
        )} səviyyəsindədir.`
      : 'Hələ günlük mühasibat qeydləri azdır, buna görə orta günlük mənfəət haqqında dəqiq fikir formalaşdırmaq çətindir.'
  }`;

  const risks: string[] = [];
  if (margin < 15)
    risks.push(
      'Mənfəət marjası 15%-dən aşağıdır. Xərclərin strukturunu yenidən gözdən keçirmək və yüksək paya malik kateqoriyalarda sərt optimizasiya aparmaq lazımdır.',
    );
  else if (margin < 25)
    risks.push(
      'Mənfəət marjası orta səviyyədədir. Kiçik optimizasiya ilə daha sağlam səviyyəyə yüksəlmək mümkündür.',
    );
  if (topCats.length)
    risks.push(
      `Ən böyük xərc kateqoriyaları: ${topCats
        .map((c) => `${c.name} (${formatCurrency(c.value)})`)
        .join(', ')}. Xərclərin əsas yükü bu sahələrdə cəmlənir.`,
    );
  if (cardShare > 40)
    risks.push(
      'Kart və POS ödənişlərinin payı yüksəkdir. POS və bank komissiyalarının mənfəət marjasına təsirini ayrıca izləmək faydalıdır.',
    );

  const suggestions: string[] = [];
  if (topCats.some((c) => c.name === 'nəqliyyat' || c.name === 'yanacaq'))
    suggestions.push(
      'Nəqliyyat və yanacaq xərcləri üçün marşrut planlaması, tədarükçülərlə birləşdirilmiş çatdırılma və ya toplu alış modellərini nəzərdən keçir.',
    );
  if (topCats.some((c) => c.name === 'zay məhsul'))
    suggestions.push(
      'Zay məhsul nisbəti artıbsa, stok dövriyyəsini sürətləndirmək, tarixə yaxın məhsullar üçün sürətli endirim kampaniyaları tətbiq etmək məsləhətdir.',
    );
  if (cardShare > 30)
    suggestions.push(
      'Kart ödənişləri üçün POS komissiya dərəcələrini banklarla yenidən müzakirə etmək və ya komissiyanı qismən qiymətə daxil etmək olar.',
    );
  if (cashShare < 20 && bankShare < 20)
    suggestions.push(
      'Nağd və bank hesabına daxil olan vəsaitlərin payı aşağıdır. Likvidlik (xərc ödəmələri və təcili alışlar) üçün müəyyən həcmdə bu balansları qorumaq faydalı olar.',
    );
  if (!suggestions.length)
    suggestions.push(
      'Cari struktur ümumilikdə balanslı görünür. Xərcləri kateqoriya üzrə izləməyə davam edib, hər ay kiçik optimizasiya addımları atmaq kifayət edir.',
    );

  return {
    title: 'AI Maliyyə Analitikası · Orqanik Baxış',
    summary: mainSummary,
    risks,
    suggestions,
  };
}

// --------------------------------------------
// MAIN COMPONENT
// --------------------------------------------

export default function FinancePage() {
  const { orders, products, categories } = useApp();

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    category: 'digər',
    description: '',
  });
  const [dailyForm, setDailyForm] = useState<
    Omit<DailyLog, 'id' | 'totalIncome' | 'totalExpenses' | 'netProfit'>
  >({
    date: new Date().toISOString().slice(0, 10),
    cashIn: 0,
    cardIn: 0,
    bankIn: 0,
    debtGiven: 0,
    debtCollected: 0,
    note: '',
  });

  const [nowMs] = useState(() => Date.now());
  const now = new Date(nowMs);
  const monthKey = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
    2,
    '0',
  )}`;

  const [budget, setBudget] = useState<Budget[]>([
    {
      month: monthKey,
      incomeTarget: 15000,
      expenseTarget: 8000,
      profitTarget: 7000,
    },
  ]);
  const [dateRange, setDateRange] = useState<{ from: Date; to: Date }>(() => ({
    from: new Date(Date.now() - 30 * DAY_MS),
    to: new Date(),
  }));
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [roiDiscount, setRoiDiscount] = useState(10);
  const [roiSalesIncrease, setRoiSalesIncrease] = useState(20);

  // Store based calculations
  const revenue = useMemo(
    () => orders.reduce((sum, o) => sum + orderRevenue(o.items), 0),
    [orders],
  );
  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );
  const totalCogs = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum +
          o.items.reduce(
            (s, it) => s + (it.costAtOrder ?? 0) * (it.qty || 0),
            0,
          ),
        0,
      ),
    [orders],
  );
  const grossProfit = revenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const lowStock =
    products?.filter((p) =>
      (p.variants || []).some((v) => (v.stock ?? 0) <= (p.minStock ?? 5)),
    ).length || 0;
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  // Range stats
  const computeRange = useCallback(
    (days: number): RangeStats => {
      const income = orders
        .filter((o) => inLastDays(o.createdAt, days))
        .reduce((s, o) => s + orderRevenue(o.items), 0);
      const exp = expenses
        .filter((e) => inLastDays(e.date, days))
        .reduce((s, e) => s + e.amount, 0);
      const profit = income - exp;
      const margin = income > 0 ? (profit / income) * 100 : 0;
      return { income, exp, profit, margin };
    },
    [orders, expenses],
  );
  const todayStats = useMemo(() => computeRange(1), [computeRange]);
  const weekStats = useMemo(() => computeRange(7), [computeRange]);
  const monthStats = useMemo(() => computeRange(30), [computeRange]);

  // Custom date-range stats (premium filter)
  const rangeStats: RangeStats = useMemo(() => {
    const income = orders
      .filter((o) => inRange(o.createdAt, dateRange.from, dateRange.to))
      .reduce((s, o) => s + orderRevenue(o.items), 0);
    const exp = expenses
      .filter((e) => inRange(e.date, dateRange.from, dateRange.to))
      .reduce((s, e) => s + e.amount, 0);
    const profit = income - exp;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, exp, profit, margin };
  }, [orders, expenses, dateRange]);

  // Current month stats
  const currentMonthLabel = now.toLocaleDateString('az-AZ', {
    month: 'long',
    year: 'numeric',
  });
  const monthOrders = useMemo(
    () => orders.filter((o) => o.createdAt.startsWith(monthKey)),
    [orders, monthKey],
  );
  const monthExpenses = useMemo(
    () => expenses.filter((e) => e.date.startsWith(monthKey)),
    [expenses, monthKey],
  );
  const monthlyStats: RangeStats = useMemo(() => {
    const income = monthOrders.reduce((s, o) => s + orderRevenue(o.items), 0);
    const exp = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = income - exp;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, exp, profit, margin };
  }, [monthOrders, monthExpenses]);
  const monthLogs = useMemo(
    () => logs.filter((l) => l.date.startsWith(monthKey)),
    [logs, monthKey],
  );
  const channelTotals: ChannelTotals = useMemo(
    () =>
      monthLogs.reduce(
        (acc, l) => ({
          cash: acc.cash + l.cashIn,
          card: acc.card + l.cardIn,
          bank: acc.bank + l.bankIn,
        }),
        { cash: 0, card: 0, bank: 0 },
      ),
    [monthLogs],
  );

  // Inventory stats
  const inventoryStats: InventoryStats = useMemo(() => {
    let totalUnits = 0,
      totalCost = 0,
      potentialRevenue = 0;
    for (const p of products) {
      for (const v of p.variants || []) {
        const qty = v.stock ?? 0;
        totalUnits += qty;
        totalCost += qty * (v.costPrice ?? p.costPrice ?? 0);
        potentialRevenue += qty * (v.price ?? p.price ?? 0);
      }
    }
    const potentialProfit = potentialRevenue - totalCost;
    const avgMargin =
      potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0;
    return { totalUnits, totalCost, potentialRevenue, potentialProfit, avgMargin };
  }, [products]);

  // Budget vs Actual
  const budgetVsActual: BudgetComparison | null = useMemo(() => {
    const currentBudget = budget.find((b) => b.month === monthKey);
    if (!currentBudget) return null;
    const incomeDiff = monthlyStats.income - currentBudget.incomeTarget;
    const incomePct = currentBudget.incomeTarget
      ? (monthlyStats.income / currentBudget.incomeTarget - 1) * 100
      : 0;
    const expenseDiff = monthlyStats.exp - currentBudget.expenseTarget;
    const expensePct = currentBudget.expenseTarget
      ? (monthlyStats.exp / currentBudget.expenseTarget - 1) * 100
      : 0;
    const profitDiff = monthlyStats.profit - currentBudget.profitTarget;
    const profitPct = currentBudget.profitTarget
      ? (monthlyStats.profit / currentBudget.profitTarget - 1) * 100
      : 0;
    return { incomeDiff, incomePct, expenseDiff, expensePct, profitDiff, profitPct };
  }, [budget, monthKey, monthlyStats]);

  // Cash flow forecast (next 30 days)
  const cashFlowProjection: CashFlowProjection[] = useMemo(() => {
    const sorted = orders
      .map((o) => ({
        date: o.createdAt.slice(0, 10),
        sales: orderRevenue(o.items),
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
    const last30 = sorted.slice(-30);
    const avgIncome =
      last30.reduce((s, d) => s + d.sales, 0) / (last30.length || 1);
    const avgExpense = totalExpenses / 30;
    const projection: CashFlowProjection[] = [];
    let cumulative = inventoryStats.totalCost;
    for (let i = 1; i <= 30; i++) {
      const date = new Date(nowMs + i * DAY_MS).toISOString().slice(0, 10);
      const projIncome = avgIncome * (1 + (i / 30) * 0.05);
      const projExpense = avgExpense * (1 + (i / 30) * 0.02);
      const net = projIncome - projExpense;
      cumulative += net;
      projection.push({
        date,
        projectedIncome: projIncome,
        projectedExpenses: projExpense,
        netCashFlow: net,
        cumulativeCash: cumulative,
      });
    }
    return projection;
  }, [orders, totalExpenses, inventoryStats.totalCost, nowMs]);

  // Health score
  const inventoryTurnover =
    inventoryStats.potentialRevenue / (inventoryStats.totalCost || 1);
  const healthScore = useMemo(() => {
    let score = 0;
    if (netMargin > 20) score += 30;
    else if (netMargin > 10) score += 20;
    else if (netMargin > 5) score += 10;
    if (inventoryTurnover > 3) score += 20;
    else if (inventoryTurnover > 1.5) score += 10;
    if (revenue > 10000) score += 20;
    else if (revenue > 5000) score += 10;
    if (revenue > 0 && totalExpenses / revenue < 0.3) score += 20;
    else if (revenue > 0 && totalExpenses / revenue < 0.5) score += 10;
    if (lowStock === 0) score += 10;
    else if (lowStock < 5) score += 5;
    return Math.min(100, score);
  }, [netMargin, inventoryTurnover, revenue, totalExpenses, lowStock]);

  // ROI simulator
  const roiResult: CampaignROI = useMemo(() => {
    const baseRevenue = monthlyStats.income;
    const projectedRevenue = baseRevenue * (1 + roiSalesIncrease / 100);
    const projectedProfit = projectedRevenue * (netMargin / 100);
    const discountCost = baseRevenue * (roiDiscount / 100);
    const roi =
      discountCost > 0
        ? ((projectedProfit - monthlyStats.profit) / discountCost) * 100
        : 0;
    return {
      discountPercent: roiDiscount,
      expectedSalesIncreasePercent: roiSalesIncrease,
      projectedRevenue,
      projectedProfit,
      roi: isFinite(roi) ? roi : 0,
    };
  }, [monthlyStats, netMargin, roiDiscount, roiSalesIncrease]);

  // Top products
  const topProducts: TopProductRow[] = useMemo(() => {
    const map = new Map<
      string,
      { productId: string; soldQty: number; revenue: number; grossProfit: number }
    >();
    for (const o of orders) {
      for (const it of o.items) {
        const price = it.priceAtOrder ?? 0;
        const cost = it.costAtOrder ?? 0;
        const qty = it.qty ?? 0;
        const existing = map.get(it.productId);
        if (!existing)
          map.set(it.productId, {
            productId: it.productId,
            soldQty: qty,
            revenue: price * qty,
            grossProfit: (price - cost) * qty,
          });
        else {
          existing.soldQty += qty;
          existing.revenue += price * qty;
          existing.grossProfit += (price - cost) * qty;
        }
      }
    }
    const result: TopProductRow[] = [];
    for (const row of map.values()) {
      const p = products.find((x) => x.id === row.productId);
      const catName =
        categories.find((c) => c.id === p?.categoryId)?.name || 'Naməlum';
      result.push({
        productId: row.productId,
        name: p?.name || 'Silinmiş məhsul',
        categoryName: catName,
        soldQty: row.soldQty,
        revenue: row.revenue,
        grossProfit: row.grossProfit,
        grossMargin: row.revenue ? (row.grossProfit / row.revenue) * 100 : 0,
      });
    }
    return result.sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 8);
  }, [orders, products, categories]);

  // Chart data (filtered by date range)
  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; sales: number; expenses: number; profit: number }
    >();
    for (const o of orders) {
      if (!inRange(o.createdAt, dateRange.from, dateRange.to)) continue;
      const key = o.createdAt.slice(0, 10);
      if (!map.has(key))
        map.set(key, { date: key, sales: 0, expenses: 0, profit: 0 });
      map.get(key)!.sales += orderRevenue(o.items);
    }
    for (const e of expenses) {
      if (!inRange(e.date, dateRange.from, dateRange.to)) continue;
      if (!map.has(e.date))
        map.set(e.date, { date: e.date, sales: 0, expenses: 0, profit: 0 });
      map.get(e.date)!.expenses += e.amount;
    }
    for (const row of map.values()) row.profit = row.sales - row.expenses;
    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [orders, expenses, dateRange]);

  const expensePie = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const e of expenses)
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    return Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  const aiInsight = useMemo(
    () =>
      generateAiInsight({
        monthLabel: currentMonthLabel,
        monthlyStats,
        expensePie,
        channelTotals,
        logs: monthLogs,
      }),
    [currentMonthLabel, monthlyStats, expensePie, channelTotals, monthLogs],
  );

  // Actions
  const addExpense = () => {
    if (form.amount <= 0) return;
    setExpenses((prev) => [...prev, { id: nanoid(), ...form }]);
    setForm({
      amount: 0,
      date: new Date().toISOString().slice(0, 10),
      category: 'digər',
      description: '',
    });
  };

  const addDailyLog = () => {
    const totalIncome =
      dailyForm.cashIn +
      dailyForm.cardIn +
      dailyForm.bankIn +
      dailyForm.debtCollected;
    const totalExpensesForDay = expenses
      .filter((e) => e.date === dailyForm.date)
      .reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpensesForDay;
    setLogs((prev) => [
      {
        id: nanoid(),
        ...dailyForm,
        totalIncome,
        totalExpenses: totalExpensesForDay,
        netProfit,
      },
      ...prev,
    ]);
    setDailyForm({
      date: new Date().toISOString().slice(0, 10),
      cashIn: 0,
      cardIn: 0,
      bankIn: 0,
      debtGiven: 0,
      debtCollected: 0,
      note: '',
    });
  };

  const upsertBudget = (next: Budget) => {
    setBudget((prev) => {
      const without = prev.filter((b) => b.month !== next.month);
      return [...without, next];
    });
  };

  // --------------------------------------------
  // EXPORTS
  // --------------------------------------------

  const handleExportMonthlyPdf = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(16);
    doc.text('Organik Gədəbəy · Aylıq Maliyyə Hesabatı', 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Ay: ${currentMonthLabel}`, 10, y);
    y += 7;
    doc.text(`Umumi gelir: ${monthlyStats.income.toFixed(2)} AZN`, 10, y);
    y += 7;
    doc.text(`Umumi xercler: ${monthlyStats.exp.toFixed(2)} AZN`, 10, y);
    y += 7;
    doc.text(`Xalis menfeet: ${monthlyStats.profit.toFixed(2)} AZN`, 10, y);
    y += 7;
    doc.text(`Menfeet marjasi: ${monthlyStats.margin.toFixed(1)}%`, 10, y);
    y += 10;

    doc.setFontSize(12);
    doc.text('Xerc Kateqoriyalari', 10, y);
    y += 6;
    doc.setFontSize(10);
    const topExp = [...expensePie].sort((a, b) => b.value - a.value).slice(0, 12);
    if (!topExp.length) {
      doc.text('- Xerc melumati yoxdur.', 12, y);
      y += 6;
    } else {
      for (const cat of topExp) {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        doc.text(`- ${cat.name}: ${cat.value.toFixed(2)} AZN`, 12, y);
        y += 5;
      }
    }

    y += 6;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.setFontSize(12);
    doc.text('AI Maliyye Yekun', 10, y);
    y += 6;
    doc.setFontSize(9);
    for (const line of doc.splitTextToSize(aiInsight.summary, 185)) {
      if (y > 280) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 12, y);
      y += 4;
    }

    doc.save(`maliyye-${monthKey}.pdf`);
  };

  const handleExportExcel = () => {
    const wb = XLSX.utils.book_new();
    const summary = [
      ['Gosterici', 'Deyer'],
      ['Ay', currentMonthLabel],
      ['Umumi gelir', monthlyStats.income],
      ['Umumi xercler', monthlyStats.exp],
      ['Xalis menfeet', monthlyStats.profit],
      ['Menfeet marjasi (%)', Number(monthlyStats.margin.toFixed(1))],
    ];
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.aoa_to_sheet(summary),
      'Xulase',
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        expenses.map((e) => ({
          Tarix: e.date,
          Mebleg: e.amount,
          Kateqoriya: e.category,
          Aciqlama: e.description ?? '',
        })),
      ),
      'Xercler',
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        logs.map((l) => ({
          Tarix: l.date,
          Gelir: l.totalIncome,
          Xerc: l.totalExpenses,
          Menfeet: l.netProfit,
          Qeyd: l.note ?? '',
        })),
      ),
      'Gundelik',
    );
    XLSX.utils.book_append_sheet(
      wb,
      XLSX.utils.json_to_sheet(
        topProducts.map((p) => ({
          Mehsul: p.name,
          Kateqoriya: p.categoryName,
          Satilan: p.soldQty,
          Gelir: p.revenue,
          Menfeet: p.grossProfit,
          Marja: Number(p.grossMargin.toFixed(1)),
        })),
      ),
      'Top mehsullar',
    );
    XLSX.writeFile(wb, `maliyye-${monthKey}.xlsx`);
  };

  const handleExportCsv = () => {
    const rows = [
      ['Tarix', 'Mebleg', 'Kateqoriya', 'Aciqlama'],
      ...expenses.map((e) => [
        e.date,
        String(e.amount),
        e.category,
        (e.description ?? '').replace(/"/g, '""'),
      ]),
    ];
    const csv = rows
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], {
      type: 'text/csv;charset=utf-8;',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `xercler-${monthKey}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Warnings
  const warnings: string[] = [];
  if (revenue > 0 && netMargin < 15)
    warnings.push(
      `Mənfəət marjası çox aşağı (${netMargin.toFixed(
        1,
      )}%). Xərclərinizi azaltmaq üçün tədbirlər görün.`,
    );
  if (inventoryTurnover < 1.5)
    warnings.push(
      'Stok dövriyyəniz aşağıdır – stokda dondurulmuş kapitalı azaldın.',
    );
  if (lowStock > 5)
    warnings.push(
      `${lowStock} məhsulda stok tükənmə riski var. Stok siyahını yeniləyin.`,
    );
  if (cashFlowProjection.some((d) => d.cumulativeCash < 0))
    warnings.push(
      'Pul axını proqnozu növbəti 30 gündə likvidlik riski göstərir.',
    );

  return (
    <main className="min-h-screen space-y-10 bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-4 md:p-8">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl font-extrabold text-emerald-900 md:text-4xl">
            <Leaf className="h-8 w-8 text-emerald-600" />
            Premium Maliyyə Paneli · Organik Gədəbəy
          </h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600">
            Gündəlik, həftəlik və aylıq kəsikdə{' '}
            <b>gəlir, COGS, xərclər, mənfəət, stok və satış kanalları</b> üçün
            premium analitika. Real alıcı və məhsul davranışına uyğun strategiya
            qurmaq üçündür.
          </p>
        </div>

        <div className="flex flex-col items-stretch gap-2 md:items-end">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs shadow-sm">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              Ümumi gəlir: {formatCurrency(revenue)}
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700">
              COGS: {formatCurrency(totalCogs)}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
              Xərclər: {formatCurrency(totalExpenses)}
            </span>
            <span
              className={`rounded-full bg-white px-2 py-1 font-semibold ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Xalis mənfəət: {formatCurrency(netProfit)} ({netMargin.toFixed(1)}
              %)
            </span>
          </div>
          <ExportButtons
            onExportPdf={handleExportMonthlyPdf}
            onExportExcel={handleExportExcel}
            onExportCsv={handleExportCsv}
          />
        </div>
      </header>

      {/* DATE RANGE FILTER */}
      <section className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <DateRangeFilter value={dateRange} onChange={setDateRange} />
        <div className="inline-flex flex-wrap items-center gap-2 text-xs">
          <span className="rounded-full bg-white px-3 py-1 font-semibold text-emerald-700 shadow-sm">
            Seçilmiş aralıq gəlir: {formatCurrency(rangeStats.income)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-semibold text-amber-700 shadow-sm">
            Xərc: {formatCurrency(rangeStats.exp)}
          </span>
          <span className="rounded-full bg-white px-3 py-1 font-semibold text-sky-700 shadow-sm">
            Mənfəət: {formatCurrency(rangeStats.profit)} (
            {rangeStats.margin.toFixed(1)}%)
          </span>
        </div>
      </section>

      {/* GLOBAL KPIS */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<TrendingUp className="h-5 w-5" />}
          label="Ümumi gəlir"
          value={formatCurrency(revenue)}
          description="Sifarişlərdən yığılan ümumi dövriyyə."
          color="bg-emerald-600"
        />
        <KpiCard
          icon={<ShoppingBag className="h-5 w-5" />}
          label="COGS"
          value={formatCurrency(totalCogs)}
          description="Cost of Goods Sold – real maya dəyəri."
          color="bg-sky-600"
        />
        <KpiCard
          icon={<Wallet className="h-5 w-5" />}
          label="Xalis mənfəət"
          value={formatCurrency(netProfit)}
          valueClassName={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}
          description={`Mənfəət marjası: ${netMargin.toFixed(1)}%`}
          color="bg-amber-500"
        />
        <KpiCard
          icon={<Coins className="h-5 w-5" />}
          label="Sifariş & stok"
          value={`${totalOrders} sifariş`}
          description={`Orta sifariş: ${formatCurrency(
            avgOrderValue,
          )} · Aşağı stoklu: ${lowStock}`}
          color="bg-rose-500"
        />
      </section>

      {/* BUDGET & HEALTH */}
      <section className="grid gap-6 lg:grid-cols-2">
        <BudgetVsActual
          budgetData={budgetVsActual}
          onEditBudget={() => setShowBudgetModal(true)}
        />
        <FinancialHealthScore
          score={healthScore}
          metrics={{
            netMargin,
            inventoryTurnover,
            liquidity: (revenue - totalExpenses) / (totalExpenses || 1),
          }}
        />
      </section>

      {warnings.length > 0 && <WarningPanel warnings={warnings} />}

      {/* CASH FLOW & INVENTORY IMPACT */}
      <section className="grid gap-6 lg:grid-cols-2">
        <CashFlowForecast
          data={cashFlowProjection}
          formatCurrency={formatCurrency}
        />
        <InventoryFinancialImpact
          totalCost={inventoryStats.totalCost}
          potentialRevenue={inventoryStats.potentialRevenue}
          avgMargin={inventoryStats.avgMargin}
          formatCurrency={formatCurrency}
        />
      </section>

      {/* INVENTORY SUMMARY & SCENARIO SIMULATOR */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1.3fr]">
        <InventorySummary stats={inventoryStats} />
        <ScenarioSimulator formatCurrency={formatCurrency} />
      </section>

      {/* RANGE CARDS */}
      <section className="grid gap-4 md:grid-cols-3">
        <FinanceRangeCard
          title="Bu gün"
          icon={<CalendarDays className="h-4 w-4" />}
          stats={todayStats}
          accent="emerald"
        />
        <FinanceRangeCard
          title="Son 7 gün"
          icon={<CalendarRange className="h-4 w-4" />}
          stats={weekStats}
          accent="sky"
        />
        <FinanceRangeCard
          title="Son 30 gün"
          icon={<CalendarClock className="h-4 w-4" />}
          stats={monthStats}
          accent="amber"
        />
      </section>

      {/* DAILY LOG & CHANNEL & ROI */}
      <section className="grid gap-6 lg:grid-cols-[2fr_1.4fr]">
        {/* Daily Log Form & Table */}
        <div className="space-y-4 rounded-2xl border border-emerald-100 bg-white p-5 shadow-sm">
          <h2 className="flex items-center gap-2 text-xl font-semibold text-emerald-900">
            <NotebookPen className="h-5 w-5 text-emerald-600" />
            Gündəlik Mühasibat Qeydləri
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            <Input
              label="Tarix"
              type="date"
              value={dailyForm.date}
              onChange={(v) => setDailyForm({ ...dailyForm, date: v })}
            />
            <Input
              label="Nağd gəlir"
              type="number"
              value={dailyForm.cashIn}
              onChange={(v) =>
                setDailyForm({ ...dailyForm, cashIn: Number(v) || 0 })
              }
              icon={<Banknote className="h-3 w-3 text-emerald-600" />}
            />
            <Input
              label="Kartdan gələn"
              type="number"
              value={dailyForm.cardIn}
              onChange={(v) =>
                setDailyForm({ ...dailyForm, cardIn: Number(v) || 0 })
              }
              icon={<CreditCard className="h-3 w-3 text-sky-600" />}
            />
            <Input
              label="Bank hesabına"
              type="number"
              value={dailyForm.bankIn}
              onChange={(v) =>
                setDailyForm({ ...dailyForm, bankIn: Number(v) || 0 })
              }
              icon={<HandCoins className="h-3 w-3 text-amber-600" />}
            />
            <Input
              label="Borc verilib"
              type="number"
              value={dailyForm.debtGiven}
              onChange={(v) =>
                setDailyForm({ ...dailyForm, debtGiven: Number(v) || 0 })
              }
            />
            <Input
              label="Borc ödənilib"
              type="number"
              value={dailyForm.debtCollected}
              onChange={(v) =>
                setDailyForm({ ...dailyForm, debtCollected: Number(v) || 0 })
              }
            />
          </div>
          <Input
            label="Qeyd"
            value={dailyForm.note || ''}
            onChange={(v) => setDailyForm({ ...dailyForm, note: v })}
            placeholder="Məs: POS problemləri, tədarükçü ödənişi"
          />
          <button
            type="button"
            onClick={addDailyLog}
            className="h-11 w-full rounded-xl bg-emerald-600 font-semibold text-white shadow hover:bg-emerald-700"
          >
            Gündəlik Qeydi Saxla
          </button>
          <div className="max-h-[260px] overflow-auto rounded-xl border">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-emerald-50 font-semibold text-emerald-800">
                <tr>
                  <th className="p-2 text-left">Tarix</th>
                  <th className="text-left">Gəlir</th>
                  <th className="text-left">Xərc</th>
                  <th className="text-left">Mənfəət</th>
                  <th className="text-left">Qeyd</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-emerald-50/40">
                    <td className="p-2">{l.date}</td>
                    <td className="px-2 font-semibold text-emerald-700">
                      {formatCurrency(l.totalIncome)}
                    </td>
                    <td className="px-2 font-semibold text-amber-700">
                      {formatCurrency(l.totalExpenses)}
                    </td>
                    <td
                      className={`px-2 font-bold ${
                        l.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(l.netProfit)}
                    </td>
                    <td className="px-2 text-slate-600">{l.note || '—'}</td>
                  </tr>
                ))}
                {!logs.length && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Hələ günlük qeyd əlavə edilməyib.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel & ROI */}
        <div className="space-y-4">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <h3 className="mb-1 text-sm font-semibold text-slate-900">
              Ödəniş Kanalları (Cari Ay)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <FinanceChannelCard
                label="Nağd"
                value={channelTotals.cash}
                icon={<Banknote className="h-3.5 w-3.5" />}
                bg="bg-emerald-50"
              />
              <FinanceChannelCard
                label="Kart / POS"
                value={channelTotals.card}
                icon={<CreditCard className="h-3.5 w-3.5" />}
                bg="bg-sky-50"
              />
              <FinanceChannelCard
                label="Bank hesabı"
                value={channelTotals.bank}
                icon={<HandCoins className="h-3.5 w-3.5" />}
                bg="bg-amber-50"
              />
            </div>
          </div>
          <ROISimulator
            discount={roiDiscount}
            setDiscount={setRoiDiscount}
            salesIncrease={roiSalesIncrease}
            setSalesIncrease={setRoiSalesIncrease}
            result={roiResult}
            formatCurrency={formatCurrency}
          />
        </div>
      </section>

      {/* EXPENSE FORM */}
      <section className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-slate-900">Xərc əlavə et</h2>
          <span className="text-[11px] text-slate-500">
            Məs: mal alışı, yanacaq, maaş, marketinq, kirayə və s.
          </span>
        </div>
        <div className="grid gap-4 md:grid-cols-4">
          <Input
            label="Məbləğ (₼)"
            type="number"
            value={form.amount}
            onChange={(v) => setForm({ ...form, amount: Number(v) || 0 })}
          />
          <Input
            label="Tarix"
            type="date"
            value={form.date}
            onChange={(v) => setForm({ ...form, date: v })}
          />
          <FinanceSelect
            label="Kateqoriya"
            value={form.category}
            onChange={(e) =>
              setForm({ ...form, category: e.target.value as ExpenseCategory })
            }
          >
            {EXPENSE_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </FinanceSelect>
          <div className="flex items-end">
            <button
              type="button"
              onClick={addExpense}
              className="h-10 w-full rounded-xl bg-emerald-600 text-sm font-semibold text-white shadow hover:bg-emerald-700"
            >
              Xərc əlavə et
            </button>
          </div>
        </div>
        <Input
          label="Açıqlama"
          value={form.description || ''}
          onChange={(v) => setForm({ ...form, description: v })}
          placeholder="Məs: 'Tədarükçüyə ödəniş', 'Yanacaq - Gəncə yolu'"
        />
      </section>

      {/* EXPENSE TABLE & CHARTS */}
      <section className="grid gap-6 xl:grid-cols-[1.3fr_1.4fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-lg font-semibold text-slate-900">
              Xərclər Cədvəli
            </h2>
            <span className="rounded-full bg-slate-50 px-3 py-1 text-xs">
              {expenses.length} xərc · {formatCurrency(totalExpenses)}
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs md:text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-[11px] text-slate-500">
                  <th className="p-2">Tarix</th>
                  <th>Məbləğ</th>
                  <th>Kateqoriya</th>
                  <th>Açıqlama</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b hover:bg-emerald-50/40">
                    <td className="p-2">
                      {new Date(e.date).toLocaleDateString('az-AZ')}
                    </td>
                    <td className="p-2 font-semibold text-emerald-700">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-2 text-slate-700">{e.category}</td>
                    <td className="p-2 text-slate-500">
                      {e.description || '—'}
                    </td>
                  </tr>
                ))}
                {!expenses.length && (
                  <tr>
                    <td
                      colSpan={4}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Hələ xərc əlavə edilməyib.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-5">
          <div className="rounded-2xl border border-emerald-100 bg-white p-5 shadow">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-emerald-900">
              <LineChartIcon className="h-4 w-4 text-emerald-700" />
              Gündəlik Satış · Xərc · Mənfəət
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="date" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value) => formatCurrency(Number(value))}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="sales"
                    name="Satış"
                    stroke="#22c55e"
                    strokeWidth={2.2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="expenses"
                    name="Xərc"
                    stroke="#ef4444"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Line
                    type="monotone"
                    dataKey="profit"
                    name="Mənfəət"
                    stroke="#0ea5e9"
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow">
            <h2 className="mb-2 flex items-center gap-2 text-sm font-semibold text-slate-900">
              <PackageSearch className="h-4 w-4 text-slate-700" />
              Xərclərin Kateqoriyalara Bölünməsi
            </h2>
            <div className="flex h-64 items-center justify-center">
              {expensePie.length ? (
                <ResponsiveContainer>
                  <RePieChart>
                    <Pie
                      data={expensePie}
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${((percent ?? 0) * 100).toFixed(0)}%)`
                      }
                    >
                      {expensePie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={PIE_COLORS[i % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => formatCurrency(Number(value))}
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500">Xərc məlumatı yoxdur.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS & AI INSIGHT */}
      <section className="grid gap-6 lg:grid-cols-[1.4fr_1.2fr]">
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <TrendingUp className="h-4 w-4 text-emerald-700" />
              Ən çox qazanc gətirən məhsullar
            </h2>
            <span className="text-[11px] text-slate-500">
              İlk 8 · real satış və maya dəyəri əsasında
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto rounded-xl border border-slate-100">
            <table className="w-full text-xs md:text-sm">
              <thead className="sticky top-0 bg-slate-50">
                <tr className="text-left text-[11px] text-slate-500">
                  <th className="p-2">Məhsul</th>
                  <th className="p-2">Kateqoriya</th>
                  <th className="p-2">Satılan</th>
                  <th className="p-2">Gəlir</th>
                  <th className="p-2">Mənfəət</th>
                  <th className="p-2">Marja</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((row) => (
                  <tr
                    key={row.productId}
                    className="border-b hover:bg-emerald-50/50"
                  >
                    <td className="p-2 font-semibold">{row.name}</td>
                    <td className="p-2 text-slate-600">{row.categoryName}</td>
                    <td className="p-2 text-slate-700">{row.soldQty}</td>
                    <td className="p-2 font-semibold text-emerald-700">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="p-2 font-semibold text-emerald-700">
                      {formatCurrency(row.grossProfit)}
                    </td>
                    <td className="p-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${
                          row.grossMargin >= 30
                            ? 'bg-emerald-50 text-emerald-700'
                            : row.grossMargin >= 15
                              ? 'bg-amber-50 text-amber-700'
                              : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        <Percent className="h-3 w-3" />
                        {row.grossMargin.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
                {!topProducts.length && (
                  <tr>
                    <td
                      colSpan={6}
                      className="px-3 py-4 text-center text-xs text-slate-500"
                    >
                      Hələ kifayət qədər satış məlumatı yoxdur.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <AiInsightPanel aiInsight={aiInsight} />
      </section>

      {/* small footer note with secondary icon to keep design consistent */}
      <p className="flex items-center justify-center gap-1.5 pb-4 text-center text-[11px] text-slate-400">
        <BarChart3 className="h-3.5 w-3.5" />
        Bütün hesablamalar daxili sifariş, məhsul və xərc məlumatlarına əsaslanır.
      </p>

      <BudgetModal
        key={showBudgetModal ? 'budget-open' : 'budget-closed'}
        isOpen={showBudgetModal}
        onClose={() => setShowBudgetModal(false)}
        month={monthKey}
        initial={budget.find((b) => b.month === monthKey) ?? null}
        onSave={upsertBudget}
      />
    </main>
  );
}
