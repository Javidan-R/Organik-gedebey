// ============================================================
// src/components/admin/dashboard/RevenueForecastChart.tsx
// PHASE 4 — Tarixi dövriyyə + xətti trend proqnozu (± etibarlılıq aralığı)
// ============================================================
'use client';

import dynamic from 'next/dynamic';
import { useMemo } from 'react';
import { LineChartIcon } from 'lucide-react';
import { SectionCard, EmptyState } from '@/components/admin/daily/SectionCard';
import { currency } from '@/helpers';
import { DashboardForecast, DashboardSummary } from '@/hooks/useAnalyticsDashboard';

const ResponsiveContainer = dynamic(async () => ({ default: (await import('recharts')).ResponsiveContainer }), { ssr: false });
const ComposedChart = dynamic(async () => ({ default: (await import('recharts')).ComposedChart }), { ssr: false });
const Area = dynamic(async () => ({ default: (await import('recharts')).Area }), { ssr: false });
const Line = dynamic(async () => ({ default: (await import('recharts')).Line }), { ssr: false });
const XAxis = dynamic(async () => ({ default: (await import('recharts')).XAxis }), { ssr: false });
const YAxis = dynamic(async () => ({ default: (await import('recharts')).YAxis }), { ssr: false });
const CartesianGrid = dynamic(async () => ({ default: (await import('recharts')).CartesianGrid }), { ssr: false });
const Tooltip = dynamic(async () => ({ default: (await import('recharts')).Tooltip }), { ssr: false });
const Legend = dynamic(async () => ({ default: (await import('recharts')).Legend }), { ssr: false });

interface Props {
  summary?: DashboardSummary;
  forecast?: DashboardForecast;
  isLoading: boolean;
}

export default function RevenueForecastChart({ summary, forecast, isLoading }: Props) {
  const chartData = useMemo(() => {
    const history = (summary?.timeseries ?? []).map((t) => ({
      date: t.date,
      actual: Number(t.netRevenue),
      predicted: undefined as number | undefined,
      lowerBound: undefined as number | undefined,
      upperBound: undefined as number | undefined,
    }));
    const future = (forecast?.revenueForecast.points ?? []).map((p) => ({
      date: p.date,
      actual: undefined as number | undefined,
      predicted: p.predicted,
      lowerBound: p.lowerBound,
      upperBound: p.upperBound,
    }));
    return [...history, ...future];
  }, [summary, forecast]);

  const trendLabel =
    forecast?.revenueForecast.trend === 'artan'
      ? 'Artan trend'
      : forecast?.revenueForecast.trend === 'azalan'
      ? 'Azalan trend'
      : 'Sabit trend';

  return (
    <SectionCard
      title="Dövriyyə: tarixçə + 7 günlük proqnoz"
      icon={<LineChartIcon className="w-4 h-4 text-purple-600" />}
    >
      {isLoading ? (
        <div className="h-80 animate-pulse rounded-2xl bg-slate-100" />
      ) : chartData.length === 0 ? (
        <EmptyState message="Bu aralıq üçün məlumat yoxdur." />
      ) : (
        <>
          <div className="mb-2 flex items-center justify-between text-xs text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">{trendLabel}</span>
              {forecast && ` · gündə ${currency(forecast.revenueForecast.trendSlopePerDay)} · R² ${forecast.revenueForecast.r2}`}
            </span>
          </div>
          <div className="h-80">
            <ResponsiveContainer>
              <ComposedChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 10 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 10, fill: '#6b7280' }} />
                <Tooltip formatter={(v: number) => currency(v)} />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#a855f7"
                  fillOpacity={0.08}
                  name="Etibarlılıq aralığı (üst)"
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#ffffff"
                  fillOpacity={1}
                  name="Etibarlılıq aralığı (alt)"
                />
                <Line type="monotone" dataKey="actual" stroke="#0ea5e9" strokeWidth={2} dot={false} name="Faktiki" />
                <Line
                  type="monotone"
                  dataKey="predicted"
                  stroke="#a855f7"
                  strokeWidth={2}
                  strokeDasharray="5 4"
                  dot={{ r: 2 }}
                  name="Proqnoz"
                />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </SectionCard>
  );
}