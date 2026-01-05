'use client';
import { AdvancedHighlights } from "@/components/admin/molecules/AdvancedHighlights";
import { StatBox } from "@/components/admin/molecules/StatBox";
import { currency, LOW_STOCK_THRESHOLD, simulateTrend } from "@/helpers";
import { useApp } from "@/lib/store";
import { 
  BarChart2, 
  Layers, 
  Wallet, 
  TrendingUp, 
  BadgeDollarSign, 
  MinusCircle, 
  Package,
  XSquare,

  AlertTriangle,     // Əlavə edirik
} from "lucide-react";
import { useMemo, } from "react";

export function ProductStatistic ()  {
  const products = useApp((state) => state.products || []);
  
  // GLOBAL ANALYTICS - Bütün hesablama məntiqi buradadır
  const globalStats = useMemo(() => {
    const activeProducts = products.filter(p => !p.archived);
    const allVariants = activeProducts.flatMap((p) => p.variants || []);

    const stock = allVariants.reduce((s, v) => s + (v.stock ?? 0), 0);

    const cost = allVariants.reduce(
      (s, v) =>
        s +
        (v.stock ?? 0) *
          ((v.costPrice ?? 0) + (v.arrivalCost ?? 0)),
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

    const totalReviewScore = activeProducts.flatMap(p => p.reviews || []).reduce((sum, r) => sum + (r.rating || 0), 0);
    const totalReviewCount = activeProducts.flatMap(p => p.reviews || []).length;
    const avgRating = totalReviewCount === 0 ? 0 : totalReviewScore / totalReviewCount;

    const lowStockCount = allVariants.filter(
      (v) => (v.stock ?? 0) < LOW_STOCK_THRESHOLD && (v.stock ?? 0) > 0,
    ).length;

    const zeroStockCount = allVariants.filter(
      (v) => (v.stock ?? 0) === 0,
    ).length;

    // --- Premium Simulyasiya Datası (Realda calc.ts-dən gəlməlidir) ---
    const simulatedTopSellers = [
        { name: 'Gədəbəy Balı', qty: 150 },
        { name: 'Kənd Yağı', qty: 120 },
        { name: 'Təbii Alma', qty: 95 },
        { name: 'Qoz Mürəbbəsi', qty: 88 },
        { name: 'Qara Çay', qty: 70 },
    ];
    
    // Stok Deffisiti Simulyasiyası
    const lowStockDetails = allVariants
      .filter(v => (v.stock ?? 0) < LOW_STOCK_THRESHOLD && (v.stock ?? 0) > 0)
      .map(v => ({ id: v.id, name: `${products.find(p => p.variants?.some(pv => pv.id === v.id))?.name || 'Məhsul'} (${v.name})`, stock: v.stock || 0 }));

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
      lowStockCount,
      zeroStockCount,
      topSellers: simulatedTopSellers, // Simulyasiya
      lowStockDetails: lowStockDetails, // Detallı stok siyahısı
    };
  }, [products]);


  // Trend simulyasiyaları
  const profitTrend = simulateTrend(globalStats.profit);
  const revenueTrend = simulateTrend(globalStats.revenue);
  const stockTrend = simulateTrend(globalStats.stock);
  const lowStockTrend = simulateTrend(globalStats.lowStockCount); // Burda artım neqativ trenddir

  const profitColor = globalStats.profit >= 0 ? 'emerald' : 'red';

  return (
        <section className="rounded-2xl border border-slate-100 bg-white p-6 shadow-2xl">
          <h2 className="mb-6 flex items-center gap-3 text-2xl font-extrabold text-slate-900 border-b border-slate-100 pb-3">
            <BarChart2 className="h-6 w-6 text-emerald-600" />
            Ultimate Analitika İdarəetmə Paneli
          </h2>
          
          {/* FİNANSAL PERFORMANS */}
          <h3 className="mb-4 text-lg font-bold text-slate-800">1. Maliyyə Metrikaları (Potensial)</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox
              label="Ümumi Mənfəət"
              value={globalStats.profit}
              icon={<BadgeDollarSign className="h-5 w-5" />}
              color={profitColor}
              isCurrency
              trend={profitTrend}
              helperText={`Maya Dəyəri: ${typeof currency === 'function' ? currency(globalStats.cost) : `${globalStats.cost.toFixed(2)} ₼`}`}
            />
            <StatBox
              label="Ümumi Satış Dəyəri"
              value={globalStats.revenue}
              icon={<TrendingUp className="h-5 w-5" />}
              color="blue"
              isCurrency
              trend={revenueTrend}
              helperText="Satış qiymətinə əsaslanan potensial gəlir."
            />
            <StatBox
              label="Orta Satış Qiyməti"
              value={globalStats.avgPrice}
              icon={<Wallet className="h-5 w-5" />}
              color="amber"
              isCurrency
              trend={{ percentage: simulateTrend(globalStats.avgPrice).percentage, isPositive: true }}
              helperText={`Orta Alış Qiyməti: ${typeof currency === 'function' ? currency(globalStats.avgCost) : `${globalStats.avgCost.toFixed(2)} ₼`}`}
            />
             <StatBox
              label="Aktiv Məhsul Sayı"
              value={`${globalStats.totalProducts} ədəd`}
              icon={<Package className="h-5 w-5" />}
              color="slate"
              trend={{ percentage: 0, isPositive: true }}
              helperText={`Cəmi ${products.length} məhsul qeydiyyatdadır.`}
            />
          </div>

          <div className="my-8 h-1 bg-slate-100" />

          {/* İNVENTAR VƏ KEYFİYYƏT */}
          <h3 className="mb-4 text-lg font-bold text-slate-800">2. İnventar Sağlamlığı & Keyfiyyət</h3>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            <StatBox
              label="Ümumi Stok Vahidi"
              value={`${globalStats.stock} vahid`}
              icon={<Layers className="h-5 w-5" />}
              color="emerald"
              trend={stockTrend}
              helperText="Bütün variantlar üzrə cəmi stok sayı."
            />
            <StatBox
              label="Kritik Stok Varianı"
              value={`${globalStats.lowStockCount} variant`}
              icon={<MinusCircle className="h-5 w-5" />}
              color={globalStats.lowStockCount > 0 ? 'amber' : 'blue'}
              trend={{ ...lowStockTrend, isPositive: !lowStockTrend.isPositive }} // Trend azalırsa, bu müsbətdir
              helperText={`Limit: ${LOW_STOCK_THRESHOLD} vahiddən az qalanlar.`}
            />
            <StatBox
              label="Stokda Olmayan Varian"
              value={`${globalStats.zeroStockCount} variant`}
              icon={<XSquare className="h-5 w-5" />}
              color={globalStats.zeroStockCount > 0 ? 'red' : 'blue'}
              trend={{ percentage: simulateTrend(globalStats.zeroStockCount).percentage, isPositive: globalStats.zeroStockCount === 0 }}
              helperText="Təcili sifariş tələb edən variantlar."
            />
            
          </div>
          
          {/* ƏSAS VURĞULAYICILAR */}
          <AdvancedHighlights 
            margin={globalStats.margin} 
            topSellers={globalStats.topSellers}
            lowStockItems={globalStats.lowStockDetails.length}
          />

          {/* ƏLAVƏ İNVENTAR FİÇERİ: Kritik Stok Detalları */}
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

        </section>
  )
}