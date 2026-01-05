// src/components/ProductCard.tsx
'use client';

import Image from 'next/image';
import { memo, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  XCircle,
  Percent,
  Star,
  List,
  Layers,
  Clock,
  Edit3,
  RotateCcw,
  Archive,
  Tag,
  MapPin,
  DollarSign,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  ShoppingCart,
  Package,
  Eye,
  Scale, // Marja ikonu
  Heart, // Yeni: Bəyənmə / Featured ikonu
} from 'lucide-react';

import {
  productTotalStock,
  isDiscountActive,
  productDisplayPrice,
  minPrice,
  avgRating,
  variantFinalPrice,
  ageInDays, // Fərz edilir ki, calc.ts-dən gəlir
} from '@/lib/calc';
import { Button } from '@/components/atoms/button';
import { ProductCardProps, ProductImage } from '@/types/products';
// PREMIUM UTILS İMPORTU: fərz edirik ki, `safeImageUrl` və `currency` mövcuddur
import { safeImageUrl, currency } from '@/helpers'; 


// --- DİNAMİK RƏNG PALİTRASI ---
const PROFIT_COLORS = {
    positive: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', line: 'bg-emerald-500' },
    negative: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', line: 'bg-red-500' },
    stockLow: { bg: 'bg-amber-50 border-amber-200', text: 'text-amber-700', line: 'bg-amber-500' },
    stockOut: { bg: 'bg-red-50 border-red-200', text: 'text-red-700', line: 'bg-red-500' },
    neutral: { bg: 'bg-slate-50 border-slate-200', text: 'text-slate-600', line: 'bg-slate-300' },
};


// --- VİZUAL KOMPONENT: Maliyyə/İnventar Metriki (ULTRA PREMIUM BADGE) ---
interface MetricBadgeProps {
    label: string;
    value: string | number;
    icon: React.ElementType;
    colorClass: string; 
    iconColorClass: string;
    isLargeValue?: boolean;
}

const MetricBadge: React.FC<MetricBadgeProps> = memo(({ label, value, icon: Icon, colorClass, iconColorClass, isLargeValue = false }) => (
    <div className={`rounded-xl p-3 border transition-all duration-200 ${colorClass} hover:shadow-md`}>
        <div className="flex items-center justify-between mb-1">
            <p className={`text-[10px] font-semibold flex items-center gap-1 ${iconColorClass}`}>
                <Icon className="h-3 w-3" />
                {label}
            </p>
        </div>
        <p className={`font-extrabold ${isLargeValue ? 'text-xl' : 'text-base'} text-slate-900 leading-tight`}>
            {value}
        </p>
    </div>
));
MetricBadge.displayName = 'MetricBadge';


// --- VİZUAL KOMPONENT: Marja İndikatoru (PREMIUM LINE) ---
const ProfitLine = memo(({ margin, isProfitable }: { margin: string, isProfitable: boolean }) => {
    const { line, text } = isProfitable 
        ? PROFIT_COLORS.positive 
        : PROFIT_COLORS.negative;
    
    // Mənfi marja olanda da xəttin uzunluğunu müsbət dəyərlə hesablayırıq.
    const absoluteMargin = Math.min(Math.abs(parseFloat(margin)), 100);

    return (
        <div className="mt-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
                <p className={`flex items-center gap-1 text-[11px] font-semibold ${text}`}>
                    <Scale className="h-3 w-3" />
                    Orta Profit Marjası
                </p>
                <span className={`text-[11px] font-bold whitespace-nowrap ${text} rounded-md px-1.5 py-0.5 ${isProfitable ? 'bg-emerald-100' : 'bg-red-100'}`}>
                    {margin}%
                </span>
            </div>
            {/* Vizual marja xətti */}
            <div className="flex-1 h-1.5 bg-slate-100 rounded-full overflow-hidden mt-1">
                <div
                    className={`h-full transition-all duration-500 ${line}`}
                    style={{ width: `${absoluteMargin}%` }}
                />
            </div>
        </div>
    );
});
ProfitLine.displayName = 'ProfitLine';


