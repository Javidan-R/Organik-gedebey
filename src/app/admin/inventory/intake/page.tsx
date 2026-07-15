// src/app/admin/procurement/page.tsx – TAM DÜZƏLDİLMİŞ VERSİYA
'use client';

import { useState, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Truck,
  Package,
  Scale,
  Wallet,
  ClipboardList,
  Plus,
  Trash2,
  Calculator,
  CalendarDays,
  CheckCircle2,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { useFinance } from '@/lib/finance';
import { Button } from '@/components/atoms/button';
import { Input } from '@/components/atoms/input';
import { Select } from '@/components/atoms/select';
import { Textarea } from '@/components/atoms/textarea';

// ─── Types ──────────────────────────────────────────────────────────────
type IntakeRow = {
  id: string;
  productId: string;
  variantId: string;
  qty: number;
  unitCost: number;
  weightKg: number;
};

type CostRow = IntakeRow & {
  baseTotal: number;
  transportShare: number;
  transportPerUnit: number;
  finalUnitCost: number;
  finalTotal: number;
};

// ─── Helpers ──────────────────────────────────────────────────────────
const randomId = () => Math.random().toString(36).slice(2);

function formatCurrency(value: number): string {
  return `${value.toFixed(2)} ₼`;
}

function calculateRowCosts(row: IntakeRow, totalWeight: number, transportCost: number): CostRow {
  const baseTotal = row.unitCost * row.qty;
  const safeWeight = totalWeight > 0 ? totalWeight : 1;
  const weightShare = row.weightKg > 0 ? row.weightKg / safeWeight : 0;
  const transportShare = transportCost * weightShare;
  const transportPerUnit = row.qty > 0 ? transportShare / row.qty : 0;
  const finalUnitCost = row.unitCost + transportPerUnit;
  const finalTotal = finalUnitCost * row.qty;

  return {
    ...row,
    baseTotal,
    transportShare,
    transportPerUnit,
    finalUnitCost,
    finalTotal,
  };
}

// ─── Sub-components ──────────────────────────────────────────────────
function SummaryCard({ label, value, bold }: { label: string; value: number; bold?: boolean }) {
  return (
    <div className="flex items-center justify-between text-xs">
      <span className="text-slate-600">{label}</span>
      <span className={bold ? 'font-extrabold text-emerald-800' : 'font-semibold text-slate-800'}>
        {formatCurrency(value)}
      </span>
    </div>
  );
}

function ProcurementRow({
  row,
  products,
  variantsMap,
  updateRow,
  removeRow,
}: {
  row: CostRow;
  products: any[];
  variantsMap: Record<string, any[]>;
  updateRow: (id: string, patch: Partial<IntakeRow>) => void;
  removeRow: (id: string) => void;
}) {
  const variants = variantsMap[row.productId] || [];

  return (
    <motion.tr
      key={row.id}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      transition={{ duration: 0.15 }}
      className="bg-white/90 align-middle shadow-sm hover:bg-emerald-50/40"
    >
      <td className="px-2 py-2">
        <select
          value={row.productId}
          onChange={(e) => updateRow(row.id, { productId: e.target.value, variantId: '' })}
          className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-emerald-500 focus:outline-none md:w-48"
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
          className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-emerald-500 focus:outline-none md:w-40"
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
          min={1}
          value={row.qty || ''}
          onChange={(e) => updateRow(row.id, { qty: Number(e.target.value) || 0 })}
          className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <input
          type="number"
          step="0.01"
          min={0}
          value={row.unitCost || ''}
          onChange={(e) => updateRow(row.id, { unitCost: Number(e.target.value) || 0 })}
          className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-2 text-right">
        <input
          type="number"
          step="0.01"
          min={0}
          value={row.weightKg || ''}
          onChange={(e) => updateRow(row.id, { weightKg: Number(e.target.value) || 0 })}
          className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
        />
      </td>
      <td className="px-2 py-2 text-right text-xs text-slate-600">{formatCurrency(row.baseTotal)}</td>
      <td className="px-2 py-2 text-right text-xs text-amber-700">{formatCurrency(row.transportShare)}</td>
      <td className="px-2 py-2 text-right text-xs font-semibold text-emerald-700">
        {row.finalUnitCost.toFixed(3)} ₼
      </td>
      <td className="px-2 py-2 text-right text-xs font-bold text-emerald-800">
        {formatCurrency(row.finalTotal)}
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
export default function ProcurementPage() {
  const { products, adjustStock } = useApp();
  const { suppliers, accounts, addPurchase, cashBalances } = useFinance();

  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [supplierId, setSupplierId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [transportCost, setTransportCost] = useState(0);
  const [paidNow, setPaidNow] = useState(0);
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<IntakeRow[]>([
    { id: randomId(), productId: '', variantId: '', qty: 1, unitCost: 0, weightKg: 0 },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState(false);

  const balances = cashBalances?.() || [];

  // ─── Variants map for quick lookup ─────────────────────────────────
  const variantsMap = useMemo(() => {
    const map: Record<string, any[]> = {};
    products.forEach((p) => {
      map[p.id] = p.variants || [];
    });
    return map;
  }, [products]);

  const costRows = useMemo(() => {
    const totalWeight = rows.reduce((s, r) => s + (r.weightKg || 0), 0);
    return rows.map((r) => calculateRowCosts(r, totalWeight, transportCost));
  }, [rows, transportCost]);

  const totals = useMemo(() => {
    const base = costRows.reduce((s, r) => s + r.baseTotal, 0);
    const totalTransport = costRows.reduce((s, r) => s + r.transportShare, 0);
    const grand = costRows.reduce((s, r) => s + r.finalTotal, 0);
    const totalQty = costRows.reduce((s, r) => s + (r.qty || 0), 0);
    const effTransportPerKg = totalQty > 0 ? totalTransport / totalQty : 0;

    return { base, totalTransport, grand, totalQty, effTransportPerKg };
  }, [costRows]);

  const updateRow = useCallback((id: string, patch: Partial<IntakeRow>) => {
    setRows((prev) => prev.map((r) => (r.id === id ? { ...r, ...patch } : r)));
    setTouched(true);
  }, []);

  const addRow = useCallback(() => {
    setRows((prev) => [
      { id: randomId(), productId: '', variantId: '', qty: 1, unitCost: 0, weightKg: 0 },
      ...prev,
    ]);
    setTouched(true);
  }, []);

  const removeRow = useCallback((id: string) => {
    setRows((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((r) => r.id !== id);
    });
    setTouched(true);
  }, []);

  const resetForm = useCallback(() => {
    setRows([{ id: randomId(), productId: '', variantId: '', qty: 1, unitCost: 0, weightKg: 0 }]);
    setTransportCost(0);
    setPaidNow(0);
    setNote('');
    setSuccess(null);
    setError(null);
    setTouched(false);
    setSupplierId('');
    setAccountId('');
  }, []);

  const validateForm = useCallback(() => {
    if (!supplierId) {
      setError('Təchizatçı seçilməyib.');
      return false;
    }

    const validRows = costRows.filter(
      (r) => r.productId && r.variantId && r.qty > 0 && r.finalUnitCost > 0
    );

    if (!validRows.length) {
      setError('Heç bir sətir düzgün doldurulmayıb.');
      return false;
    }

    // Check if any row has zero weight but transport cost > 0
    if (transportCost > 0) {
      const zeroWeightRows = validRows.filter((r) => r.weightKg <= 0);
      if (zeroWeightRows.length === validRows.length) {
        setError('Daşınma xərci paylanması üçün ən azı bir sətirdə çəki daxil edilməlidir.');
        return false;
      }
    }

    return true;
  }, [supplierId, costRows, transportCost]);

  const handleSubmit = useCallback(async () => {
    setError(null);
    setSuccess(null);

    if (!validateForm()) {
      setTouched(true);
      return;
    }

    const validRows = costRows.filter(
      (r) => r.productId && r.variantId && r.qty > 0 && r.finalUnitCost > 0
    );

    setSubmitting(true);
    try {
      const totalCost = validRows.reduce((s, r) => s + r.finalTotal, 0);
      const paid = Math.max(0, Math.min(paidNow, totalCost));
      const paidRatio = totalCost > 0 ? paid / totalCost : 0;

      for (const r of validRows) {
        const rowPaid = r.finalTotal * paidRatio;

        await addPurchase({
          date,
          supplierId,
          productId: r.productId,
          variantId: r.variantId,
          qty: r.qty,
          unitCost: +r.finalUnitCost.toFixed(4),
          accountId: accountId || undefined,
          paid: +rowPaid.toFixed(2),
          note: note || 'Mal qəbulu: daşınma maya dəyərinə paylanıb.',
        });

        // ✅ Stock-u artır
        adjustStock(r.productId, r.qty, r.variantId);
      }

      setSuccess(`Mal qəbulu qeydə alındı. Ümumi maya: ${formatCurrency(totals.grand)}`);
      resetForm();
    } catch (e: any) {
      console.error('Procurement error:', e);
      setError(e?.message || 'Xəta baş verdi, yenidən yoxla.');
    } finally {
      setSubmitting(false);
    }
  }, [
    supplierId,
    accountId,
    date,
    paidNow,
    note,
    costRows,
    totals.grand,
    addPurchase,
    adjustStock,
    resetForm,
    validateForm,
  ]);

  const hasValidRows = costRows.some((r) => r.productId && r.variantId && r.qty > 0 && r.finalUnitCost > 0);

  return (
    <main className="space-y-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-lime-50 to-white p-4 md:p-6">
      {/* Header */}
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-emerald-900 md:text-2xl">Mal Qəbulu · Procurement</h1>
            <p className="text-xs text-slate-600 md:text-sm">
              Çəkiyə görə daşınma bölüşdürülməsi, maya hesabı və stokun avtomatik yenilənməsi.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs md:text-sm">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            <Scale className="h-4 w-4" />
            <span>
              Daşınma payı: <strong>{totals.effTransportPerKg.toFixed(2)} ₼ / əd</strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Tarix: <strong className="text-slate-700">{date}</strong>
          </span>
        </div>
      </header>

      {/* Controls Grid */}
      <section className="grid gap-4 md:grid-cols-3">
        {/* Supplier & Date */}
        <motion.div
          className="space-y-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <ClipboardList className="h-4 w-4 text-emerald-600" />
            Təchizatçı & Tarix
          </h2>
          <div className="space-y-2 text-xs">
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Təchizatçı *</label>
              <select
                value={supplierId}
                onChange={(e) => setSupplierId(e.target.value)}
                className={`h-10 w-full rounded-xl border bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none ${
                  touched && !supplierId ? 'border-red-400' : 'border-slate-200'
                }`}
              >
                <option value="">Təchizatçı seç...</option>
                {(suppliers || []).map((s: any) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
              {touched && !supplierId && (
                <p className="text-[10px] text-red-500">Təchizatçı seçilməlidir</p>
              )}
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Tarix</label>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Qeyd (opsional)</label>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Məs: 'Gəncə bazasından toplanan kartoflar'"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
        </motion.div>

        {/* Transport & Payment */}
        <motion.div
          className="space-y-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Truck className="h-4 w-4 text-emerald-600" />
            Daşınma & Ödəniş
          </h2>
          <div className="grid gap-2 text-xs md:grid-cols-2">
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Daşınma xərci (₼)</label>
              <div className="relative">
                <Calculator className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  min={0}
                  value={transportCost || ''}
                  onChange={(e) => setTransportCost(Number(e.target.value) || 0)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="space-y-1">
              <label className="block font-medium text-slate-600">Bu gün ödənən (₼)</label>
              <input
                type="number"
                step="0.01"
                min={0}
                value={paidNow || ''}
                onChange={(e) => setPaidNow(Number(e.target.value) || 0)}
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </div>
          </div>
          <div className="space-y-1 text-xs">
            <label className="block font-medium text-slate-600">Ödəniş hesabı</label>
            <select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Hesab seç (opsional)</option>
              {balances.map((a: any) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.balance.toFixed(2)} ₼
                </option>
              ))}
            </select>
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          className="space-y-3 rounded-2xl border border-emerald-100 bg-white/90 p-4 shadow-sm"
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
            <Wallet className="h-4 w-4 text-emerald-600" />
            Maya xülasəsi
          </h2>
          <div className="space-y-1 text-xs">
            <SummaryCard label="Məhsul maya cəmi" value={totals.base} />
            <SummaryCard label="Daşınma payı cəmi" value={totals.totalTransport} />
            <SummaryCard label="Ümumi maya (baza+daşınma)" value={totals.grand} bold />
            <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              <p>
                Ümumi {totals.totalQty} ədəd üçün orta vahid maya:{' '}
                <strong>
                  {totals.totalQty > 0 ? (totals.grand / totals.totalQty).toFixed(2) : '0.00'} ₼
                </strong>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Rows Table */}
      <section className="space-y-3 rounded-3xl border border-emerald-100 bg-white/95 p-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-800 md:text-base">
            <Package className="h-5 w-5 text-emerald-600" />
            Mal qəbulu sətirləri
          </h2>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={addRow}
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700 transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Sətir əlavə et
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200 transition-colors"
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
                <th className="px-2 py-2 text-right">Vahid maya</th>
                <th className="px-2 py-2 text-right">Çəki (kq)</th>
                <th className="px-2 py-2 text-right">Baza cəmi</th>
                <th className="px-2 py-2 text-right">Daşınma payı</th>
                <th className="px-2 py-2 text-right">Son vahid maya</th>
                <th className="px-2 py-2 text-right">Son cəmi</th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {costRows.map((row) => (
                  <ProcurementRow
                    key={row.id}
                    row={row}
                    products={products}
                    variantsMap={variantsMap}
                    updateRow={updateRow}
                    removeRow={removeRow}
                  />
                ))}
                {!rows.length && (
                  <tr>
                    <td colSpan={10} className="px-3 py-6 text-center text-xs text-slate-500">
                      Hələ sətir əlavə edilməyib.
                    </td>
                  </tr>
                )}
              </AnimatePresence>
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] text-slate-500">
            Vahid maya = baza maya + (daşınma xərci çəkiyə görə paylanmış).
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting || !hasValidRows}
              onClick={handleSubmit}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-300 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mal qəbulunu təsdiqlə
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
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}