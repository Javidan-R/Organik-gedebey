// src/components/admin/daily/Dailychecklist.tsx
'use client';

import { useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  ShoppingBag,
  Wallet,
  ListChecks,
  AlertTriangle,
  TrendingDown,
  Receipt,
} from 'lucide-react';
import {
  SectionCard,
  EmptyState,
  ChecklistItem,
} from '@/components/admin/daily/SectionCard';
import { currency } from '@/helpers';
import type { SystemMetrics, DailyOrder } from '@/hooks/useDailySummary';
import type { Product } from '@/types/products';

interface DailychecklistProps {
  dayOrders: DailyOrder[];
  products: Product[];
  systemBalances: SystemMetrics['systemBalances'];
  kassaSystem: number;
  kassaReal: number;
  closingForm: any;
  systemMetrics: SystemMetrics;
  diffSales: number;
  diffKassa: number;
  realProfit: number;
  expensesTotal: number;
}

export default function Dailychecklist({
  dayOrders,
  products,
  systemBalances,
  kassaSystem,
  kassaReal,
  closingForm,
  systemMetrics,
  diffSales,
  diffKassa,
  realProfit,
  expensesTotal,
}: DailychecklistProps) {
  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistState, setChecklistState] = useState({
    stockChecked: false,
    cashCounted: false,
    fridgesOk: false,
    discountsUpdated: false,
    spoilageLogged: false,
    whatsappImported: false,
  });

  const toggleChecklistItem = (key: keyof typeof checklistState) => {
    setChecklistState((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Server‑dən gələn məhsul xülasəsi
  const productSummary = useMemo(
    () => systemMetrics.productBreakdown.slice(0, 15),
    [systemMetrics.productBreakdown]
  );

  // Anomaliyalar (riskli göstəricilər)
  const anomalies = useMemo(() => {
    const list: string[] = [];
    const salesTotal = systemMetrics.salesTotal;
    if (Math.abs(diffSales) > 0.05 * (salesTotal || 1))
      list.push('Sistem satışları ilə real satışlar arasında fərq böyükdür.');
    if (realProfit < 0)
      list.push('Gün real olaraq zərərlə bitib.');
    const expRatio = closingForm.realSales > 0
      ? closingForm.realExpenses / closingForm.realSales
      : 0;
    if (expRatio > 0.6)
      list.push('Xərc/satış nisbəti 60%-dən yuxarıdır.');
    if (diffKassa !== 0)
      list.push('Kassa ilə sistem balansı arasında fərq var.');
    if (systemMetrics.orderCount === 0)
      list.push('Bu gün heç bir sifariş qeydə alınmayıb.');
    if (systemMetrics.systemBalances.some(b => b.balance < 0))
      list.push('Bəzi kassa hesablarında mənfi balans var.');
    return list;
  }, [diffSales, realProfit, closingForm.realSales, closingForm.realExpenses, diffKassa, systemMetrics]);

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      {/* Məhsul xülasəsi */}
      <SectionCard
        title="Bu gün satılan məhsulların xülasəsi (sistem)"
        icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
      >
        {productSummary.length === 0 ? (
          <EmptyState message="Bu gün üçün məhsul satışı qeydi yoxdur." />
        ) : (
          <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar text-xs md:text-sm">
            <table className="w-full border-collapse">
              <thead>
                <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-2">Məhsul</th>
                  <th className="py-2 px-2 text-right">Miqdar</th>
                  <th className="py-2 pl-2 text-right">Dövriyyə</th>
                </tr>
              </thead>
              <tbody>
                {productSummary.map((p, idx) => (
                  <tr
                    key={p.productName + idx}
                    className="border-b border-slate-50 hover:bg-emerald-50/60 transition-colors"
                  >
                    <td className="py-2 pr-2">
                      <p className="font-medium text-slate-800">
                        {p.productName}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        #{idx + 1} ən çox satılan
                      </p>
                    </td>
                    <td className="py-2 px-2 text-right font-semibold text-slate-700">
                      {p.totalQty} ədəd
                    </td>
                    <td className="py-2 pl-2 text-right text-emerald-700 font-semibold">
                      {currency(p.totalRevenue)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </SectionCard>

      {/* Kassa balansı & Checklist */}
      <SectionCard
        title="Kassa balansı & Gün sonu checklist"
        icon={<Wallet className="w-4 h-4 text-emerald-600" />}
      >
        <div className="grid gap-3 text-xs md:text-sm md:grid-cols-2">
          {/* Kassa balansları */}
          <div className="space-y-2">
            <p className="text-[11px] font-semibold uppercase text-slate-500">
              Sistem üzrə kassalar
            </p>
            <div className="space-y-1.5">
              {systemBalances.map((b) => (
                <div
                  key={b.id}
                  className="flex items-center justify-between rounded-xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <span className="font-medium text-slate-700">
                    {b.name}
                  </span>
                  <span className="font-semibold text-emerald-700">
                    {currency(b.balance)}
                  </span>
                </div>
              ))}
            </div>
            <div className="flex items-center justify-between rounded-xl bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-800 border border-emerald-200 mt-2">
              <span>Cəmi sistem kassa</span>
              <span>{currency(kassaSystem)}</span>
            </div>
            <div className="flex items-center justify-between rounded-xl bg-purple-50 px-3 py-2 text-xs font-semibold text-purple-800 border border-purple-200 mt-2">
              <span>Cəmi real kassa</span>
              <span>{currency(kassaReal)}</span>
            </div>
          </div>

          {/* Checklist & anomaliyalar */}
          <div className="space-y-2">
            <button
              onClick={() => setShowChecklist((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100"
            >
              <ListChecks className="w-4 h-4" />
              Gün sonu check-list
            </button>

            <AnimatePresence initial={false}>
              {showChecklist && (
                <motion.div
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="space-y-1 rounded-2xl border border-slate-100 bg-slate-50 px-3 py-2"
                >
                  <ChecklistItem
                    label="Stok yoxlanıldı"
                    checked={checklistState.stockChecked}
                    onChange={() => toggleChecklistItem('stockChecked')}
                  />
                  <ChecklistItem
                    label="Kassa tam sayıldı"
                    checked={checklistState.cashCounted}
                    onChange={() => toggleChecklistItem('cashCounted')}
                  />
                  <ChecklistItem
                    label="Soyuducu / ərzaq qalıqları yoxlanıldı"
                    checked={checklistState.fridgesOk}
                    onChange={() => toggleChecklistItem('fridgesOk')}
                  />
                  <ChecklistItem
                    label="Endirimlər / qiymətlər yeniləndi"
                    checked={checklistState.discountsUpdated}
                    onChange={() =>
                      toggleChecklistItem('discountsUpdated')
                    }
                  />
                  <ChecklistItem
                    label="Ziyan / xarab olma sistemə yazıldı"
                    checked={checklistState.spoilageLogged}
                    onChange={() => toggleChecklistItem('spoilageLogged')}
                  />
                  <ChecklistItem
                    label="WhatsApp / offline satışlar sistemə keçirildi"
                    checked={checklistState.whatsappImported}
                    onChange={() =>
                      toggleChecklistItem('whatsappImported')
                    }
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {anomalies.length > 0 && (
              <div className="mt-2 rounded-2xl border border-amber-200 bg-amber-50 px-3 py-2 text-[11px] text-amber-800 space-y-1">
                <p className="flex items-center gap-1 font-semibold">
                  <AlertTriangle className="w-3.5 h-3.5" />
                  Bu gün üçün risklər:
                </p>
                <ul className="list-disc pl-4 space-y-0.5">
                  {anomalies.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      </SectionCard>
    </section>
  );
}