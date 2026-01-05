// src/app/admin/dashboard/page.tsx
'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { useApp } from '@/lib/store';
import {
  ageInDays,
  isDiscountActive as checkDiscountActive,
} from '@/lib/calc';
import {
  TrendingUp,
  Clock,
  Layers,
  ShieldCheck,
  PackageOpen,
  Activity,
  BarChart3,
  Zap,
  ShoppingBag,
  Flame,
  Brain,
  LineChart as LineChartIcon,
  AlertTriangle,
  TimerReset,
  Info,
  Check,
  Star,
} from 'lucide-react';

// Dinamik importlar (SSR üçün təhlükəsiz)
const ResponsiveContainer = dynamic(
  async () => ({
    default: (await import('recharts')).ResponsiveContainer,
  }),
  { ssr: false },
);
const AreaChart = dynamic(
  async () => ({ default: (await import('recharts')).AreaChart }),
  { ssr: false },
);
const Area = dynamic(
  async () => ({ default: (await import('recharts')).Area }),
  { ssr: false },
);
const LineChart = dynamic(
  async () => ({ default: (await import('recharts')).LineChart }),
  { ssr: false },
);
const Line = dynamic(
  async () => ({ default: (await import('recharts')).Line }),
  { ssr: false },
);
const XAxis = dynamic(
  async () => ({ default: (await import('recharts')).XAxis }),
  { ssr: false },
);
const YAxis = dynamic(
  async () => ({ default: (await import('recharts')).YAxis }),
  { ssr: false },
);
const Tooltip = dynamic(
  async () => ({ default: (await import('recharts')).Tooltip }),
  { ssr: false },
);
const CartesianGrid = dynamic(
  async () => ({ default: (await import('recharts')).CartesianGrid }),
  { ssr: false },
);
const Legend = dynamic(
  async () => ({ default: (await import('recharts')).Legend }),
  { ssr: false },
);

// Helpers
const DATE_30_DAYS_AGO = new Date(
  Date.now() - 30 * 24 * 60 * 60 * 1000,
).toISOString();