// --- ƏSAS KOMPONENT REFAKTORİNG ---

const EnhancedProductCardBase = ({
  p,
  categoryMap,
  setEditingProduct,
  archiveProduct,
  unarchiveProduct,
  viewMode = 'grid',
}: ProductCardProps) => {
  
  // Əsas Hesablamalar
  const stock = productTotalStock(p);
  const lowStock = stock < (p.minStock ?? 5);
  const discount = isDiscountActive(p);
  const price = productDisplayPrice(p);
  const regularPrice = minPrice(p);
  const rating = avgRating(p);
  const isArchived = p.archived;
  const hasSlug = !!p.slug;

  // Yeni: Məhsulun aktiv olduğu gün sayı
  const productAgeDays = useMemo(() => {
    // Fərz edirik ki, `ageInDays` util funksiyası mövcuddur
    // Əks halda bu, sadə bir hesablama ilə əvəz olunur:
    const days = Math.floor((new Date().getTime() - new Date(p.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return Math.max(0, days);
  }, [p.createdAt]);

  // Maliyyə metrikaları (Currency formatı ilə)
  const financialMetrics = useMemo(() => {
    let totalCost = 0;
    let potentialRevenue = 0;
    let totalStockQty = 0;

    for (const v of p.variants || []) {
      const stockQty = v.stock ?? 0;
      const itemPrice = variantFinalPrice(p, v);
      const itemCost = v.costPrice ?? p.costPrice ?? 0;

      totalStockQty += stockQty;
      totalCost += itemCost * stockQty;
      potentialRevenue += itemPrice * stockQty;
    }

    const potentialProfit = potentialRevenue - totalCost;
    const profitMargin =
      potentialRevenue > 0 ? ((potentialProfit / potentialRevenue) * 100).toFixed(1) : '0.0';

    return {
      totalStockQty,
      totalCost: totalCost,
      potentialRevenue: potentialRevenue,
      potentialProfit: potentialProfit,
      profitMargin,
      isProfitable: potentialProfit >= 0, // 0 və üstü müsbət sayılır
    };
  }, [p]);

  const primaryImage = (Array.isArray(p.images) ? p.images[0] : null) as ProductImage | null;
  const imageUrl = safeImageUrl(primaryImage);

  // Stok rəngləri
  let stockColorSet = PROFIT_COLORS.neutral;
  if (lowStock && stock > 0) {
    stockColorSet = PROFIT_COLORS.stockLow;
  }
  if (stock === 0) {
    stockColorSet = PROFIT_COLORS.stockOut;
  }
  
  const categoryName = categoryMap[p.categoryId] || 'Naməlum';

  // --- Render Funksiyaları ---

  const renderFinancialMetrics = () => (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 mt-3">
        {/* Potensial Mənfəət (Ən önəmli metrik) */}
        <MetricBadge
            label="Potensial Mənfəət"
            // currency util funksiyasının formatlaşdırdığını fərz edirik (məs: 12.34 ₼)
            value={currency(financialMetrics.potentialProfit, 0)} 
            icon={financialMetrics.isProfitable ? TrendingUp : TrendingDown}
            colorClass={financialMetrics.isProfitable ? PROFIT_COLORS.positive.bg : PROFIT_COLORS.negative.bg}
            iconColorClass={financialMetrics.isProfitable ? PROFIT_COLORS.positive.text : PROFIT_COLORS.negative.text}
            isLargeValue
        />

        {/* Ümumi Stok Vahidi */}
        <MetricBadge
            label="Stok Vahidi"
            value={`${financialMetrics.totalStockQty} ədəd`}
            icon={Layers}
            colorClass={stockColorSet.bg}
            iconColorClass={stockColorSet.text}
        />

        {/* Potensial Gəlir */}
        <MetricBadge
            label="Potensial Gəlir"
            value={currency(financialMetrics.potentialRevenue, 0)}
            icon={ShoppingCart}
            colorClass={'bg-blue-50 border-blue-200'}
            iconColorClass={'text-blue-700'}
        />

        {/* Maya Dəyəri */}
        <MetricBadge
            label="Maya Dəyəri"
            value={currency(financialMetrics.totalCost, 0)}
            icon={DollarSign}
            colorClass={'bg-slate-50 border-slate-200'}
            iconColorClass={'text-slate-700'}
        />
    </div>
  );

  const renderPriceBlock = () => {
    if (discount) {
      const discountPercentage = ((1 - price / regularPrice) * 100).toFixed(0);
      return (
        <div className="flex flex-col items-end whitespace-nowrap">
          <span className="text-sm line-through text-slate-400 font-medium">
            {currency(regularPrice, 2)}
          </span>
          <span className="text-xl font-extrabold text-rose-600 leading-tight">
            {currency(price, 2)}
          </span>
          <span className="text-[10px] font-semibold text-rose-500 rounded-full bg-rose-50 px-2 mt-1">
            -{discountPercentage}% Endirim
          </span>
        </div>
      );
    }

    return (
      <div className='flex flex-col items-end'>
        <span className="text-xl font-extrabold text-emerald-600 leading-tight">
          {currency(price, 2)}
        </span>
        <span className="text-[10px] font-medium text-slate-500 mt-1">
          Ən Aşağı Qiymət
        </span>
      </div>
    );
  };

  const renderBadges = () => (
    <div className="absolute top-3 right-3 flex flex-col space-y-2 z-10">
      {/* Ən kritik status ən üstdə */}
      {stock === 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-700 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
          <XCircle className="h-3 w-3" /> Stoksuz
        </span>
      )}

      {lowStock && stock > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
          <AlertTriangle className="h-3 w-3" /> Az Qalıb
        </span>
      )}

      {discount && (
        <span className="inline-flex items-center gap-1 rounded-full bg-pink-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
          <Percent className="h-3 w-3" /> Endirim
        </span>
      )}

      {p.featured && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2.5 py-1 text-[11px] font-semibold text-white shadow-lg">
          <Heart className="h-3 w-3" /> Seçilmiş
        </span>
      )}
    </div>
  );

  const renderArchivedOverlay = () =>
    isArchived && (
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15 backdrop-blur-sm">
        <span className="rotate-[-10deg] rounded-xl bg-black/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-2xl ring-2 ring-red-500">
          ARXİVDƏDİR
        </span>
      </div>
    );

  const renderMetaTags = () => {
    const tags = (p.tags || []).slice(0, 3);
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {p.originRegion && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
            <MapPin className="h-2.5 w-2.5" />
            {p.originRegion}
          </span>
        )}

        {tags.map((t) => (
          <span
            key={t}
            className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600"
          >
            <Tag className="h-2.5 w-2.5" />
            {t}
          </span>
        ))}

        {p.variants && p.variants.length > 1 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <Package className="h-2.5 w-2.5" />
            {p.variants.length} variant
          </span>
        )}
      </div>
    );
  };

  // Refakt edilmiş Action Buttons (ID Kopyalama silindi)
  const actionButtons = (
    <div className="mt-4 flex gap-2 border-t border-slate-100 pt-3">
        {/* Başlıca Redaktə düyməsi */}
        <Button
            type="button"
            variant="secondary"
            onClick={() => setEditingProduct(p)}
            className="flex-1 justify-center gap-1 text-[12px] h-10 px-3 font-semibold rounded-xl"
            title="Məhsulu redaktə et"
        >
            <Edit3 className="h-4 w-4" />
            Redaktə
        </Button>

        {/* Kompakt Qrup: Vitrin və Arxivləmə */}
        <div className="flex gap-2">
            {hasSlug && (
                <a
                    href={`/products/${p.slug}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 text-blue-700 hover:bg-blue-600 hover:text-white transition h-10 w-10 shadow-sm hover:shadow-md"
                    title="Vitrində bax"
                >
                    <Eye className="h-4 w-4" />
                </a>
            )}

            <Button
                type="button"
                variant="soft"
                onClick={() => (isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id))}
                title={isArchived ? 'Arxivdən çıxar' : 'Arxivə sal'}
                className={`px-3 h-10 w-10 rounded-xl shadow-sm hover:shadow-md ${
                    isArchived ? 'text-indigo-600 hover:bg-indigo-50' : 'text-red-500 hover:bg-red-50'
                }`}
            >
                {isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            </Button>
        </div>
    </div>
  );

  // ============================================
  // LIST MODE - Ultra Kompakt və Detaillı (Responsive)
  // ============================================
  if (viewMode === 'list') {
    return (
      <motion.article
        layout
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -10 }}
        whileHover={{ boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
        className={`group relative bg-white rounded-xl border ${
          isArchived ? 'border-slate-300 opacity-60' : 'border-slate-200 hover:border-emerald-300'
        } shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden`}
      >
        {renderArchivedOverlay()}

        <div className="flex flex-col sm:flex-row">
          {/* Şəkil və Məlumat Qrupu */}
          <div className="flex flex-1">
              {/* Şəkil */}
              <div className="relative w-28 sm:w-36 flex-shrink-0 overflow-hidden bg-slate-50 border-r border-slate-100">
                  <div className="relative h-full w-full min-h-[120px]">
                  <Image
                      src={imageUrl}
                      alt={p.name || 'Məhsul'}
                      fill
                      quality={70}
                      sizes="(max-width: 640px) 100vw, 144px"
                      className="object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  {renderBadges()}
                  </div>
              </div>

              {/* Məlumat və Qiymət - Orta hissə */}
              <div className="flex flex-1 flex-col p-3 min-w-0">
                  <div className="flex items-start justify-between gap-3 mb-2">
                      <div className="flex-1 min-w-0">
                          <h3 className="text-base font-bold text-slate-900 truncate mb-1 leading-snug">
                              {p.name}
                          </h3>
                          <div className="flex items-center flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                              <span className="inline-flex items-center gap-1 font-medium text-emerald-600">
                                  <List className="h-3 w-3" />
                                  {categoryName}
                              </span>
                              <span className="inline-flex items-center gap-1 font-medium">
                                  <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                                  {rating.toFixed(1)} ({p.reviews?.length ?? 0})
                              </span>
                              <span className="inline-flex items-center gap-1 text-slate-400">
                                  <Clock className="h-3 w-3" />
                                  {productAgeDays} gün
                              </span>
                          </div>
                          {renderMetaTags()}
                      </div>
                      <div className="text-right flex-shrink-0">{renderPriceBlock()}</div>
                  </div>
              
                  {/* Kompakt Maliyyə Vurğusu (Mobil üçün əla) */}
                  <div className='flex items-end justify-between border-t border-slate-100 pt-2 mt-auto'>
                      <div className='flex items-center gap-4 text-[12px] font-bold text-slate-700'>
                          <p className={financialMetrics.isProfitable ? 'text-emerald-700' : 'text-red-700'}>
                              {currency(financialMetrics.potentialProfit, 0)} Mənfəət
                          </p>
                          <p className='text-blue-700'>
                              {financialMetrics.totalStockQty} Vahid
                          </p>
                      </div>
                      {/* Profit Marja İndikatoru */}
                      <div className="flex-shrink-0 w-32 hidden sm:block">
                          <ProfitLine margin={financialMetrics.profitMargin} isProfitable={financialMetrics.isProfitable} />
                      </div>
                  </div>
              </div>
          </div>

          {/* Action buttons - Sağ tərəf (Responsive: Mobil görünüşdə aşağı hissədə qruplaşdırıla bilər) */}
          <div className="flex sm:flex-col gap-1 p-3 border-t sm:border-t-0 sm:border-l border-slate-100 justify-center">
              <a
                  href={`/products/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center rounded-lg border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition h-8 w-8 text-[11px]"
                  title="Vitrində bax"
              >
                  <Eye className="h-4 w-4" />
              </a>

              <Button
                type="button"
                variant="secondary"
                onClick={() => setEditingProduct(p)}
                className="flex-1 sm:flex-initial justify-center gap-1 text-[11px] h-8 w-8 p-0"
                title="Redaktə et"
              >
                  <Edit3 className="h-4 w-4" />
              </Button>
              
              <Button
                  type="button"
                  variant="soft"
                  onClick={() => (isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id))}
                  title={isArchived ? 'Arxivdən çıxar' : 'Arxivə sal'}
                  className={`flex-1 sm:flex-initial h-8 w-8 p-0 ${
                      isArchived ? 'text-indigo-600' : 'text-red-500'
                  }`}
              >
                  {isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </Button>
          </div>
        </div>
      </motion.article>
    );
  }

  // ============================================
  // GRID MODE - Ultimate Professional Card
  // ============================================
  return (
    <motion.article
      layout
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: 15 }}
      whileHover={{ y: -8, boxShadow: '0 25px 50px rgba(0,0,0,0.15)' }}
      transition={{ type: 'spring', stiffness: 280, damping: 20 }}
      className={`group relative bg-white rounded-2xl border ${
        isArchived ? 'border-slate-300 opacity-60' : 'border-slate-200 hover:border-emerald-400'
      } shadow-xl hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col h-full`}
    >
      {renderArchivedOverlay()}

      {/* Şəkil */}
      <div className="relative w-full overflow-hidden bg-slate-50 aspect-[4/3] border-b border-slate-100">
        <Image
          src={imageUrl}
          alt={p.name || 'Məhsul'}
          fill
          quality={85}
          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-20 bg-gradient-to-t from-black/25 to-transparent" />
        {renderBadges()}
      </div>

      {/* Məlumat */}
      <div className="flex flex-1 flex-col p-4">
        {/* Başlıq + Qiymət */}
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="min-w-0 flex-1">
            <h3 className="line-clamp-2 text-lg font-extrabold text-slate-900 mb-1 leading-snug">
              {p.name}
            </h3>
            <p className="flex items-center gap-1 text-[12px] font-medium text-slate-500">
              <List className="h-3.5 w-3.5 text-emerald-500" />
              <span className="truncate">{categoryName}</span>
            </p>
          </div>
          {renderPriceBlock()}
        </div>

        {/* Statistika Sətiri (Stok, Rəy, Yaş) */}
        <div className="flex items-center justify-between text-[11px] text-slate-600 mb-3 border-b border-slate-100 pb-2">
          <p className={`flex items-center gap-1.5 font-semibold ${stockColorSet.text}`}>
            <Layers className="h-4 w-4" />
            {financialMetrics.totalStockQty} vahid
          </p>
          <p className="flex items-center gap-1.5 text-amber-500">
            <Star className="h-4 w-4 fill-amber-400" />
            {rating.toFixed(1)}
          </p>
          <p className="flex items-center gap-1.5 text-slate-400">
            <Clock className="h-4 w-4" />
            {productAgeDays} gün
          </p>
        </div>

        {renderMetaTags()}

        {/* Maliyyə Metrikaları Gridi */}
        <div className="mt-auto pt-3">
            {renderFinancialMetrics()}
            <ProfitLine margin={financialMetrics.profitMargin} isProfitable={financialMetrics.isProfitable} />
        </div>

        {actionButtons}
      </div>
    </motion.article>
  );
};

export const ProductCard = memo(EnhancedProductCardBase);
ProductCard.displayName = 'ProductCard';