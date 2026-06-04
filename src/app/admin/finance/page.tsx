'use client';

import { useState, useMemo, useCallback } from 'react';
import { nanoid } from 'nanoid';
import { motion } from 'framer-motion';
import jsPDF from 'jspdf';
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
  Percent,
  LineChart as LineChartIcon,
  AlertCircle,
  Target,
  Droplets,
  Gauge,
  BarChart3,
  DollarSign,
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

// ============================================================
// YARDIMÇI TARİX FUNKSİYALARI (təhlükəsiz)
// ============================================================
const toDateKey = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d?.toISOString().slice(0, 10);
};
const toMonthKey = (date: string | Date): string => {
  const d = typeof date === 'string' ? new Date(date) : date;
  return `${d?.getFullYear()}-${String(d?.getMonth() + 1).padStart(2, '0')}`;
};

const DAY_MS = 24 * 60 * 60 * 1000;
const inLastDays = (iso: string, days: number) =>
  Date.now() - new Date(iso).getTime() <= days * DAY_MS;

// ============================================================
// TİPLƏR
// ============================================================
export type ExpenseCategory =
  | 'mal alışı'
  | 'nəqliyyat'
  | 'işçi haqqı'
  | 'marketinq'
  | 'kirayə'
  | 'kommunal'
  | 'POS komissiyası'
  | 'bank komissiyası'
  | 'yanacaq'
  | 'əlavə xərc'
  | 'avadanlıq təmiri'
  | 'paketləmə'
  | 'IT xərcləri'
  | 'təmizlik'
  | 'ofis ləvazimatı'
  | 'zay məhsul'
  | 'digər';

export type Expense = {
  id: string;
  amount: number;
  date: string;
  category: ExpenseCategory;
  description?: string;
};

type DailyLog = {
  id: string;
  date: string;
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

export type Budget = {
  month: string;
  incomeTarget: number;
  expenseTarget: number;
  profitTarget: number;
};

export type CashFlowProjection = {
  date: string;
  projectedIncome: number;
  projectedExpenses: number;
  netCashFlow: number;
  cumulativeCash: number;
};

export type CampaignROI = {
  discountPercent: number;
  expectedSalesIncreasePercent: number;
  projectedRevenue: number;
  projectedProfit: number;
  roi: number;
};

export type InventoryStats = {
  totalUnits: number;
  totalCost: number;
  potentialRevenue: number;
  potentialProfit: number;
  avgMargin: number;
};

export type AiInsight = {
  title: string;
  summary: string;
  risks: string[];
  suggestions: string[];
};

const EXPENSE_CATEGORIES: ExpenseCategory[] = [
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
];

const PIE_COLORS = ['#22c55e', '#0ea5e9', '#eab308', '#ef4444', '#6366f1', '#14b8a6', '#f97316', '#a855f7'];

const formatCurrency = (value: number) => `${value.toFixed(2)} ₼`;

// ============================================================
// AI GENERATOR
// ============================================================
function generateAiInsight(opts: {
  monthLabel: string;
  monthlyStats: { income: number; exp: number; profit: number; margin: number };
  expensePie: { name: string; value: number }[];
  channelTotals: ChannelTotals;
  logs: DailyLog[];
}): AiInsight {
  const { monthLabel, monthlyStats, expensePie, channelTotals, logs } = opts;
  const { income, exp, profit, margin } = monthlyStats;
  const topCats = [...expensePie].sort((a, b) => b.value - a.value).slice(0, 3);
  const totalChannel = channelTotals.cash + channelTotals.card + channelTotals.bank || 1;
  const cardShare = (channelTotals.card / totalChannel) * 100;
  const avgDailyProfit = logs.length > 0 ? logs.reduce((s, l) => s + l.netProfit, 0) / logs.length : 0;

  const mainSummary = `Bu ay (${monthLabel}) qeydə alınan ümumi satış gəliri təxminən ${formatCurrency(income)}, xərclər isə ${formatCurrency(exp)} təşkil edir. Təxmini xalis mənfəət ${formatCurrency(profit)}, marja isə ${margin.toFixed(1)}% civarındadır. ${logs.length ? `Gündəlik orta mənfəət təxminən ${formatCurrency(avgDailyProfit)} səviyyəsindədir.` : 'Hələ günlük mühasibat qeydləri azdır.'}`;

  const risks: string[] = [];
  if (margin < 15) risks.push('Mənfəət marjası 15%-dən aşağıdır. Xərclərin strukturunu yenidən gözdən keçirmək lazımdır.');
  else if (margin < 25) risks.push('Mənfəət marjası orta səviyyədədir. Kiçik optimizasiya ilə daha sağlam səviyyəyə yüksəlmək mümkündür.');
  if (topCats.length) risks.push(`Ən böyük xərc kateqoriyaları: ${topCats.map(c => `${c.name} (${formatCurrency(c.value)})`).join(', ')}. Xərclərin əsas yükü bu sahələrdə cəmlənir.`);
  if (cardShare > 40) risks.push('Kart və POS ödənişlərinin payı yüksəkdir. Bank komissiyalarının mənfəətə təsirini izləyin.');

  const suggestions: string[] = [];
  if (topCats.some(c => c.name === 'nəqliyyat' || c.name === 'yanacaq')) suggestions.push('Nəqliyyat xərclərini azaltmaq üçün marşrut planlaması və toplu alış modellərini nəzərdən keçirin.');
  if (topCats.some(c => c.name === 'zay məhsul')) suggestions.push('Zay məhsul nisbəti artıbsa, stok dövriyyəsini sürətləndirmək üçün endirim kampaniyaları tətbiq edin.');
  if (cardShare > 30) suggestions.push('Kart ödənişləri üçün POS komissiya dərəcələrini banklarla yenidən müzakirə edin.');
  if (!suggestions.length) suggestions.push('Cari struktur ümumilikdə balanslı görünür. Xərcləri izləməyə davam edin.');

  return { title: 'AI Maliyyə Analitikası · Orqanik Baxış', summary: mainSummary, risks, suggestions };
}

// ============================================================
// KÖMƏKÇİ KOMPONENTLƏR (minimal işlək)
// ============================================================
const BudgetVsActual = ({ budgetData, onEditBudget }: any) => {
  if (!budgetData) return <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200 text-center text-slate-500">Bu ay üçün büdcə təyin edilməyib.</div>;
  return (
    <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200">
      <div className="flex justify-between items-center mb-3"><h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><Target className="w-4 h-4 text-emerald-600"/> Bütçe vs Gerçək (cari ay)</h3><button onClick={onEditBudget} className="text-xs font-semibold text-emerald-600">Redaktə et</button></div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between"><span>Gəlir</span><span className={budgetData.incomeDiff >=0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(budgetData.incomeDiff)} ({budgetData.incomePct>0?`+${budgetData.incomePct.toFixed(1)}%`: `${budgetData.incomePct.toFixed(1)}%`})</span></div>
        <div className="flex justify-between"><span>Xərc</span><span className={budgetData.expenseDiff <=0 ? 'text-emerald-600' : 'text-rose-600'}>{formatCurrency(budgetData.expenseDiff)} ({budgetData.expensePct.toFixed(1)}%)</span></div>
        <div className="flex justify-between font-bold"><span>Mənfəət</span><span className={budgetData.profitDiff>=0?'text-emerald-600':'text-rose-600'}>{formatCurrency(budgetData.profitDiff)} ({budgetData.profitPct.toFixed(1)}%)</span></div>
      </div>
    </div>
  );
};

const CashFlowForecast = ({ data, formatCurrency }: any) => (
  <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200">
    <h3 className="text-md font-bold text-slate-800 mb-3 flex items-center gap-2"><DollarSign className="w-4 h-4 text-emerald-600"/> Nakit axını proqnozu (30 gün)</h3>
    <div className="h-48"><ResponsiveContainer width="100%" height="100%"><LineChart data={data.slice(0,30)}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => formatCurrency(v)} /><Legend /><Line type="monotone" dataKey="cumulativeCash" name="Kumulyativ nakit" stroke="#22c55e" strokeWidth={2} /></LineChart></ResponsiveContainer></div>
  </div>
);

