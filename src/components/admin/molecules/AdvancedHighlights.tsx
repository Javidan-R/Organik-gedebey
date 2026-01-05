
// --- Əsas Vurğulayıcı (Orta Marja & Top Satışlar) ---

import { Percent, Zap } from "lucide-react";
import { memo } from "react";

export const AdvancedHighlights = memo(({ margin, topSellers, lowStockItems }: { margin: number, topSellers: { name: string, qty: number }[], lowStockItems: number }) => {
    const isGoodMargin = margin >= 20; 
    const marginColor = isGoodMargin ? 'text-emerald-800' : 'text-amber-800';
    const marginBg = isGoodMargin ? 'bg-emerald-100' : 'bg-amber-100';

    return (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-3 gap-5">
            
            {/* 1. Ümumi Marja Performansı */}
            <div className={`flex flex-col justify-between rounded-xl border border-dashed p-4 shadow-sm transition-all duration-300 ${marginBg} border-slate-300 col-span-1`}>
                <div className="flex items-center gap-3">
                    <Percent className="h-6 w-6 opacity-70" />
                    <span className="text-sm font-bold uppercase tracking-wider text-slate-700">
                        Ümumi Marja Faizi
                    </span>
                </div>
                <span className={`mt-3 text-4xl font-extrabold ${marginColor}`}>
                    {margin.toFixed(1)}%
                </span>
                <p className="text-xs text-slate-600 mt-2">
                    Orta satış qiymətindən maya dəyəri çıxıldıqda qalan faiz.
                </p>
            </div>

            {/* 2. Top Satışlar Siyahısı */}
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-lg col-span-2">
                <h3 className="mb-3 text-sm font-bold uppercase text-blue-700 flex items-center gap-2">
                    <Zap className="h-4 w-4 text-blue-500" />
                    Top 5 Ən Çox Satılan Məhsul
                </h3>
                <ul className="space-y-2">
                    {topSellers.slice(0, 5).map((item, index) => (
                        <li key={item.name} className="flex items-center justify-between text-sm border-b border-slate-100 pb-1 last:border-b-0">
                            <span className="font-medium text-slate-700">
                                {index + 1}. {item.name}
                            </span>
                            <span className="font-semibold text-blue-600">
                                {item.qty} ədəd
                            </span>
                        </li>
                    ))}
                    {topSellers.length === 0 && <li className="text-slate-500 text-sm">Satış məlumatı tapılmadı.</li>}
                </ul>
            </div>
        </div>
    );
});
AdvancedHighlights.displayName = 'AdvancedHighlights';
