'use client';

import { Rocket, Percent, TrendingUp } from 'lucide-react';
import type { CampaignROI } from '@/types/finance';

export default function ROISimulator({
  discount,
  setDiscount,
  salesIncrease,
  setSalesIncrease,
  result,
  formatCurrency,
}: {
  discount: number;
  setDiscount: (v: number) => void;
  salesIncrease: number;
  setSalesIncrease: (v: number) => void;
  result: CampaignROI;
  formatCurrency: (n: number) => string;
}) {
  const roiGood = result.roi >= 0;

  return (
    <div className="space-y-4 rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 via-white to-white p-5 shadow-sm">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <Rocket className="h-4 w-4 text-amber-600" />
        Kampaniya ROI Simulyatoru
      </h3>

      <div className="space-y-3">
        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <Percent className="h-3 w-3" /> Endirim
            </span>
            <span className="font-bold text-amber-700">{discount}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={70}
            step={1}
            value={discount}
            onChange={(e) => setDiscount(Number(e.target.value))}
            className="w-full accent-amber-500"
          />
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between text-[11px] font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" /> Gözlənilən satış artımı
            </span>
            <span className="font-bold text-emerald-700">{salesIncrease}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={salesIncrease}
            onChange={(e) => setSalesIncrease(Number(e.target.value))}
            className="w-full accent-emerald-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <div className="rounded-xl border border-slate-100 bg-white px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Proq. gəlir
          </p>
          <p className="mt-0.5 text-xs font-bold text-slate-800">
            {formatCurrency(result.projectedRevenue)}
          </p>
        </div>
        <div className="rounded-xl border border-slate-100 bg-white px-2 py-2">
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            Proq. mənfəət
          </p>
          <p className="mt-0.5 text-xs font-bold text-emerald-700">
            {formatCurrency(result.projectedProfit)}
          </p>
        </div>
        <div
          className={`rounded-xl border px-2 py-2 ${
            roiGood
              ? 'border-emerald-200 bg-emerald-50'
              : 'border-rose-200 bg-rose-50'
          }`}
        >
          <p className="text-[10px] uppercase tracking-wide text-slate-400">
            ROI
          </p>
          <p
            className={`mt-0.5 text-xs font-bold ${
              roiGood ? 'text-emerald-700' : 'text-rose-700'
            }`}
          >
            {result.roi.toFixed(1)}%
          </p>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        ROI endirimə görə itirilən marjaya qarşı əlavə mənfəəti müqayisə edir.
        Müsbət ROI kampaniyanın özünü ödədiyini göstərir.
      </p>
    </div>
  );
}
