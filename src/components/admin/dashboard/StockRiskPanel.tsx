// ============================================================
// src/components/admin/dashboard/StockRiskPanel.tsx
// PHASE 4 — "Sabah sifarişləri qarşılamaq üçün stok kifayət edirmi?"
// ============================================================
'use client';

import { AlertTriangle, PackageX, CheckCircle2 } from 'lucide-react';
import { SectionCard, EmptyState } from '@/components/admin/daily/SectionCard';
import { useDashboardForecast, useInventoryAlerts } from '@/hooks/useAnalyticsDashboard';

const RISK_STYLE = {
  critical: 'border-rose-200 bg-rose-50 text-rose-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  ok: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  unknown: 'border-slate-200 bg-slate-50 text-slate-500',
} as const;

const RISK_LABEL = {
  critical: 'Kritik',
  warning: 'Diqqət',
  ok: 'Normal',
  unknown: 'Satış yoxdur',
} as const;

export default function StockRiskPanel() {
  const { data: forecast, isLoading: forecastLoading } = useDashboardForecast();
  const { data: alerts, isLoading: alertsLoading } = useInventoryAlerts();
  const isLoading = forecastLoading || alertsLoading;

  const risky = (forecast?.stockRisk ?? []).filter((r) => r.riskLevel === 'critical' || r.riskLevel === 'warning');

  return (
    <SectionCard title="Stok Riski & Sabahkı Kifayətlilik" icon={<AlertTriangle className="w-4 h-4 text-amber-600" />}>
      {isLoading ? (
        <div className="h-64 animate-pulse rounded-2xl bg-slate-100" />
      ) : (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-2 py-2">
              <p className="text-lg font-extrabold text-rose-700">{forecast?.stockRiskSummary.criticalCount ?? 0}</p>
              <p className="text-[10px] text-rose-600">Kritik (≤1 gün)</p>
            </div>
            <div className="rounded-2xl border border-amber-200 bg-amber-50 px-2 py-2">
              <p className="text-lg font-extrabold text-amber-700">{forecast?.stockRiskSummary.warningCount ?? 0}</p>
              <p className="text-[10px] text-amber-600">Diqqət (≤3 gün)</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-slate-50 px-2 py-2">
              <p className="text-lg font-extrabold text-slate-700">{alerts?.outOfStockCount ?? 0}</p>
              <p className="text-[10px] text-slate-500">Stokda yoxdur</p>
            </div>
          </div>

          {risky.length === 0 ? (
            <div className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs text-emerald-700">
              <CheckCircle2 className="h-4 w-4" />
              Kritik və ya diqqət tələb edən stok riski yoxdur.
            </div>
          ) : (
            <div className="max-h-64 overflow-y-auto space-y-1.5 pr-1">
              {risky.map((r) => (
                <div
                  key={r.variantId}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-[11px] ${RISK_STYLE[r.riskLevel]}`}
                >
                  <div>
                    <p className="font-semibold">
                      {r.productName} {r.variantName ? `— ${r.variantName}` : ''}
                    </p>
                    <p className="opacity-80">
                      Stok: {r.currentStock} {r.unit ?? 'ədəd'} · Gündəlik tələb: ~{r.avgDailyQty}
                      {!r.coversTomorrow && ' · Sabahı qarşılamır!'}
                    </p>
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-lg bg-white/70 px-2 py-1 font-semibold">
                    {r.riskLevel === 'critical' && <PackageX className="h-3 w-3" />}
                    {RISK_LABEL[r.riskLevel]}
                    {r.daysUntilStockout !== null && ` · ${r.daysUntilStockout}g`}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </SectionCard>
  );
}