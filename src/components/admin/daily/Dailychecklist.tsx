import { SectionCard, EmptyState, ChecklistItem } from '@/app/admin/summary/daily/page';
import { currency } from '@/helpers';
import { useFinance } from '@/lib/finance';
import { useApp } from '@/lib/store';
import { DayClosingForm } from '@/types/daily';
import { AnimatePresence, motion } from 'framer-motion';
import { ShoppingBag, Wallet, ListChecks, AlertTriangle } from 'lucide-react';

import React, { useMemo, useState } from 'react'

// Helpers

const Dailychecklist = () => {
  const { orders, products } = useApp();
  const {  cashBalances } = useFinance();

  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  );

  const [closingForm, setClosingForm] = useState<DayClosingForm>({
    realCustomers: 0,
    realSales: 0,
    realPurchases: 0,
    realExpenses: 0,
    realCashStart: 0,
    realCashEnd: 0,
    realPos: 0,
    realBank: 0,
    note: '',
  });

  const [showChecklist, setShowChecklist] = useState(false);
  const [checklistState, setChecklistState] = useState({
    stockChecked: false,
    cashCounted: false,
    fridgesOk: false,
    discountsUpdated: false,
    spoilageLogged: false,
    whatsappImported: false,
  });

  // ========= SYSTEM CALCULATIONS FOR SELECTED DAY =========

  const dayOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.createdAt.slice(0, 10) === selectedDay,
      ),
    [orders, selectedDay],
  );

  const systemDayMetrics = useMemo(() => {
    const salesTotal = dayOrders.reduce(
      (s, o) =>
        s +
        o.items.reduce(
          (x, it) => x + it.qty * it.priceAtOrder,
          0,
        ),
      0,
    );
    const orderCount = dayOrders.length;
    const customerCount = new Set(
      dayOrders
        .map((o) => o.customerName?.trim())
        .filter(Boolean),
    ).size;

    const avgTicket =
      orderCount > 0 ? salesTotal / orderCount : 0;

    const pending = dayOrders.filter(
      (o) => o.status === 'pending',
    ).length;
    const delivered = dayOrders.filter(
      (o) => o.status === 'delivered',
    ).length;
    const cancelled = dayOrders.filter(
      (o) => o.status === 'cancelled',
    ).length;

    return {
      salesTotal,
      orderCount,
      customerCount,
      avgTicket,
      pending,
      delivered,
      cancelled,
    };
  }, [dayOrders]);



  // ========= PRODUCT DAILY SUMMARY =========
  const productDailySummary = useMemo(() => {
    const map = new Map<
      string,
      { id: string; name: string; qty: number; revenue: number }
    >();

    dayOrders.forEach((o) => {
      o.items.forEach((it) => {
        const id = it.productId ?? it.productName ?? 'unknown';
        const name =
          it.productName ||
          products.find((p) => p.id === it.productId)?.name ||
          'Naməlum Məhsul';
        const prev = map.get(id) ?? {
          id,
          name,
          qty: 0,
          revenue: 0,
        };
        prev.qty += it.qty;
        prev.revenue += it.qty * it.priceAtOrder;
        map.set(id, prev);
      });
    });

    const arr = Array.from(map.values());
    arr.sort((a, b) => b.qty - a.qty);
    return arr;
  }, [dayOrders, products]);



  // ========= REAL DAY CLOSING (MANUAL INPUT) =========
  const realProfit = useMemo(
    () =>
      closingForm.realSales -
      closingForm.realPurchases -
      closingForm.realExpenses,
    [
      closingForm.realSales,
      closingForm.realPurchases,
      closingForm.realExpenses,
    ],
  );

  const kassaReal =
    closingForm.realCashEnd +
    closingForm.realPos +
    closingForm.realBank;

  // kassaların sistem balansı (ümumi)
  const systemBalances = cashBalances();
  const kassaSystem = useMemo(
    () =>
      systemBalances.reduce(
        (s, b) => s + (b.balance ?? 0),
        0,
      ),
    [systemBalances],
  );

  // ========= MİSMATCH / HEALTH SCORE =========
  const diffSales = closingForm.realSales - systemDayMetrics.salesTotal;
  
  const diffKassa = kassaReal - kassaSystem;
 
  // ========= ANOMALIES / ALERTS =========
  const anomalies = useMemo(() => {
    const list: string[] = [];

    if (Math.abs(diffSales) > 0.05 * (systemDayMetrics.salesTotal || 1))
      list.push('Sistem satışları ilə real satışlar arasında fərq böyükdür.');

    if (realProfit < 0)
      list.push('Gün real olaraq zərərlə bitib.');

    const expRatio =
      closingForm.realSales > 0
        ? closingForm.realExpenses /
          closingForm.realSales
        : 0;
    if (expRatio > 0.6)
      list.push('Xərc/satış nisbəti 60%-dən yuxarıdır.');

    if (diffKassa !== 0)
      list.push('Kassa ilə sistem balansı arasında fərq var.');

    if (systemDayMetrics.pending > 0)
      list.push(
        `${systemDayMetrics.pending} ədəd sifariş hələ də "Gözləyir" statusundadır.`,
      );

    return list;
  }, [
    diffSales,
    realProfit,
    closingForm.realSales,
    closingForm.realExpenses,
    diffKassa,
    systemDayMetrics.pending,
    systemDayMetrics.salesTotal,
  ]);


  const toggleChecklistItem = (
    key: keyof typeof checklistState,
  ) => {
    setChecklistState((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  // ========= RENDER =========
  return (
    <section className="grid gap-4 lg:grid-cols-2">
        {/* PRODUCT LIST */}
        <SectionCard
          title="Bu gün satılan məhsulların xülasəsi (sistem)"
          icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}
        >
          {productDailySummary.length === 0 ? (
            <EmptyState message="Bu gün üçün məhsul satışı qeydi yoxdur." />
          ) : (
            <div className="max-h-72 overflow-y-auto pr-1 custom-scrollbar text-xs md:text-sm">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-100">
                    <th className="py-2 pr-2">Məhsul</th>
                    <th className="py-2 px-2 text-right">
                      Miqdar
                    </th>
                    <th className="py-2 pl-2 text-right">
                      Dövriyyə
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {productDailySummary.map((p, idx) => (
                    <tr
                      key={p.id + idx}
                      className="border-b border-slate-50 hover:bg-emerald-50/60 transition-colors"
                    >
                      <td className="py-2 pr-2">
                        <p className="font-medium text-slate-800">
                          {p.name}
                        </p>
                        <p className="text-[11px] text-slate-500">
                          #{idx + 1} ən çox satılan
                        </p>
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-slate-700">
                        {p.qty} ədəd
                      </td>
                      <td className="py-2 pl-2 text-right text-emerald-700 font-semibold">
                        {currency(p.revenue)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </SectionCard>

        {/* CASH & CHECKLIST */}
        <SectionCard
          title="Kassa balansı & Gün sonu checklist"
          icon={<Wallet className="w-4 h-4 text-emerald-600" />}
        >
          <div className="grid gap-3 text-xs md:text-sm md:grid-cols-2">
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
                      {currency(b.balance ?? 0)}
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

            <div className="space-y-2">
              <button
                onClick={() =>
                  setShowChecklist((v) => !v)
                }
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
                      onChange={() =>
                        toggleChecklistItem(
                          'stockChecked',
                        )
                      }
                    />
                    <ChecklistItem
                      label="Kassa tam sayıldı"
                      checked={checklistState.cashCounted}
                      onChange={() =>
                        toggleChecklistItem(
                          'cashCounted',
                        )
                      }
                    />
                    <ChecklistItem
                      label="Soyuducu / ərzaq qalıqları yoxlanıldı"
                      checked={checklistState.fridgesOk}
                      onChange={() =>
                        toggleChecklistItem(
                          'fridgesOk',
                        )
                      }
                    />
                    <ChecklistItem
                      label="Endirimlər / qiymətlər yeniləndi"
                      checked={
                        checklistState.discountsUpdated
                      }
                      onChange={() =>
                        toggleChecklistItem(
                          'discountsUpdated',
                        )
                      }
                    />
                    <ChecklistItem
                      label="Ziyan / xarab olma sistemə yazıldı"
                      checked={
                        checklistState.spoilageLogged
                      }
                      onChange={() =>
                        toggleChecklistItem(
                          'spoilageLogged',
                        )
                      }
                    />
                    <ChecklistItem
                      label="WhatsApp / offline satışlar sistəmə keçirildi"
                      checked={
                        checklistState.whatsappImported
                      }
                      onChange={() =>
                        toggleChecklistItem(
                          'whatsappImported',
                        )
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
  )
}

export default Dailychecklist
