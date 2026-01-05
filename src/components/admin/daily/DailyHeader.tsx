import { motion } from 'framer-motion'
import { Sparkles, CalendarDays, ChevronLeft, ChevronRight, Download , Clipboard } from 'lucide-react'
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { useState, useMemo, useCallback } from 'react';
import { useApp } from '@/lib/store';
import { useFinance } from '@/lib/finance';
import { DayClosingForm } from '@/types/daily';

const DailyHeader = () => {
  const { orders } = useApp();
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

  const [copied, setCopied] = useState(false);


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


  const kassaReal =
    closingForm.realCashEnd +
    closingForm.realPos +
    closingForm.realBank;

  // kassaların sistem balansı (ümumi)
  const systemBalances = cashBalances();
  


    const changeDay = (delta: number) => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + delta);
    setSelectedDay(d.toISOString().slice(0, 10));
  };

    const selectedDayLabel = useMemo(
      () =>
        format(new Date(selectedDay), 'd MMMM yyyy, EEEE', {
          locale: az,
        }),
      [selectedDay],
    );
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
    const diffPurchases =
      closingForm.realPurchases - dayPurchasesTotal;
    const diffExpenses =
      closingForm.realExpenses - dayExpensesTotal;
    const diffCustomers =
      closingForm.realCustomers -
      systemDayMetrics.customerCount;
    const diffKassa = kassaReal - kassaSystem;
    const profitGap = realProfit - systemProfit;
  
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
      // ========= EXPORT / COPY =========
      const handleCopySummary = useCallback(() => {
        const payload = {
          date: selectedDay,
          system: {
            sales: systemDayMetrics.salesTotal,
            purchases: dayPurchasesTotal,
            expenses: dayExpensesTotal,
            profit: systemProfit,
            customers: systemDayMetrics.customerCount,
            orders: systemDayMetrics.orderCount,
          },
          real: {
            ...closingForm,
            realProfit,
            kassaReal,
          },
          diffs: {
            diffSales,
            diffPurchases,
            diffExpenses,
            diffCustomers,
            diffKassa,
            profitGap,
          },
          labels: {
            dayHealthScore,
            dayTag: dayTag.label,
          },
          anomalies,
        };
    
        if (
          typeof navigator !== 'undefined' &&
          navigator.clipboard
        ) {
          navigator.clipboard
            .writeText(JSON.stringify(payload, null, 2))
            .then(() => {
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            })
            .catch(() => {
              // ignore
            });
        } else {
          alert(
            'Clipboard dəstəklənmir. JSON konsolda göstərildi.',
          );
          console.log(payload);
        }
      }, [
        selectedDay,
        systemDayMetrics,
        dayPurchasesTotal,
        dayExpensesTotal,
        systemProfit,
        closingForm,
        realProfit,
        kassaReal,
        diffSales,
        diffPurchases,
        diffExpenses,
        diffCustomers,
        diffKassa,
        profitGap,
        dayHealthScore,
        dayTag.label,
        anomalies,
      ]);
    
      const handlePrint = useCallback(() => {
        if (typeof window !== 'undefined') {
          window.print();
        }
      }, []);
    
  return (
    <motion.header
           initial={{ opacity: 0, y: -14 }}
           animate={{ opacity: 1, y: 0 }}
           className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between rounded-3xl border border-emerald-100 bg-white/90 px-4 py-4 md:px-6 md:py-5 shadow-lg shadow-emerald-50"
         >
           <div className="space-y-1">
             <div className="inline-flex items-center gap-2 rounded-2xl bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
               <Sparkles className="w-3.5 h-3.5" />
               Gündəlik Xülasə & Gün Sonu Bəyannamə
             </div>
             <h1 className="flex flex-wrap items-center gap-2 text-2xl md:text-3xl font-extrabold text-emerald-900">
               <CalendarDays className="w-7 h-7 text-emerald-600" />
               {selectedDayLabel}
             </h1>
             <p className="text-xs md:text-sm text-slate-600 max-w-xl">
               Sistem məlumatları + real gün sonu inputların birləşir. Günün
               satış, alış, xərc və kassa yekunlarını buradan tam idarə edə
               bilərsən.
             </p>
           </div>
   
           <div className="flex flex-wrap items-center gap-2 md:gap-3">
             {/* Date switch */}
             <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 px-2 py-1">
               <button
                 onClick={() => changeDay(-1)}
                 className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200"
               >
                 <ChevronLeft className="w-4 h-4" />
               </button>
               <input
                 type="date"
                 value={selectedDay}
                 onChange={(e) => setSelectedDay(e.target.value)}
                 className="h-8 rounded-xl border-0 bg-transparent px-2 text-xs md:text-sm font-semibold text-slate-700 focus:outline-none focus:ring-0"
               />
               <button
                 onClick={() => changeDay(1)}
                 className="inline-flex h-8 w-8 items-center justify-center rounded-xl text-slate-500 hover:bg-slate-200"
               >
                 <ChevronRight className="w-4 h-4" />
               </button>
             </div>
   
             {/* Export buttons */}
             <button
               onClick={handleCopySummary}
               className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs md:text-sm font-semibold text-emerald-700 hover:bg-emerald-100 shadow-sm"
             >
               <Clipboard className="w-4 h-4" />
               {copied ? 'Kopyalandı' : 'JSON Export'}
             </button>
             <button
               onClick={handlePrint}
               className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs md:text-sm font-semibold text-slate-700 hover:bg-slate-100 shadow-sm"
             >
               <Download className="w-4 h-4" />
               Çap et
             </button>
           </div>
         </motion.header>

  )
}

export default DailyHeader
