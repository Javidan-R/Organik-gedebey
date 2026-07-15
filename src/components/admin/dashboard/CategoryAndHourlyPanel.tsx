// ============================================================
// src/components/admin/dashboard/CategoryAndHourlyPanel.tsx
// PHASE 4 — Kateqoriya üzrə gəlir bölgüsü + saatlıq satış heatmap-i
// ============================================================
'use client';

import dynamic from 'next/dynamic';
import { PieChart as PieChartIcon, Clock } from 'lucide-react';
import { hourlyLabels, CHART_COLORS, currency } from '@/helpers';
import type { DashboardRangeKey } from '@/lib/dashboard/dateRanges';
import { useDashboardBreakdown } from '@/hooks/useAnalyticsDashboard';
import { EmptyState, SectionCard } from '../daily/SectionCard';

const ResponsiveContainer = dynamic(async () => ({ default: (await import('recharts')).ResponsiveContainer }), { ssr: false });
const PieChart = dynamic(async () => ({ default: (await import('recharts')).PieChart }), { ssr: false });
const Pie = dynamic(async () => ({ default: (await import('recharts')).Pie }), { ssr: false });
const Cell = dynamic(async () => ({ default: (await import('recharts')).Cell }), { ssr: false });
const BarChart = dynamic(async () => ({ default: (await import('recharts')).BarChart }), { ssr: false });
const Bar = dynamic(async () => ({ default: (await import('recharts')).Bar }), { ssr: false });
const XAxis = dynamic(async () => ({ default: (await import('recharts')).XAxis }), { ssr: false });
const YAxis = dynamic(async () => ({ default: (await import('recharts')).YAxis }), { ssr: false });
const CartesianGrid = dynamic(async () => ({ default: (await import('recharts')).CartesianGrid }), { ssr: false });
const Tooltip = dynamic(async () => ({ default: (await import('recharts')).Tooltip }), { ssr: false });
const Legend = dynamic(async () => ({ default: (await import('recharts')).Legend }), { ssr: false });

export default function CategoryAndHourlyPanel({
  range,
  customStart,
  customEnd,
}: {
  range: DashboardRangeKey;
  customStart?: string;
  customEnd?: string;
}) {
  const { data, isLoading } = useDashboardBreakdown(range, customStart, customEnd);

  const hourlyData = Array.from({ length: 24 }).map((_, hour) => {
    const found = data?.hourly.find((h) => h.hour === hour);
    return { hour, label: hourlyLabels[hour], orders: found?.ordersCount ?? 0, revenue: Number(found?.revenue ?? 0) };
  });

  return (
    <section className="grid gap-4 lg:grid-cols-2">
      <SectionCard title="Kateqoriya üzrə gəlir bölgüsü" icon={<PieChartIcon className="w-4 h-4 text-emerald-600" />}>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
          ) : !data || data.categories.length === 0 ? (
            <EmptyState message="Bu aralıq üçün kateqoriya üzrə satış yoxdur." />
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie data={data.categories} dataKey="totalRevenue" nameKey="categoryName" innerRadius={55} outerRadius={90} paddingAngle={3}>
                  {data.categories.map((_, idx) => (
                    <Cell key={idx} fill={CHART_COLORS[idx % CHART_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(v: number) => currency(Number(v))} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      <SectionCard title="Saatlıq satış yoğunluğu" icon={<Clock className="w-4 h-4 text-purple-600" />}>
        <div className="h-72">
          {isLoading ? (
            <div className="h-full animate-pulse rounded-2xl bg-slate-100" />
          ) : (
            <ResponsiveContainer>
              <BarChart data={hourlyData} margin={{ top: 10, right: 10, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="label" tick={{ fontSize: 9, fill: '#6b7280' }} interval={2} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip formatter={(v: number, name: string) => (name === 'revenue' ? currency(v) : v)} />
                <Bar dataKey="orders" radius={[6, 6, 0, 0]} fill="#a855f7" name="Sifariş sayı" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>
    </section>
  );
}