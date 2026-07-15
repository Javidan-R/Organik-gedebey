// src/components/admin/daily/DailyHeader.tsx
'use client';

import { useMemo, useCallback, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  Clipboard,
} from 'lucide-react';
import { format } from 'date-fns';
import { az } from 'date-fns/locale';
import { currency } from '@/helpers';
import type { DayTag } from '@/types/daily';
import type { SystemMetrics } from '@/hooks/useDailySummary';

interface DailyHeaderProps {
  selectedDay: string;
  onDayChange: (day: string) => void;
  systemMetrics: SystemMetrics;
  closingForm: any;
  realProfit: number;
  systemProfit: number;
  purchasesTotal: number;
  expensesTotal: number;
  kassaReal: number;
  kassaSystem: number;
  diffSales: number;
  diffCustomers: number;
  diffKassa: number;
  dayHealthScore: number;
  dayTag: DayTag;
}

export default function DailyHeader({
  selectedDay,
  onDayChange,
  systemMetrics,
  closingForm,
  realProfit,
  systemProfit,
  purchasesTotal,
  expensesTotal,
  kassaReal,
  kassaSystem,
  diffSales,
  diffCustomers,
  diffKassa,
  dayHealthScore,
  dayTag,
}: DailyHeaderProps) {
  const [copied, setCopied] = useState(false);

  const selectedDayLabel = useMemo(
    () =>
      format(new Date(selectedDay), 'd MMMM yyyy, EEEE', { locale: az }),
    [selectedDay]
  );

  const changeDay = (delta: number) => {
    const d = new Date(selectedDay);
    d.setDate(d.getDate() + delta);
    onDayChange(d.toISOString().slice(0, 10));
  };

  const handleCopySummary = useCallback(() => {
    const payload = {
      date: selectedDay,
      system: {
        sales: systemMetrics.salesTotal,
        purchases: purchasesTotal,
        expenses: expensesTotal,
        profit: systemProfit,
        customers: systemMetrics.customerCount,
        orders: systemMetrics.orderCount,
        avgTicket: systemMetrics.avgTicket,
        cashPayments: systemMetrics.cashPayments,
        cardPayments: systemMetrics.cardPayments,
        discount: systemMetrics.totalDiscount,
        delivery: systemMetrics.totalDelivery,
      },
      real: {
        ...closingForm,
        realProfit,
        kassaReal,
      },
      diffs: {
        diffSales,
        diffCustomers,
        diffKassa,
        profitGap: realProfit - systemProfit,
      },
      health: {
        score: dayHealthScore,
        tag: dayTag.label,
      },
    };

    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard
        .writeText(JSON.stringify(payload, null, 2))
        .then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {});
    }
  }, [
    selectedDay,
    systemMetrics,
    purchasesTotal,
    expensesTotal,
    systemProfit,
    closingForm,
    realProfit,
    kassaReal,
    diffSales,
    diffCustomers,
    diffKassa,
    dayHealthScore,
    dayTag.label,
  ]);

  const handlePrint = useCallback(() => {
    if (typeof window !== 'undefined') window.print();
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
          Sistem məlumatları + real gün sonu inputların birləşir. Günün satış,
          alış, xərc və kassa yekunlarını buradan tam idarə edə bilərsən.
        </p>
        <div className="flex flex-wrap items-center gap-2 mt-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-blue-700">
            Sistem gəlir: {currency(systemMetrics.salesTotal)}
          </span>
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-0.5 text-amber-700">
            Xərclər: {currency(expensesTotal)}
          </span>
          <span
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 ${
              systemProfit >= 0
                ? 'bg-emerald-50 text-emerald-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            Sistem mənfəət: {currency(systemProfit)}
          </span>
        </div>
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
            onChange={(e) => onDayChange(e.target.value)}
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
  );
}