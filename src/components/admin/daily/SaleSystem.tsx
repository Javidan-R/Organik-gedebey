// src/components/admin/daily/SaleSystem.tsx
'use client';

import { useMemo, ChangeEvent } from 'react';
import { motion } from 'framer-motion';
import {
  Calculator,
  Wallet,
  CreditCard,
  Banknote,
  StickyNote,
  AlertTriangle,
  CheckCircle2,
  Receipt,
  ShoppingBag,
  TrendingDown,
} from 'lucide-react';
import { currency } from '@/helpers';
import type { SystemMetrics, DailyOrder } from '@/hooks/useDailySummary';

interface Props {
  closingForm: any;
  onClosingFormChange: (form: any) => void;
  systemMetrics: SystemMetrics;
  purchasesTotal: number;
  expensesTotal: number;
  systemProfit: number;
  kassaSystem: number;
  kassaReal: number;
  systemBalances: { id: string; name: string; type: string; balance: number }[];
  dayOrders: DailyOrder[];
  selectedDay: string;
}

export default function SaleSystem({
  closingForm,
  onClosingFormChange,
  systemMetrics,
  purchasesTotal,
  expensesTotal,
  systemProfit,
  kassaSystem,
  kassaReal,
  systemBalances,
  dayOrders,
}: Props) {
  const {
    salesTotal,
    customerCount,
    avgTicket,
    cashPayments,
    cardPayments,
  } = systemMetrics;

  const cashBucket =
    systemBalances.find((b) => b.type === 'cash')?.balance ?? 0;
  const posBucket =
    systemBalances.find((b) => b.type === 'pos')?.balance ?? 0;
  const bankBucket =
    systemBalances.find((b) => b.type === 'bank')?.balance ?? 0;

  const handleNumberChange =
    (field: string) => (e: ChangeEvent<HTMLInputElement>) => {
      const v = parseFloat(e.target.value || '0');
      onClosingFormChange({
        ...closingForm,
        [field]: Number.isNaN(v) ? 0 : v,
      });
    };

  const handleNoteChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    onClosingFormChange({ ...closingForm, note: e.target.value });
  };

  const totalSystemCash = cashBucket + posBucket + bankBucket;
  const totalRealCash =
    closingForm.realCashEnd + closingForm.realPos + closingForm.realBank;
  const diffTotalCash = totalRealCash - totalSystemCash;

  const realProfit =
    closingForm.realSales -
    closingForm.realPurchases -
    closingForm.realExpenses;

  const hasBigCashIssue = Math.abs(diffTotalCash) > 5;

  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="grid gap-4 rounded-3xl border border-slate-100 bg-white/95 p-4 shadow-lg shadow-slate-50 md:grid-cols-[2fr,1.3fr] md:p-5"
    >
      <div className="space-y-4">
        <header className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-50 text-emerald-700">
              <Calculator className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-slate-800 md:text-base">
                Gün Sonu Bəyannamə — Sistem vs Real
              </h2>
              <p className="text-[11px] text-slate-500 md:text-xs">
                Sistem rəqəmlərini real yoxlama ilə müqayisə et, fərqləri gör
                və qeydlər yaz.
              </p>
            </div>
          </div>
          <HealthBadge
            label="Günün sağlamlıq skoru"
            score={
              (() => {
                let s = 100;
                const gapSalesRatio =
                  salesTotal > 0
                    ? Math.abs(
                        closingForm.realSales - salesTotal
                      ) / salesTotal
                    : 0;
                if (gapSalesRatio > 0.1) s -= 25;
                else if (gapSalesRatio > 0.05) s -= 10;
                if (realProfit < 0) s -= 20;
                if (diffTotalCash !== 0) s -= 15;
                return Math.max(0, Math.min(100, s));
              })()
            }
          />
        </header>

        {/* System metrics card */}
        <div className="grid gap-3 rounded-2xl bg-slate-50/80 p-3 md:grid-cols-2">
          <SystemStat label="Satış (Sistem)" value={currency(salesTotal)} />
          <SystemStat label="Alış (Sistem)" value={currency(purchasesTotal)} />
          <SystemStat label="Xərc (Sistem)" value={currency(expensesTotal)} />
          <SystemStat
            label="Mənfəət (Sistem)"
            value={currency(systemProfit)}
            highlight
          />
          <SystemStat label="Müştəri sayı" value={customerCount} />
          <SystemStat
            label="Nağd / Kart"
            value={`${currency(cashPayments)} / ${currency(cardPayments)}`}
          />
        </div>

        {/* Real inputs */}
        <div className="grid gap-4 md:grid-cols-2">
          <FormCard
            title="Real Satış & Alış & Xərc"
            icon={<Wallet className="h-4 w-4" />}
          >
            <TwoColField
              label="Real Satış"
              system={currency(salesTotal)}
              real={closingForm.realSales}
              onChange={handleNumberChange('realSales')}
            />
            <TwoColField
              label="Real Alış"
              system={currency(purchasesTotal)}
              real={closingForm.realPurchases}
              onChange={handleNumberChange('realPurchases')}
            />
            <TwoColField
              label="Real Xərc"
              system={currency(expensesTotal)}
              real={closingForm.realExpenses}
              onChange={handleNumberChange('realExpenses')}
            />
            <TwoColField
              label="Real Müştəri sayı"
              system={customerCount.toString()}
              real={closingForm.realCustomers}
              onChange={handleNumberChange('realCustomers')}
              isInteger
            />
          </FormCard>

          <FormCard
            title="Kassa, POS, Bank (Real)"
            icon={<CreditCard className="h-4 w-4" />}
          >
            <TwoColField
              label="Real Kassa Son"
              system={currency(cashBucket)}
              real={closingForm.realCashEnd}
              onChange={handleNumberChange('realCashEnd')}
            />
            <TwoColField
              label="Real POS"
              system={currency(posBucket)}
              real={closingForm.realPos}
              onChange={handleNumberChange('realPos')}
            />
            <TwoColField
              label="Real Bank"
              system={currency(bankBucket)}
              real={closingForm.realBank}
              onChange={handleNumberChange('realBank')}
            />
            <div className="mt-2 rounded-xl bg-slate-50 p-2 text-[11px] text-slate-500">
              <span className="font-semibold">
                Real cəmi (Kassa + POS + Bank):
              </span>{' '}
              {currency(totalRealCash)} — Sistem: {currency(totalSystemCash)}
            </div>
          </FormCard>
        </div>

        {/* Qeyd və sifariş cədvəli */}
        <div className="grid gap-3 md:grid-cols-[2fr,1fr]">
          <div className="space-y-1">
            <label className="flex items-center gap-2 text-[11px] font-semibold text-slate-600">
              <StickyNote className="h-3.5 w-3.5" />
              Gün sonu qeydi / izah
            </label>
            <textarea
              rows={3}
              value={closingForm.note}
              onChange={handleNoteChange}
              placeholder="Məs: Kassa fərqi səbəbi, EVD, kart gecikməsi..."
              className="w-full resize-y rounded-2xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-800 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 md:text-sm"
            />
          </div>
          <SummaryBadge
            dayHealthScore={(() => {
              let s = 100;
              const gapSalesRatio =
                salesTotal > 0
                  ? Math.abs(
                      closingForm.realSales - salesTotal
                    ) / salesTotal
                  : 0;
              if (gapSalesRatio > 0.1) s -= 25;
              else if (gapSalesRatio > 0.05) s -= 10;
              if (realProfit < 0) s -= 20;
              if (diffTotalCash !== 0) s -= 15;
              return Math.max(0, Math.min(100, s));
            })()}
            diffTotalCash={diffTotalCash}
            hasBigCashIssue={hasBigCashIssue}
          />
        </div>

        {/* Bugünkü sifarişlərin icmalı */}
        {dayOrders.length > 0 && (
          <div className="rounded-2xl border border-slate-100 bg-white p-3">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-700 mb-3">
              <Receipt className="w-4 h-4 text-emerald-600" />
              Bugünkü sifarişlər ({dayOrders.length})
            </h3>
            <div className="max-h-48 overflow-y-auto space-y-2">
              {dayOrders.map((order) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between rounded-xl border border-slate-50 bg-slate-50/50 p-2 text-xs"
                >
                  <div className="space-y-0.5">
                    <p className="font-semibold text-slate-800">
                      {order.orderNumber}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      {order.customerName} • {order.items.length} məhsul
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-emerald-700">
                      {Number(order.total).toFixed(2)} ₼
                    </p>
                    <p className="text-[10px] text-slate-400">
                      {order.paymentMethod === 'CASH_ON_DELIVERY'
                        ? 'Nağd'
                        : 'Kart'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <aside className="space-y-4 rounded-2xl bg-slate-50/70 p-3 md:p-4">
        <h3 className="mb-1 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-slate-600 md:text-[13px]">
          <Banknote className="h-4 w-4 text-emerald-600" />
          Gün Sonu Quick Check
        </h3>
        <DiffLine
          label="Satış"
          system={salesTotal}
          real={closingForm.realSales}
        />
        <DiffLine
          label="Müştəri sayı"
          system={customerCount}
          real={closingForm.realCustomers}
          money={false}
        />
        <DiffLine
          label="Kassa Son"
          system={cashBucket}
          real={closingForm.realCashEnd}
        />
        <DiffLine label="POS" system={posBucket} real={closingForm.realPos} />
        <DiffLine
          label="Bank"
          system={bankBucket}
          real={closingForm.realBank}
        />
        <DiffLine
          label="Toplam Kassa + POS + Bank"
          system={totalSystemCash}
          real={totalRealCash}
        />

        <div className="mt-2 space-y-2 text-[11px] md:text-xs">
          {hasBigCashIssue ? (
            <div className="flex items-start gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-3 py-2 text-rose-700">
              <AlertTriangle className="mt-0.5 h-4 w-4" />
              <p>
                Kassa / POS / Bank cəmi ilə sistem cəmi arasında fərq var.
                Gün sonu kassa sayımını təkrar yoxla.
              </p>
            </div>
          ) : (
            <div className="flex items-start gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-emerald-700">
              <CheckCircle2 className="mt-0.5 h-4 w-4" />
              <p>
                Kassa və sistem rəqəmləri uyğundur. Gün sonu bəyannamə sağlam
                görünür.
              </p>
            </div>
          )}
        </div>
      </aside>
    </motion.section>
  );
}

/* ── Alt komponentlər (əvvəlki ilə demək olar ki, eyni) ─────────────────── */
function SystemStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string | number;
  highlight?: boolean;
}) {
  return (
    <div className="flex flex-col rounded-2xl bg-white/90 px-3 py-2 shadow-sm shadow-slate-100">
      <span className="text-[11px] font-semibold text-slate-500">{label}</span>
      <span
        className={`text-xs font-bold md:text-sm ${
          highlight ? 'text-emerald-700' : 'text-slate-800'
        }`}
      >
        {value}
      </span>
    </div>
  );
}

function FormCard({
  title,
  icon,
  children,
}: {
  title: string;
  icon?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 rounded-2xl border border-slate-100 bg-white/90 p-3 shadow-sm shadow-slate-50 md:p-4">
      <div className="flex items-center gap-2">
        {icon && (
          <div className="flex h-7 w-7 items-center justify-center rounded-xl bg-slate-50 text-slate-700">
            {icon}
          </div>
        )}
        <h3 className="text-xs font-semibold text-slate-700 md:text-sm">
          {title}
        </h3>
      </div>
      {children}
    </div>
  );
}

function TwoColField({
  label,
  system,
  real,
  onChange,
  isInteger,
}: {
  label: string;
  system: string;
  real: number;
  onChange: (e: ChangeEvent<HTMLInputElement>) => void;
  isInteger?: boolean;
}) {
  return (
    <div className="space-y-1 rounded-2xl bg-slate-50/80 p-2">
      <div className="flex items-center justify-between text-[11px] text-slate-500">
        <span className="font-semibold">{label}</span>
        <span className="text-[10px]">
          Sistem: <span className="font-semibold">{system}</span>
        </span>
      </div>
      <input
        type="number"
        step={isInteger ? '1' : '0.01'}
        value={Number.isNaN(real) ? '' : real}
        onChange={onChange}
        className="h-8 w-full rounded-xl border border-slate-200 bg-white px-3 text-xs text-slate-800 shadow-inner focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
      />
    </div>
  );
}

function DiffLine({
  label,
  system,
  real,
  money = true,
}: {
  label: string;
  system: number;
  real: number;
  money?: boolean;
}) {
  const diff = (real || 0) - (system || 0);
  const neutral = diff === 0;
  const positive = diff > 0;
  const format = (v: number) => (money ? currency(v) : v.toFixed(0));
  return (
    <div className="flex items-center justify-between rounded-xl bg-white px-3 py-1.5 text-[11px] text-slate-700">
      <div>
        <p className="font-semibold">{label}</p>
        <p className="text-[10px] text-slate-500">
          Sistem: {format(system)} · Real: {format(real)}
        </p>
      </div>
      <span
        className={`inline-flex items-center rounded-xl px-2 py-0.5 text-[10px] font-semibold ${
          neutral
            ? 'bg-slate-100 text-slate-500'
            : positive
            ? 'bg-emerald-100 text-emerald-700'
            : 'bg-rose-100 text-rose-700'
        }`}
      >
        {neutral ? 'Uyğundur' : positive ? `+${format(diff)}` : format(diff)}
      </span>
    </div>
  );
}

function HealthBadge({ label, score }: { label: string; score: number }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
      <CheckCircle2 className="h-4 w-4" />
      <span>{label}</span>
      <span className="rounded-xl bg-white/80 px-2 py-0.5 text-[11px] font-bold text-emerald-700">
        {score.toFixed(0)}/100
      </span>
    </div>
  );
}

