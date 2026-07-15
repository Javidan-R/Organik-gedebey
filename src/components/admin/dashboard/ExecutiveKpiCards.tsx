// ============================================================
// src/components/admin/dashboard/ExecutiveKpiCards.tsx
// PHASE 4 — Seçilmiş aralıq üçün əsas KPI-lar + öncəki dövrlə müqayisə
// ============================================================
'use client';

import { TrendingUp, TrendingDown, Minus, Wallet, ShoppingBag, Users, Percent } from 'lucide-react';
import { currency } from '@/helpers';
import { DashboardSummary } from '@/hooks/useAnalyticsDashboard';

function GrowthBadge({ pct }: { pct: number }) {
  const rounded = Math.round(pct * 10) / 10;
  if (Math.abs(rounded) < 0.1) {
    return (
      <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-0.5 text-[11px] font-semibold text-slate-500">
        <Minus className="h-3 w-3" /> 0%
      </span>
    );
  }
  const positive = rounded > 0;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-[11px] font-semibold ${
        positive ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? '+' : ''}
      {rounded}%
    </span>
  );
}

export default function ExecutiveKpiCards({ data, isLoading }: { data?: DashboardSummary; isLoading: boolean }) {
  if (isLoading || !data) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-3xl bg-slate-100" />
        ))}
      </div>
    );
  }

  const { current } = data.kpis;
  const { growth } = data.kpis;

  const cards = [
    {
      icon: <Wallet className="h-5 w-5" />,
      label: 'Xalis dövriyyə',
      value: currency(Number(current.netRevenue)),
      growth: growth.revenueGrowthPct,
      accent: 'emerald',
    },
    {
      icon: <Percent className="h-5 w-5" />,
      label: 'Xalis qazanc',
      value: currency(Number(current.netProfit)),
      growth: growth.profitGrowthPct,
      accent: Number(current.netProfit) >= 0 ? 'emerald' : 'red',
    },
    {
      icon: <ShoppingBag className="h-5 w-5" />,
      label: 'Sifariş sayı',
      value: String(current.ordersTotal),
      growth: growth.ordersGrowthPct,
      accent: 'blue',
      subtitle: `${current.ordersDelivered} çatdırıldı · ${current.ordersCancelled} ləğv · ${current.ordersRefunded} geri qaytarıldı`,
    },
    {
      icon: <Users className="h-5 w-5" />,
      label: 'Yeni müştərilər',
      value: String(current.newCustomerCount),
      growth: growth.customerGrowthPct,
      accent: 'purple',
    },
  ] as const;

  const colorMap: Record<string, { bg: string; text: string }> = {
    emerald: { bg: 'bg-emerald-50', text: 'text-emerald-700' },
    blue: { bg: 'bg-sky-50', text: 'text-sky-700' },
    purple: { bg: 'bg-purple-50', text: 'text-purple-700' },
    red: { bg: 'bg-rose-50', text: 'text-rose-700' },
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {cards.map((c) => {
        const { bg, text } = colorMap[c.accent];
        return (
          <div key={c.label} className="rounded-3xl border border-slate-100 bg-white px-4 py-4 shadow-md shadow-slate-50">
            <div className="mb-2 flex items-center justify-between">
              <div className={`inline-flex h-9 w-9 items-center justify-center rounded-2xl ${bg} ${text}`}>{c.icon}</div>
              <GrowthBadge pct={c.growth} />
            </div>
            <p className="text-[11px] font-semibold uppercase tracking-wide text-slate-500">{c.label}</p>
            <p className={`mt-1 text-xl md:text-2xl font-extrabold ${text}`}>{c.value}</p>
            {'subtitle' in c && c.subtitle && <p className="mt-0.5 text-[11px] text-slate-500">{c.subtitle}</p>}
          </div>
        );
      })}
    </div>
  );
}