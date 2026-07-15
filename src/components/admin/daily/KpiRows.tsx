// src/components/admin/daily/KpiRows.tsx
'use client';

import {
  ShoppingBag, Users, Wallet, Activity,
  TrendingUp, CreditCard, Banknote, TicketPercent,
  Truck, Percent, DollarSign, BarChart3,
} from 'lucide-react';
import { StatCard } from '@/components/admin/daily/StatCard';
import { currency } from '@/helpers';

interface KpiRowsProps {
  systemMetrics?: any;
  closingForm?: any;
  systemProfit?: number;
  realProfit?: number;
  dayHealthScore?: number;
  dayTag?: { label: string; color?: string };
  diffCustomers?: number;
  diffSales?: number;
  diffKassa?: number;
  expensesTotal?: number;
  avgTicket?: number;
  cashPayments?: number;
  cardPayments?: number;
  totalDiscount?: number;
  totalDelivery?: number;
}

export default function KpiRows(props: KpiRowsProps) {
  const {
    systemMetrics = {},
    closingForm = {},
    systemProfit = 0,
    realProfit = 0,
    dayHealthScore = 0,
    dayTag = { label: '—' },
    diffCustomers = 0,
    diffSales = 0,
    diffKassa = 0,
    expensesTotal = 0,
    avgTicket = 0,
    cashPayments = 0,
    cardPayments = 0,
    totalDiscount = 0,
    totalDelivery = 0,
  } = props;

  const salesTotal = systemMetrics?.salesTotal ?? 0;
  const orderCount = systemMetrics?.orderCount ?? 0;
  const customerCount = systemMetrics?.customerCount ?? 0;
  const totalCoupon = systemMetrics?.totalCoupon ?? 0;

  const profitMargin = salesTotal > 0 ? (systemProfit / salesTotal) * 100 : 0;

  return (
    <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      <StatCard
        icon={<ShoppingBag className="w-5 h-5" />}
        label="Sistem satış"
        value={currency(salesTotal)}
        subtitle={`${orderCount} sifariş, orta çek ${currency(avgTicket)}`}
        accent="emerald"
      />
      <StatCard
        icon={<Users className="w-5 h-5" />}
        label="Müştəri sayı"
        value={customerCount.toString()}
        subtitle={`Real: ${closingForm?.realCustomers ?? '—'}`}
        accent="blue"
      />
      <StatCard
        icon={<Banknote className="w-5 h-5" />}
        label="Nağd / Kart"
        value={`${currency(cashPayments)} / ${currency(cardPayments)}`}
        subtitle="Ödəniş üsulu"
        accent="purple"
      />
      <StatCard
        icon={<TicketPercent className="w-5 h-5" />}
        label="Endirimlər"
        value={currency(totalDiscount)}
        subtitle={`Kupon: ${currency(totalCoupon)}`}
        accent="amber"
      />
      <StatCard
        icon={<Truck className="w-5 h-5" />}
        label="Çatdırılma"
        value={currency(totalDelivery)}
        subtitle=""
        accent="indigo"
      />
      <StatCard
        icon={<Wallet className="w-5 h-5" />}
        label="Sistem mənfəəti"
        value={currency(systemProfit)}
        subtitle={`Real: ${currency(realProfit)}`}
        accent={systemProfit >= 0 ? 'emerald' : 'red'}
      />
      <StatCard
        icon={<Percent className="w-5 h-5" />}
        label="Mənfəət marjı"
        value={`${profitMargin.toFixed(1)}%`}
        subtitle="Sistem üzrə"
        accent={profitMargin > 10 ? 'emerald' : 'orange'}
      />
      <StatCard
        icon={<Activity size={20} />}
        label="Gün skoru"
        value={`${dayHealthScore.toFixed(0)} / 100`}
        subtitle={dayTag.label}
        accent="purple"
      />
      <StatCard
        icon={<BarChart3 className="w-5 h-5" />}
        label="Satış fərqi"
        value={currency(Math.abs(diffSales))}
        subtitle={diffSales >= 0 ? 'Sistemdən çox' : 'Sistemdən az'}
        accent="orange"
      />
      <StatCard
        icon={<DollarSign className="w-5 h-5" />}
        label="Kassa fərqi"
        value={currency(Math.abs(diffKassa))}
        subtitle="Sistem – Real"
        accent={diffKassa === 0 ? 'emerald' : 'red'}
      />
    </section>
  );
}