function SummaryBadge({
  dayHealthScore,
  diffTotalCash,
  hasBigCashIssue,
}: {
  dayHealthScore: number;
  diffTotalCash: number;
  hasBigCashIssue: boolean;
}) {
  const text =
    dayHealthScore >= 85
      ? 'Gün sonu rəqəmlər çox yaxşıdır. Sistem və real göstəricilər uyğundur.'
      : dayHealthScore >= 60
      ? 'Bəzi fərqlər var, amma ümumi vəziyyət idarə edilə biləndir.'
      : 'Fərqlər çoxdur. Kassa, POS, bank və satış qeydlərini yenidən nəzərdən keçir.';
  return (
    <div className="space-y-2 rounded-2xl border border-slate-200 bg-white px-3 py-2 text-[11px] text-slate-700 shadow-sm">
      <div className="flex items-center justify-between">
        <span className="font-semibold">Gün sonu nəticə</span>
        <span className="rounded-xl bg-slate-50 px-2 py-0.5 text-[10px] font-mono text-slate-500">
          Kassa fərqi: {currency(diffTotalCash)}
        </span>
      </div>
      <p className="text-[10px] leading-snug">{text}</p>
      {hasBigCashIssue && (
        <p className="text-[10px] font-semibold text-rose-600">
          * Kassa fərqi 5 ₼-dan çoxdur — sabah ilk iş bunu düzəltmək olsun.
        </p>
      )}
    </div>
  );
}