'use client';

import { useState, useMemo } from 'react';
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
import { AiInsight, InventoryStats } from '@/types/finance';

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

// --------------------------------------------
// AI MALIYYƏ ANALİZ GENERATORU
// --------------------------------------------

function generateAiInsight(opts: {
  monthLabel: string;
  monthlyStats: { income: number; exp: number; profit: number; margin: number };
  expensePie: { name: string; value: number }[];
  channelTotals: ChannelTotals;
  logs: DailyLog[];
}): AiInsight {
  const { monthLabel, monthlyStats, expensePie, channelTotals, logs } = opts;

  const { income, exp, profit, margin } = monthlyStats;

  const topCats = [...expensePie]
    .sort((a, b) => b.value - a.value)
    .slice(0, 3);

  const totalChannel =
    channelTotals.cash + channelTotals.card + channelTotals.bank || 1;
  const cashShare = (channelTotals.cash / totalChannel) * 100;
  const cardShare = (channelTotals.card / totalChannel) * 100;
  const bankShare = (channelTotals.bank / totalChannel) * 100;

  const avgDailyProfit =
    logs.length > 0
      ? logs.reduce((s, l) => s + l.netProfit, 0) / logs.length
      : 0;

  const mainSummary = [
    `Bu ay (${monthLabel}) qeydə alınan ümumi satış gəliri təxminən ${formatCurrency(
      income,
    )}, xərclər isə ${formatCurrency(exp)} təşkil edir.`,
    `Təxmini xalis mənfəət ${formatCurrency(
      profit,
    )}, marja isə ${margin.toFixed(1)}% civarındadır.`,
    logs.length
      ? `Gündəlik orta mənfəət təxminən ${formatCurrency(
          avgDailyProfit,
        )} səviyyəsindədir.`
      : 'Hələ günlük mühasibat qeydləri azdır, buna görə orta günlük mənfəət haqqında dəqiq fikir formalaşdırmaq çətindir.',
  ].join(' ');

  const risks: string[] = [];

  if (margin < 15) {
    risks.push(
      'Mənfəət marjası 15%-dən aşağıdır. Xərclərin strukturunu yenidən gözdən keçirmək və yüksək paya malik kateqoriyalarda sərt optimizasiya aparmaq lazımdır.',
    );
  } else if (margin < 25) {
    risks.push(
      'Mənfəət marjası orta səviyyədədir. Kiçik optimizasiya ilə daha sağlam səviyyəyə yüksəlmək mümkündür.',
    );
  }

  if (topCats.length) {
    const catList = topCats
      .map((c) => `${c.name} (${formatCurrency(c.value)})`)
      .join(', ');
    risks.push(
      `Ən böyük xərc kateqoriyaları: ${catList}. Xərclərin əsas yükü bu sahələrdə cəmlənir.`,
    );
  }

  if (cardShare > 40) {
    risks.push(
      'Kart və POS ödənişlərinin payı yüksəkdir. POS və bank komissiyalarının mənfəət marjasına təsirini ayrıca izləmək faydalıdır.',
    );
  }

  const suggestions: string[] = [];

  if (topCats.some((c) => c.name === 'nəqliyyat' || c.name === 'yanacaq')) {
    suggestions.push(
      'Nəqliyyat və yanacaq xərcləri üçün marşrut planlaması, tədarükçülərlə birləşdirilmiş çatdırılma və ya toplu alış modellərini nəzərdən keçir.',
    );
  }

  if (topCats.some((c) => c.name === 'zay məhsul')) {
    suggestions.push(
      'Zay məhsul nisbəti artıbsa, stok dövriyyəsini sürətləndirmək, tarixə yaxın məhsullar üçün sürətli endirim kampaniyaları tətbiq etmək məsləhətdir.',
    );
  }

  if (cardShare > 30) {
    suggestions.push(
      'Kart ödənişləri üçün POS komissiya dərəcələrini banklarla yenidən müzakirə etmək və ya komissiyanı qismən qiymətə daxil etmək olar.',
    );
  }

  if (cashShare < 20 && bankShare < 20) {
    suggestions.push(
      'Nağd və bank hesabına daxil olan vəsaitlərin payı aşağıdır. Likvidlik (xərc ödəmələri və təcili alışlar) üçün müəyyən həcmdə bu balansları qorumaq faydalı olar.',
    );
  }

  if (!suggestions.length) {
    suggestions.push(
      'Cari struktur ümumilikdə balanslı görünür. Xərcləri kateqoriya üzrə izləməyə davam edib, hər ay kiçik optimizasiya addımları atmaq kifayət edir.',
    );
  }

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

  // LOCAL STATE
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
const appState = useApp();
    const formatCurrency = (n: number) => `${n.toFixed(2)} ₼`; 
    
  const revenue = useMemo(
    () =>
      orders.reduce(
        (sum, o) =>
          sum +
          o.items.reduce(
            (s, it) => s + (it.priceAtOrder ?? 0) * (it.qty || 0),
            0,
          ),
        0,
      ),
    [orders],
  );

  const totalExpenses = useMemo(
    () => expenses.reduce((s, e) => s + e.amount, 0),
    [expenses],
  );

  // COGS (maya) — OrderItem.costAtOrder varsa, daha real COGS
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
      (p.variants || []).some(
        (v) => (v.stock ?? 0) <= (p.minStock ?? 5),
      ),
    ).length || 0;

  const totalOrders = orders.length;
  const avgOrderValue =
    totalOrders > 0 ? revenue / totalOrders : 0;

  // --------------------------------------------
  // RANGE STATS (TODAY / WEEK / MONTH)
  // --------------------------------------------

  const computeRange = (days: number): RangeStats => {
    const rOrders = orders.filter((o) => inLastDays(o.createdAt, days));
    const income = rOrders.reduce(
      (s, o) =>
        s +
        o.items.reduce(
          (x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0),
          0,
        ),
      0,
    );

    const exp = expenses
      .filter((e) => inLastDays(e.date, days))
      .reduce((s, e) => s + e.amount, 0);

    const profit = income - exp;
    const margin = income > 0 ? (profit / income) * 100 : 0;

    return { income, exp, profit, margin };
  };

  const todayStats = useMemo(
    () => computeRange(1),
    [computeRange, orders, expenses],
  );
  const weekStats = useMemo(
    () => computeRange(7),
    [computeRange, orders, expenses],
  );
  const monthStats = useMemo(
    () => computeRange(30),
    [computeRange, orders, expenses],
  );

  // --------------------------------------------
  // CURRENT MONTH STATS (AI & PDF ÜÇÜN)
  // --------------------------------------------

  const now = new Date();
  const monthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}`;

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
    const income = monthOrders.reduce(
      (s, o) =>
        s +
        o.items.reduce(
          (x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0),
          0,
        ),
      0,
    );

    const exp = monthExpenses.reduce(
      (s, e) => s + e.amount,
      0,
    );
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

  // --------------------------------------------
  // INVENTORY STATS (STOK + POTENSİAL MALIYYƏ)
// --------------------------------------------

  const inventoryStats: InventoryStats = useMemo(() => {
    let totalUnits = 0;
    let totalCost = 0;
    let potentialRevenue = 0;

    for (const p of products) {
      const variants = p.variants || [];
      for (const v of variants) {
        const qty = v.stock ?? 0;
        const cost =
          (v.arrivalCost ?? v.costPrice ?? p.costPrice ?? 0) /
          (v.length && v.length > 0 ? v.length : 1);

        const sellPrice = v.price ?? p.price ?? 0;
        totalUnits += qty;
        totalCost += qty * (v.costPrice ?? p.costPrice ?? 0);
        potentialRevenue += qty * sellPrice;
      }
    }

    const potentialProfit = potentialRevenue - totalCost;
    const avgMargin =
      potentialRevenue > 0
        ? (potentialProfit / potentialRevenue) * 100
        : 0;

    return {
      totalUnits,
      totalCost,
      potentialRevenue,
      potentialProfit,
      avgMargin,
    };
  }, [products]);

  // --------------------------------------------
  // TOP PRODUCTS (SATIŞ + MƏNFƏƏT BAXIMINDAN)
// --------------------------------------------

  const topProducts: TopProductRow[] = useMemo(() => {
    const map = new Map<
      string,
      {
        productId: string;
        soldQty: number;
        revenue: number;
        grossProfit: number;
      }
    >();

    for (const o of orders) {
      for (const it of o.items) {
        const key = it.productId;
        const price = it.priceAtOrder ?? 0;
        const cost = it.costAtOrder ?? 0;
        const qty = it.qty ?? 0;
        if (!map.has(key)) {
          map.set(key, {
            productId: key,
            soldQty: 0,
            revenue: 0,
            grossProfit: 0,
          });
        }
        const row = map.get(key)!;
        row.soldQty += qty;
        row.revenue += price * qty;
        row.grossProfit += (price - cost) * qty;
      }
    }

    const result: TopProductRow[] = [];
    for (const row of map.values()) {
      const p = products.find((x) => x.id === row.productId);
      const catName =
        categories.find((c) => c.id === p?.categoryId)?.name ||
        'Naməlum';

      const margin =
        row.revenue > 0
          ? (row.grossProfit / row.revenue) * 100
          : 0;

      result.push({
        productId: row.productId,
        name: p?.name || 'Silinmiş məhsul',
        categoryName: catName,
        soldQty: row.soldQty,
        revenue: row.revenue,
        grossProfit: row.grossProfit,
        grossMargin: margin,
      });
    }

    return result
      .sort((a, b) => b.grossProfit - a.grossProfit)
      .slice(0, 8);
  }, [orders, products, categories]);

  // --------------------------------------------
  // DAILY SALES–EXPENSE–PROFIT CHART DATA
  // --------------------------------------------

  const chartData = useMemo(() => {
    const map = new Map<
      string,
      { date: string; sales: number; expenses: number; profit: number }
    >();

    for (const o of orders) {
      const key = o.createdAt.slice(0, 10);
      const s = o.items.reduce(
        (x, it) => x + (it.priceAtOrder ?? 0) * (it.qty || 0),
        0,
      );

      if (!map.has(key)) {
        map.set(key, {
          date: key,
          sales: 0,
          expenses: 0,
          profit: 0,
        });
      }

      map.get(key)!.sales += s;
    }

    for (const e of expenses) {
      if (!map.has(e.date)) {
        map.set(e.date, {
          date: e.date,
          sales: 0,
          expenses: 0,
          profit: 0,
        });
      }
      map.get(e.date)!.expenses += e.amount;
    }

    for (const row of map.values()) {
      row.profit = row.sales - row.expenses;
    }

    return Array.from(map.values()).sort((a, b) =>
      a.date.localeCompare(b.date),
    );
  }, [orders, expenses]);

  // --------------------------------------------
  // EXPENSE PIE DATA
  // --------------------------------------------

  const expensePie = useMemo(() => {
    const catMap = new Map<string, number>();
    for (const e of expenses) {
      catMap.set(e.category, (catMap.get(e.category) || 0) + e.amount);
    }
    return Array.from(catMap.entries()).map(([name, value]) => ({
      name,
      value,
    }));
  }, [expenses]);

  // --------------------------------------------
  // AI INSIGHT
  // --------------------------------------------

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

  const addExpense = () => {
    if (!form.amount || form.amount <= 0) return;

    setExpenses((prev) => [
      ...prev,
      {
        id: nanoid(),
        ...form,
      },
    ]);

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

    const log: DailyLog = {
      id: nanoid(),
      ...dailyForm,
      totalIncome,
      totalExpenses: totalExpensesForDay,
      netProfit,
    };

    setLogs((prev) => [log, ...prev]);

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
    doc.text(
      `Mənfəət marjası: ${monthlyStats.margin.toFixed(1)}%`,
      10,
      y,
    );
    y += 10;

    doc.setFontSize(12);
    doc.text('Xərc Kateqoriyaları', 10, y);
    y += 6;
    doc.setFontSize(10);

    const topExp = [...expensePie]
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
    if (!topExp.length) {
      doc.text('- Xərc məlumatı yoxdur.', 12, y);
      y += 6;
    } else {
      for (const cat of topExp) {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        doc.text(
          `- ${cat.name}: ${formatCurrency(cat.value)}`,
          12,
          y,
        );
        y += 5;
      }
    }

    y += 6;
    doc.setFontSize(12);
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text('Gündəlik Mühasibat Qeydləri (Qısa)', 10, y);
    y += 6;
    doc.setFontSize(9);

    if (!monthLogs.length) {
      doc.text(
        '- Bu ay üçün qeyd edilmiş Daily Log yoxdur.',
        12,
        y,
      );
      y += 6;
    } else {
      const shortLogs = monthLogs.slice(0, 8);
      for (const l of shortLogs) {
        if (y > 270) {
          doc.addPage();
          y = 15;
        }
        doc.text(
          `${l.date} · Gəlir: ${formatCurrency(
            l.totalIncome,
          )} · Xərc: ${formatCurrency(
            l.totalExpenses,
          )} · Mənfəət: ${formatCurrency(l.netProfit)}`,
          12,
          y,
        );
        y += 5;
      }
    }

    y += 6;
    doc.setFontSize(12);
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text('AI Maliyyə Qısa Yekun', 10, y);
    y += 6;
    doc.setFontSize(9);
    const summaryLines = doc.splitTextToSize(aiInsight.summary, 180);
    for (const line of summaryLines) {
      if (y > 270) {
        doc.addPage();
        y = 15;
      }
      doc.text(line, 12, y);
      y += 4;
    }

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text('Risklər:', 12, y);
    y += 5;
    if (!aiInsight.risks.length) {
      doc.text('- Əhəmiyyətli risk qeyd edilməyib.', 15, y);
      y += 5;
    } else {
      for (const r of aiInsight.risks) {
        const lines = doc.splitTextToSize(`- ${r}`, 180);
        for (const line of lines) {
          if (y > 270) {
            doc.addPage();
            y = 15;
          }
          doc.text(line, 15, y);
          y += 4;
        }
      }
    }

    y += 4;
    if (y > 270) {
      doc.addPage();
      y = 15;
    }
    doc.text('Tövsiyələr:', 12, y);
    y += 5;
    if (!aiInsight.suggestions.length) {
      doc.text('- Hazırda xüsusi tövsiyə yoxdur.', 15, y);
    } else {
      for (const s of aiInsight.suggestions) {
        const lines = doc.splitTextToSize(`- ${s}`, 180);
        for (const line of lines) {
          if (y > 270) {
            doc.addPage();
            y = 15;
          }
          doc.text(line, 15, y);
          y += 4;
        }
      }
    }

    doc.save(`maliyye-${monthKey}.pdf`);
  };

  // --------------------------------------------
  // UI
  // --------------------------------------------

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
            Gündəlik, həftəlik və aylıq kəsikdə{' '}
            <b>gəlir, COGS (maya), xərclər, mənfəət, stok və satış kanalları</b> üçün
            premium analitika. Real alıcı və məhsul davranışına uyğun strategiya qurmaq üçündür.
          </p>
        </div>

        <div className="flex flex-col gap-2 items-stretch md:items-end">
          <div className="inline-flex flex-wrap items-center gap-2 rounded-2xl border border-emerald-100 bg-white/80 px-3 py-2 text-xs shadow-sm">
            <span className="rounded-full bg-emerald-50 px-2 py-1 font-semibold text-emerald-700">
              Ümumi gəlir: {formatCurrency(revenue)}
            </span>
            <span className="rounded-full bg-sky-50 px-2 py-1 font-semibold text-sky-700">
              COGS (maya): {formatCurrency(totalCogs)}
            </span>
            <span className="rounded-full bg-amber-50 px-2 py-1 font-semibold text-amber-700">
              Ümumi xərclər: {formatCurrency(totalExpenses)}
            </span>
            <span
              className={`rounded-full px-2 py-1 font-semibold bg-white ${
                netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'
              }`}
            >
              Xalis mənfəət: {formatCurrency(netProfit)} ({netMargin.toFixed(1)}%)
            </span>
          </div>
          <button
            type="button"
            onClick={handleExportMonthlyPdf}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow hover:bg-emerald-700"
          >
            📄 Aylıq PDF Maliyyə Hesabatı
          </button>
        </div>
      </header>

      {/* GLOBAL KPIS STRIP */}
      <section className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <KpiCard
          icon={<TrendingUp className="w-5 h-5" />}
          label="Ümumi gəlir"
          value={formatCurrency(revenue)}
          description="Sifarişlərdən yığılan ümumi dövriyyə."
          color="from-emerald-100 via-emerald-50 to-white"
        />
        <KpiCard
          icon={<ShoppingBag className="w-5 h-5" />}
          label="Satılmış malların maya dəyəri (COGS)"
          value={formatCurrency(totalCogs)}
          description="Cost of Goods Sold – real maya dəyəri."
          color="from-sky-100 via-sky-50 to-red"
        />
        <KpiCard
          icon={<Wallet className="w-5 h-5" />}
          label="Xalis mənfəət"
          value={formatCurrency(netProfit)}
          valueClassName={netProfit >= 0 ? 'text-emerald-700' : 'text-rose-700'}
          description={`Mənfəət marjası: ${netMargin.toFixed(1)}%. Gəlir - COGS - xərclər.`}
          color="from-amber-100 via-amber-50 to-white"
        />
        <KpiCard
          icon={<Coins className="w-5 h-5" />}
          label="Sifariş & stok xülasəsi"
          value={`${totalOrders} sifariş`}
          description={`Orta sifariş dəyəri: ${formatCurrency(
            avgOrderValue,
          )} · Aşağı stoklu məhsul: ${lowStock}`}
          color="from-rose-100 via-rose-50 to-white"
        />
      </section>

      {/* INVENTORY & SCENARIO SECTION */}
      <section className="grid lg:grid-cols-[1.4fr_1.3fr] gap-6">
        {/* Inventory summary */}
        <InventorySummary stats={inventoryStats} />

        {/* Scenario simulator */}
        <ScenarioSimulator  formatCurrency={formatCurrency} />
      </section>

      {/* RANGE CARDS */}
      <section className="grid md:grid-cols-3 gap-4">
        <FinanceRangeCard
          title="Bu gün"
          icon={<CalendarDays className="w-4 h-4" />}
          stats={todayStats}
          accent="emerald"
        />
        <FinanceRangeCard
          title="Son 7 gün"
          icon={<CalendarRange className="w-4 h-4" />}
          stats={weekStats}
          accent="sky"
        />
        <FinanceRangeCard
          title="Son 30 gün"
          icon={<CalendarClock className="w-4 h-4" />}
          stats={monthStats}
          accent="amber"
        />
      </section>

      {/* DAILY LOG + KANAL XÜLASƏSİ + AI SHORT */}
      <section className="grid lg:grid-cols-[2fr_1.4fr] gap-6">
        {/* Daily Log Form & Table */}
        <div className="p-5 border border-emerald-100 rounded-2xl bg-white shadow-sm space-y-4">
          <h2 className="font-semibold text-xl text-emerald-900 flex items-center gap-2">
            <NotebookPen className="w-5 h-5 text-emerald-600" />
            Gündəlik Mühasibat Qeydləri (Daily Log)
          </h2>

          <div className="grid md:grid-cols-3 gap-4">
            <Input
              label="Tarix"
              type="date"
              value={dailyForm.date}
              onChange={(e) =>
                setDailyForm({ ...dailyForm, date: (e as unknown as React.ChangeEvent<HTMLInputElement>).target.value })
              }
            />
            <Input
              label="Nağd gəlir"
              type="number"
              value={dailyForm.cashIn}
              onChange={(e) =>
                setDailyForm({
                  ...dailyForm,
                  cashIn: Number((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value) || 0,
                })
              }
              icon={
                <Banknote className="w-3 h-3 text-emerald-600" />
              }
            />
            <Input
              label="Kartdan gələn"
              type="number"
              value={dailyForm.cardIn}
              onChange={(e) =>
                setDailyForm({
                  ...dailyForm,
                  cashIn: Number((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value) || 0,
                })
              }
              icon={
                <CreditCard className="w-3 h-3 text-sky-600" />
              }
            />
            <Input
              label="Bank hesabına gələn"
              type="number"
              value={dailyForm.bankIn}
              onChange={(e) =>
                setDailyForm({
                  ...dailyForm,
                  bankIn: Number((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value) || 0,
                })
              }
              icon={
                <HandCoins className="w-3 h-3 text-amber-600" />
              }
            />
            <Input
              label="Borc verilib"
              type="number"
              value={dailyForm.debtGiven}
              onChange={(e) =>
                setDailyForm({
                  ...dailyForm,
                  debtGiven:Number((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value) || 0,
                })
              }
            />
            <Input
              label="Borc ödənilib"
              type="number"
              value={dailyForm.debtCollected}
              onChange={(e) =>
                setDailyForm({
                  ...dailyForm,
                  debtCollected: Number((e as unknown as React.ChangeEvent<HTMLInputElement>).target.value) || 0,
                })
              }
            />
          </div>

          <Input
            label="Qeyd"
            type="text"
            value={dailyForm.note || ''}
            onChange={(e) =>
                setDailyForm({ ...dailyForm, date: (e as unknown as React.ChangeEvent<HTMLInputElement>).target.value })
            }
            placeholder="Məs: 'Bu gün POS çox idi', 'Tədarükçüyə borc verildi' və s."
          />

          <button
            onClick={addDailyLog}
            className="w-full h-11 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 shadow"
          >
            Gündəlik Qeydi Saxla
          </button>

          <div className="border rounded-xl overflow-hidden mt-4 max-h-[260px]">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-emerald-50 text-emerald-800 font-semibold">
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
                  <tr
                    key={l.id}
                    className="border-b hover:bg-emerald-50/40"
                  >
                    <td className="p-2">{l.date}</td>
                    <td className="px-2 text-emerald-700 font-semibold">
                      {formatCurrency(l.totalIncome)}
                    </td>
                    <td className="px-2 text-amber-700 font-semibold">
                      {formatCurrency(l.totalExpenses)}
                    </td>
                    <td
                      className={`px-2 font-bold ${
                        l.netProfit >= 0
                          ? 'text-emerald-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {formatCurrency(l.netProfit)}
                    </td>
                    <td className="px-2 text-slate-600">
                      {l.note || '—'}
                    </td>
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

        {/* Channel Summary + AI Insight Short */}
        <div className="space-y-4">
          {/* Kanal xülasəsi */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm space-y-3">
            <h3 className="text-sm font-semibold text-slate-900 mb-1">
              Ödəniş Kanalları Xülasəsi (Cari Ay)
            </h3>
            <div className="grid grid-cols-3 gap-3 text-xs">
              <FinanceChannelCard
                label="Nağd"
                value={channelTotals.cash}
                icon={<Banknote className="w-3.5 h-3.5" />}
                bg="bg-emerald-50"
              />
              <FinanceChannelCard
                label="Kart / POS"
                value={channelTotals.card}
                icon={<CreditCard className="w-3.5 h-3.5" />}
                bg="bg-sky-50"
              />
              <FinanceChannelCard
                label="Bank hesabı"
                value={channelTotals.bank}
                icon={<HandCoins className="w-3.5 h-3.5" />}
                bg="bg-amber-50"
              />
            </div>
            <p className="text-[11px] text-slate-500 mt-1">
              Bu məlumat yalnız qeyd etdiyin <b>Daily Log</b> üzərindən
              formalaşır. POS komissiyası və bank xərclərini ayrıca xərc
              kimi əlavə etmək olar.
            </p>
          </div>

          {/* AI Insight (Short) */}
          <div className="p-5 border border-purple-100 rounded-2xl bg-gradient-to-br from-purple-50 to-white shadow-sm space-y-2">
            <h3 className="text-sm font-semibold text-purple-900 flex items-center gap-1">
              <BarChart3 className="w-4 h-4 text-purple-600" />
              AI Maliyyə Analitikası — Qısa Baxış ({currentMonthLabel})
            </h3>
            <p className="text-[11px] text-slate-600">
              {aiInsight.summary}
            </p>
            {!!aiInsight.risks.length && (
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-rose-700 mb-1">
                  Risk siqnalları:
                </p>
                <ul className="space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
                  {aiInsight.risks.slice(0, 2).map((r, i) => (
                    <li key={i}>{r}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!aiInsight.suggestions.length && (
              <div className="mt-2">
                <p className="text-[11px] font-semibold text-emerald-700 mb-1">
                  Tövsiyə yönləri:
                </p>
                <ul className="space-y-0.5 text-[11px] text-slate-600 list-disc list-inside">
                  {aiInsight.suggestions.slice(0, 2).map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* EXPENSE FORM */}
      <section className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="font-semibold text-lg text-slate-900">
            Xərc əlavə et
          </h2>
          <span className="text-[11px] text-slate-500">
            Məs: mal alışı, yanacaq, maaş, marketinq, kirayə və s.
          </span>
        </div>

        <div className="grid md:grid-cols-4 gap-4">
          <Input
            label="Məbləğ (₼)"
            type="number"
            value={form.amount}
            onChange={(e) =>
              setForm({
                ...form,
                amount: Number(e.target.value) || 0,
              })
            }
          />
          <Input
            label="Tarix"
            type="date"
            value={form.date}
            onChange={(e) =>
              setForm({ ...form, date: e.target.value })
            }
          />
          <FinanceSelect
            label="Kateqoriya"
            value={form.category}
            onChange={(
              e: React.ChangeEvent<HTMLSelectElement>,
            ) =>
              setForm({
                ...form,
                category: e.target.value as ExpenseCategory,
              })
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
              onClick={addExpense}
              className="w-full h-10 rounded-xl bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 shadow"
            >
              Xərc əlavə et
            </button>
          </div>
        </div>

        <Input
          label="Açıqlama"
          value={form.description}
          onChange={(e) =>
            setForm({ ...form, description: e.target.value })
          }
          placeholder="Məs: 'Tədarükçüyə ödəniş', 'Yanacaq - Gəncə yolu' və s."
        />
      </section>

      {/* EXPENSE TABLE + PIE & LINE CHARTS + TOP PRODUCTS */}
      <section className="grid xl:grid-cols-[1.3fr_1.4fr] gap-6">
        {/* Expense table */}
        <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow-sm">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold text-slate-900">
              Xərclər Cədvəli
            </h2>
            <span className="text-xs bg-slate-50 px-3 py-1 rounded-full text-slate-600">
              {expenses.length} xərc ·{' '}
              {formatCurrency(totalExpenses)}
            </span>
          </div>

          <div className="max-h-[320px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-[11px] text-slate-500">
                  <th className="p-2">Tarix</th>
                  <th>Məbləğ</th>
                  <th>Kateqoriya</th>
                  <th>Açıqlama</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr
                    key={e.id}
                    className="border-b hover:bg-emerald-50/40"
                  >
                    <td className="p-2">
                      {new Date(e.date).toLocaleDateString(
                        'az-AZ',
                      )}
                    </td>
                    <td className="p-2 text-emerald-700 font-semibold">
                      {formatCurrency(e.amount)}
                    </td>
                    <td className="p-2 text-slate-700">
                      {e.category}
                    </td>
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

        {/* Charts + Top products */}
        <div className="space-y-5">
          {/* Line chart */}
          <div className="p-5 border border-emerald-100 rounded-2xl bg-white shadow">
            <h2 className="text-sm font-semibold text-emerald-900 mb-2 flex items-center gap-2">
              <LineChartIcon className="w-4 h-4 text-emerald-700" />
              Gündəlik Satış · Xərc · Mənfəət Qrafiki
            </h2>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="#e5e7eb"
                  />
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10 }}
                    tickMargin={8}
                  />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip
                    formatter={(value: any, name: string) => [
                      `${Number(value).toFixed(2)} ₼`,
                      name,
                    ]}
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

          {/* Pie chart */}
          <div className="p-5 border border-slate-200 rounded-2xl bg-white shadow">
            <h2 className="text-sm font-semibold text-slate-900 mb-2 flex items-center gap-2">
              <PackageSearch className="w-4 h-4 text-slate-700" />
              Xərclərin Kateqoriyalara Bölünməsi
            </h2>
            <div className="h-64 flex items-center justify-center">
              {expensePie.length ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={expensePie}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={100}
                      dataKey="value"
                      label={({ name, percent }) =>
                        `${name} (${(percent * 100).toFixed(0)}%)`
                      }
                    >
                      {expensePie.map((_, i) => (
                        <Cell
                          key={i}
                          fill={
                            PIE_COLORS[i % PIE_COLORS.length]
                          }
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) =>
                        `${Number(value).toFixed(2)} ₼`
                      }
                    />
                  </RePieChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-xs text-slate-500">
                  Xərc məlumatı olmadığı üçün pie qrafik göstərilmir.
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* TOP PRODUCTS & FULL AI PANEL */}
      <section className="grid lg:grid-cols-[1.4fr_1.2fr] gap-6">
        {/* Top products by profit */}
        <div className="p-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              Ən çox qazanc gətirən məhsullar
            </h2>
            <span className="text-[11px] text-slate-500">
              İlk 8 məhsul · real satış və maya dəyərləri əsasında
            </span>
          </div>
          <div className="max-h-[320px] overflow-y-auto border border-slate-100 rounded-xl">
            <table className="w-full text-xs md:text-sm">
              <thead className="bg-slate-50 sticky top-0">
                <tr className="text-left text-[11px] text-slate-500">
                  <th className="p-2">Məhsul</th>
                  <th className="p-2">Kateqoriya</th>
                  <th className="p-2">Satılan</th>
                  <th className="p-2">Gəlir</th>
                  <th className="p-2">Mənfəət</th>
                  <th className="p-2">% marja</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((row) => (
                  <tr
                    key={row.productId}
                    className="border-b hover:bg-emerald-50/50"
                  >
                    <td className="p-2 text-slate-800">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {row.name}
                        </span>
                      </div>
                    </td>
                    <td className="p-2 text-slate-600">
                      {row.categoryName}
                    </td>
                    <td className="p-2 text-slate-700">
                      {row.soldQty}
                    </td>
                    <td className="p-2 text-emerald-700 font-semibold">
                      {formatCurrency(row.revenue)}
                    </td>
                    <td className="p-2 text-emerald-700 font-semibold">
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
                        <Percent className="w-3 h-3" />
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
          <p className="mt-2 text-[11px] text-slate-500">
            Bu cədvəl üzrə məhsul strategiyası qura bilərsən: yüksək marjalı
            məhsullara vitrin, banner və kampaniya dəstəyi vermək daha
            məntiqlidir.
          </p>
        </div>

        {/* Full AI insight panel */}
        <AiInsightPanel aiInsight={aiInsight} />
      </section>
    </main>
  );
}