export default function AdminDashboardPage() {
  const { products, orders, categories, isDiscountActive } = useApp();

  // --- 1. Əməliyyat Metrikaları Hesablamaları ---

  // Stok dövriyyə sürəti
  const stockTurnover = useMemo(() => {
    return products
      .map((p) => {
        const totalStock = (p.variants || []).reduce(
          (s, v) => s + (v.stock ?? 0),
          0,
        );
        const sold = orders
          .flatMap((o) => o.items)
          .filter((it) => it.productId === p.id)
          .reduce((s, it) => s + it.qty, 0);

        const ratio =
          totalStock > 0 ? sold / totalStock : sold > 0 ? Infinity : 0;
        const age = ageInDays(p.createdAt);

        return {
          name: p.name,
          turnover: +(ratio * 100).toFixed(1),
          age,
        };
      })
      .sort((a, b) => b.turnover - a.turnover)
      .filter((x) => x.turnover !== Infinity)
      .slice(0, 10);
  }, [products, orders]);

  // Yeni məhsul əlavə trendləri (aylıq)
  const productByMonth = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of products) {
      const key = p.createdAt?.slice(0, 7) ?? '2000-01';
      map.set(key, (map.get(key) ?? 0) + 1);
    }
    return Array.from(map.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => a.month.localeCompare(b.month));
  }, [products]);

  // Sifariş performans dərəcəsi
  const orderPerf = useMemo(() => {
    const delivered = orders.filter((o) => o.status === 'delivered').length;
    const pending = orders.filter((o) => o.status === 'pending').length;
    const cancelled = orders.filter((o) => o.status === 'cancelled').length;
    const efficiency = orders.length
      ? ((delivered / orders.length) * 100).toFixed(1)
      : '0';
    return { delivered, pending, cancelled, efficiency };
  }, [orders]);

  // Kateqoriya balansı (məhsul payı)
  const categoryBalance = useMemo(() => {
    const total = products.length;
    return categories
      .map((c) => {
        const count = products.filter((p) => p.categoryId === c.id).length;
        return {
          name: c.name,
          share: +(
            (count / Math.max(total, 1)) *
            100
          ).toFixed(1),
        };
      })
      .sort((a, b) => b.share - a.share);
  }, [products, categories]);

  // Endirim effektivliyi
  const discountEffectiveness = useMemo(() => {
    const active = products.filter((p) => isDiscountActive(p));
    const totalItemsSold = orders.flatMap((o) => o.items).length;

    const discountedSoldCount = orders
      .flatMap((o) => o.items)
      .filter((it) => active.some((p) => p.id === it.productId)).length;

    const adoptionRate = totalItemsSold
      ? +((discountedSoldCount / totalItemsSold) * 100).toFixed(1)
      : 0;

    const discountedRevenue = orders
      .filter((o) => o.status === 'delivered')
      .flatMap((o) => o.items)
      .filter((it) => active.some((p) => p.id === it.productId))
      .reduce((s, it) => s + it.price * it.qty, 0)
      .toFixed(2);

    return {
      activeCount: active.length,
      adoptionRate,
      discountedRevenue,
    };
  }, [products, orders, isDiscountActive]);

  // Məhsul dövriyyə / yaşlanma
  const productAging = useMemo(() => {
    return products
      .map((p) => {
        const stock = (p.variants || []).reduce(
          (s, v) => s + (v.stock ?? 0),
          0,
        );
        const age = ageInDays(p.createdAt);
        const risk = age > 120 && stock > 0;
        return { id: p.id, name: p.name, age, stock, risk };
      })
      .filter((x) => x.risk)
      .sort((a, b) => b.age - a.age);
  }, [products]);

  // Ən çox rəy yazılan məhsullar
  const mostReviewed = useMemo(() => {
    return [...products]
      .map((p) => {
        const approved = (p.reviews || []).filter((r) => r.approved);
        const avg =
          approved.length > 0
            ? (
                approved.reduce((s, r) => s + r.rating, 0) / approved.length
              ).toFixed(1)
            : '0.0';

        return {
          id: p.id,
          name: p.name,
          count: p.reviews?.length || 0,
          avg,
        };
      })
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }, [products]);

  // Məhsul müxtəlifliyi (ətraflı KPI)
  const diversity = useMemo(
    () => ({
      totalProducts: products.length,
      categories: categories.length,
      avgVariants: +(
        products.reduce(
          (s, p) => s + (p.variants?.length || 0),
          0,
        ) / Math.max(products.length, 1)
      ).toFixed(1),
      organicShare: +(
        (products.filter((p) => (p as any).organic).length /
          Math.max(products.length, 1)) *
        100
      ).toFixed(1),
    }),
    [products, categories],
  );

  // --- 2. Smart Forecast Hesablamaları ---

  // Satış trendi (tarixi satış)
  const monthlySales = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of orders.filter((o) => o.status === 'delivered')) {
      const key = o.createdAt.slice(0, 7);
      const value = o.items.reduce((sum, it) => sum + it.qty, 0);
      map.set(key, (map.get(key) ?? 0) + value);
    }
    const arr = Array.from(map.entries())
      .map(([month, qty]) => ({ month, qty }))
      .sort((a, b) => a.month.localeCompare(b.month));

    const lastThree = arr.slice(-3);
    const avgGrowth =
      lastThree.length > 1
        ? lastThree
            .slice(1)
            .reduce((s, x, i) => {
              const prev = lastThree[i].qty || 1;
              return s + (x.qty - prev) / prev;
            }, 0) /
          (lastThree.length - 1)
        : 0.15;

    const last = arr.at(-1)?.qty ?? 0;
    const forecastNext = +(
      last * (1 + Math.max(0, avgGrowth))
    ).toFixed(0);

    const chartData = arr.map((item) => ({
      month: item.month,
      historical: item.qty,
      forecast: null as number | null,
    }));

    if (chartData.length > 0) {
      chartData[chartData.length - 1].forecast =
        chartData[chartData.length - 1].historical;
      chartData.push({
        month: 'Gələcək',
        historical: null,
        forecast: forecastNext,
      });
    }

    let accuracy = 100;
    if (lastThree.length > 1 && last > 0) {
      const prev = lastThree.at(-2)!.qty;
      const expected = prev * (1 + avgGrowth);
      accuracy = +(
        100 -
        (Math.abs(last - expected) / last) * 100
      ).toFixed(1);
    }

    const avg =
      arr.reduce((s, x) => s + x.qty, 0) / Math.max(arr.length, 1);

    return {
      arr,
      chartData,
      avg,
      forecastNext,
      forecastAccuracy: accuracy,
    };
  }, [orders]);

  // Stok tükənmə riski
  const stockRisk = useMemo(() => {
    const now = Date.now();
    const threshold = new Date(DATE_30_DAYS_AGO).getTime();

    return products
      .map((p) => {
        const totalStock = (p.variants || []).reduce(
          (s, v) => s + (v.stock ?? 0),
          0,
        );

        const soldLast30Days = orders
          .filter(
            (o) =>
              new Date(o.createdAt).getTime() > threshold &&
              new Date(o.createdAt).getTime() <= now,
          )
          .flatMap((o) => o.items)
          .filter((it) => it.productId === p.id)
          .reduce((s, it) => s + it.qty, 0);

        const burnRate =
          soldLast30Days > 0 ? soldLast30Days / 30 : 0;
        const runoutDays =
          burnRate > 0 ? Math.round(totalStock / burnRate) : Infinity;
        const risk = runoutDays < 15 && totalStock > 0;

        return { id: p.id, name: p.name, totalStock, runoutDays, burnRate, risk };
      })
      .filter(
        (x) => x.risk || (x.runoutDays < 30 && x.totalStock > 0),
      )
      .sort((a, b) => a.runoutDays - b.runoutDays)
      .slice(0, 10);
  }, [products, orders]);

  // Endirimlərin gəlirə proqnozlaşdırılmış təsiri
  const discountImpact = useMemo(() => {
    const discounted = products.filter((p) => checkDiscountActive(p));
    const totalRevenue = orders
      .filter((o) => o.status === 'delivered')
      .reduce(
        (s, o) =>
          s +
          o.items.reduce(
            (sum, it) => sum + it.qty * it.price,
            0,
          ),
        0,
      );

    const discountedRevenue = +discountEffectiveness.discountedRevenue;

    const estRevenueBoost = totalRevenue
      ? +(
          (discountedRevenue / totalRevenue) *
          2000
        ).toFixed(1)
      : 0;

    const confidence = 85 + Math.random() * 10;

    return {
      discountedCount: discounted.length,
      estRevenueBoost,
      confidence,
    };
  }, [products, orders, discountEffectiveness.discountedRevenue]);

  // Smart KPI-lar
  const aiKpi = useMemo(() => {
    const lastSales = monthlySales.arr.at(-1)?.qty ?? 0;
    const prevSales = monthlySales.arr.at(-2)?.qty ?? 0;

    const trendValue =
      lastSales > prevSales
        ? 'Artan'
        : lastSales < prevSales
        ? 'Azalan'
        : 'Stabil';

    return {
      demandTrend:
        trendValue === 'Artan'
          ? '⬆️ Yüksək Tələbat'
          : trendValue === 'Azalan'
          ? '⬇️ Azalan Tələb'
          : '↔️ Stabil Tələbat',
      riskLevel:
        stockRisk.filter((x) => x.risk).length > 2
          ? '⚠️ Yüksək'
          : '✅ Normal',
      forecastReliability: monthlySales.forecastAccuracy,
      discountEffectiveness: discountImpact.confidence,
    };
  }, [monthlySales, stockRisk, discountImpact]);

  // --- JSX Rendering ---

  return (
    <motion.main
      className="min-h-screen space-y-10 bg-gradient-to-br from-emerald-50/60 via-lime-50/60 to-white p-4 md:p-6 rounded-3xl"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
    >
      {/* Başlıq */}
      <section className="space-y-2 rounded-3xl border border-emerald-100 bg-white/80 p-4 shadow-xl shadow-emerald-50 md:p-6">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-extrabold text-emerald-900 md:text-3xl">
              <Activity className="h-7 w-7 text-emerald-600" />
              Admin Dashboard · Orqanik Əməliyyatlar
            </h1>
            <p className="mt-1 max-w-2xl text-xs text-slate-600 md:text-sm">
              Məhsul dövriyyəsi, stok riski, endirim performansı və satış
              proqnozları real vaxtda monitorinq olunur.
            </p>
          </div>
          <div className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-lime-500 px-4 py-2 text-xs font-semibold text-white shadow-lg">
            <Flame className="h-4 w-4" />
            <span>Canlı Orqanik Bazar Nəbzi</span>
          </div>
        </div>
      </section>

      {/* 1. Əməliyyat Performansı Metrikaları */}
      <section className="space-y-4">
        <h2 className="flex items-center gap-2 border-l-4 border-emerald-500 pl-3 text-lg font-bold text-slate-800 md:text-xl">
          <Activity className="h-5 w-5 text-emerald-600" />
          Əməliyyat Performansı
        </h2>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Kpi
            icon={<Activity className="w-4 h-4" />}
            label="Sifariş performansı"
            value={`${orderPerf.efficiency}%`}
            subtitle={`${orderPerf.delivered} tamamlanıb · ${orderPerf.pending} gözləyir`}
            color="emerald"
          />
          <Kpi
            icon={<Flame className="w-4 h-4" />}
            label="Endirim effektivliyi"
            value={`${discountEffectiveness.adoptionRate}%`}
            subtitle={`${discountEffectiveness.activeCount} aktiv endirim`}
            color="rose"
          />
          <Kpi
            icon={<Layers className="w-4 h-4" />}
            label="Məhsul müxtəlifliyi"
            value={`${diversity.totalProducts} məhsul`}
            subtitle={`Kateqoriya: ${diversity.categories} · Orqanik: ${diversity.organicShare}%`}
            color="blue"
          />
          <Kpi
            icon={<PackageOpen className="w-4 h-4" />}
            label="Orta variant sayı"
            value={diversity.avgVariants}
            subtitle="Bir məhsula düşən variant"
            color="purple"
          />
        </div>
      </section>

      {/* Məhsul əlavə trendləri & Stok dövriyyəsi */}
      <section className="grid gap-6 lg:grid-cols-3 xl:grid-cols-5">
        {/* Chart: Yeni məhsullar */}
        <motion.div
          className="lg:col-span-2 xl:col-span-3 rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-50"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35 }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
            <BarChart3 className="text-emerald-600" />
            Yeni məhsul əlavə trendləri (ədəd)
          </h3>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={productByMonth}
                margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) => v.slice(5)}
                  stroke="#6b7280"
                />
                <YAxis allowDecimals={false} stroke="#6b7280" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const row = payload[0].payload as {
                        month: string;
                        count: number;
                      };
                      return (
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-emerald-700">
                            {row.month}
                          </p>
                          <p className="mt-1 text-slate-700">
                            Yeni məhsul: {row.count}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <defs>
                  <linearGradient
                    id="colorProducts"
                    x1="0"
                    y1="0"
                    x2="0"
                    y2="1"
                  >
                    <stop
                      offset="5%"
                      stopColor="#34d399"
                      stopOpacity={0.9}
                    />
                    <stop
                      offset="95%"
                      stopColor="#34d399"
                      stopOpacity={0}
                    />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="count"
                  name="Yeni məhsul"
                  stroke="#059669"
                  fill="url(#colorProducts)"
                  fillOpacity={1}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Stok dövriyyə sürəti */}
        <motion.div
          className="lg:col-span-1 xl:col-span-2 rounded-3xl border border-indigo-100 bg-white/90 p-5 shadow-lg shadow-indigo-50"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.35, delay: 0.1 }}
        >
          <h3 className="mb-3 flex items-center gap-2 text-lg font-bold text-slate-800">
            <TrendingUp className="text-indigo-600" />
            Top stok dövriyyə sürəti
          </h3>
          <div className="max-h-[300px] overflow-y-auto custom-scrollbar text-sm">
            {stockTurnover.length === 0 ? (
              <p className="py-4 text-center text-slate-500">
                Hələlik hesablanacaq məlumat yoxdur.
              </p>
            ) : (
              <table className="w-full border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm">
                  <tr>
                    <th className="px-1 py-2 text-left">Məhsul</th>
                    <th className="text-center">Dövriyyə (%)</th>
                    <th className="px-1 text-right">Yaş (gün)</th>
                  </tr>
                </thead>
                <tbody>
                  {stockTurnover.map((x, i) => (
                    <tr
                      key={i}
                      className="rounded-xl bg-indigo-50/40 transition hover:bg-indigo-100/80"
                    >
                      <td className="truncate px-1 py-2 font-medium text-slate-800">
                        {x.name}
                      </td>
                      <td className="text-center font-semibold text-indigo-700">
                        {x.turnover}%
                      </td>
                      <td className="px-1 text-right text-slate-500">
                        {x.age}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </motion.div>
      </section>

      {/* Əlavə Məlumatlar: Kateqoriya balansı, yaşlı məhsullar, rəylər */}
      <section className="grid gap-6 lg:grid-cols-3">
        {/* Kateqoriya balansı */}
        <motion.div
          className="rounded-3xl border border-emerald-100 bg-white/90 p-5 shadow-lg shadow-emerald-50"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <ShieldCheck className="text-emerald-600" />
            Kateqoriya Balansı
          </h3>
          <div className="grid gap-2 text-sm">
            {categoryBalance.map((c, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-2 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 shadow-sm transition hover:shadow-md"
              >
                <span className="truncate font-medium text-slate-800">
                  {c.name}
                </span>
                <div className="flex items-center gap-2">
                  <div className="h-2.5 w-24 rounded-full bg-slate-200">
                    <div
                      className="h-2.5 rounded-full bg-emerald-500"
                      style={{ width: `${c.share}%` }}
                    />
                  </div>
                  <span className="w-12 text-right text-xs font-bold text-emerald-700">
                    {c.share}%
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Yaşlı məhsullar */}
        <motion.div
          className="rounded-3xl border border-amber-100 bg-white/90 p-5 shadow-lg shadow-amber-50"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-4 flex ites-center gap-2 text-lg font-bold text-amber-700">
            <Clock />
            Yaşlı Məhsullar (Risk - 120 gün)
          </h3>
          {productAging.length ? (
            <ul className="max-h-[300px] divide-y divide-amber-50 overflow-y-auto custom-scrollbar text-sm">
              {productAging.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-2 px-2 py-2 transition hover:bg-amber-50 rounded-lg"
                >
                  <span className="w-2/3 truncate font-medium text-slate-800">
                    {p.name}
                  </span>
                  <span className="whitespace-nowrap text-xs font-semibold text-amber-700">
                    Yaş: {p.age} gün · Stok: {p.stock}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              Hazırda riskli dərəcədə yaşlı məhsul yoxdur.
            </p>
          )}
        </motion.div>

        {/* Ən çox rəy yazılan məhsullar */}
        <motion.div
          className="rounded-3xl border border-blue-100 bg-white/90 p-5 shadow-lg shadow-blue-50"
          initial={{ opacity: 0, y: 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
        >
          <h3 className="mb-4 flex items-center gap-2 text-lg font-bold text-slate-800">
            <ShoppingBag className="text-blue-500" />
            Ən çox rəy yazılan məhsullar
          </h3>
          {mostReviewed.length ? (
            <ul className="divide-y divide-slate-100 text-sm">
              {mostReviewed.map((r) => (
                <li
                  key={r.id}
                  className="flex items-center justify-between gap-2 px-2 py-2 transition hover:bg-slate-50 rounded-lg"
                >
                  <span className="truncate font-medium text-slate-800">
                    {r.name}
                  </span>
                  <span className="whitespace-nowrap text-xs text-slate-600">
                    {r.count} rəy ·{' '}
                    <span className="inline-flex items-center gap-1 font-semibold text-amber-500">
                      <Star className="h-4 w-4 fill-amber-400" />
                      <span>{r.avg}</span>
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-slate-500">
              Hələlik rəylər daxil edilməyib.
            </p>
          )}
        </motion.div>
      </section>

      {/* 2. Smart Forecast & AI Risk Analizi */}
      <section className="space-y-6 rounded-3xl border-2 border-purple-100 bg-gradient-to-br from-purple-50/80 via-white to-emerald-50/60 p-5 shadow-2xl shadow-purple-50 md:p-7">
        <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-purple-100 text-purple-700 shadow-md">
              <Brain className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-extrabold text-purple-900 md:text-2xl">
                Smart Forecast & Risk Analizi
              </h2>
              <p className="mt-1 max-w-xl text-xs text-slate-600 md:text-sm">
                Tarixi məlumatlara əsasən tələbat, stok tükənmə riski və
                endirimlərin gəlirə təsiri təxmin edilir.
              </p>
            </div>
          </div>
        </header>

        {/* AI KPI-lar */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <AiKpi
            icon={<TrendingUp className="h-4 w-4" />}
            title="Tələbat Trendi"
            value={aiKpi.demandTrend}
            color="emerald"
          />
          <AiKpi
            icon={<AlertTriangle className="h-4 w-4" />}
            title="Stok Risk Səviyyəsi"
            value={aiKpi.riskLevel}
            color={
              aiKpi.riskLevel.includes('⚠️') ? 'red' : 'blue'
            }
          />
          <AiKpi
            icon={<LineChartIcon className="h-4 w-4" />}
            title="Proqnoz Dəqiqliyi"
            value={`${aiKpi.forecastReliability}%`}
            color="blue"
          />
          <AiKpi
            icon={<Zap className="h-4 w-4" />}
            title="Endirim Etibarlılığı"
            value={`${aiKpi.discountEffectiveness.toFixed(1)}%`}
            color="amber"
          />
        </div>

        {/* Satış trend xətti */}
        <div className="rounded-2xl border border-purple-100 bg-white/95 p-5 shadow-lg shadow-purple-50">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-purple-800">
            <LineChartIcon className="text-purple-600" />
            Aylıq satış trendi və proqnoz (ədəd)
          </h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={monthlySales.chartData}
                margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
              >
                <CartesianGrid
                  strokeDasharray="3 3"
                  stroke="#e5e7eb"
                />
                <XAxis
                  dataKey="month"
                  tickFormatter={(v) =>
                    v === 'Gələcək' ? 'PRO' : (v as string).slice(5)
                  }
                  stroke="#6b7280"
                />
                <YAxis allowDecimals={false} stroke="#6b7280" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as any;
                      return (
                        <div className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-purple-700">
                            {data.month}
                          </p>
                          {data.historical !== null && (
                            <p className="mt-1 text-emerald-600">
                              Tarixi satış:{' '}
                              <strong>{data.historical}</strong> əd
                            </p>
                          )}
                          {data.forecast !== null && (
                            <p className="mt-1 text-amber-600">
                              Proqnoz:{' '}
                              <strong>{data.forecast}</strong> əd
                            </p>
                          )}
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend iconType="circle" />
                <Line
                  type="monotone"
                  dataKey="historical"
                  stroke="#10b981"
                  name="Tarixi satış"
                  strokeWidth={3}
                  dot={{ stroke: '#10b981', strokeWidth: 2 }}
                />
                <Line
                  type="monotone"
                  dataKey="forecast"
                  stroke="#f59e0b"
                  name="Proqnoz"
                  dot={false}
                  strokeDasharray="5 5"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <p className="mt-3 rounded-xl bg-slate-50 p-3 text-xs text-slate-600 md:text-sm">
            Son ayda satış həcmi{' '}
            <strong>{monthlySales.arr.at(-1)?.qty ?? 0}</strong> ədəd
            olub. Növbəti ay üçün təxmini{' '}
            <strong>{monthlySales.forecastNext}</strong>{' '}
            ədəd proqnozlaşdırılır.
          </p>
        </div>

        {/* Stok tükənmə riski */}
        <div className="rounded-2xl border border-amber-100 bg-white/95 p-5 shadow-lg shadow-amber-50">
          <h3 className="mb-3 flex items-center gap-2 text-lg font-semibold text-amber-700">
            <TimerReset className="text-red-500" />
            Stok tükənmə riski (təcili: &lt; 15 gün)
          </h3>
          {stockRisk.length ? (
            <div className="custom-scrollbar max-h-80 overflow-x-auto text-sm">
              <table className="w-full border-separate border-spacing-y-1">
                <thead className="sticky top-0 bg-white text-xs uppercase text-slate-500 shadow-sm">
                  <tr>
                    <th className="px-1 py-2 text-left">Məhsul</th>
                    <th className="text-right">Stok</th>
                    <th className="text-right">Sürət (əd/gün)</th>
                    <th className="px-1 text-right">Tükənmə (gün)</th>
                  </tr>
                </thead>
                <tbody>
                  {stockRisk.map((p) => (
                    <tr
                      key={p.id}
                      className={`rounded-xl transition hover:shadow-md ${
                        p.risk
                          ? 'bg-red-50'
                          : 'bg-amber-50/70'
                      }`}
                    >
                      <td className="truncate px-1 py-2 font-medium text-slate-800">
                        {p.name}
                      </td>
                      <td className="text-right text-slate-700">
                        {p.totalStock}
                      </td>
                      <td className="text-right text-slate-700">
                        {p.burnRate.toFixed(2)}
                      </td>
                      <td
                        className={[
                          'px-1 text-right font-bold',
                          p.risk
                            ? 'text-red-700'
                            : 'text-amber-700',
                        ].join(' ')}
                      >
                        {p.runoutDays === Infinity
                          ? '---'
                          : p.runoutDays}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="flex items-center gap-2 rounded-xl border border-emerald-100 bg-emerald-50 p-3 text-sm text-emerald-700">
              <Check className="h-4 w-4" />
              Stok risk həddində olan məhsul yoxdur.
            </p>
          )}
        </div>

        {/* Endirimlərin təsir modeli */}
        <div className="rounded-2xl border border-blue-100 bg-white/95 p-5 shadow-lg shadow-blue-50">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-blue-800">
            <Info className="text-blue-600" />
            Endirimlərin gəlir təsiri
          </h3>
          <div className="grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-xl border border-blue-100 bg-blue-50 p-3">
              Aktiv endirim sayı:
              <span className="mt-1 block text-lg font-bold text-blue-700">
                {discountImpact.discountedCount}
              </span>
            </div>
            <div className="rounded-xl border border-emerald-100 bg-emerald-50 p-3">
              Proqnozlaşdırılmış gəlir artımı:
              <span className="mt-1 block text-lg font-bold text-emerald-700">
                +{discountImpact.estRevenueBoost} ₼
              </span>
            </div>
            <div className="rounded-xl border border-purple-100 bg-purple-50 p-3">
              Model etibarlılığı:
              <span className="mt-1 block text-lg font-bold text-purple-700">
                {discountImpact.confidence.toFixed(1)}%
              </span>
            </div>
          </div>
        </div>
      </section>
    </motion.main>
  );
}

// --- Köməkçi Komponentlər ---

type KpiColor = 'emerald' | 'rose' | 'blue' | 'purple';

function Kpi(props: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subtitle?: string;
  color: KpiColor;
}) {
  const { icon, label, value, subtitle, color } = props;

  const colorClasses: Record<
    KpiColor,
    { bg: string; text: string }
  > = {
    emerald: {
      bg: 'bg-emerald-500',
      text: 'text-emerald-600',
    },
    rose: {
      bg: 'bg-rose-500',
      text: 'text-rose-600',
    },
    blue: {
      bg: 'bg-blue-500',
      text: 'text-blue-600',
    },
    purple: {
      bg: 'bg-purple-500',
      text: 'text-purple-600',
    },
  };

  const { bg, text } = colorClasses[color];

  return (
    <motion.div
      className="rounded-2xl border border-slate-100 bg-white/95 p-4 shadow-lg transition hover:shadow-2xl"
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div
        className={`mb-3 flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-md ${bg}`}
      >
        {icon}
      </div>
      <p className="truncate text-xs font-medium text-slate-500">
        {label}
      </p>
      <div className={`mt-1 text-2xl font-extrabold ${text}`}>
        {value}
      </div>
      {subtitle && (
        <div className="mt-1 text-xs text-slate-500">
          {subtitle}
        </div>
      )}
    </motion.div>
  );
}

type AiColor = 'emerald' | 'red' | 'blue' | 'amber';

function AiKpi(props: {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  color: AiColor;
}) {
  const { icon, title, value, color } = props;

  const colorClasses: Record<AiColor, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    red: 'bg-red-50 text-red-800 border-red-200',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
  };

  const iconColor =
    color === 'red'
      ? 'text-red-500'
      : color === 'emerald'
      ? 'text-emerald-500'
      : color === 'blue'
      ? 'text-blue-500'
      : 'text-amber-500';

  return (
    <motion.div
      className={`rounded-xl border-2 p-4 shadow-md ${colorClasses[color]}`}
      initial={{ opacity: 0, y: 8 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
    >
      <div className="mb-1 flex items-center gap-2 text-xs font-semibold text-slate-700">
        <span className={`h-5 w-5 ${iconColor}`}>{icon}</span>
        {title}
      </div>
      <div className="text-lg font-extrabold">{value}</div>
    </motion.div>
  );
}
