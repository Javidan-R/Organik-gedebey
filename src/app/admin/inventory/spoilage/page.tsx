// src/app/admin/spoilage/page.tsx – TAM DÜZƏLDİLMİŞ VERSİYA
'use client';

import { useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  Skull,
  Scale,
  ThermometerSnowflake,
  Droplets,
  Trash2,
  Plus,
  CheckCircle2,
  Info,
  Activity,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { useFinance } from '@/lib/finance';
import { productTotalStock } from '@/lib/calc';
// ─── Types ──────────────────────────────────────────────────────────────
type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type RiskResult = {
  score: number;
  level: RiskLevel;
  label: string;
  color: string;
  bg: string;
  badge: string;
};

type SpoilageRow = {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  reason: string;
};

type RowMeta = {
  product: any;
  variant: any;
  totalStock: number;
  variantStock: number;
  ageDays: number;
  approxCost: number;
  rowLossCost: number;
  risk: RiskResult;
  overStock: boolean;
};

// ─── Helpers ──────────────────────────────────────────────────────────
const randomId = () => Math.random().toString(36).slice(2);
const DAY_MS = 24 * 60 * 60 * 1000;

function computeRisk(row: SpoilageRow, ctx: { ageDays: number; shelf?: number; grade?: string; stock: number }): RiskResult {
  const { ageDays, shelf, grade, stock } = ctx;
  let score = 0;

  const ratio = stock > 0 ? row.qty / stock : row.qty > 0 ? 0.7 : 0;
  score += Math.min(40, ratio * 40);

  if (shelf && shelf > 0) {
    const usage = ageDays / shelf;
    if (usage >= 1.1) score += 40;
    else if (usage >= 0.9) score += 25;
    else if (usage >= 0.7) score += 15;
  } else {
    if (ageDays > 90) score += 25;
    else if (ageDays > 60) score += 18;
    else if (ageDays > 30) score += 10;
  }

  if (grade === 'B') score += 5;
  if (grade === 'C' || grade === 'Unsorted') score += 10;

  const lower = row.reason.toLowerCase();
  if (lower.includes('temperatur') || lower.includes('soyuducu')) score += 10;
  if (lower.includes('qoxu') || lower.includes('kif')) score += 10;
  if (lower.includes('qaytarış') || lower.includes('müşteri')) score += 5;

  score = Math.max(0, Math.min(100, Math.round(score)));

  let level: RiskLevel;
  if (score < 30) level = 'low';
  else if (score < 60) level = 'medium';
  else if (score < 80) level = 'high';
  else level = 'critical';

  const meta: Record<RiskLevel, Omit<RiskResult, 'score' | 'level'>> = {
    low: { label: 'Aşağı risk', color: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-100', badge: '🟢' },
    medium: { label: 'Orta risk', color: 'text-amber-700', bg: 'bg-amber-50 border-amber-100', badge: '🟡' },
    high: { label: 'Yüksək risk', color: 'text-orange-700', bg: 'bg-orange-50 border-orange-100', badge: '🟠' },
    critical: { label: 'Kritik risk', color: 'text-rose-700', bg: 'bg-rose-50 border-rose-200', badge: '🔴' },
  };

  return { score, level, ...meta[level] } as RiskResult;
}

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} ₼`;
}

// ─── Sub‑components ──────────────────────────────────────────────────
function RiskBadge({ risk }: { risk: RiskResult }) {
  return (
    <div className={`inline-flex max-w-[120px] flex-col items-end rounded-xl border px-2 py-1 text-[10px] ${risk.bg}`}>
      <span className="flex items-center gap-1 font-semibold">
        <span>{risk.badge}</span>
        <span className={`truncate ${risk.color}`}>{risk.label}</span>
      </span>
      <span className="text-[9px] text-slate-500">Skor: {risk.score} / 100</span>
    </div>
  );
}

function SpoilageRowComponent({
  row,
  meta,
  products,
  variantsMap,
  updateRow,
  removeRow,
  submitAttempted,
}: {
  row: SpoilageRow;
  meta: RowMeta;
  products: any[];
  variantsMap: Record<string, any[]>;
  updateRow: (id: string, patch: Partial<SpoilageRow>) => void;
  removeRow: (id: string) => void;
  submitAttempted: boolean;
}) {
  const variants = variantsMap[row.productId] || [];

  const invalidProduct = submitAttempted && !row.productId;
  const invalidVariant = submitAttempted && !row.variantId;
  const invalidQty = submitAttempted && (row.qty <= 0 || meta.overStock);

  return (
    <motion.tr
      key={row.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="bg-white align-middle shadow-sm hover:bg-rose-50/40"
    >
      <td className="px-2 py-2">
        <select
          value={row.productId}
          onChange={(e) => updateRow(row.id, { productId: e.target.value, variantId: '' })}
          className={`h-9 w-40 rounded-lg border bg-white px-2 text-xs shadow-inner focus:border-rose-500 focus:outline-none md:w-48 ${
            invalidProduct ? 'border-rose-400' : 'border-slate-200'
          }`}
        >
          <option value="">Məhsul seç</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2">
        <select
          value={row.variantId}
          onChange={(e) => updateRow(row.id, { variantId: e.target.value })}
          className={`h-9 w-32 rounded-lg border bg-white px-2 text-xs shadow-inner focus:border-rose-500 focus:outline-none md:w-40 ${
            invalidVariant ? 'border-rose-400' : 'border-slate-200'
          }`}
          disabled={!row.productId}
        >
          <option value="">Variant</option>
          {variants.map((v: any) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
      </td>
      <td className="px-2 py-2 text-right">
        <input
          type="number"
          min={0}
          value={row.qty || ''}
          onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) || 0 })}
          className={`h-9 w-20 rounded-lg border bg-white px-2 text-right text-xs shadow-inner focus:border-rose-500 focus:outline-none ${
            invalidQty ? 'border-rose-400' : 'border-slate-200'
          }`}
        />
      </td>
      <td className="px-2 py-2">
        <input
          value={row.reason}
          onChange={(e) => updateRow(row.id, { reason: e.target.value })}
          className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-rose-400 focus:outline-none md:w-72"
          placeholder="Məs: temperatur, qablaşdırma zədəsi..."
        />
      </td>
      <td className="px-2 py-2 text-right text-[11px] text-slate-600">{meta.ageDays} gün</td>
      <td className="px-2 py-2 text-right text-[11px]">
        <div className="space-y-0.5">
          <div className="flex justify-between gap-2 text-slate-500">
            <span>Variant stok:</span>
            <span className="font-semibold">{meta.variantStock}</span>
          </div>
          <div className={`flex justify-between gap-2 ${meta.overStock ? 'text-rose-700 font-semibold' : 'text-slate-500'}`}>
            <span>Ziyan:</span>
            <span>{row.qty || 0}</span>
          </div>
        </div>
      </td>
      <td className="px-2 py-2 text-right text-[11px] text-rose-700">{formatCurrency(meta.rowLossCost)}</td>
      <td className="px-2 py-2 text-right">
        <RiskBadge risk={meta.risk} />
      </td>
      <td className="px-2 py-2 text-center">
        <button
          type="button"
          onClick={() => removeRow(row.id)}
          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100 transition-colors"
          aria-label="Sətri sil"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </td>
    </motion.tr>
  );
}

// ─── Main Component ──────────────────────────────────────────────────
export default function SpoilagePage() {
  const { products, adjustStock } = useApp();
  const { consumeForSale, addExpense } = useFinance();

  const [date, setDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [rows, setRows] = useState<SpoilageRow[]>([
    {
      id: randomId(),
      productId: '',
      variantId: '',
      qty: 0,
      reason: 'Tez xarab oldu (temperatur / saxlanma problemi)',
    },
  ]);
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [shake, setShake] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Variants map ────────────────────────────────────────────────────
  const variantsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    products.forEach((p) => {
      map[p.id] = p.variants || [];
    });
    return map;
  }, [products]);

  const perRowMeta = useMemo((): RowMeta[] => {
    const today = new Date(date || new Date().toISOString().slice(0, 10)).getTime();

    return rows.map((row) => {
      const product = products.find((p) => p.id === row.productId);
      const variant = product?.variants?.find((v) => v.id === row.variantId);
      const totalStock = product ? productTotalStock(product) : 0;
      const variantStock = variant?.stock ?? 0;
      const stockForRisk = variantStock || totalStock;

      const batchDateRaw = variant?.batchDate || product?.createdAt;
      const batchTime = batchDateRaw ? new Date(batchDateRaw).getTime() : today;
      const ageDays = Math.max(0, Math.round((today - batchTime) / DAY_MS));

      const approxCost = variant?.arrivalCost ?? variant?.costPrice ?? product?.costPrice ?? 0;
      const rowLossCost = approxCost * (row.qty || 0);

      const risk = computeRisk(row, {
        ageDays,
        shelf: product?.shelfLifeDays,
        grade: product?.grade,
        stock: stockForRisk,
      });

      const overStock = row.qty > 0 && variantStock > 0 && row.qty > variantStock;

      return {
        product,
        variant,
        totalStock,
        variantStock,
        ageDays,
        approxCost,
        rowLossCost,
        risk,
        overStock,
      };
    });
  }, [rows, products, date]);

  const totalLossCost = useMemo(() => perRowMeta.reduce((s, m) => s + m.rowLossCost, 0), [perRowMeta]);

  const highestRisk = useMemo(() => {
    let maxScore = 0;
    let label = 'Hələ risk hesablanmayıb';
    let color = 'text-slate-600';
    let badge = 'ℹ️';

    perRowMeta.forEach((m) => {
      if (m.risk.score > maxScore) {
        maxScore = m.risk.score;
        label = m.risk.label;
        color = m.risk.color;
        badge = m.risk.badge;
      }
    });

    return { maxScore, label, color, badge };
  }, [perRowMeta]);

  const hasCriticalOverStock = perRowMeta.some((m, idx) => rows[idx]?.qty > 0 && m.overStock);
  const hasAnyValidRow = rows.some(
    (r, idx) => r.productId && r.variantId && r.qty > 0 && !(perRowMeta[idx]?.overStock ?? true)
  );

  const addRow = useCallback(() => {
    setRows((prev) => [
      {
        id: randomId(),
        productId: '',
        variantId: '',
        qty: 0,
        reason: 'Tez xarab oldu (temperatur / saxlanma problemi)',
      },
      ...prev,
    ]);
  }, []);

  const updateRow = useCallback((id: string, patch: Partial<SpoilageRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
  }, []);

  const resetForm = useCallback(() => {
    setRows([
      {
        id: randomId(),
        productId: '',
        variantId: '',
        qty: 0,
        reason: 'Tez xarab oldu (temperatur / saxlanma problemi)',
      },
    ]);
    setSubmitAttempted(false);
    setSuccess(null);
    setError(null);
  }, []);

  const triggerShake = useCallback(() => {
    setShake(true);
    setTimeout(() => setShake(false), 350);
  }, []);

  const validateForm = useCallback(() => {
    // Check if there are any valid rows
    for (let i = 0; i < rows.length; i++) {
      const r = rows[i]!;                   // rows[i] exists
      const meta = perRowMeta[i]!;          // perRowMeta has same length
      if (r.productId && r.variantId && r.qty > 0 && !meta.overStock) {
        return true;                        // at least one valid
      }
    }

    setError('Formada xətalar var. Zəhmət olmasa düzgün məlumat daxil edin.');
    return false;
  }, [rows, perRowMeta]);

  const handleSubmit = useCallback(async () => {
    setSubmitAttempted(true);
    setSuccess(null);
    setError(null);

    if (!validateForm()) {
      triggerShake();
      return;
    }

    // Build valid indices (with explicit null safety)
    const validIndexes: number[] = [];
    rows.forEach((r, idx) => {
      const meta = perRowMeta[idx];
      if (r.productId && r.variantId && r.qty > 0 && meta && !meta.overStock) {
        validIndexes.push(idx);
      }
    });

    if (validIndexes.length === 0) {
      setError('Heç bir etibarlı sətir tapılmadı.');
      triggerShake();
      return;
    }

    const spoilItems = validIndexes.map((i) => ({
      productId: rows[i]!.productId,
      variantId: rows[i]!.variantId,
      qty: rows[i]!.qty,
    }));

    setSubmitting(true);
    try {
      let totalCost = 0;
      if (consumeForSale) {
        const result = await consumeForSale(spoilItems);
        totalCost = result?.totalCost || 0;
      }

      validIndexes.forEach((i) => {
        const r = rows[i]!;
        adjustStock(r.productId, -Math.abs(r.qty), r.variantId);
      });

      const finalCost = totalCost > 0 ? totalCost : totalLossCost;
      if (finalCost > 0 && addExpense) {
        await addExpense({
          date,
          category: 'spoilage',
          amount: +finalCost.toFixed(2),
          accountId: undefined,
          description: `Ziyan / xarab olma - ${spoilItems.length} məhsul`,
        });
      }

      setSuccess(`Ziyan / xarab olma qeydi saxlanıldı. Təxmini maya itkisi: ${formatCurrency(finalCost || 0)}`);
      resetForm();
    } catch (e: any) {
      console.error('Spoilage error:', e);
      setError(e?.message || 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }, [
    rows,
    perRowMeta,
    totalLossCost,
    adjustStock,
    consumeForSale,
    addExpense,
    date,
    resetForm,
    validateForm,
    triggerShake,
  ]);

  return (
    <motion.main
      className="space-y-6 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-white p-4 md:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* Header */}
      <section className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-md shadow-rose-50 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-inner">
              <Skull className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-rose-900 md:text-2xl">Ziyan / Spoilage · ERP</h1>
              <p className="mt-1 max-w-xl text-xs text-slate-600 md:text-sm">
                Xarab olma, çəkidə itki və keyfiyyət problemi nəticəsində stokdan çıxan məhsullar üçün risk skoru,
                avtomatik xəbərdarlıqlar və maya itkisi analizi.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Ümumi təxmini maya itkisi: <strong>{formatCurrency(totalLossCost)}</strong>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-100">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              <span>
                Risk səviyyəsi: <span className={highestRisk.color}>
                  {highestRisk.badge} {highestRisk.label} · {highestRisk.maxScore}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Controls */}
      <section className="grid gap-4 md:grid-cols-[1.3fr_1fr]">
        <motion.div
          className="space-y-3 rounded-2xl border border-amber-100 bg-white/95 p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
            <Droplets className="h-4 w-4 text-amber-500" />
            Ümumi parametrlər
          </h2>
          <div className="grid gap-3 text-xs md:grid-cols-3">
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Tarix</label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-rose-400 focus:outline-none"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <span className="block text-[11px] font-semibold text-slate-600">Qısa izah</span>
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] text-slate-600">
                Ziyan qeydi həm stokdan miqdar azaldır, həm də maliyyədə <b>&quot;zay məhsul&quot;</b> xərcini
                formalaşdırır. Risk səviyyəsi məhsulun yaşı, raf ömrü, keyfiyyəti və miqdarına görə hesablanır.
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          className="space-y-3 rounded-2xl border border-rose-100 bg-gradient-to-br from-rose-50 to-white p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-rose-900 md:text-base">
            <ThermometerSnowflake className="h-4 w-4 text-rose-600" />
            Avtomatik risk xəbərdarlıqları
          </h2>

          <div className="space-y-2 text-[11px] text-slate-700">
            {hasCriticalOverStock && (
              <div className="flex items-start gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
                <AlertTriangle className="mt-0.5 h-4 w-4" />
                <p>Bəzi sətirlərdə ziyan miqdarı mövcud stokdan çoxdur. Bu qeydlər düzəldilmədən əməliyyat icra olunmayacaq.</p>
              </div>
            )}

            {highestRisk.maxScore >= 80 && (
              <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                <Skull className="mt-0.5 h-4 w-4" />
                <p>
                  <b>Kritik / Yüksək riskli ziyan</b> qeydi var. Saxlama şəraiti, soyuducu temperaturu və stok dövriyyəsi
                  təcili analiz olunmalıdır.
                </p>
              </div>
            )}

            {highestRisk.maxScore > 0 && highestRisk.maxScore < 80 && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <p>Ziyan qeydləri mövcuddur, lakin risk səviyyəsi nəzarət altındadır.</p>
              </div>
            )}

            {!rows.some((r) => r.productId) && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <Info className="mt-0.5 h-4 w-4" />
                <p>Ən azı bir məhsul və variant seçərək miqdar daxil et. Risk skoru və maya itkisi avtomatik hesablanacaq.</p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* Rows Table */}
      <motion.section
        className="space-y-3 rounded-3xl border border-rose-100 bg-white/95 p-4 shadow-md"
        animate={shake ? { x: [0, -8, 8, -6, 6, -3, 3, 0] } : { x: 0 }}
        transition={{ duration: 0.35 }}
      >
        <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
            <Scale className="h-5 w-5 text-rose-600" />
            Ziyan sətirləri
          </h2>
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 font-semibold text-white shadow hover:bg-rose-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Sətir əlavə et
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200 transition-colors"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Formu sıfırla
            </button>
          </div>
        </div>

        <div className="custom-scrollbar max-h-[420px] overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full border-separate border-spacing-y-1 text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase text-slate-500 shadow">
              <tr>
                <th className="px-2 py-2 text-left">Məhsul</th>
                <th className="px-2 py-2 text-left">Variant</th>
                <th className="px-2 py-2 text-right">Miqdar</th>
                <th className="px-2 py-2 text-left">Səbəb</th>
                <th className="px-2 py-2 text-right">Yaş (gün)</th>
                <th className="px-2 py-2 text-right">Stok / Ziyan</th>
                <th className="px-2 py-2 text-right">Maya itkisi</th>
                <th className="px-2 py-2 text-right">Risk</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {rows.map((row, idx) => {
                  const meta = perRowMeta[idx]!;          // safe because arrays are aligned
                  return (
                    <SpoilageRowComponent
                      key={row.id}
                      row={row}
                      meta={meta}
                      products={products}
                      variantsMap={variantsMap}
                      updateRow={updateRow}
                      removeRow={removeRow}
                      submitAttempted={submitAttempted}
                    />
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td colSpan={9} className="px-3 py-6 text-center text-xs text-slate-500">
                      Hələ ziyan sətiri əlavə edilməyib.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between text-xs">
          <p className="text-[11px] text-slate-500">
            Ziyan qeydi: seçilmiş məhsul-variantlar üçün stokdan miqdar çıxılır, maliyyə tərəfdə isə{' '}
            <b>&quot;zay məhsul&quot;</b> xərc kateqoriyası üzrə maya itkisi qeydə alınır.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
              Toplam ziyan maya təxmini: {formatCurrency(totalLossCost)}
            </span>
            <button
              type="button"
              disabled={submitting || !hasAnyValidRow}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Ziyanı təsdiqlə və stokdan çıx
            </button>
          </div>
        </div>

        {/* Status Messages */}
        <div className="space-y-2 text-xs">
          {success && (
            <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
              <CheckCircle2 className="h-4 w-4" />
              <span>{success}</span>
            </div>
          )}
          {error && (
            <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
              <AlertTriangle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </motion.section>
    </motion.main>
  );
}