'use client';

import dynamic from 'next/dynamic';
import { useMemo, useState } from 'react';
import { useApp } from '@/lib/store';
import { sellThrough, forecastPerProduct } from '@/lib/forecast';

const ResponsiveContainer = dynamic(async () => ({ default: (await import('recharts')).ResponsiveContainer }), { ssr:false });
const BarChart = dynamic(async () => ({ default: (await import('recharts')).BarChart }), { ssr:false });
const Bar = dynamic(async () => ({ default: (await import('recharts')).Bar }), { ssr:false });
const XAxis = dynamic(async () => ({ default: (await import('recharts')).XAxis }), { ssr:false });
const YAxis = dynamic(async () => ({ default: (await import('recharts')).YAxis }), { ssr:false });
const CartesianGrid = dynamic(async () => ({ default: (await import('recharts')).CartesianGrid }), { ssr:false });
const Tooltip = dynamic(async () => ({ default: (await import('recharts')).Tooltip }), { ssr:false });

export default function ForecastPage() {
  const { products, orders } = useApp();
  const [alpha, setAlpha] = useState(0.35);
  const [lead, setLead] = useState(3);

  const st14 = useMemo(()=> sellThrough(products, orders, 14), [products, orders]);
  const rows = useMemo(()=> products.map(p => forecastPerProduct(p, orders, { alpha, leadTimeDays: lead })), [products, orders, alpha, lead]);

  return (
    <main className="p-6 space-y-8 bg-gradient-to-b from-white to-emerald-50">
      <header className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-extrabold text-emerald-800">🤖 Smart Forecast</h1>
        <div className="flex items-center gap-2">
          <label className="text-sm text-gray-600">Alpha</label>
          <input type="number" min={0.05} max={0.95} step={0.05} value={alpha} onChange={e=>setAlpha(+e.target.value)} className="input w-24" />
          <label className="text-sm text-gray-600">Lead (gün)</label>
          <input type="number" min={1} max={14} value={lead} onChange={e=>setLead(+e.target.value)} className="input w-20" />
        </div>
      </header>

      {/* Sell-through Top 10 */}
      <section className="card card-pad">
        <h2 className="font-bold mb-3">14 günlük sell-through (Top 10)</h2>
        <div className="h-72">
          <ResponsiveContainer>
            <BarChart data={st14.slice(0,10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" hide />
              <YAxis />
              <Tooltip />
              <Bar dataKey="ratio" name="%" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </section>

      {/* Forecast cədvəli */}
      <section className="card card-pad overflow-x-auto">
        <h2 className="font-bold mb-3">Reorder point və tövsiyə olunan sifariş</h2>
        <table className="table">
          <thead className="text-gray-500">
            <tr>
              <th>Məhsul</th><th>On-hand</th><th>Günlük tələbat</th><th>ROP</th><th>Days of cover</th><th>Mean14</th><th>Mean30</th><th>Sigma</th><th>Tövsiyə PO</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(r=>(
              <tr key={r.productId} className="border-t">
                <td className="py-2">{r.productName}</td>
                <td>{r.onHand}</td>
                <td>{r.demandPerDay}</td>
                <td>{r.reorderPoint}</td>
                <td>{r.daysOfCover}</td>
                <td>{r.mean14}</td>
                <td>{r.mean30}</td>
                <td>{r.sigma}</td>
                <td className={r.recommendedPO>0?'text-emerald-700 font-semibold':''}>{r.recommendedPO}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </main>
  );
}
