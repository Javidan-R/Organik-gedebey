// src/app/admin/spoilage/page.tsx
'use client';

import { useMemo, useState } from 'react';
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
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { useFinance } from '@/lib/finance';
import { productTotalStock } from '@/lib/calc';

type SpoilageRow = {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  reason: string;
};

type RiskLevel = 'low' | 'medium' | 'high' | 'critical';

type RiskResult = {
  score: number;
  level: RiskLevel;
  label: string;
  color: string;
  bg: string;
  badge: string;
};

const randomId = () => Math.random().toString(36).slice(2);
const DAY_MS = 24 * 60 * 60 * 1000;

function computeRisk(row: SpoilageRow, ctx: { ageDays: number; shelf?: number; grade?: string; stock: number }) {
  const { ageDays, shelf, grade, stock } = ctx;
  let score = 0;

  // 1) Nisbətən nə qədər stok gedir?
  const ratio = stock > 0 ? row.qty / stock : row.qty > 0 ? 0.7 : 0;
  score += Math.min(40, ratio * 40);

  // 2) Yaş və raf ömrü
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

  // 3) Keyfiyyət dərəcəsi
  if (grade === 'B') score += 5;
  if (grade === 'C' || grade === 'Unsorted') score += 10;

  // 4) Səbəb mətni
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
    low: {
      label: 'Aşağı risk',
      color: 'text-emerald-700',
      bg: 'bg-emerald-50 border-emerald-100',
      badge: '🟢',
    },
    medium: {
      label: 'Orta risk',
      color: 'text-amber-700',
      bg: 'bg-amber-50 border-amber-100',
      badge: '🟡',
    },
    high: {
      label: 'Yüksək risk',
      color: 'text-orange-700',
      bg: 'bg-orange-50 border-orange-100',
      badge: '🟠',
    },
    critical: {
      label: 'Kritik risk',
      color: 'text-rose-700',
      bg: 'bg-rose-50 border-rose-200',
      badge: '🔴',
    },
  };

  return { score, level, ...meta[level] } as RiskResult;
}

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

  // ROW HELPERS
  function addRow() {
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
  }

  function updateRow(id: string, patch: Partial<SpoilageRow>) {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  }

  function removeRow(id: string) {
    setRows((prev) => prev.filter((r) => r.id !== id));
  }

  function resetForm() {
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
  }

  // PER-ROW CONTEXT: STOCK, AGE, COST APPROX, RISK
  const perRowMeta = useMemo(() => {
    const today = new Date(date || new Date().toISOString().slice(0, 10)).getTime();

    return rows.map((row) => {
      const product = products.find((p) => p.id === row.productId);
      const variant = product?.variants?.find((v) => v.id === row.variantId);
      const totalStock = product ? productTotalStock(product as any) : 0;
      const variantStock = variant?.stock ?? 0;
      const stockForRisk = variantStock || totalStock;

      const batchDateRaw = variant?.batchDate || product?.createdAt;
      const batchTime = batchDateRaw ? new Date(batchDateRaw).getTime() : today;
      const ageDays = Math.max(0, Math.round((today - batchTime) / DAY_MS));

      const approxCost =
        variant?.arrivalCost ??
        variant?.costPrice ??
        product?.costPrice ??
        0;

      const rowLossCost = approxCost * (row.qty || 0);

      const risk = computeRisk(row, {
        ageDays,
        shelf: product?.shelfLifeDays,
        grade: product?.grade,
        stock: stockForRisk,
      });

      const overStock =
        row.qty > 0 && variantStock > 0 && row.qty > variantStock;

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

  const totalLossCost = useMemo(
    () => perRowMeta.reduce((s, m) => s + m.rowLossCost, 0),
    [perRowMeta],
  );

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

  const hasCriticalOverStock = perRowMeta.some((m, idx) => rows[idx].qty > 0 && m.overStock);
  const hasAnyValidRow = rows.some(
    (r, idx) =>
      r.productId &&
      r.variantId &&
      r.qty > 0 &&
      !perRowMeta[idx].overStock,
  );

  function triggerShake() {
    setShake(true);
    setTimeout(() => setShake(false), 350);
  }

  async function handleCommit() {
    setSubmitAttempted(true);
    setSuccess(null);
    setError(null);

    if (!hasAnyValidRow || hasCriticalOverStock) {
      setError('Formda xətalar var, ziyan qeydi aparılmadı.');
      triggerShake();
      return;
    }

    // Valid rows only
    const validIndexes: number[] = [];
    rows.forEach((r, idx) => {
      if (
        r.productId &&
        r.variantId &&
        r.qty > 0 &&
        !perRowMeta[idx].overStock
      ) {
        validIndexes.push(idx);
      }
    });

    const spoilItems = validIndexes.map((i) => ({
      productId: rows[i].productId,
      variantId: rows[i].variantId,
      qty: rows[i].qty,
    }));

    setSubmitting(true);
    try {
      // Partiyalardan maya dəyərini çək (inventardan da düşür)
      const { totalCost } = consumeForSale(spoilItems);

      // Stoku frontend tərəfdə də azaldırıq
      validIndexes.forEach((i) => {
        const r = rows[i];
        adjustStock(r.productId, -Math.abs(r.qty), r.variantId);
      });

      // Maliyyədə "zay məhsul" xərcini yaz
      const finalCost =
        totalCost && totalCost > 0 ? totalCost : totalLossCost;

      if (finalCost > 0) {
        addExpense({
          date,
          category: 'zay məhsul',
          amount: +finalCost.toFixed(2),
          accountId: undefined,
        });
      }

      setSuccess(
        `Ziyan / xarab olma qeydi saxlanıldı. Təxmini maya itkisi: ${(
          finalCost || 0
        ).toFixed(2)} ₼`,
      );
      resetForm();
    } catch (e) {
      setError('Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
      triggerShake();
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <motion.main
      className="space-y-6 rounded-3xl bg-gradient-to-br from-rose-50 via-amber-50 to-white p-4 md:p-6"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
    >
      {/* HEADER */}
      <section className="rounded-3xl border border-rose-100 bg-white/90 p-4 shadow-md shadow-rose-50 md:p-5">
        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-rose-100 text-rose-700 shadow-inner">
              <Skull className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-rose-900 md:text-2xl">
                Ziyan / Spoilage · Premium ERP
              </h1>
              <p className="mt-1 max-w-xl text-xs text-slate-600 md:text-sm">
                Xarab olma, çəkidə itki və keyfiyyət problemi nəticəsində stokdan çıxan
                məhsullar üçün risk skoru, avtomatik xəbərdarlıqlar və maya itkisi analizi.
              </p>
            </div>
          </div>

          <div className="flex flex-col items-end gap-2 text-xs md:text-sm">
            <div className="inline-flex items-center gap-2 rounded-2xl bg-rose-50 px-3 py-1 font-semibold text-rose-700">
              <AlertTriangle className="h-4 w-4" />
              <span>
                Ümumi təxmini maya itkisi:{' '}
                <strong>{totalLossCost.toFixed(2)} ₼</strong>
              </span>
            </div>
            <div className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-3 py-1 text-[11px] font-semibold text-slate-100">
              <Activity className="h-3.5 w-3.5 text-emerald-300" />
              <span>
                Risk səviyyəsi:{' '}
                <span className={highestRisk.color}>
                  {highestRisk.badge} {highestRisk.label} · {highestRisk.maxScore}%
                </span>
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* GLOBAL CONTROLS + WARNING BAR */}
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
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">Tarix</span>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-rose-400 focus:outline-none"
              />
            </label>
            <div className="space-y-1 md:col-span-2">
              <span className="block text-[11px] font-semibold text-slate-600">
                Qısa izah
              </span>
              <p className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-3 py-2 text-[11px] text-slate-600">
                Ziyan qeydi həm stokdan miqdar azaldır, həm də maliyyədə{' '}
                <b>"zay məhsul"</b> xərcini formalaşdırır. Risk səviyyəsi məhsulun yaşı,
                raf ömrü, keyfiyyəti və miqdarına görə hesablanır.
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
                <p>
                  Bəzi sətirlərdə ziyan miqdarı mövcud stokdan çoxdur. Bu qeydlər
                  düzəldilmədən əməliyyat icra olunmayacaq.
                </p>
              </div>
            )}

            {highestRisk.maxScore >= 80 && (
              <div className="flex items-start gap-2 rounded-xl border border-orange-200 bg-orange-50 px-3 py-2 text-orange-800">
                <Skull className="mt-0.5 h-4 w-4" />
                <p>
                  <b>Kritik / Yüksək riskli ziyan</b> qeydi var. Saxlama şəraiti, soyuducu
                  temperaturu və stok dövriyyəsi təcili analiz olunmalıdır.
                </p>
              </div>
            )}

            {highestRisk.maxScore > 0 && highestRisk.maxScore < 80 && (
              <div className="flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-800">
                <CheckCircle2 className="mt-0.5 h-4 w-4" />
                <p>
                  Ziyan qeydləri mövcuddur, lakin risk səviyyəsi nəzarət altındadır. Buna
                  baxmayaraq, məhsulun saxlanma tarixini və rotasiyasını mütəmadi
                  izləmək məsləhətdir.
                </p>
              </div>
            )}

            {!rows.some((r) => r.productId) && (
              <div className="flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-slate-700">
                <Info className="mt-0.5 h-4 w-4" />
                <p>
                  Ən azı bir məhsul və variant seçərək miqdar daxil et. Risk skoru və
                  maya itkisi avtomatik hesablanacaq.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* FORM + TABLE */}
      <motion.section
        className="space-y-3 rounded-3xl border border-rose-100 bg-white/95 p-4 shadow-md"
        animate={
          shake
            ? { x: [0, -8, 8, -6, 6, -3, 3, 0] }
            : { x: 0 }
        }
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
              className="inline-flex items-center gap-1 rounded-xl bg-rose-600 px-3 py-1.5 font-semibold text-white shadow hover:bg-rose-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Sətir əlavə et
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 font-medium text-slate-600 hover:bg-slate-200"
            >
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
                {rows.map((r, idx) => {
                  const meta = perRowMeta[idx];
                  const invalidProduct =
                    submitAttempted && !r.productId;
                  const invalidVariant =
                    submitAttempted && !r.variantId;
                  const invalidQty =
                    submitAttempted &&
                    (r.qty <= 0 || meta.overStock);

                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white align-middle shadow-sm hover:bg-rose-50/40"
                    >
                      {/* Product */}
                      <td className="px-2 py-2">
                        <select
                          value={r.productId}
                          onChange={(e) =>
                            updateRow(r.id, {
                              productId: e.target.value,
                              variantId: '',
                            })
                          }
                          className={`h-9 w-40 rounded-lg border bg-white px-2 text-xs shadow-inner focus:border-rose-500 focus:outline-none md:w-48 ${
                            invalidProduct
                              ? 'border-rose-400'
                              : 'border-slate-200'
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

                      {/* Variant */}
                      <td className="px-2 py-2">
                        <select
                          value={r.variantId}
                          onChange={(e) =>
                            updateRow(r.id, {
                              variantId: e.target.value,
                            })
                          }
                          className={`h-9 w-32 rounded-lg border bg-white px-2 text-xs shadow-inner focus:border-rose-500 focus:outline-none md:w-40 ${
                            invalidVariant
                              ? 'border-rose-400'
                              : 'border-slate-200'
                          }`}
                        >
                          <option value="">Variant</option>
                          {(meta.product?.variants ?? []).map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </td>

                      {/* Qty */}
                      <td className="px-2 py-2 text-right">
                        <motion.input
                          type="number"
                          min={0}
                          value={r.qty || ''}
                          onChange={(e) =>
                            updateRow(r.id, {
                              qty:
                                Number(e.target.value) || 0,
                            })
                          }
                          className={`h-9 w-20 rounded-lg border bg-white px-2 text-right text-xs shadow-inner focus:border-rose-500 focus:outline-none ${
                            invalidQty
                              ? 'border-rose-400'
                              : 'border-slate-200'
                          }`}
                          animate={
                            invalidQty
                              ? { x: [0, -4, 4, -3, 3, 0] }
                              : { x: 0 }
                          }
                          transition={{ duration: 0.2 }}
                        />
                      </td>

                      {/* Reason */}
                      <td className="px-2 py-2">
                        <input
                          value={r.reason}
                          onChange={(e) =>
                            updateRow(r.id, {
                              reason: e.target.value,
                            })
                          }
                          className="h-9 w-56 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-rose-400 focus:outline-none md:w-72"
                          placeholder="Məs: temperatur, qablaşdırma zədəsi, çəkidə itki..."
                        />
                      </td>

                      {/* Age */}
                      <td className="px-2 py-2 text-right text-[11px] text-slate-600">
                        {meta.ageDays} gün
                      </td>

                      {/* Stock / qty */}
                      <td className="px-2 py-2 text-right text-[11px]">
                        <div className="space-y-0.5">
                          <div className="flex justify-between gap-2 text-slate-500">
                            <span>Variant stok:</span>
                            <span className="font-semibold">
                              {meta.variantStock}
                            </span>
                          </div>
                          <div
                            className={`flex justify-between gap-2 ${
                              meta.overStock
                                ? 'text-rose-700 font-semibold'
                                : 'text-slate-500'
                            }`}
                          >
                            <span>Ziyan:</span>
                            <span>{r.qty || 0}</span>
                          </div>
                        </div>
                      </td>

                      {/* Loss cost */}
                      <td className="px-2 py-2 text-right text-[11px] text-rose-700">
                        {meta.rowLossCost.toFixed(2)} ₼
                      </td>

                      {/* Risk */}
                      <td className="px-2 py-2 text-right">
                        <div
                          className={`inline-flex max-w-[120px] flex-col items-end rounded-xl border px-2 py-1 text-[10px] ${meta.risk.bg}`}
                        >
                          <span className="flex items-center gap-1 font-semibold">
                            <span>{meta.risk.badge}</span>
                            <span
                              className={`truncate ${meta.risk.color}`}
                            >
                              {meta.risk.label}
                            </span>
                          </span>
                          <span className="text-[9px] text-slate-500">
                            Skor: {meta.risk.score} / 100
                          </span>
                        </div>
                      </td>

                      {/* Remove */}
                      <td className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => removeRow(r.id)}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-rose-50 text-rose-600 hover:bg-rose-100"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </motion.tr>
                  );
                })}
                {!rows.length && (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-3 py-6 text-center text-xs text-slate-500"
                    >
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
            Ziyan qeydi: seçilmiş məhsul-variantlar üçün stokdan miqdar çıxılır, maliyyə
            tərəfdə isə <b>"zay məhsul"</b> xərc kateqoriyası üzrə maya itkisi qeydə alınır.
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-rose-50 px-3 py-1 text-[11px] font-semibold text-rose-700">
              Toplam ziyan maya təxmini: {totalLossCost.toFixed(2)} ₼
            </span>
            <button
              type="button"
              disabled={submitting}
              onClick={handleCommit}
              className="inline-flex items-center gap-2 rounded-2xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-rose-200 hover:bg-rose-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Ziyanı təsdiqlə və stokdan çıx
            </button>
          </div>
        </div>

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