const FinancialHealthScore = ({ score, metrics }: any) => (
  <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200">
    <h3 className="text-md font-bold text-slate-800 mb-2 flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-600"/> Maliyyə Sağlamlıq İndeksi</h3>
    <div className="flex items-center gap-4"><div className="text-4xl font-black text-emerald-700">{score}</div><div className="h-2 flex-1 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-500 rounded-full" style={{ width: `${score}%` }} /></div></div>
    <div className="grid grid-cols-3 gap-2 mt-3 text-xs text-center"><div>Marja: {metrics.netMargin.toFixed(1)}%</div><div>Stok döv: {metrics.inventoryTurnover.toFixed(1)}x</div><div>Likvidlik: {(metrics.liquidity*100).toFixed(0)}%</div></div>
  </div>
);

const ROISimulator = ({ discount, setDiscount, salesIncrease, setSalesIncrease, result, formatCurrency }: any) => (
  <div className="p-5 border border-purple-200 rounded-2xl bg-white shadow-sm">
    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><BarChart3 className="w-4 h-4 text-purple-600"/> Kampaniya ROI Simulyatoru</h3>
    <div className="grid grid-cols-2 gap-3 mt-3">
      <div><label className="text-xs">Endirim %</label><input type="number" value={discount} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setDiscount(Number(e.target.value))} className="w-full border rounded-lg p-1 text-sm" /></div>
      <div><label className="text-xs">Satış artımı %</label><input type="number" value={salesIncrease} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSalesIncrease(Number(e.target.value))} className="w-full border rounded-lg p-1 text-sm" /></div>
    </div>
    <div className="mt-2 text-xs">Proqnoz gəlir: {formatCurrency(result.projectedRevenue)} | Mənfəət: {formatCurrency(result.projectedProfit)} | ROI: {result.roi.toFixed(1)}%</div>
  </div>
);

