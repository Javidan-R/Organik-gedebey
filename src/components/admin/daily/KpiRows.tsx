import { StatCard } from '@/app/admin/summary/daily/page';
import { useFinance } from '@/lib/finance';
import { useApp } from '@/lib/store';
import { DayClosingForm } from '@/types/daily';
import { ShoppingBag, Users, Wallet , Activity } from 'lucide-react'
import React, {  useMemo, useState } from 'react'

const KpiRows = () => {

  const { orders} = useApp();
  const { purchases, expenses, cashBalances } = useFinance();

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

// Helpers
const currency = (v: number) => `${v.toFixed(2)} ₼`;

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

  // ========= MİSMATCH / HEALTH SCORE =========
  const diffSales = closingForm.realSales - systemDayMetrics.salesTotal;
  const dayPurchases = useMemo(
    () =>
      purchases.filter(
        (p) => p.date.slice(0, 10) === selectedDay,
      ),
    [purchases, selectedDay],
  );
  const dayPurchasesTotal = useMemo(
    () =>
      dayPurchases.reduce(
        (s, p) => s + p.unitCost * p.qty,
        0,
      ),
    [dayPurchases],
  );
  const dayExpenses = useMemo(
    () =>
      expenses.filter(
        (e) => e.date.slice(0, 10) === selectedDay,
      ),
    [expenses, selectedDay],
  );
  const dayExpensesTotal = useMemo(
    () =>
      dayExpenses.reduce((s, e) => s + e.amount, 0),
    [dayExpenses],
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
  const diffCustomers =
    closingForm.realCustomers -
    systemDayMetrics.customerCount;
  const diffKassa = kassaReal - kassaSystem;

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

  const dayHealthScore = useMemo(() => {
    let score = 100;

    const gapSalesAbs = Math.abs(diffSales);
    const gapSalesRatio =
      systemDayMetrics.salesTotal > 0
        ? gapSalesAbs /
          Math.max(systemDayMetrics.salesTotal, 1)
        : 0;

    if (gapSalesRatio > 0.1) score -= 25;
    else if (gapSalesRatio > 0.05) score -= 10;

    const expRatio =
      systemDayMetrics.salesTotal > 0
        ? dayExpensesTotal /
          systemDayMetrics.salesTotal
        : 0;
    if (expRatio > 0.6) score -= 20;
    else if (expRatio > 0.4) score -= 10;

    if (realProfit < 0) score -= 20;
    if (diffKassa !== 0) score -= 15;

    score = Math.max(0, Math.min(100, score));
    return score;
  }, [
    diffSales,
    diffKassa,
    realProfit,
    dayExpensesTotal,
    systemDayMetrics.salesTotal,
  ]);

  const dayTag = useMemo(() => {
    if (dayHealthScore >= 85 && realProfit > 0)
      return { label: 'Super Gün', color: 'bg-emerald-100 text-emerald-800 border-emerald-300' };
    if (dayHealthScore >= 60 && realProfit >= 0)
      return { label: 'Normal Gün', color: 'bg-blue-100 text-blue-800 border-blue-300' };
    if (realProfit < 0)
      return { label: 'Zərərlə Gün', color: 'bg-red-100 text-red-800 border-red-300' };
    return { label: 'Riskli Gün', color: 'bg-amber-100 text-amber-800 border-amber-300' };
  }, [dayHealthScore, realProfit]);

  const systemProfit = useMemo(
    () =>
      systemDayMetrics.salesTotal -
      dayPurchasesTotal -
      dayExpensesTotal,
    [
      systemDayMetrics.salesTotal,
      dayPurchasesTotal,
      dayExpensesTotal,
    ],
  );



  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<ShoppingBag className="w-5 h-5" />}
              label="Sistem üzrə bu gün satış"
              value={currency(systemDayMetrics.salesTotal)}
              subtitle={`${systemDayMetrics.orderCount} sifariş`}
              accent="emerald"
            />
            <StatCard
              icon={<Users className="w-5 h-5" />}
              label="Müştəri sayı (sistem)"
              value={systemDayMetrics.customerCount.toString()}
              subtitle={`Real: ${
                closingForm.realCustomers || '—'
              } (${diffCustomers === 0 ? 'Uyğundur' : 'Fərq: ' + diffCustomers})`}
              accent="blue"
            />
            <StatCard
              icon={<Wallet className="w-5 h-5" />}
              label="Günün sistem mənfəəti"
              value={currency(systemProfit)}
              subtitle={`Real: ${
                closingForm.realSales
                  ? currency(realProfit)
                  : '—'
              }`}
              accent={systemProfit >= 0 ? 'emerald' : 'red'}
            />
            <StatCard
              icon={<Activity size={20} />}
              label="Gün Sağlamlıq Skoru"
              value={`${dayHealthScore.toFixed(0)} / 100`}
              subtitle={dayTag.label}
              accent="purple"
            />
          </section>
  )
}

export default KpiRows
