// src/app/admin/inventory/page.tsx
'use client';

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  PackageSearch,
  BatteryWarning,
  TrendingDown,
  RefreshCw,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
  CheckCircle2,
  Filter,
  Search,
  Plus,
  Minus,
  Activity,
  Layers,
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { productTotalStock, ageInDays } from '@/lib/calc';
import type { Product, Variant } from '@/lib/types';

type InventoryStatus = 'ok' | 'low' | 'critical';

type InventoryRow = {
  product: Product;
  totalStock: number;
  minStock: number;
  status: InventoryStatus;
  lowBy: number;
  ageDays: number;
  variants: Variant[];
};

type FilterMode = 'all' | 'low' | 'critical';

export default function InventoryPage() {
  const { products, categories, adjustStock } = useApp();

  const [search, setSearch] = useState('');
  const [filterMode, setFilterMode] = useState<FilterMode>('all');

  // Simulation panel state
  const [simProductId, setSimProductId] = useState('');
  const [simVariantId, setSimVariantId] = useState('');
  const [simDelta, setSimDelta] = useState(0);
  const [simMessage, setSimMessage] = useState<string | null>(null);
  const [simError, setSimError] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  // -----------------------------
  // Derive inventory rows
  // -----------------------------
  const rows: InventoryRow[] = useMemo(() => {
    return products.map((p) => {
      const totalStock = productTotalStock(p as any);
      const minStock = (p.minStock ?? 0) > 0 ? p.minStock! : 5;
      const lowBy = totalStock < minStock ? minStock - totalStock : 0;
      let status: InventoryStatus = 'ok';

      if (totalStock <= 0) status = 'critical';
      else if (totalStock <= minStock) status = 'low';

      const ageDays = ageInDays(p.createdAt);

      return {
        product: p as Product,
        totalStock,
        minStock,
        lowBy,
        status,
        ageDays,
        variants: (p.variants ?? []) as Variant[],
      };
    });
  }, [products]);

  const lowStockCount = rows.filter((r) => r.status === 'low').length;
  const criticalCount = rows.filter((r) => r.status === 'critical').length;

  const filteredRows = useMemo(() => {
    let list = rows;

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((row) => {
        const p = row.product;
        const category = categories.find((c) => c.id === p.categoryId);
        return (
          p.name.toLowerCase().includes(q) ||
          p.slug.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)) ||
          category?.name.toLowerCase().includes(q)
        );
      });
    }

    if (filterMode === 'low') {
      list = list.filter((r) => r.status === 'low');
    } else if (filterMode === 'critical') {
      list = list.filter((r) => r.status === 'critical');
    }

    // Most risky first
    return list.sort((a, b) => {
      const weight = (s: InventoryStatus) =>
        s === 'critical' ? 3 : s === 'low' ? 2 : 1;
      const diff = weight(b.status) - weight(a.status);
      if (diff !== 0) return diff;

      // Then by how much below min-stock
      const lowDiff = b.lowBy - a.lowBy;
      if (lowDiff !== 0) return lowDiff;

      // Then by age
      return b.ageDays - a.ageDays;
    });
  }, [rows, search, filterMode, categories]);

  const totalProducts = rows.length;
  const lowShare = totalProducts
    ? ((lowStockCount + criticalCount) / totalProducts) * 100
    : 0;

  // -----------------------------
  // Simulation meta
  // -----------------------------
  const simProduct: Product | undefined = useMemo(
    () => products.find((p) => p.id === simProductId) as Product | undefined,
    [products, simProductId],
  );
  const simVariants: Variant[] = useMemo(
    () => (simProduct?.variants ?? []) as Variant[],
    [simProduct],
  );
  const simVariant: Variant | undefined = useMemo(
    () => simVariants.find((v) => v.id === simVariantId),
    [simVariants, simVariantId],
  );

  const currentStock = useMemo(() => {
    if (!simProduct) return 0;
    if (!simVariant) return productTotalStock(simProduct as any);
    return simVariant.stock ?? 0;
  }, [simProduct, simVariant]);

  const simMinStock = useMemo(() => {
    if (!simProduct) return 0;
    return (simProduct.minStock ?? 0) > 0 ? simProduct.minStock! : 5;
  }, [simProduct]);

  const newStock = currentStock + simDelta;

  const simStatus: InventoryStatus | null = useMemo(() => {
    if (!simProduct) return null;
    if (newStock <= 0) return 'critical';
    if (newStock <= simMinStock) return 'low';
    return 'ok';
  }, [simProduct, newStock, simMinStock]);

  const simWillTriggerAlert = simStatus === 'low' || simStatus === 'critical';

  // -----------------------------
  // Actions
  // -----------------------------
  function quickAdjust(productId: string, variantId: string | undefined, delta: number) {
    if (!delta) return;
    adjustStock(productId, delta, variantId);
  }

  async function applySimulation() {
    setSimMessage(null);
    setSimError(null);

    if (!simProduct || !simVariant || !simDelta) {
      setSimError('Məhsul, variant və müsbət/mənfi miqdar seç.');
      return;
    }

    setApplying(true);
    try {
      adjustStock(simProduct.id, simDelta, simVariant.id);
      setSimMessage(
        `${simProduct.name} (${simVariant.name}) üçün stok ${simDelta > 0 ? '+' : ''}${simDelta} dəyişdi. Yeni stok təxminən ${newStock} ədəd.`,
      );
      setSimDelta(0);
    } catch {
      setSimError('Stok dəyişdirilərkən xəta baş verdi.');
    } finally {
      setApplying(false);
    }
  }

  // -----------------------------
  // JSX
  // -----------------------------
  return (
    <motion.main
      className="min-h-screen space-y-8 rounded-3xl bg-gradient-to-br from-emerald-50 via-lime-50/70 to-white p-4 md:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* HEADER */}
      <section className="rounded-3xl border border-emerald-100 bg-white/90 p-4 shadow-lg shadow-emerald-50 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
              <PackageSearch className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-emerald-900 md:text-2xl">
                Inventory Management · Premium
              </h1>
              <p className="mt-1 max-w-xl text-xs text-slate-600 md:text-sm">
                Real-time stok hərəkəti, aşağı stok xəbərdarlıqları və simulyasiya
                paneli ilə daha ağıllı stok idarəetməsi.
              </p>
            </div>
          </div>

          {/* Global stats */}
          <div className="grid gap-2 text-xs sm:grid-cols-3">
            <StatPill
              icon={<Layers className="h-3.5 w-3.5" />}
              label="Aktiv məhsul"
              value={totalProducts}
              tone="emerald"
            />
            <StatPill
              icon={<BatteryWarning className="h-3.5 w-3.5" />}
              label="Aşağı / kritik stok"
              value={lowStockCount + criticalCount}
              extra={`${lowShare.toFixed(1)}%`}
              tone="amber"
            />
            <StatPill
              icon={<TrendingDown className="h-3.5 w-3.5" />}
              label="Kritik stok (0 və ya aşağı)"
              value={criticalCount}
              tone="rose"
            />
          </div>
        </div>
      </section>

      {/* SEARCH + FILTER + SIMULATION PANEL */}
      <section className="grid gap-5 lg:grid-cols-[1.7fr_1.3fr]">
        {/* Search & filter */}
        <motion.div
          className="space-y-3 rounded-2xl border border-slate-100 bg-white/95 p-4 shadow"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
            <Search className="h-4 w-4 text-emerald-600" />
            Stok siyahısı · Axtarış və filter
          </h2>

          <div className="flex flex-col gap-3 md:flex-row md:items-center">
            <div className="relative flex-1">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Məhsul adı, kateqoriya və ya etiket üzrə axtar..."
                className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </div>

            <div className="flex items-center gap-1 rounded-xl bg-slate-50 px-2 py-1 text-[11px] text-slate-600">
              <Filter className="h-3.5 w-3.5" />
              Filter:
              <FilterChip
                active={filterMode === 'all'}
                label="Hamısı"
                onClick={() => setFilterMode('all')}
              />
              <FilterChip
                active={filterMode === 'low'}
                label="Aşağı stok"
                tone="amber"
                onClick={() => setFilterMode('low')}
              />
              <FilterChip
                active={filterMode === 'critical'}
                label="Kritik"
                tone="rose"
                onClick={() => setFilterMode('critical')}
              />
            </div>
          </div>

          <p className="text-[11px] text-slate-500">
            Sətirlərin rəngi stok riskini göstərir: <span className="font-semibold text-emerald-700">yaşıl</span> – normal,{' '}
            <span className="font-semibold text-amber-700">sarı</span> – aşağı stok,{' '}
            <span className="font-semibold text-rose-700">qırmızı</span> – kritik vəziyyət.
          </p>
        </motion.div>

        {/* Simulation panel */}
        <SimulationPanel
          products={products as Product[]}
          simProduct={simProduct}
          simVariant={simVariant}
          simVariants={simVariants}
          simDelta={simDelta}
          setSimDelta={setSimDelta}
          simProductId={simProductId}
          setSimProductId={setSimProductId}
          simVariantId={simVariantId}
          setSimVariantId={setSimVariantId}
          currentStock={currentStock}
          minStock={simMinStock}
          status={simStatus}
          willAlert={simWillTriggerAlert}
          applying={applying}
          onApply={applySimulation}
          message={simMessage}
          error={simError}
        />
      </section>

      {/* INVENTORY TABLE */}
      <section className="rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-md">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
            <Activity className="h-4 w-4 text-emerald-600" />
            Canlı stok hərəkəti
          </h2>
          <span className="rounded-full bg-slate-50 px-3 py-1 text-[11px] font-semibold text-slate-600">
            {filteredRows.length} məhsul göstərilir
          </span>
        </div>

        <div className="custom-scrollbar max-h-[460px] overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full border-separate border-spacing-y-1 text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase text-slate-500 shadow">
              <tr>
                <th className="px-2 py-2 text-left">Məhsul</th>
                <th className="px-2 py-2 text-left">Kateqoriya</th>
                <th className="px-2 py-2 text-center">Yaş (gün)</th>
                <th className="px-2 py-2 text-center">Min stok</th>
                <th className="px-2 py-2 text-center">Cəmi stok</th>
                <th className="px-2 py-2 text-center">Risk səviyyəsi</th>
                <th className="px-2 py-2 text-center">Quick Adjust</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {filteredRows.map((row) => {
                  const cat = categories.find(
                    (c) => c.id === row.product.categoryId,
                  );
                  const barPct = Math.max(
                    0,
                    Math.min(100, (row.totalStock / Math.max(row.minStock, 1)) * 100),
                  );

                  const color =
                    row.status === 'critical'
                      ? 'bg-rose-50 border-rose-100'
                      : row.status === 'low'
                      ? 'bg-amber-50 border-amber-100'
                      : 'bg-emerald-50/40 border-emerald-100';

                  const barColor =
                    row.status === 'critical'
                      ? 'bg-rose-500'
                      : row.status === 'low'
                      ? 'bg-amber-500'
                      : 'bg-emerald-500';

                  return (
                    <motion.tr
                      key={row.product.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      className={`align-middle ${color}`}
                    >
                      {/* Product name + tags */}
                      <td className="px-2 py-2">
                        <div className="space-y-1">
                          <div className="flex items-center gap-1.5">
                            <span className="truncate text-xs font-semibold text-slate-800 md:text-sm">
                              {row.product.name}
                            </span>
                            {row.product.organic && (
                              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                                🌿 Orqanik
                              </span>
                            )}
                            {row.product.seasonal && (
                              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                                ☀️ Mövsümi
                              </span>
                            )}
                          </div>
                          {row.product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {row.product.tags.slice(0, 3).map((t) => (
                                <span
                                  key={t}
                                  className="rounded-full bg-slate-900/5 px-2 py-0.5 text-[10px] text-slate-600"
                                >
                                  #{t}
                                </span>
                              ))}
                              {row.product.tags.length > 3 && (
                                <span className="text-[10px] text-slate-400">
                                  +{row.product.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-2 py-2 text-xs text-slate-600">
                        {cat ? (
                          <span className="inline-flex items-center rounded-full bg-slate-900/5 px-2 py-0.5">
                            {cat.name}
                          </span>
                        ) : (
                          <span className="text-[11px] text-slate-400">Kateqoriya yoxdur</span>
                        )}
                      </td>

                      {/* Age */}
                      <td className="px-2 py-2 text-center text-[11px] text-slate-600">
                        {row.ageDays}
                      </td>

                      {/* Min stock */}
                      <td className="px-2 py-2 text-center text-[11px] text-slate-600">
                        {row.minStock}
                      </td>

                      {/* Total stock + bar */}
                      <td className="px-2 py-2">
                        <div className="space-y-1 text-center">
                          <div className="flex items-center justify-center gap-1 text-[11px]">
                            <span className="font-semibold text-slate-800">
                              {row.totalStock}
                            </span>
                            {row.status !== 'ok' && (
                              <span className="text-[10px] text-rose-700">
                                {row.status === 'critical'
                                  ? 'Kritik – təcili alış'
                                  : `Min-dən ${row.lowBy} aşağı`}
                              </span>
                            )}
                          </div>
                          <div className="mx-auto h-1.5 w-32 rounded-full bg-slate-100">
                            <div
                              className={`h-1.5 rounded-full ${barColor}`}
                              style={{ width: `${barPct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      {/* Risk */}
                      <td className="px-2 py-2 text-center text-[11px]">
                        {row.status === 'critical' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-rose-100 px-2 py-0.5 font-semibold text-rose-700">
                            <AlertTriangle className="h-3 w-3" />
                            Kritik
                          </span>
                        ) : row.status === 'low' ? (
                          <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 font-semibold text-amber-700">
                            <BatteryWarning className="h-3 w-3" />
                            Aşağı stok
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 font-semibold text-emerald-700">
                            <CheckCircle2 className="h-3 w-3" />
                            Normal
                          </span>
                        )}
                      </td>

                      {/* Quick adjust */}
                      <td className="px-2 py-2 text-center">
                        <div className="inline-flex items-center gap-1 rounded-full bg-white/70 px-2 py-1 shadow-inner">
                          <button
                            type="button"
                            onClick={() => quickAdjust(row.product.id, undefined, -5)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            -5
                          </button>
                          <button
                            type="button"
                            onClick={() => quickAdjust(row.product.id, undefined, -1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-rose-50 text-rose-700 hover:bg-rose-100"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => quickAdjust(row.product.id, undefined, 1)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => quickAdjust(row.product.id, undefined, 5)}
                            className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    </motion.tr>
                  );
                })}
                {!filteredRows.length && (
                  <tr>
                    <td
                      colSpan={7}
                      className="px-3 py-6 text-center text-xs text-slate-500"
                    >
                      Axtarış və filtrə uyğun məhsul tapılmadı.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </section>
    </motion.main>
  );
}

// ------------------------------------------------------------
// Small components
// ------------------------------------------------------------
function StatPill({
  icon,
  label,
  value,
  extra,
  tone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  extra?: string;
  tone: 'emerald' | 'amber' | 'rose';
}) {
  const colors: Record<
    typeof tone,
    { bg: string; text: string; chip: string }
  > = {
    emerald: {
      bg: 'bg-emerald-50 border-emerald-100',
      text: 'text-emerald-800',
      chip: 'bg-emerald-100 text-emerald-700',
    },
    amber: {
      bg: 'bg-amber-50 border-amber-100',
      text: 'text-amber-800',
      chip: 'bg-amber-100 text-amber-700',
    },
    rose: {
      bg: 'bg-rose-50 border-rose-100',
      text: 'text-rose-800',
      chip: 'bg-rose-100 text-rose-700',
    },
  };

  const c = colors[tone];

  return (
    <div
      className={`flex items-center justify-between gap-2 rounded-2xl border px-3 py-2 text-[11px] ${c.bg}`}
    >
      <div className="flex items-center gap-2">
        <span className={`flex h-6 w-6 items-center justify-center rounded-full ${c.chip}`}>
          {icon}
        </span>
        <span className="font-medium text-slate-600">{label}</span>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-sm font-extrabold ${c.text}`}>{value}</span>
        {extra && <span className="text-[10px] text-slate-500">{extra}</span>}
      </div>
    </div>
  );
}

function FilterChip({
  active,
  label,
  tone,
  onClick,
}: {
  active: boolean;
  label: string;
  tone?: 'amber' | 'rose';
  onClick: () => void;
}) {
  const base =
    'cursor-pointer rounded-full px-2 py-0.5 text-[11px] font-semibold transition';
  if (!active) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${base} text-slate-500 hover:bg-slate-100`}
      >
        {label}
      </button>
    );
  }

  const map: Record<
    NonNullable<typeof tone>,
    { bg: string; text: string; border: string }
  > = {
    amber: {
      bg: 'bg-amber-100',
      text: 'text-amber-800',
      border: 'border-amber-300',
    },
    rose: {
      bg: 'bg-rose-100',
      text: 'text-rose-800',
      border: 'border-rose-300',
    },
  };

  const colors = tone ? map[tone] : { bg: 'bg-emerald-100', text: 'text-emerald-800', border: 'border-emerald-300' };

  return (
    <button
      type="button"
      onClick={onClick}
      className={`${base} border ${colors.bg} ${colors.text} ${colors.border}`}
    >
      {label}
    </button>
  );
}

function SimulationPanel({
  products,
  simProduct,
  simVariants,
  simVariant,
  simDelta,
  setSimDelta,
  simProductId,
  setSimProductId,
  simVariantId,
  setSimVariantId,
  currentStock,
  minStock,
  status,
  willAlert,
  applying,
  onApply,
  message,
  error,
}: {
  products: Product[];
  simProduct?: Product;
  simVariants: Variant[];
  simVariant?: Variant;
  simDelta: number;
  setSimDelta: (v: number) => void;
  simProductId: string;
  setSimProductId: (v: string) => void;
  simVariantId: string;
  setSimVariantId: (v: string) => void;
  currentStock: number;
  minStock: number;
  status: InventoryStatus | null;
  willAlert: boolean;
  applying: boolean;
  onApply: () => void;
  message: string | null;
  error: string | null;
}) {
  const newStock = currentStock + simDelta;
  const disableApply = !simProduct || !simVariant || !simDelta || applying;

  let badgeColor = 'bg-slate-100 text-slate-700';
  let label = 'Simulyasiya gözləyir';
  let icon = <RefreshCw className="h-3.5 w-3.5" />;
  if (status === 'ok') {
    badgeColor = 'bg-emerald-100 text-emerald-800';
    label = 'Normal stok səviyyəsi';
    icon = <CheckCircle2 className="h-3.5 w-3.5" />;
  } else if (status === 'low') {
    badgeColor = 'bg-amber-100 text-amber-800';
    label = 'Aşağı stok – xəbərdarlıq';
    icon = <BatteryWarning className="h-3.5 w-3.5" />;
  } else if (status === 'critical') {
    badgeColor = 'bg-rose-100 text-rose-800';
    label = 'Kritik stok – təcili həmlə';
    icon = <AlertTriangle className="h-3.5 w-3.5" />;
  }

  return (
    <motion.div
      className="space-y-3 rounded-2xl border border-emerald-100 bg-gradient-to-br from-emerald-50/70 via-white to-lime-50 p-4 shadow"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
        <ArrowUpRight className="h-4 w-4 text-emerald-600" />
        Real-time stok hərəkəti simulyasiyası
      </h2>

      <div className="grid gap-3 text-xs md:grid-cols-3">
        <label className="space-y-1 md:col-span-1">
          <span className="block font-medium text-slate-600">Məhsul</span>
          <select
            value={simProductId}
            onChange={(e) => {
              setSimProductId(e.target.value);
              setSimVariantId('');
            }}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
          >
            <option value="">Məhsul seç...</option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-1">
          <span className="block font-medium text-slate-600">Variant</span>
          <select
            value={simVariantId}
            onChange={(e) => setSimVariantId(e.target.value)}
            className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
            disabled={!simProduct}
          >
            <option value="">Variant seç...</option>
            {simVariants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-1 md:col-span-1">
          <span className="block font-medium text-slate-600">
            Miqdar dəyişimi (±)
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setSimDelta(simDelta - 5)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              -5
            </button>
            <button
              type="button"
              onClick={() => setSimDelta(simDelta - 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100"
            >
              <ArrowDownRight className="h-3.5 w-3.5" />
            </button>
            <input
              type="number"
              value={simDelta || ''}
              onChange={(e) => setSimDelta(Number(e.target.value) || 0)}
              className="h-9 flex-1 rounded-xl border border-slate-200 bg-white px-2 text-center text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
              placeholder="± miqdar"
            />
            <button
              type="button"
              onClick={() => setSimDelta(simDelta + 1)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              <ArrowUpRight className="h-3.5 w-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setSimDelta(simDelta + 5)}
              className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
            >
              +5
            </button>
          </div>
        </label>
      </div>

      {/* Info line */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
        <div className={`inline-flex items-center gap-2 rounded-full px-3 py-1 ${badgeColor}`}>
          {icon}
          <span className="font-semibold">{label}</span>
        </div>
        {simProduct && (
          <div className="flex flex-wrap items-center gap-2 text-slate-600">
            <span>
              Cari stok:{' '}
              <strong className="text-slate-900">{currentStock}</strong>
            </span>
            <span className="hidden text-slate-400 md:inline">•</span>
            <span>
              Min stok: <strong>{minStock}</strong>
            </span>
            <span className="hidden text-slate-400 md:inline">•</span>
            <span>
              Yeni stok:{' '}
              <strong
                className={
                  newStock <= 0
                    ? 'text-rose-700'
                    : newStock < minStock
                    ? 'text-amber-700'
                    : 'text-emerald-700'
                }
              >
                {isNaN(newStock) ? '—' : newStock}
              </strong>
            </span>
          </div>
        )}
      </div>

      {/* Alert preview bar */}
      {simProduct && (
        <div className="space-y-2">
          <div className="h-1.5 w-full rounded-full bg-slate-100">
            <div
              className={`h-1.5 rounded-full ${
                status === 'critical'
                  ? 'bg-rose-500'
                  : status === 'low'
                  ? 'bg-amber-500'
                  : 'bg-emerald-500'
              }`}
              style={{
                width: `${Math.max(0, Math.min(100, (newStock / Math.max(minStock, 1)) * 100))}%`,
              }}
            />
          </div>
          <p className="text-[11px] text-slate-500">
            Bu simulyasiya tətbiq edilsə, bu məhsul{' '}
            {willAlert ? (
              <span className="font-semibold text-rose-700">
                aşağı / kritik stok xəbərdarlığı
              </span>
            ) : (
              <span className="font-semibold text-emerald-700">
                təhlükəsiz stok zonasında
              </span>
            )}{' '}
            olacaq.
          </p>
        </div>
      )}

      <div className="mt-2 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <button
          type="button"
          disabled={disableApply}
          onClick={onApply}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-700 disabled:opacity-60"
        >
          <ArrowUpRight className="h-4 w-4" />
          {applying ? 'Tətbiq edilir...' : 'Simulyasiyanı stoka tətbiq et'}
        </button>

        <div className="space-y-1 text-[11px] text-slate-500">
          <p>
            Bu panel stok hərəkətini əvvəlcədən simulyasiya edir: real stok yalnız
            `Tətbiq et` düyməsini basdıqda dəyişir.
          </p>
        </div>
      </div>

      <div className="space-y-2 text-[11px]">
        {message && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
            <CheckCircle2 className="h-4 w-4" />
            <span>{message}</span>
          </div>
        )}
        {error && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
            <AlertTriangle className="h-4 w-4" />
            <span>{error}</span>
          </div>
        )}
      </div>
    </motion.div>
  );
}