const InventoryFinancialImpact = ({ totalCost, potentialRevenue, avgMargin, formatCurrency }: any) => (
  <div className="p-5 rounded-2xl bg-white shadow-sm border border-slate-200">
    <h3 className="text-md font-bold text-slate-800 flex items-center gap-2"><PackageSearch className="w-4 h-4 text-emerald-600"/> Stokun maliyyə təsiri</h3>
    <div className="space-y-1 text-sm"><div>Stok dəyəri: {formatCurrency(totalCost)}</div><div>Potensial gəlir: {formatCurrency(potentialRevenue)}</div><div>Gözlənilən mənfəət: {formatCurrency(potentialRevenue - totalCost)}</div><div>Ort. marja: {avgMargin.toFixed(1)}%</div></div>
  </div>
);

const WarningPanel = ({ warnings }: any) => (
  <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm flex gap-2 items-start"><AlertCircle className="w-5 h-5 shrink-0 mt-0.5" /><div><strong>Xəbərdarlıqlar:</strong><ul className="list-disc list-inside text-xs mt-1">{warnings.map((w: string, i: number) => <li key={i}>{w}</li>)}</ul></div></div>
);

// ============================================================
// MAIN COMPONENT
// ============================================================
export default function FinancePage() {
  const { orders, products, categories } = useApp();
  const safeProducts = products || [];
  const safeCategories = categories || [];

  // State
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [form, setForm] = useState<Omit<Expense, 'id'>>({
    amount: 0,
    date: new Date().toISOString().slice(0, 10),
    category: 'digər',
    description: '',
  });
  const [dailyForm, setDailyForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    cashIn: 0,
    cardIn: 0,
    bankIn: 0,
    debtGiven: 0,
    debtCollected: 0,
    note: '',
  });
  const [budget, setBudget] = useState<Budget[]>([
    { month: toMonthKey(new Date()), incomeTarget: 15000, expenseTarget: 8000, profitTarget: 7000 },
  ]);
  const [roiDiscount, setRoiDiscount] = useState(10);
  const [roiSalesIncrease, setRoiSalesIncrease] = useState(20);

  // ========== ƏSAS HESABLAMALAR ==========
  const revenue = useMemo(() => orders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (it.priceAtOrder ?? 0) * (it.qty || 0), 0), 0), [orders]);
  const totalExpenses = useMemo(() => expenses.reduce((s, e) => s + e.amount, 0), [expenses]);
  const totalCogs = useMemo(() => orders.reduce((sum, o) => sum + o.items.reduce((s, it) => s + (it.costAtOrder ?? 0) * (it.qty || 0), 0), 0), [orders]);
  const grossProfit = revenue - totalCogs;
  const netProfit = grossProfit - totalExpenses;
  const netMargin = revenue > 0 ? (netProfit / revenue) * 100 : 0;
  const lowStock = safeProducts.filter(p => (p.variants || []).some(v => (v.stock ?? 0) <= (p.minStock ?? 5))).length;
  const totalOrders = orders.length;
  const avgOrderValue = totalOrders > 0 ? revenue / totalOrders : 0;

  // Range stats
  const computeRange = useCallback((days: number): RangeStats => {
    const rOrders = orders.filter(o => inLastDays(o.createdAt, days));
    const income = rOrders.reduce((s, o) => s + o.items.reduce((x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0), 0), 0);
    const exp = expenses.filter(e => inLastDays(e.date, days)).reduce((s, e) => s + e.amount, 0);
    const profit = income - exp;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, exp, profit, margin };
  }, [orders, expenses]);
  const todayStats = useMemo(() => computeRange(1), [computeRange]);
  const weekStats = useMemo(() => computeRange(7), [computeRange]);
  const monthStats = useMemo(() => computeRange(30), [computeRange]);

  // Cari ay
  const now = new Date();
  const monthKey = toMonthKey(now);
  const currentMonthLabel = now.toLocaleDateString('az-AZ', { month: 'long', year: 'numeric' });

  const monthOrders = useMemo(() => orders.filter(o => toMonthKey(o.createdAt) === monthKey), [orders, monthKey]);
  const monthExpenses = useMemo(() => expenses.filter(e => e.date.startsWith(monthKey)), [expenses, monthKey]);
  const monthlyStats: RangeStats = useMemo(() => {
    const income = monthOrders.reduce((s, o) => s + o.items.reduce((x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0), 0), 0);
    const exp = monthExpenses.reduce((s, e) => s + e.amount, 0);
    const profit = income - exp;
    const margin = income > 0 ? (profit / income) * 100 : 0;
    return { income, exp, profit, margin };
  }, [monthOrders, monthExpenses]);
  const monthLogs = useMemo(() => logs.filter(l => l.date.startsWith(monthKey)), [logs, monthKey]);
  const channelTotals: ChannelTotals = useMemo(() => monthLogs.reduce((acc, l) => ({ cash: acc.cash + l.cashIn, card: acc.card + l.cardIn, bank: acc.bank + l.bankIn }), { cash: 0, card: 0, bank: 0 }), [monthLogs]);

  // Inventory stats
  const inventoryStats: InventoryStats = useMemo(() => {
    let totalUnits = 0, totalCost = 0, potentialRevenue = 0;
    for (const p of safeProducts) {
      for (const v of p.variants || []) {
        const qty = v.stock ?? 0;
        totalUnits += qty;
        totalCost += qty * (v.costPrice ?? p.costPrice ?? 0);
        potentialRevenue += qty * (v.price ?? p.price ?? 0);
      }
    }
    const potentialProfit = potentialRevenue - totalCost;
    const avgMargin = potentialRevenue > 0 ? (potentialProfit / potentialRevenue) * 100 : 0;
    return { totalUnits, totalCost, potentialRevenue, potentialProfit, avgMargin };
  }, [safeProducts]);

  // Budget vs actual
  const budgetVsActual = useMemo(() => {
    const currentBudget = budget.find(b => b.month === monthKey);
    if (!currentBudget) return null;
    return {
      incomeDiff: monthlyStats.income - currentBudget.incomeTarget,
      incomePct: currentBudget.incomeTarget ? (monthlyStats.income / currentBudget.incomeTarget - 1) * 100 : 0,
      expenseDiff: monthlyStats.exp - currentBudget.expenseTarget,
      expensePct: currentBudget.expenseTarget ? (monthlyStats.exp / currentBudget.expenseTarget - 1) * 100 : 0,
      profitDiff: monthlyStats.profit - currentBudget.profitTarget,
      profitPct: currentBudget.profitTarget ? (monthlyStats.profit / currentBudget.profitTarget - 1) * 100 : 0,
    };
  }, [budget, monthKey, monthlyStats]);

  // Cash flow forecast
  const cashFlowProjection: CashFlowProjection[] = useMemo(() => {
    const dailySales = new Map<string, number>();
    for (const o of orders) {
      const date = toDateKey(o.createdAt);
      const amount = o.items.reduce((s, it) => s + (it.priceAtOrder ?? 0) * (it.qty || 0), 0);
      dailySales.set(date, (dailySales.get(date) || 0) + amount);
    }
    const last30Sales = Array.from(dailySales.values()).slice(-30);
    const avgIncome = last30Sales.length ? last30Sales.reduce((a, b) => a + b, 0) / last30Sales.length : 0;
    const avgExpense = totalExpenses / 30;
    const projection: CashFlowProjection[] = [];
    let cumulative = inventoryStats.totalCost;
    for (let i = 1; i <= 30; i++) {
      const date = new Date(Date.now() + i * DAY_MS).toISOString().slice(0, 10);
      const projIncome = avgIncome * (1 + (i / 30) * 0.05);
      const projExpense = avgExpense * (1 + (i / 30) * 0.02);
      const net = projIncome - projExpense;
      cumulative += net;
      projection.push({ date, projectedIncome: projIncome, projectedExpenses: projExpense, netCashFlow: net, cumulativeCash: cumulative });
    }
    return projection;
  }, [orders, totalExpenses, inventoryStats.totalCost]);

  // Health score
  const healthScore = useMemo(() => {
    let score = 0;
    if (netMargin > 20) score += 30;
    else if (netMargin > 10) score += 20;
    else if (netMargin > 5) score += 10;
    const turnover = inventoryStats.potentialRevenue / (inventoryStats.totalCost || 1);
    if (turnover > 3) score += 20;
    else if (turnover > 1.5) score += 10;
    if (revenue > 10000) score += 20;
    else if (revenue > 5000) score += 10;
    if (totalExpenses / revenue < 0.3) score += 20;
    else if (totalExpenses / revenue < 0.5) score += 10;
    if (lowStock === 0) score += 10;
    else if (lowStock < 5) score += 5;
    return Math.min(100, score);
  }, [netMargin, inventoryStats, revenue, totalExpenses, lowStock]);

  // ROI
  const roiResult: CampaignROI = useMemo(() => {
    const baseRevenue = monthlyStats.income;
    const projectedRevenue = baseRevenue * (1 + roiSalesIncrease / 100);
    const projectedProfit = projectedRevenue * (netMargin / 100);
    const roi = ((projectedProfit - monthlyStats.profit) / (baseRevenue * (roiDiscount / 100))) * 100;
    return { discountPercent: roiDiscount, expectedSalesIncreasePercent: roiSalesIncrease, projectedRevenue, projectedProfit, roi: isFinite(roi) ? roi : 0 };
  }, [monthlyStats, netMargin, roiDiscount, roiSalesIncrease]);

  // Top products
  const topProducts: TopProductRow[] = useMemo(() => {
    const map = new Map<string, { soldQty: number; revenue: number; grossProfit: number }>();
    for (const o of orders) {
      for (const it of o.items) {
        const price = it.priceAtOrder ?? 0;
        const cost = it.costAtOrder ?? 0;
        const qty = it.qty ?? 0;
        const existing = map.get(it.productId);
        if (!existing) map.set(it.productId, { soldQty: qty, revenue: price * qty, grossProfit: (price - cost) * qty });
        else { existing.soldQty += qty; existing.revenue += price * qty; existing.grossProfit += (price - cost) * qty; }
      }
    }
    const result: TopProductRow[] = [];
    for (const [pid, data] of map.entries()) {
      const p = safeProducts.find(x => x.id === pid);
      const catName = safeCategories.find(c => c.id === p?.categoryId)?.name || 'Naməlum';
      result.push({
        productId: pid,
        name: p?.name || 'Silinmiş məhsul',
        categoryName: catName,
        soldQty: data.soldQty,
        revenue: data.revenue,
        grossProfit: data.grossProfit,
        grossMargin: data.revenue ? (data.grossProfit / data.revenue) * 100 : 0,
      });
    }
    return result.sort((a, b) => b.grossProfit - a.grossProfit).slice(0, 8);
  }, [orders, safeProducts, safeCategories]);

  // Chart data
  const chartData = useMemo(() => {
    const map = new Map<string, { date: string; sales: number; expenses: number; profit: number }>();
    for (const o of orders) {
      const key = toDateKey(o.createdAt);
      const sales = o.items.reduce((x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0), 0);
      const existing = map.get(key);
      if (existing) existing.sales += sales;
      else map.set(key, { date: key, sales, expenses: 0, profit: 0 });
    }
    for (const e of expenses) {
      const key = e.date;
      const existing = map.get(key);
      if (existing) existing.expenses += e.amount;
      else map.set(key, { date: key, sales: 0, expenses: e.amount, profit: 0 });
    }
    for (const row of map.values()) row.profit = row.sales - row.expenses;
    return Array.from(map.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [orders, expenses]);

  const expensePie = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const e of expenses) catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    return Array.from(catMap.entries()).map(([name, value]) => ({ name, value }));
  }, [expenses]);

  const aiInsight = useMemo(() => generateAiInsight({ monthLabel: currentMonthLabel, monthlyStats, expensePie, channelTotals, logs: monthLogs }), [monthlyStats, expensePie, channelTotals, monthLogs]);

  // Actions
  const addExpense = () => {
    if (form.amount <= 0) return;
    setExpenses(prev => [...prev, { id: nanoid(), ...form }]);
    setForm({ amount: 0, date: new Date().toISOString().slice(0, 10), category: 'digər', description: '' });
  };
  const addDailyLog = () => {
    const totalIncome = dailyForm.cashIn + dailyForm.cardIn + dailyForm.bankIn + dailyForm.debtCollected;
    const totalExpensesForDay = expenses.filter(e => e.date === dailyForm.date).reduce((s, e) => s + e.amount, 0);
    const netProfit = totalIncome - totalExpensesForDay;
    setLogs(prev => [{ id: nanoid(), ...dailyForm, totalIncome, totalExpenses: totalExpensesForDay, netProfit }, ...prev]);
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
  const handleExportMonthlyPdf = () => {
    const doc = new jsPDF();
    let y = 15;
    doc.setFontSize(16);
    doc.text('Organik Gədəbəy · Aylıq Maliyyə Hesabatı', 10, y);
    y += 8;
    doc.setFontSize(11);
    doc.text(`Ay: ${currentMonthLabel}`, 10, y);
    y += 7;
    doc.text(`Ümumi gəlir: ${formatCurrency(monthlyStats.income)}`, 10, y);
    y += 7;
    doc.text(`Ümumi xərclər: ${formatCurrency(monthlyStats.exp)}`, 10, y);
    y += 7;
    doc.text(`Xalis mənfəət: ${formatCurrency(monthlyStats.profit)}`, 10, y);
    y += 7;
    doc.text(`Mənfəət marjası: ${monthlyStats.margin.toFixed(1)}%`, 10, y);
    y += 10;
    doc.setFontSize(12);
    doc.text('Xərc Kateqoriyaları', 10, y);
    y += 6;
    doc.setFontSize(10);
    const topExp = [...expensePie].sort((a, b) => b.value - a.value).slice(0, 10);
    if (topExp.length) {
      topExp.forEach(cat => {
        if (y > 270) { doc.addPage(); y = 15; }
        doc.text(`- ${cat.name}: ${formatCurrency(cat.value)}`, 12, y);
        y += 5;
      });
    } else {
      doc.text('- Xərc məlumatı yoxdur.', 12, y);
      y += 6;
    }
    y += 6;
    doc.setFontSize(12);
    if (y > 270) { doc.addPage(); y = 15; }
    doc.text('AI Maliyyə Qısa Yekun', 10, y);
    y += 6;
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(aiInsight.summary, 180);
    summaryLines.forEach(line => {
      if (y > 270) { doc.addPage(); y = 15; }
      doc.text(line, 12, y);
      y += 4;
    });
    y += 4;
    doc.text('Risklər:', 12, y);
    y += 5;
    if (aiInsight.risks.length) {
      aiInsight.risks.forEach(r => {
        const lines = doc.splitTextToSize(`- ${r}`, 180);
        lines.forEach(line => {
          if (y > 270) { doc.addPage(); y = 15; }
          doc.text(line, 15, y);
          y += 4;
        });
      });
    } else {
      doc.text('- Əhəmiyyətli risk yoxdur.', 15, y);
      y += 5;
    }
    y += 4;
    doc.text('Tövsiyələr:', 12, y);
    y += 5;
    if (aiInsight.suggestions.length) {
      aiInsight.suggestions.forEach(s => {
        const lines = doc.splitTextToSize(`- ${s}`, 180);
        lines.forEach(line => {
          if (y > 270) { doc.addPage(); y = 15; }
          doc.text(line, 15, y);
          y += 4;
        });
      });
    } else {
      doc.text('- Hazırda xüsusi tövsiyə yoxdur.', 15, y);
    }
    doc.save(`maliyye-${monthKey}.pdf`);
  };

  const warnings: string[] = [];
  if (netMargin < 15) warnings.push(`Mənfəət marjası çox aşağı (${netMargin.toFixed(1)}%). Xərclərinizi azaldın.`);
  if (inventoryStats.potentialRevenue / (inventoryStats.totalCost || 1) < 1.5) warnings.push('Stok dövriyyəniz aşağıdır – stokda dondurulmuş kapitalı azaldın.');
  if (lowStock > 5) warnings.push(`${lowStock} məhsulda stok tükənmə riski var.`);

  // ========== RENDER ==========
  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-lime-50 to-amber-50 p-4 md:p-8 space-y-10">
      {/* HEADER */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-3xl md:text-4xl font-extrabold text-emerald-900">
            <Leaf className="h-8 w-8 text-emerald-600" />
            Premium Maliyyə Paneli · Organik Gədəbəy
          </h1>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            Gündəlik, həftəlik və aylıq kəsikdə gəlir, COGS, xərclər, mənfəət, stok və satış kanalları üçün premium analitika.
          </p>
        </div>
        <div className="flex flex-col gap-2 items-stretch md:items-end">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs shadow-sm">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">Gəlir: {formatCurrency(revenue)}</span>
            <span className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700">COGS: {formatCurrency(totalCogs)}</span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">Xərclər: {formatCurrency(totalExpenses)}</span>
            <span className={`rounded-full px-2 py-1 font-semibold bg-white ${netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
              Mənfəət: {formatCurrency(netProfit)} ({netMargin.toFixed(1)}%)
            </span>
          </div>
          <button onClick={handleExportMonthlyPdf} className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700">
            📄 Aylıq PDF Maliyyə Hesabatı
          </button>
        </div>
      </header>

      {/* KPI KARTLARI */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard icon={<TrendingUp className="w-5 h-5" />} label="Ümumi gəlir" value={formatCurrency(revenue)} description="Sifarişlərdən yığılan ümumi dövriyyə." color="from-emerald-100 via-emerald-50 to-white" />
        <KpiCard icon={<ShoppingBag className="w-5 h-5" />} label="COGS" value={formatCurrency(totalCogs)} description="Satılmış malların maya dəyəri." color="from-sky-100 via-sky-50 to-white" />
        <KpiCard icon={<Wallet className="w-5 h-5" />} label="Xalis mənfəət" value={formatCurrency(netProfit)} valueClassName={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'} description={`Marja: ${netMargin.toFixed(1)}%`} color="from-amber-100 via-amber-50 to-white" />
        <KpiCard icon={<Coins className="w-5 h-5" />} label="Sifariş & stok" value={`${totalOrders} sifariş`} description={`Orta sifariş: ${formatCurrency(avgOrderValue)} · Aşağı stoklu: ${lowStock}`} color="from-rose-100 via-rose-50 to-white" />
      </section>

      {/* BUDGET & HEALTH & WARNINGS */}
      <section className="grid lg:grid-cols-2 gap-6">
        <BudgetVsActual budgetData={budgetVsActual} onEditBudget={() => setBudget([...budget])} />
        <FinancialHealthScore score={healthScore} metrics={{ netMargin, inventoryTurnover: inventoryStats.potentialRevenue / (inventoryStats.totalCost || 1), liquidity: (revenue - totalExpenses) / (totalExpenses || 1) }} />
      </section>
      {warnings.length > 0 && <WarningPanel warnings={warnings} />}

      {/* CASH FLOW & INVENTORY IMPACT */}
      <section className="grid lg:grid-cols-2 gap-6">
        <CashFlowForecast data={cashFlowProjection} formatCurrency={formatCurrency} />
        <InventoryFinancialImpact totalCost={inventoryStats.totalCost} potentialRevenue={inventoryStats.potentialRevenue} avgMargin={inventoryStats.avgMargin} formatCurrency={formatCurrency} />
      </section>

      {/* INVENTORY SUMMARY & SCENARIO SIMULATOR */}
      <section className="grid lg:grid-cols-[1.4fr_1.3fr] gap-6">
        <InventorySummary stats={inventoryStats} />
        <ScenarioSimulator formatCurrency={formatCurrency} />
      </section>

      {/* RANGE CARDS */}
      <section className="grid md:grid-cols-3 gap-4">
        <FinanceRangeCard title="Bu gün" icon={<CalendarDays className="w-4 h-4" />} stats={todayStats} accent="emerald" />
        <FinanceRangeCard title="Son 7 gün" icon={<CalendarRange className="w-4 h-4" />} stats={weekStats} accent="sky" />
        <FinanceRangeCard title="Son 30 gün" icon={<CalendarClock className="w-4 h-4" />} stats={monthStats} accent="amber" />
      </section>

      {/* DAILY LOG & CHANNEL & ROI */}
      <section className="grid lg:grid-cols-[2fr_1.4fr] gap-6">
        {/* Daily Log Form */}
        <div className="p-5 border border-emerald-100 rounded-2xl bg-white shadow-sm space-y-4">
          <h2 className="font-semibold text-xl text-emerald-900 flex items-center gap-2"><NotebookPen className="w-5 h-5 text-emerald-600" />Gündəlik Mühasibat Qeydləri</h2>
          <div className="grid md:grid-cols-3 gap-4">
            <Input label="Tarix" type="date" value={dailyForm.date} onChange={(val: string) => setDailyForm({ ...dailyForm, date: val })} />
            <Input label="Nağd gəlir" type="number" value={dailyForm.cashIn} onChange={(val: string) => setDailyForm({ ...dailyForm, cashIn: Number(val) || 0 })} icon={<Banknote className="w-3 h-3 text-emerald-600" />} />
            <Input label="Kartdan gələn" type="number" value={dailyForm.cardIn} onChange={(val: string) => setDailyForm({ ...dailyForm, cardIn: Number(val) || 0 })} icon={<CreditCard className="w-3 h-3 text-sky-600" />} />
            <Input label="Bank hesabına" type="number" value={dailyForm.bankIn} onChange={(val: string) => setDailyForm({ ...dailyForm, bankIn: Number(val) || 0 })} icon={<HandCoins className="w-3 h-3 text-amber-600" />} />
            <Input label="Borc verilib" type="number" value={dailyForm.debtGiven} onChange={(val: string) => setDailyForm({ ...dailyForm, debtGiven: Number(val) || 0 })} />
            <Input label="Borc ödənilib" type="number" value={dailyForm.debtCollected} onChange={(val: string) => setDailyForm({ ...dailyForm, debtCollected: Number(val) || 0 })} />
          </div>
          <Input label="Qeyd" value={dailyForm.note || ''} onChange={(val: string) => setDailyForm({ ...dailyForm, note: val })} placeholder="Məs: POS problemləri, tədarükçü ödənişi" />
          <button onClick={addDailyLog} className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow">Gündəlik Qeydi Saxla</button>
          <div className="border rounded-xl overflow-hidden max-h-[260px]">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-emerald-50 text-emerald-800 font-semibold">
                <tr><th className="p-2">Tarix</th><th>Gəlir</th><th>Xərc</th><th>Mənfəət</th><th>Qeyd</th></tr>
              </thead>
              <tbody>
                {logs.map(l => (
                  <tr key={l.id} className="border-b hover:bg-emerald-50/40">
                    <td className="p-2">{l.date}</td>
                    <td className="px-2 text-emerald-700 font-semibold">{formatCurrency(l.totalIncome)}</td>
                    <td className="px-2 text-amber-700 font-semibold">{formatCurrency(l.totalExpenses)}</td>
                    <td className={`px-2 font-bold ${l.netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{formatCurrency(l.netProfit)}</td>
                    <td className="px-2 text-slate-600">{l.note || '—'}</td>
                  </tr>
                ))}
                {logs.length === 0 && (
                  <tr><td colSpan={5} className="px-3 py-4 text-center text-xs text-slate-500">Hələ günlük qeyd əlavə edilməyib.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Channel & ROI */}
        <div className="space-y-4">
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">Ödəniş Kanalları (Cari Ay)</h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <FinanceChannelCard label="Nağd" value={channelTotals.cash} icon={<Banknote className="w-3.5 h-3.5" />} bg="bg-emerald-50" />
              <FinanceChannelCard label="Kart / POS" value={channelTotals.card} icon={<CreditCard className="w-3.5 h-3.5" />} bg="bg-sky-50" />
              <FinanceChannelCard label="Bank hesabı" value={channelTotals.bank} icon={<HandCoins className="w-3.5 h-3.5" />} bg="bg-amber-50" />
            </div>
          </div>
          <ROISimulator discount={roiDiscount} setDiscount={setRoiDiscount} salesIncrease={roiSalesIncrease} setSalesIncrease={setRoiSalesIncrease} result={roiResult} formatCurrency={formatCurrency} />
        </div>
      </section>

      {/* EXPENSE FORM */}
      <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between"><h2 className="font-semibold text-lg text-slate-900">Xərc əlavə et</h2><span className="text-[11px] text-slate-500">Məs: mal alışı, yanacaq, maaş, marketinq, kirayə və s.</span></div>
        <div className="grid md:grid-cols-4 gap-4">
          <Input label="Məbləğ (₼)" type="number" value={form.amount} onChange={(val: string) => setForm({ ...form, amount: Number(val) || 0 })} />
          <Input label="Tarix" type="date" value={form.date} onChange={(val: string) => setForm({ ...form, date: val })} />
          <FinanceSelect label="Kateqoriya" value={form.category} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, category: e.target.value as ExpenseCategory })}>
            {EXPENSE_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
          </FinanceSelect>
          <div className="flex items-end"><button onClick={addExpense} className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow">Xərc əlavə et</button></div>
        </div>
        <Input label="Açıqlama" value={form.description} onChange={(val: string) => setForm({ ...form, description: val })} placeholder="Məs: 'Tədarükçüyə ödəniş', 'Yanacaq - Gəncə yolu'" />
      </section>

      {/* EXPENSE TABLE & CHARTS */}
      <section className="grid xl:grid-cols-[1.3fr_1.4fr] gap-6">
        <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div className="flex justify-between items-center mb-3"><h2 className="text-lg font-semibold text-slate-900">Xərclər Cədvəli</h2><span className="text-xs bg-slate-50 px-3 py-1 rounded-full">{expenses.length} xərc · {formatCurrency(totalExpenses)}</span></div>
          <div className="max-h-[320px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50 sticky top-0"><tr><th className="p-2">Tarix</th><th>Məbləğ</th><th>Kateqoriya</th><th>Açıqlama</th></tr></thead>
              <tbody>
                {expenses.map(e => (
                  <tr key={e.id} className="border-b hover:bg-emerald-50/40">
                    <td className="p-2">{new Date(e.date).toLocaleDateString('az-AZ')}</td>
                    <td className="p-2 text-emerald-700 font-semibold">{formatCurrency(e.amount)}</td>
                    <td className="p-2 text-slate-700">{e.category}</td>
                    <td className="p-2 text-slate-500">{e.description || '—'}</td>
                  </tr>
                ))}
                {expenses.length === 0 && <tr><td colSpan={4} className="px-3 py-4 text-center text-xs text-slate-500">Hələ xərc əlavə edilməyib.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <div className="space-y-5">
          <div className="p-5 border border-emerald-100 rounded-2xl bg-white shadow">
            <h2 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2"><LineChartIcon className="w-4 h-4 text-emerald-700" />Gündəlik Satış · Xərc · Mənfəət</h2>
            <div className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 10 }} /><YAxis tick={{ fontSize: 10 }} /><Tooltip formatter={(v: any) => formatCurrency(v)} /><Legend /><Line type="monotone" dataKey="sales" name="Satış" stroke="#22c55e" strokeWidth={2.2} dot={false} /><Line type="monotone" dataKey="expenses" name="Xərc" stroke="#ef4444" strokeWidth={2} dot={false} /><Line type="monotone" dataKey="profit" name="Mənfəət" stroke="#0ea5e9" strokeWidth={2} dot={false} /></LineChart></ResponsiveContainer></div>
          </div>
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow">
            <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2"><PackageSearch className="w-4 h-4 text-slate-700" />Xərclərin Kateqoriyalara Bölünməsi</h2>
            <div className="h-64 flex items-center justify-center">
              {expensePie.length ? (
                <ResponsiveContainer><RePieChart><Pie data={expensePie} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>{expensePie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}</Pie><Tooltip formatter={(v: any) => formatCurrency(v)} /></RePieChart></ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500">Xərc məlumatı yoxdur.</p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS & AI INSIGHT */}
      <section className="grid lg:grid-cols-[1.4fr_1.2fr] gap-6">
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex justify-between items-center mb-3"><h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2"><TrendingUp className="w-4 h-4 text-emerald-700" />Ən çox qazanc gətirən məhsullar</h2><span className="text-[11px] text-slate-500">İlk 8 · real satış və maya dəyəri əsasında</span></div>
          <div className="max-h-[320px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50"><tr><th className="p-2">Məhsul</th><th>Kateqoriya</th><th>Satılan</th><th>Gəlir</th><th>Mənfəət</th><th>Marja</th></tr></thead>
              <tbody>
                {topProducts.map(row => (
                  <tr key={row.productId} className="border-b hover:bg-emerald-50/50">
                    <td className="p-2 font-semibold">{row.name}</td>
                    <td className="p-2">{row.categoryName}</td>
                    <td className="p-2">{row.soldQty}</td>
                    <td className="p-2 text-emerald-700">{formatCurrency(row.revenue)}</td>
                    <td className="p-2 text-emerald-700">{formatCurrency(row.grossProfit)}</td>
                    <td className="p-2"><span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] ${row.grossMargin >= 30 ? 'bg-emerald-50 text-emerald-700' : row.grossMargin >= 15 ? 'bg-amber-50 text-amber-700' : 'bg-rose-50 text-rose-700'}`}><Percent className="w-3 h-3" />{row.grossMargin.toFixed(1)}%</span></td>
                  </tr>
                ))}
                {topProducts.length === 0 && <tr><td colSpan={6} className="px-3 py-4 text-center text-xs text-slate-500">Hələ kifayət qədər satış məlumatı yoxdur.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
        <AiInsightPanel aiInsight={aiInsight} />
      </section>
    </main>
  );
}