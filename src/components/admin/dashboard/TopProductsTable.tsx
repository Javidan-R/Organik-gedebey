// ============================================================
// src/components/admin/dashboard/TopProductsTable.tsx
// PHASE 4 — Ən çox / ən az satılan, ən çox gəlir gətirən məhsullar
// ============================================================
'use client';

import { useState } from 'react';
import { ShoppingBag } from 'lucide-react';
import { SectionCard, EmptyState } from '@/components/admin/daily/SectionCard';
import { currency } from '@/helpers';
import type { DashboardRangeKey } from '@/lib/dashboard/dateRanges';
import { useDashboardProducts } from '@/hooks/useAnalyticsDashboard';

type SortMode = 'top' | 'top-qty' | 'least';

const SORT_LABELS: Record<SortMode, string> = {
  top: 'Ən çox gəlir',
  'top-qty': 'Ən çox satılan',
  least: 'Ən az satılan',
};

export default function TopProductsTable({
  range,
  customStart,
  customEnd,
}: {
  range: DashboardRangeKey;
  customStart?: string;
  customEnd?: string;
}) {
  const [sort, setSort] = useState<SortMode>('top');
  const { data, isLoading } = useDashboardProducts(range, sort, 10, customStart, customEnd);

  return (
    <SectionCard title="Məhsul analitikası" icon={<ShoppingBag className="w-4 h-4 text-emerald-600" />}>
      <div className="mb-3 flex gap-1.5">
        {(Object.keys(SORT_LABELS) as SortMode[]).map((s) => (
          <button
            key={s}
            onClick={() => setSort(s)}
            className={`rounded-xl px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
              sort === s ? 'bg-emerald-600 text-white' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
            }`}
          >
            {SORT_LABELS[s]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="h-72 animate-pulse rounded-2xl bg-slate-100" />
      ) : !data || data.products.length === 0 ? (
        <EmptyState message="Bu aralıq üçün məhsul satışı qeydi yoxdur." />
      ) : (
        <div className="max-h-72 overflow-y-auto pr-1 text-xs md:text-sm">
          <table className="w-full border-collapse">
            <thead>
              <tr className="text-left text-[11px] uppercase text-slate-500 border-b border-slate-100">
                <th className="py-2 pr-2">Məhsul</th>
                <th className="py-2 px-2 text-right">Miqdar</th>
                <th className="py-2 pl-2 text-right">Dövriyyə</th>
              </tr>
            </thead>
            <tbody>
              {data.products.map((p, idx) => (
                <tr key={p.productId + idx} className="border-b border-slate-50 hover:bg-emerald-50/60">
                  <td className="py-2 pr-2">
                    <p className="font-medium text-slate-800">{p.productName}</p>
                    <p className="text-[11px] text-slate-500">#{idx + 1}</p>
                  </td>
                  <td className="py-2 px-2 text-right font-semibold text-slate-700">{p.totalQty} ədəd</td>
                  <td className="py-2 pl-2 text-right text-emerald-700 font-semibold">{currency(Number(p.totalRevenue))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </SectionCard>
  );
}