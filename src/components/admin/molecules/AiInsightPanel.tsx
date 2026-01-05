import { AiInsight } from "@/types/finance";
import { BarChart3, AlertTriangle, TrendingUp } from "lucide-react";

export default function AiInsightPanel({ aiInsight }: { aiInsight: AiInsight }) {
  return (
    <div className="p-5 rounded-2xl border border-purple-100 bg-linear-to-br from-purple-50 via-white to-slate-50 shadow-sm space-y-3">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold text-purple-900 flex items-center gap-2">
          <BarChart3 className="w-4 h-4 text-purple-700" />
          {aiInsight.title}
        </h2>
        <span className="text-[11px] text-slate-500">
          Yalnız daxili məlumatlara əsaslanan, izahlı maliyyə baxışı.
        </span>
      </div>

      <div className="rounded-xl bg-white/70 border border-purple-100 px-3 py-2">
        <p className="text-[11px] text-slate-700">
          {aiInsight.summary}
        </p>
      </div>

      <div className="grid md:grid-cols-2 gap-4 text-[11px]">
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-rose-700 font-semibold">
            <AlertTriangle className="w-3 h-3" />
            Risk siqnalları
          </div>
          <ul className="space-y-1 list-disc list-inside text-slate-700">
            {aiInsight.risks.length ? (
              aiInsight.risks.map((r, i) => <li key={i}>{r}</li>)
            ) : (
              <li>Əhəmiyyətli risk qeyd edilməyib.</li>
            )}
          </ul>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1 text-emerald-700 font-semibold">
            <TrendingUp className="w-3 h-3" />
            Praktik tövsiyələr
          </div>
          <ul className="space-y-1 list-disc list-inside text-slate-700">
            {aiInsight.suggestions.length ? (
              aiInsight.suggestions.map((s, i) => (
                <li key={i}>{s}</li>
              ))
            ) : (
              <li>Hazırda xüsusi tövsiyə yoxdur.</li>
            )}
          </ul>
        </div>
      </div>

      <p className="text-[11px] text-slate-500">
        Bu paneli hər ay PDF hesabatla birgə rəhbərlik üçün qısa prezenasiyaya
        çevirə bilərsən: <b>1 səhifə xülasə + 1-2 qrafik + 3 əsas risk +
        3 əsas tövsiyə</b> kifayət edir.
      </p>
    </div>
  );
}