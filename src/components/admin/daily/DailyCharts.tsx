// src/components/admin/daily/DailyCharts.tsx
'use client';

import { useMemo } from 'react';
import {
  PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, CartesianGrid, XAxis, YAxis,
  LineChart, Line,
} from 'recharts';
import { PieChart as PieChartIcon, BarChart3, LineChart as LineChartIcon } from 'lucide-react';
import { SectionCard, EmptyState } from '@/components/admin/daily/SectionCard';
import { currency } from '@/helpers';
import type { Product, Category } from '@/types/products';
import type { DailyOrder, SystemMetrics } from '@/hooks/useDailySummary';

const CHART_COLORS = [
  '#10b981', '#3b82f6', '#8b5cf6', '#f59e0b', '#ef4444',
  '#06b6d4', '#ec4899', '#f97316', '#14b8a6', '#6366f1',
];

interface DailyChartsProps {
  dayOrders: DailyOrder[];
  productBreakdown: SystemMetrics['productBreakdown'];
  hourlySales: SystemMetrics['hourlySales'];
  products: Product[];
  categories: Category[];
}

export default function DailyCharts({
  dayOrders,
  productBreakdown,
  hourlySales,
  products,
  categories,
}: DailyChartsProps) {
  // Kateqoriya üzrə paylanma – orders içindən gəlir
  const categoryPieData = useMemo(() => {
    const map = new Map<string, number>();
    dayOrders.forEach((order) => {
      order.items.forEach((item) => {
        // item-də productId yoxdur deyə, productName-dən yola çıxırıq
        const product = products.find(
          (p) => p.name === item.productName
        );
        const category = categories.find(
          (c) => c.id === product?.categoryId
        );
        const name = category?.name || 'Digər';
        const value =
          (map.get(name) ?? 0) + item.qty * Number(item.priceAtOrder);
        map.set(name, value);
      });
    });
    return Array.from(map.entries())
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [dayOrders, products, categories]);

  // Məhsul üzrə xülasə (server‑dən birbaşa gəlir)
  const topProducts = useMemo(
    () => productBreakdown.slice(0, 10),
    [productBreakdown]
  );

  return (
    <section className="grid gap-4 lg:grid-cols-3">
      {/* PIE: Kateqoriya üzrə satış */}
      <SectionCard
        title="Kateqoriya üzrə satış paylanması"
        icon={<PieChartIcon className="w-4 h-4 text-emerald-600" />}
      >
        <div className="h-72">
          {categoryPieData.length === 0 ? (
            <EmptyState message="Kateqoriya üzrə məlumat yoxdur." />
          ) : (
            <ResponsiveContainer>
              <PieChart>
                <Pie
                  data={categoryPieData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={55}
                  outerRadius={90}
                  paddingAngle={3}
                >
                  {categoryPieData.map((_, idx) => (
                    <Cell
                      key={idx}
                      fill={CHART_COLORS[idx % CHART_COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0] as unknown as {
                        name: string;
                        value: number;
                      };
                      return (
                        <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-emerald-700">
                            {data.name ?? 'Digər'}
                          </p>
                          <p className="text-slate-600 mt-1">
                            {currency(data.value)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* BAR: ən çox satılan məhsullar (server‑dən) */}
      <SectionCard
        title="Ən çox satılan 10 məhsul"
        icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
      >
        <div className="h-72">
          {topProducts.length === 0 ? (
            <EmptyState message="Bu gün məhsul satışı yoxdur." />
          ) : (
            <ResponsiveContainer>
              <BarChart
                data={topProducts}
                margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="productName"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                  interval={0}
                  angle={-40}
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} stroke="#6b7280" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0] as unknown as {
                        productName: string;
                        totalQty: number;
                        totalRevenue: number;
                      };
                      return (
                        <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-blue-700">
                            {data.productName}
                          </p>
                          <p className="mt-1 text-slate-700">
                            Satış: {data.totalQty} ədəd
                          </p>
                          <p className="mt-0.5 text-emerald-700">
                            Dövriyyə: {currency(data.totalRevenue)}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Bar
                  dataKey="totalQty"
                  radius={[6, 6, 0, 0]}
                  fill="#0ea5e9"
                />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>

      {/* LINE: saatlıq satış */}
      <SectionCard
        title="Saatlara görə satış qrafiki"
        icon={<LineChartIcon className="w-4 h-4 text-purple-600" />}
      >
        <div className="h-72">
          {hourlySales.length === 0 ? (
            <EmptyState message="Bu gün sifariş yoxdur." />
          ) : (
            <ResponsiveContainer>
              <LineChart
                data={hourlySales}
                margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#6b7280' }}
                />
                <YAxis
                  stroke="#6b7280"
                  tickFormatter={(v) => `${v}`}
                />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0] as unknown as {
                        label: string;
                        sales: number;
                        orders: number;
                      };
                      return (
                        <div className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs shadow-md">
                          <p className="font-semibold text-purple-700">
                            Saat: {data.label}
                          </p>
                          <p className="mt-1 text-emerald-700">
                            Satış: {currency(data.sales)}
                          </p>
                          <p className="text-slate-600">
                            Sifariş: {data.orders}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="sales"
                  stroke="#a855f7"
                  strokeWidth={2}
                  dot={{ r: 2 }}
                  name="Satış"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
        </div>
      </SectionCard>
    </section>
  );
}