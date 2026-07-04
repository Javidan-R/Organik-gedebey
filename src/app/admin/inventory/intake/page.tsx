// src/app/admin/procurement/page.tsx
'use client';

import { useState, useMemo } from 'react';
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
} from 'lucide-react';

import { useApp } from '@/lib/store';
import { useFinance } from '@/lib/finance';

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

const randomId = () => Math.random().toString(36).slice(2);

export default function ProcurementPage() {
  const { products, adjustStock } = useApp();
  const {
    suppliers,
    accounts,
    addPurchase,
    cashBalances,
  } = useFinance();

  const [date, setDate] = useState(
    new Date().toISOString().slice(0, 10),
  );
  const [supplierId, setSupplierId] = useState('');
  const [accountId, setAccountId] = useState('');
  const [transportCost, setTransportCost] = useState(0);
  const [paidNow, setPaidNow] = useState(0);
  const [note, setNote] = useState('');
  const [rows, setRows] = useState<IntakeRow[]>([
    {
      id: randomId(),
      productId: '',
      variantId: '',
      qty: 1,
      unitCost: 0,
      weightKg: 0,
    },
  ]);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const balances = cashBalances();

  const costRows: CostRow[] = useMemo(() => {
    const totalWeight = rows.reduce(
      (s, r) => s + (r.weightKg || 0),
      0,
    );
    const safeWeight = totalWeight > 0 ? totalWeight : 1;

    return rows.map((r) => {
      const baseTotal = r.unitCost * r.qty;
      const weightShare =
        r.weightKg > 0 ? r.weightKg / safeWeight : 0;
      const transportShare = transportCost * weightShare;
      const transportPerUnit =
        r.qty > 0 ? transportShare / r.qty : 0;
      const finalUnitCost = r.unitCost + transportPerUnit;
      const finalTotal = finalUnitCost * r.qty;

      return {
        ...r,
        baseTotal,
        transportShare,
        transportPerUnit,
        finalUnitCost,
        finalTotal,
      };
    });
  }, [rows, transportCost]);

  const totals = useMemo(() => {
    const base = costRows.reduce(
      (s, r) => s + r.baseTotal,
      0,
    );
    const totalTransport = costRows.reduce(
      (s, r) => s + r.transportShare,
      0,
    );
    const grand = costRows.reduce(
      (s, r) => s + r.finalTotal,
      0,
    );
    const totalQty = costRows.reduce(
      (s, r) => s + (r.qty || 0),
      0,
    );

    const effTransportPerKg =
      totalQty > 0 ? totalTransport / totalQty : 0;

    return {
      base,
      totalTransport,
      grand,
      totalQty,
      effTransportPerKg,
    };
  }, [costRows]);

  function updateRow(id: string, patch: Partial<IntakeRow>) {
    setRows((prev) =>
      prev.map((r) =>
        r.id === id ? { ...r, ...patch } : r,
      ),
    );
  }

  function addRow() {
    setRows((prev) => [
      {
        id: randomId(),
        productId: '',
        variantId: '',
        qty: 1,
        unitCost: 0,
        weightKg: 0,
      },
      ...prev,
    ]);
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
        qty: 1,
        unitCost: 0,
        weightKg: 0,
      },
    ]);
    setTransportCost(0);
    setPaidNow(0);
    setNote('');
    setSuccess(null);
    setError(null);
  }

  async function commit() {
    setError(null);
    setSuccess(null);

    if (!supplierId) {
      setError('Təchizatçı seçilməyib.');
      return;
    }
    const validRows = costRows.filter(
      (r) =>
        r.productId &&
        r.variantId &&
        r.qty > 0 &&
        r.finalUnitCost > 0,
    );
    if (!validRows.length) {
      setError('Heç bir sətir düzgün doldurulmayıb.');
      return;
    }

    setSubmitting(true);
    try {
      const totalCost = validRows.reduce(
        (s, r) => s + r.finalTotal,
        0,
      );
      const paid = Math.max(0, Math.min(paidNow, totalCost));
      const paidRatio =
        totalCost > 0 ? paid / totalCost : 0;

      for (const r of validRows) {
        const rowPaid = r.finalTotal * paidRatio;

        addPurchase({
          date,
          supplierId,
          productId: r.productId,
          variantId: r.variantId,
          qty: r.qty,
          unitCost: +r.finalUnitCost.toFixed(4),
          accountId: accountId || undefined,
          paid: +rowPaid.toFixed(2),
          note:
            note ||
            'Mal qəbulu: daşınma maya dəyərinə paylanıb.',
        });

        adjustStock(r.productId, r.qty, r.variantId);
      }

      setSuccess(
        `Mal qəbulu qeydə alındı. Ümumi maya: ${totals.grand.toFixed(
          2,
        )} ₼`,
      );
      resetForm();
    } catch (e) {
      setError('Xəta baş verdi, yenidən yoxla.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="space-y-6 rounded-3xl bg-gradient-to-br from-emerald-50 via-lime-50 to-white p-4 md:p-6">
      <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-2xl border border-emerald-100 bg-white/80 px-4 py-3 shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 shadow-inner">
            <Truck className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-emerald-900 md:text-2xl">
              Mal Qəbulu · Procurement ERP
            </h1>
            <p className="text-xs text-slate-600 md:text-sm">
              Çəkiyə görə daşınma bölüşdürülməsi, maya hesabı və
              stokun avtomatik yenilənməsi.
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1 text-xs md:text-sm">
          <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-1 font-semibold text-emerald-700">
            <Scale className="h-4 w-4" />
            <span>
              Ümumi çəkidə daşınma payı:{' '}
              <strong>
                {totals.effTransportPerKg.toFixed(2)} ₼ / əd
              </strong>
            </span>
          </div>
          <span className="text-[11px] text-slate-500">
            Tarix:{' '}
            <strong className="text-slate-700">
              {date}
            </strong>
          </span>
        </div>
      </header>

      <section className="grid gap-4 md:grid-cols-3">
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
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">
                Təchizatçı
              </span>
              <select
                value={supplierId}
                onChange={(e) =>
                  setSupplierId(e.target.value)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              >
                <option value="">
                  Təchizatçı seç...
                </option>
                {suppliers.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name}
                  </option>
                ))}
              </select>
            </label>
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">
                Tarix
              </span>
              <div className="relative">
                <CalendarDays className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">
                Qeyd (opsional)
              </span>
              <input
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Məs: 'Gəncə bazasından toplanan kartoflar'"
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
        </motion.div>

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
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">
                Daşınma xərci (₼)
              </span>
              <div className="relative">
                <Calculator className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  type="number"
                  step="0.01"
                  value={transportCost}
                  onChange={(e) =>
                    setTransportCost(
                      Number(e.target.value) || 0,
                    )
                  }
                  className="h-10 w-full rounded-xl border border-slate-200 bg-white pl-9 pr-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
                />
              </div>
            </label>
            <label className="space-y-1">
              <span className="block font-medium text-slate-600">
                Bu gün ödənən (₼)
              </span>
              <input
                type="number"
                step="0.01"
                value={paidNow}
                onChange={(e) =>
                  setPaidNow(Number(e.target.value) || 0)
                }
                className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
              />
            </label>
          </div>
          <label className="mt-1 space-y-1 text-xs">
            <span className="block font-medium text-slate-600">
              Ödəniş hesabı
            </span>
            <select
              value={accountId}
              onChange={(e) =>
                setAccountId(e.target.value)
              }
              className="h-10 w-full rounded-xl border border-slate-200 bg-white px-3 text-sm shadow-inner focus:border-emerald-500 focus:outline-none"
            >
              <option value="">Hesab seç (opsional)</option>
              {balances.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.name} · {a.balance.toFixed(2)} ₼
                </option>
              ))}
            </select>
          </label>
        </motion.div>

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
            <SummaryRow
              label="Məhsul maya cəmi"
              value={totals.base}
            />
            <SummaryRow
              label="Daşınma payı cəmi"
              value={totals.totalTransport}
            />
            <SummaryRow
              label="Ümumi maya (baza+daşınma)"
              value={totals.grand}
              bold
            />
            <div className="mt-2 rounded-xl bg-emerald-50 px-3 py-2 text-[11px] text-emerald-800">
              <p>
                Ümumi {totals.totalQty} ədəd üçün orta vahid
                maya:{' '}
                <strong>
                  {totals.totalQty > 0
                    ? (totals.grand / totals.totalQty).toFixed(
                        2,
                      )
                    : '0.00'}{' '}
                  ₼
                </strong>
              </p>
            </div>
          </div>
        </motion.div>
      </section>

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
              className="inline-flex items-center gap-1 rounded-xl bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white shadow hover:bg-emerald-700"
            >
              <Plus className="h-3.5 w-3.5" />
              Sətir əlavə et
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="inline-flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              Formu sıfırla
            </button>
          </div>
        </div>

        <div className="custom-scrollbar max-h-[420px] overflow-x-auto rounded-2xl border border-slate-100">
          <table className="min-w-full border-separate border-spacing-y-1 text-xs md:text-sm">
            <thead className="sticky top-0 z-10 bg-slate-50 text-[11px] uppercase text-slate-500 shadow">
              <tr>
                <th className="px-2 py-2 text-left">
                  Məhsul
                </th>
                <th className="px-2 py-2 text-left">
                  Variant
                </th>
                <th className="px-2 py-2 text-right">
                  Miqdar
                </th>
                <th className="px-2 py-2 text-right">
                  Vahid maya
                </th>
                <th className="px-2 py-2 text-right">
                  Çəki (kq)
                </th>
                <th className="px-2 py-2 text-right">
                  Baza cəmi
                </th>
                <th className="px-2 py-2 text-right">
                  Daşınma payı
                </th>
                <th className="px-2 py-2 text-right">
                  Son vahid maya
                </th>
                <th className="px-2 py-2 text-right">
                  Son cəmi
                </th>
                <th className="px-2 py-2" />
              </tr>
            </thead>
            <tbody>
              <AnimatePresence initial={false}>
                {costRows.map((r) => {
                  const p = products.find(
                    (x) => x.id === r.productId,
                  );
                  const variants = p?.variants ?? [];

                  return (
                    <motion.tr
                      key={r.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.15 }}
                      className="bg-white/90 align-middle shadow-sm hover:bg-emerald-50/40"
                    >
                      <td className="px-2 py-2">
                        <select
                          value={r.productId}
                          onChange={(e) =>
                            updateRow(r.id, {
                              productId: e.target.value,
                              variantId: '',
                            })
                          }
                          className="h-9 w-40 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-emerald-500 focus:outline-none md:w-48"
                        >
                          <option value="">Seç</option>
                          {products.map((p) => (
                            <option
                              key={p.id}
                              value={p.id}
                            >
                              {p.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2">
                        <select
                          value={r.variantId}
                          onChange={(e) =>
                            updateRow(r.id, {
                              variantId: e.target.value,
                            })
                          }
                          className="h-9 w-32 rounded-lg border border-slate-200 bg-white px-2 text-xs shadow-inner focus:border-emerald-500 focus:outline-none md:w-40"
                        >
                          <option value="">
                            Variant
                          </option>
                          {variants.map((v) => (
                            <option
                              key={v.id}
                              value={v.id}
                            >
                              {v.name}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          min={1}
                          value={r.qty}
                          onChange={(e) =>
                            updateRow(r.id, {
                              qty:
                                Number(
                                  e.target.value,
                                ) || 0,
                            })
                          }
                          className="h-9 w-20 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={r.unitCost}
                          onChange={(e) =>
                            updateRow(r.id, {
                              unitCost:
                                Number(
                                  e.target.value,
                                ) || 0,
                            })
                          }
                          className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 text-right">
                        <input
                          type="number"
                          step="0.01"
                          value={r.weightKg}
                          onChange={(e) =>
                            updateRow(r.id, {
                              weightKg:
                                Number(
                                  e.target.value,
                                ) || 0,
                            })
                          }
                          className="h-9 w-24 rounded-lg border border-slate-200 bg-white px-2 text-right text-xs shadow-inner focus:border-emerald-500 focus:outline-none"
                        />
                      </td>
                      <td className="px-2 py-2 text-right text-xs text-slate-600">
                        {r.baseTotal.toFixed(2)} ₼
                      </td>
                      <td className="px-2 py-2 text-right text-xs text-amber-700">
                        {r.transportShare.toFixed(2)} ₼
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-semibold text-emerald-700">
                        {r.finalUnitCost.toFixed(3)} ₼
                      </td>
                      <td className="px-2 py-2 text-right text-xs font-bold text-emerald-800">
                        {r.finalTotal.toFixed(2)} ₼
                      </td>
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
              </AnimatePresence>
              {!rows.length && (
                <tr>
                  <td
                    colSpan={10}
                    className="px-3 py-6 text-center text-xs text-slate-500"
                  >
                    Hələ sətir əlavə edilməyib.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div className="text-[11px] text-slate-500">
            Vahid maya = baza maya + (daşınma xərci
            çəkiyə görə paylanmış).
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={submitting}
              onClick={commit}
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2 text-xs font-semibold text-white shadow-lg shadow-emerald-300 hover:bg-emerald-700 disabled:opacity-60"
            >
              <CheckCircle2 className="h-4 w-4" />
              Mal qəbulunu təsdiqlə
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
              <AlertCircle className="h-4 w-4" />
              <span>{error}</span>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}

function SummaryRow({
  label,
  value,
  bold,
}: {
  label: string;
  value: number;
  bold?: boolean;
}) {
  return (
    <div className="flex items-center justify-between text-[11px]">
      <span className="text-slate-600">{label}</span>
      <span
        className={
          bold
            ? 'font-extrabold text-emerald-800'
            : 'font-semibold text-slate-800'
        }
      >
        {value.toFixed(2)} ₼
      </span>
    </div>
  );
}
