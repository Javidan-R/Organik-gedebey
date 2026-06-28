import { SectionCard, EmptyState } from '@/app/admin/summary/daily/page';
import { useApp } from '@/lib/store';
import { PieChart, BarChart3, LineChart as LineIcon, PieChart as PieIcon } from 'lucide-react';
import { BarChart } from 'recharts';
import { LineChart } from 'recharts';
import {  useMemo, useState } from 'react'
import { ResponsiveContainer, Pie, Cell, Tooltip, Legend, CartesianGrid, XAxis, YAxis, Bar, Line,  } from 'recharts';
import { hourlyLabels, CHART_COLORS, currency } from '@/helpers';



// Helpers

const DailyCharts = () => {
  const { orders, products, categories } = useApp();

  const [selectedDay, setSelectedDay] = useState(
    new Date().toISOString().slice(0, 10), // YYYY-MM-DD
  );

  // ========= SYSTEM CALCULATIONS FOR SELECTED DAY =========

  const dayOrders = useMemo(
    () =>
      orders.filter(
        (o) => o.createdAt.slice(0, 10) === selectedDay,
      ),
    [orders, selectedDay],
  );




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

  // ========= CATEGORY PIE =========
  const categoryPieData = useMemo(() => {
    const map = new Map<string, number>();

    dayOrders.forEach((o) => {
      o.items.forEach((it) => {
        const product = products.find(
          (p) => p.id === it.productId,
        );
        const category = categories.find(
          (c) => c.id === product?.categoryId,
        );
        const name = category?.name || 'Digər';
        const value =
          (map.get(name) ?? 0) +
          it.qty * it.priceAtOrder;
        map.set(name, value);
      });
    });

    return Array.from(map.entries()).map(
      ([name, value]) => ({
        name,
        value,
      }),
    );
  }, [dayOrders, products, categories]);

  // ========= HOURLY LINE CHART =========
  const hourlyData = useMemo(() => {
    const buckets = Array.from({ length: 24 }).map(
      (_, hour) => ({
        hour,
        label: hourlyLabels[hour],
        sales: 0,
        orders: 0,
      }),
    );

    dayOrders.forEach((o) => {
      const d = new Date(o.createdAt);
      const h = d.getHours();
      const sales = o.items.reduce(
        (s, it) => s + it.qty * it.priceAtOrder,
        0,
      );
      buckets[h].sales += sales;
      buckets[h].orders += 1;
    });

    return buckets;
  }, [dayOrders]);



  // ========= RENDER =========

  return (
    <section className="grid gap-4 lg:grid-cols-3">
           {/* PIE: CATEGORY DISTRIBUTION */}
           <SectionCard
             title="Kateqoriya üzrə satış paylanması (sistem)"
             icon={<PieIcon className="w-4 h-4 text-emerald-600" />}
           >
             <div className="h-72">
               {categoryPieData.length === 0 ? (
                 <EmptyState message="Bu gün üçün kateqoriya üzrə satış yoxdur." />
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
                           fill={
                             CHART_COLORS[
                               idx % CHART_COLORS.length
                             ]
                           }
                         />
                       ))}
                     </Pie>
                     <Tooltip
                       content={({ active, payload }) => {
                         if (
                           active &&
                           payload &&
                           payload.length
                         ) {
                           const p = payload[0].payload as { name: string; value: number };
                           return (
                             <div className="rounded-xl border border-emerald-100 bg-white px-3 py-2 text-xs shadow-md">
                               <p className="font-semibold text-emerald-700">
                                 {p.name}
                               </p>
                               <p className="text-slate-600 mt-1">
                                 {currency(p.value)}
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
   
           {/* BAR: TOP PRODUCTS */}
           <SectionCard
             title="Bu gün ən çox satılan 10 məhsul (sistem)"
             icon={<BarChart3 className="w-4 h-4 text-blue-600" />}
           >
             <div className="h-72">
               {productDailySummary.length === 0 ? (
                 <EmptyState message="Bu gün üçün məhsul satış qeydi yoxdur." />
               ) : (
                 <ResponsiveContainer>
                   <BarChart
                     data={productDailySummary.slice(0, 10)}
                     margin={{ top: 10, right: 10, left: 0, bottom: 40 }}
                   >
                     <CartesianGrid
                       strokeDasharray="3 3"
                       stroke="#e5e7eb"
                     />
                     <XAxis
                       dataKey="name"
                       tick={{
                         fontSize: 10,
                         fill: '#6b7280',
                       }}
                       interval={0}
                       angle={-40}
                       textAnchor="end"
                     />
                     <YAxis
                       allowDecimals={false}
                       stroke="#6b7280"
                     />
                     <Tooltip
                       content={({ active, payload }) => {
                         if (
                           active &&
                           payload &&
                           payload.length
                         ) {
                           const d = payload[0].payload as { name: string; qty: number; revenue: number };
                           return (
                             <div className="rounded-xl border border-blue-100 bg-white px-3 py-2 text-xs shadow-md">
                               <p className="font-semibold text-blue-700">
                                 {d.name}
                               </p>
                               <p className="mt-1 text-slate-700">
                                 Satış: {d.qty} ədəd
                               </p>
                               <p className="mt-0.5 text-emerald-700">
                                 Dövriyyə: {currency(d.revenue)}
                               </p>
                             </div>
                           );
                         }
                         return null;
                       }}
                     />
                     <Bar
                       dataKey="qty"
                       radius={[6, 6, 0, 0]}
                       fill="#0ea5e9"
                     />
                   </BarChart>
                 </ResponsiveContainer>
               )}
             </div>
           </SectionCard>
   
           {/* LINE: HOURLY SALES */}
           <SectionCard
             title="Saatlara görə satış qrafiki (sistem)"
             icon={<LineIcon className="w-4 h-4 text-purple-600" />}
           >
             <div className="h-72">
               {dayOrders.length === 0 ? (
                 <EmptyState message="Bu gün üçün sifariş yoxdur." />
               ) : (
                 <ResponsiveContainer>
                   <LineChart
                     data={hourlyData}
                     margin={{ top: 10, right: 20, left: 0, bottom: 10 }}
                   >
                     <CartesianGrid
                       strokeDasharray="3 3"
                       stroke="#e5e7eb"
                     />
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
                         if (
                           active &&
                           payload &&
                           payload.length
                         ) {
                           const d = payload[0].payload as { label: string; sales: number; orders: number };
                           return (
                             <div className="rounded-xl border border-purple-100 bg-white px-3 py-2 text-xs shadow-md">
                               <p className="font-semibold text-purple-700">
                                 Saat: {d.label}
                               </p>
                               <p className="mt-1 text-emerald-700">
                                 Satış: {currency(d.sales)}
                               </p>
                               <p className="text-slate-600">
                                 Sifariş sayı: {d.orders}
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
  )
}

export default DailyCharts
