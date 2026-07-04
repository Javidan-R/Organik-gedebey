// src/components/admin/products/ProductStatistic.tsx
'use client';

import { AdvancedHighlights } from '@/components/admin/molecules/AdvancedHighlights';
import { currency, LOW_STOCK_THRESHOLD } from '@/helpers';
import { useApp } from '@/lib/store';
import {
  BarChart2,
  Layers,
  Wallet,
  TrendingUp,
  TrendingDown,
  BadgeDollarSign,
  MinusCircle,
  Package,
  XSquare,
  AlertTriangle,
  Star,
  Percent,
} from 'lucide-react';
import { useMemo } from 'react';

// ─── Tip Tərifləri ──────────────────────────────────────────────
interface StatBoxProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: 'emerald' | 'blue' | 'amber' | 'red' | 'slate' | 'purple' | 'pink';
  isCurrency?: boolean;
  trend?: { percentage: number; isPositive: boolean };
  helperText?: string;
}

// ─── Köməkçi Funksiyalar ────────────────────────────────────────
function formatCurrencyValue(value: number): string {
  return typeof currency === 'function' ? currency(value) : `${value.toFixed(2)} ₼`;
}

function getColorClasses(color: StatBoxProps['color']) {
  const map = {
    emerald: { bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700' },
    blue: { bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700' },
    amber: { bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
    red: { bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700' },
    slate: { bg: 'bg-slate-50', border: 'border-slate-200', text: 'text-slate-700' },
    purple: { bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700' },
    pink: { bg: 'bg-pink-50', border: 'border-pink-200', text: 'text-pink-700' },
  };
  return map[color] || map.slate;
}

function getColorIcon(color: StatBoxProps['color']): string {
  const map = {
    emerald: 'text-emerald-600',
    blue: 'text-blue-600',
    amber: 'text-amber-600',
    red: 'text-red-600',
    slate: 'text-slate-600',
    purple: 'text-purple-600',
    pink: 'text-pink-600',
  };
  return map[color] || map.slate;
}

// ─── StatBox Sub-komponenti ─────────────────────────────────────
const StatBoxComponent = ({
  label,
  value,
  icon,
  color,
  isCurrency = false,
  trend,
  helperText,
}: StatBoxProps) => {
  const colorClasses = getColorClasses(color);
  const iconColor = getColorIcon(color);

  let displayValue: string | number = value;
  if (typeof value === 'number' && isNaN(value)) {
    displayValue = isCurrency ? '0.00 ₼' : '0';
  } else if (isCurrency && typeof value === 'number') {
    displayValue = formatCurrencyValue(value);
  }

  const trendIcon = trend?.isPositive ? (
    <TrendingUp className="h-3 w-3 text-emerald-500" />
  ) : (
    <TrendingDown className="h-3 w-3 text-red-500" />
  );

  return (
    <div className={`rounded-2xl border ${colorClasses.border} ${colorClasses.bg} p-4 shadow-sm transition-all hover:shadow-md`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className={`mt-1 text-2xl font-extrabold ${colorClasses.text}`}>
            {displayValue}
          </p>
        </div>
        <div className={`rounded-xl bg-white/80 p-2 shadow-sm ${iconColor}`}>
          {icon}
        </div>
      </div>

      {(trend || helperText) && (
        <div className="mt-2 flex flex-wrap items-center gap-2 text-[10px] text-slate-500">
          {trend && (
            <span className={`inline-flex items-center gap-0.5 font-semibold ${trend.isPositive ? 'text-emerald-600' : 'text-red-500'}`}>
              {trendIcon}
              {trend.percentage > 0 ? `+${trend.percentage.toFixed(1)}%` : `${trend.percentage.toFixed(1)}%`}
            </span>
          )}
          {helperText && (
            <span className="text-slate-400">{helperText}</span>
          )}
        </div>
      )}
    </div>
  );
};

// ─── Əsas Komponent ──────────────────────────────────────────────
export function ProductStatistic() {
  const products = useApp((state) => state.products || []);

  // ─── Qlobal Statistikalar ──────────────────────────────────────
  const globalStats = useMemo(() => {
    const activeProducts = products.filter((p) => !p.archived);
    const allVariants = activeProducts.flatMap((p) => p.variants || []);

    const stock = allVariants.reduce((s, v) => s + (v.stock ?? 0), 0);

    const cost = allVariants.reduce(
      (s, v) => s + (v.stock ?? 0) * ((v.costPrice ?? 0) + (v.arrivalCost ?? 0)),
      0,
    );

    const revenue = allVariants.reduce(
      (s, v) => s + (v.stock ?? 0) * (v.price ?? 0),
      0,
    );

    const profit = revenue - cost;
    const avgCost = stock === 0 ? 0 : cost / stock;
    const avgPrice = stock === 0 ? 0 : revenue / stock;
    const margin = avgPrice === 0 ? 0 : ((avgPrice - avgCost) / avgPrice) * 100;

    // Reytinq
    const allReviews = activeProducts.flatMap((p) => p.reviews || []);
    const totalReviewScore = allReviews.reduce((sum, r) => sum + (r.rating || 0), 0);
    const totalReviewCount = allReviews.length;
    const avgRating = totalReviewCount === 0 ? 0 : totalReviewScore / totalReviewCount;

    // Stok vəziyyəti
    const lowStockCount = allVariants.filter(
      (v) => (v.stock ?? 0) < LOW_STOCK_THRESHOLD && (v.stock ?? 0) > 0,
    ).length;

    const zeroStockCount = allVariants.filter((v) => (v.stock ?? 0) === 0).length;

    // Endirim statistikası
    const discountedProducts = activeProducts.filter((p) => isDiscountActive(p));
    const discountCount = discountedProducts.length;
    
    let avgDiscount = 0;
    if (discountCount > 0) {
      let totalDiscount = 0;
      for (const p of discountedProducts) {
        const base = p.variants?.[0]?.price ?? p.price ?? 0;
        const discounted = productDisplayPrice(p);
        if (base > 0) {
          totalDiscount += ((base - discounted) / base) * 100;
        }
      }
      avgDiscount = totalDiscount / discountCount;
    }

    // Çox satılanlar (simulyasiya)
    const topSellers = [
      { name: 'Gədəbəy Balı', qty: 150 },
      { name: 'Kənd Yağı', qty: 120 },
      { name: 'Təbii Alma', qty: 95 },
      { name: 'Qoz Mürəbbəsi', qty: 88 },
      { name: 'Qara Çay', qty: 70 },
    ];

    // Kritik stok detalları
    const lowStockDetails = allVariants
      .filter((v) => (v.stock ?? 0) < LOW_STOCK_THRESHOLD && (v.stock ?? 0) > 0)
      .map((v) => {
        const product = products.find((p) => p.variants?.some((pv) => pv.id === v.id));
        return {
          id: v.id,
          name: product ? `${product.name} (${v.name})` : v.name || 'Məhsul',
          stock: v.stock || 0,
        };
      })
      .slice(0, 10);

    return {
      totalProducts: activeProducts.length,
      stock,
      cost,
      revenue,
      profit,
      avgCost,
      avgPrice,
      margin,
      avgRating,
      totalReviewCount, // ✅ əlavə edildi
      lowStockCount,
      zeroStockCount,
      discountCount,
      avgDiscount,
      topSellers,
      lowStockDetails,
    };
  }, [products]);

  // ─── Trend Simulyasiyaları ──────────────────────────────────────
  const profitTrend = simulateTrend(globalStats.profit);
  const revenueTrend = simulateTrend(globalStats.revenue);
  const stockTrend = simulateTrend(globalStats.stock);
  const lowStockTrend = simulateTrend(globalStats.lowStockCount);

  const profitColor = globalStats.profit >= 0 ? 'emerald' : 'red';

  return (
    <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
      <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
        <BarChart2 className="h-6 w-6 text-emerald-600" />
        Ultimate Analitika İdarəetmə Paneli
      </h2>

      {/* ─── 1. Maliyyə Metrikaları ─────────────────────────────── */}
      <h3 className="mb-4 text-lg font-bold text-slate-800">1. Maliyyə Metrikaları (Potensial)</h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBoxComponent
          label="Ümumi Mənfəət"
          value={globalStats.profit}
          icon={<BadgeDollarSign className="h-5 w-5" />}
          color={profitColor}
          isCurrency
          trend={profitTrend}
          helperText={`Maya Dəyəri: ${formatCurrencyValue(globalStats.cost)}`}
        />
        <StatBoxComponent
          label="Ümumi Satış Dəyəri"
          value={globalStats.revenue}
          icon={<TrendingUp className="h-5 w-5" />}
          color="blue"
          isCurrency
          trend={revenueTrend}
          helperText="Satış qiymətinə əsaslanan potensial gəlir."
        />
        <StatBoxComponent
          label="Orta Satış Qiyməti"
          value={globalStats.avgPrice}
          icon={<Wallet className="h-5 w-5" />}
          color="amber"
          isCurrency
          trend={{ percentage: simulateTrend(globalStats.avgPrice).percentage, isPositive: true }}
          helperText={`Orta Alış Qiyməti: ${formatCurrencyValue(globalStats.avgCost)}`}
        />
        <StatBoxComponent
          label="Aktiv Məhsul Sayı"
          value={`${globalStats.totalProducts} ədəd`}
          icon={<Package className="h-5 w-5" />}
          color="slate"
          trend={{ percentage: 0, isPositive: true }}
          helperText={`Cəmi ${products.length} məhsul qeydiyyatdadır.`}
        />
      </div>

      <div className="my-8 h-px bg-slate-100" />

      {/* ─── 2. İnventar Sağlamlığı & Keyfiyyət ──────────────────── */}
      <h3 className="mb-4 text-lg font-bold text-slate-800">2. İnventar Sağlamlığı & Keyfiyyət</h3>
      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <StatBoxComponent
          label="Ümumi Stok Vahidi"
          value={`${globalStats.stock} vahid`}
          icon={<Layers className="h-5 w-5" />}
          color="emerald"
          trend={stockTrend}
          helperText="Bütün variantlar üzrə cəmi stok sayı."
        />
        <StatBoxComponent
          label="Kritik Stok Varianı"
          value={`${globalStats.lowStockCount} variant`}
          icon={<MinusCircle className="h-5 w-5" />}
          color={globalStats.lowStockCount > 0 ? 'amber' : 'blue'}
          trend={{
            ...lowStockTrend,
            isPositive: !lowStockTrend.isPositive,
          }}
          helperText={`Limit: ${LOW_STOCK_THRESHOLD} vahiddən az qalanlar.`}
        />
        <StatBoxComponent
          label="Stokda Olmayan Varian"
          value={`${globalStats.zeroStockCount} variant`}
          icon={<XSquare className="h-5 w-5" />}
          color={globalStats.zeroStockCount > 0 ? 'red' : 'blue'}
          trend={{
            percentage: simulateTrend(globalStats.zeroStockCount).percentage,
            isPositive: globalStats.zeroStockCount === 0,
          }}
          helperText="Təcili sifariş tələb edən variantlar."
        />
        <StatBoxComponent
          label="Orta Reytinq"
          value={globalStats.avgRating.toFixed(1)}
          icon={<Star className="h-5 w-5" />}
          color="amber"
          // ✅ totalReviewCount artıq mövcuddur
          helperText={`${globalStats.totalReviewCount} rəy`}
        />
      </div>

      {/* ─── Endirim statistikası ─────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-xl bg-rose-50 p-4 border border-rose-100">
          <div className="flex items-center gap-2 text-rose-700">
            <Percent className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Endirimdə</span>
          </div>
          <p className="text-2xl font-black text-rose-800">{globalStats.discountCount}</p>
          <p className="text-[10px] text-rose-500">məhsul</p>
        </div>
        <div className="rounded-xl bg-pink-50 p-4 border border-pink-100">
          <div className="flex items-center gap-2 text-pink-700">
            <Percent className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Orta Endirim</span>
          </div>
          <p className="text-2xl font-black text-pink-800">
            {globalStats.discountCount > 0 ? `${globalStats.avgDiscount.toFixed(1)}%` : '0%'}
          </p>
          <p className="text-[10px] text-pink-500">faiz</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4 border border-blue-100">
          <div className="flex items-center gap-2 text-blue-700">
            <Star className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Maks. Reytinq</span>
          </div>
          <p className="text-2xl font-black text-blue-800">
            {globalStats.avgRating > 0 ? '5.0' : '—'}
          </p>
          <p className="text-[10px] text-blue-500">ulduz</p>
        </div>
        <div className="rounded-xl bg-purple-50 p-4 border border-purple-100">
          <div className="flex items-center gap-2 text-purple-700">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-bold uppercase">Mənfəət Marjası</span>
          </div>
          <p className="text-2xl font-black text-purple-800">
            {isFinite(globalStats.margin) ? globalStats.margin.toFixed(1) : '0.0'}%
          </p>
          <p className="text-[10px] text-purple-500">orta hesabla</p>
        </div>
      </div>

      <div className="my-8 h-px bg-slate-100" />

      {/* ─── 3. Əsas Vurğulayıcılar ───────────────────────────────── */}
      <AdvancedHighlights
        margin={globalStats.margin}
        topSellers={globalStats.topSellers}
        lowStockItems={globalStats.lowStockDetails.length}
      />

      {/* ─── 4. Kritik Stok Detalları ───────────────────────────── */}
      {globalStats.lowStockDetails.length > 0 && (
        <div className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 shadow-inner">
          <h4 className="mb-3 text-sm font-bold text-red-700 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            KRİTİK HƏYƏCAN: Təcili Doldurulmalı Stoklar
          </h4>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {globalStats.lowStockDetails.map((item) => (
              <li key={item.id} className="flex justify-between font-medium text-red-800">
                <span>{item.name}</span>
                <span className="font-extrabold">{item.stock} vahid</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ─── 5. Əlaqəli Funksiyalar ──────────────────────────────── */}
      <div className="mt-6 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
        <p className="text-xs text-slate-400">
          <span className="font-semibold">🔄 Son yenilənmə:</span>{' '}
          {new Date().toLocaleString('az-AZ')}
        </p>
        <button
          type="button"
          onClick={() => window.location.reload()}
          className="ml-auto rounded-xl bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition"
        >
          🔄 Yenilə
        </button>
      </div>
    </section>
  );
}

// ─── Calcs üçün köməkçi funksiyalar ──────────────────────────
function isDiscountActive(product: any): boolean {
  return !!(product.discountType && product.discountValue && product.discountValue > 0);
}

function productDisplayPrice(product: any): number {
  const base = product.variants?.[0]?.price ?? product.price ?? 0;
  if (product.discountType === 'percentage' && product.discountValue) {
    return base * (1 - product.discountValue / 100);
  }
  if (product.discountType === 'fixed' && product.discountValue) {
    return Math.max(0, base - product.discountValue);
  }
  return base;
}

function simulateTrend(value: number): { percentage: number; isPositive: boolean } {
  if (value === 0 || !isFinite(value)) return { percentage: 0, isPositive: true };
  const pct = (Math.random() * 15 + 2) * (Math.random() > 0.6 ? 1 : -1);
  return {
    percentage: Number((pct).toFixed(1)),
    isPositive: pct >= 0,
  };
}