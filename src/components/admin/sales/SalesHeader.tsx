import { useApp } from '@/lib/store';
import { ShoppingCart, Package } from 'lucide-react';

const SalesHeader = () => {

    const { products } = useApp();
  
    // Günlük qısa info (müştəri sayı, ümumi məbləğ və s. – sadə versiya)
    const todayKey = new Date().toISOString().slice(0, 10);
  
    // ===============================================================
    // RENDER
    // ===============================================================
  return (
     <header className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold text-emerald-900">
            <ShoppingCart className="w-7 h-7 text-emerald-600" />
            Kassir Satış Paneli (Super POS)
          </h1>
          <p className="text-xs md:text-sm text-slate-500 mt-1">
            Tələsik müştəri zamanı belə – tez məhsul tap, kq / ədəd / məbləğ
            üzrə satış et, gün sonu hesabatı dəqiq çıxsın.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs md:text-sm text-slate-500">
          <span className="px-3 py-1 rounded-full bg-white border border-emerald-100 shadow-sm flex items-center gap-2">
            <Package className="w-4 h-4 text-emerald-500" />
            <span className="font-semibold text-emerald-800">
              Məhsul sayı: {products.length}
            </span>
          </span>
          <span className="hidden sm:inline text-[11px] md:text-xs">
            Bu gün:{" "}
            <span className="font-mono text-emerald-700">{todayKey}</span>
          </span>
        </div>
      </header>
  )
}

export default SalesHeader
