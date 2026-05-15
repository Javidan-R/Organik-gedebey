'use client';

import Image from 'next/image';
import { memo, useMemo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
  Scale,
  Heart,
  Trash2,
  MoreVertical,
} from 'lucide-react';

import {
  productTotalStock,
  isDiscountActive,
  productDisplayPrice,
  minPrice,
  avgRating,
  variantFinalPrice,
} from '@/lib/calc';
import { Button } from '@/components/atoms/button';
import { ProductCardProps, ProductImage } from '@/types/products';
import { safeImageUrl, currency } from '@/helpers';
import { DeleteConfirmToast } from '../molecules/Deleteconfirmtoast';

// ─── COLOUR PALETTE ──────────────────────────────────────────────
const PROFIT_COLORS = {
  positive: { bg: 'bg-emerald-50 border-emerald-200', text: 'text-emerald-700', line: 'bg-emerald-500' },
  negative:  { bg: 'bg-red-50 border-red-200',        text: 'text-red-700',     line: 'bg-red-500'     },
  stockLow:  { bg: 'bg-amber-50 border-amber-200',    text: 'text-amber-700',   line: 'bg-amber-500'   },
  stockOut:  { bg: 'bg-red-50 border-red-200',        text: 'text-red-700',     line: 'bg-red-500'     },
  neutral:   { bg: 'bg-slate-50 border-slate-200',    text: 'text-slate-600',   line: 'bg-slate-300'   },
};

// ─── METRIC BADGE ────────────────────────────────────────────────
interface MetricBadgeProps {
  label: string;
  value: string | number;
  icon: React.ElementType;
  colorClass: string;
  iconColorClass: string;
  isLargeValue?: boolean;
}

const MetricBadge = memo<MetricBadgeProps>(({ label, value, icon: Icon, colorClass, iconColorClass, isLargeValue = false }) => (
  <div className={`rounded-xl p-2.5 border transition-all duration-200 ${colorClass} hover:shadow-md`}>
    <p className={`text-[10px] font-semibold flex items-center gap-1 mb-1 ${iconColorClass}`}>
      <Icon className="h-3 w-3" />
      {label}
    </p>
    <p className={`font-extrabold ${isLargeValue ? 'text-lg' : 'text-sm'} text-slate-900 leading-tight`}>
      {value}
    </p>
  </div>
));
MetricBadge.displayName = 'MetricBadge';

// ─── PROFIT LINE ─────────────────────────────────────────────────
const ProfitLine = memo(({ margin, isProfitable }: { margin: string; isProfitable: boolean }) => {
  const { line, text } = isProfitable ? PROFIT_COLORS.positive : PROFIT_COLORS.negative;
  const abs = Math.min(Math.abs(parseFloat(margin)), 100);

  return (
    <div className="mt-3 pt-3 border-t border-slate-100">
      <div className="flex items-center justify-between mb-1">
        <p className={`flex items-center gap-1 text-[11px] font-semibold ${text}`}>
          <Scale className="h-3 w-3" /> Orta Profit Marjası
        </p>
        <span className={`text-[11px] font-bold px-1.5 py-0.5 rounded-md ${text} ${isProfitable ? 'bg-emerald-100' : 'bg-red-100'}`}>
          {margin}%
        </span>
      </div>
      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${abs}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className={`h-full rounded-full ${line}`}
        />
      </div>
    </div>
  );
});
ProfitLine.displayName = 'ProfitLine';

// ─── MOBILE ACTION MENU ──────────────────────────────────────────
interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  isArchived: boolean;
  hasSlug: boolean;
  slug: string;
  onEdit: () => void;
  onArchive: () => void;
  onDelete: () => void;
}

const MobileActionMenu = memo<MobileMenuProps>(({
  isOpen, onClose, isArchived, hasSlug, slug, onEdit, onArchive, onDelete,
}) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-40"
          onClick={onClose}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: -8 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -8 }}
          transition={{ type: 'spring', stiffness: 320, damping: 24 }}
          className="absolute right-2 top-12 z-50 min-w-[180px] rounded-2xl bg-white shadow-[0_8px_40px_rgba(0,0,0,0.18)] ring-1 ring-slate-900/8 overflow-hidden"
        >
          {hasSlug && (
            <a
              href={`/products/${slug}`}
              target="_blank"
              rel="noreferrer"
              onClick={onClose}
              className="flex items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
            >
              <Eye className="h-4 w-4" /> Vitrində bax
            </a>
          )}
          <button
            onClick={() => { onEdit(); onClose(); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <Edit3 className="h-4 w-4" /> Redaktə et
          </button>
          <button
            onClick={() => { onArchive(); onClose(); }}
            className={`flex w-full items-center gap-3 px-4 py-3 text-sm transition-colors ${
              isArchived
                ? 'text-indigo-700 hover:bg-indigo-50'
                : 'text-amber-700 hover:bg-amber-50'
            }`}
          >
            {isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
            {isArchived ? 'Arxivdən çıxar' : 'Arxivə sal'}
          </button>
          <div className="h-px bg-slate-100 mx-3" />
          <button
            onClick={() => { onDelete(); onClose(); }}
            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 transition-colors"
          >
            <Trash2 className="h-4 w-4" /> Sil
          </button>
        </motion.div>
      </>
    )}
  </AnimatePresence>
));
MobileActionMenu.displayName = 'MobileActionMenu';

// ─── MAIN COMPONENT ──────────────────────────────────────────────
const EnhancedProductCardBase = ({
  p,
  categoryMap,
  setEditingProduct,
  archiveProduct,
  unarchiveProduct,
  deleteProduct,
  viewMode = 'grid',
}: ProductCardProps) => {

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [justDeleted, setJustDeleted] = useState(false);

  // ── Calculations ─────────────────────────────────────────────
  const stock        = productTotalStock(p);
  const lowStock     = stock < (p.minStock ?? 5);
  const discount     = isDiscountActive(p);
  const price        = productDisplayPrice(p);
  const regularPrice = minPrice(p);
  const rating       = avgRating(p);
  const isArchived   = p.archived;
  const hasSlug      = !!p.slug;

  const productAgeDays = useMemo(() => {
    const days = Math.floor((Date.now() - new Date(p.createdAt).getTime()) / 86_400_000);
    return Math.max(0, days);
  }, [p.createdAt]);

  const financialMetrics = useMemo(() => {
    let totalCost = 0, potentialRevenue = 0, totalStockQty = 0;
    for (const v of p.variants ?? []) {
      const qty = v.stock ?? 0;
      totalStockQty   += qty;
      totalCost       += (v.costPrice ?? p.costPrice ?? 0) * qty;
      potentialRevenue += variantFinalPrice(p, v) * qty;
    }
    const potentialProfit = potentialRevenue - totalCost;
    const profitMargin = potentialRevenue > 0
      ? ((potentialProfit / potentialRevenue) * 100).toFixed(1)
      : '0.0';
    return { totalStockQty, totalCost, potentialRevenue, potentialProfit, profitMargin, isProfitable: potentialProfit >= 0 };
  }, [p]);

  const primaryImage = (Array.isArray(p.images) ? p.images[0] : null) as ProductImage | null;
  const imageUrl     = safeImageUrl(primaryImage);
  const categoryName = categoryMap[p.categoryId] || 'Naməlum';

  let stockColorSet = PROFIT_COLORS.neutral;
  if (lowStock && stock > 0) stockColorSet = PROFIT_COLORS.stockLow;
  if (stock === 0)            stockColorSet = PROFIT_COLORS.stockOut;

  // ── Delete handlers ──────────────────────────────────────────
  const requestDelete = useCallback(() => setShowDeleteConfirm(true), []);

  const confirmDelete = useCallback(() => {
    setShowDeleteConfirm(false);
    setJustDeleted(true);
    // Small delay so the exit animation plays
    setTimeout(() => deleteProduct?.(p.id), 350);
  }, [deleteProduct, p.id]);

  const cancelDelete = useCallback(() => setShowDeleteConfirm(false), []);

  // ── Sub-renders ──────────────────────────────────────────────
  const renderBadges = () => (
    <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5 z-10">
      {stock === 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
          <XCircle className="h-2.5 w-2.5" /> Stoksuz
        </span>
      )}
      {lowStock && stock > 0 && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
          <AlertTriangle className="h-2.5 w-2.5" /> Az
        </span>
      )}
      {discount && (
        <span className="inline-flex items-center gap-1 rounded-full bg-pink-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
          <Percent className="h-2.5 w-2.5" /> Endirim
        </span>
      )}
      {p.featured && (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-600 px-2 py-0.5 text-[10px] font-bold text-white shadow-lg">
          <Heart className="h-2.5 w-2.5" /> Seçilmiş
        </span>
      )}
    </div>
  );

  const renderArchivedOverlay = () =>
    isArchived && (
      <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center bg-black/15 backdrop-blur-[2px]">
        <span className="rotate-[-10deg] rounded-xl bg-black/70 px-4 py-2 text-xs font-bold uppercase tracking-wider text-white shadow-2xl ring-2 ring-red-500">
          ARXİVDƏDİR
        </span>
      </div>
    );

  const renderMetaTags = () => {
    const tags = (p.tags ?? []).slice(0, 3);
    return (
      <div className="mt-2 flex flex-wrap items-center gap-1.5 text-[10px]">
        {p.originRegion && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-indigo-50 px-2 py-0.5 font-medium text-indigo-700">
            <MapPin className="h-2.5 w-2.5" /> {p.originRegion}
          </span>
        )}
        {tags.map(t => (
          <span key={t} className="inline-flex items-center gap-0.5 rounded-full bg-slate-100 px-2 py-0.5 font-medium text-slate-600">
            <Tag className="h-2.5 w-2.5" /> {t}
          </span>
        ))}
        {(p.variants?.length ?? 0) > 1 && (
          <span className="inline-flex items-center gap-0.5 rounded-full bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
            <Package className="h-2.5 w-2.5" /> {p.variants!.length} variant
          </span>
        )}
      </div>
    );
  };

  const renderPriceBlock = () => {
    if (discount) {
      const pct = ((1 - price / regularPrice) * 100).toFixed(0);
      return (
        <div className="flex flex-col items-end whitespace-nowrap">
          <span className="text-xs line-through text-slate-400">{currency(regularPrice, 2)}</span>
          <span className="text-lg font-extrabold text-rose-600 leading-tight">{currency(price, 2)}</span>
          <span className="mt-0.5 rounded-full bg-rose-50 px-2 text-[10px] font-semibold text-rose-500">
            -{pct}%
          </span>
        </div>
      );
    }
    return (
      <div className="flex flex-col items-end">
        <span className="text-lg font-extrabold text-emerald-600 leading-tight">{currency(price, 2)}</span>
        <span className="mt-0.5 text-[10px] font-medium text-slate-400">Ən aşağı</span>
      </div>
    );
  };

  const renderFinancialMetrics = () => (
    <div className="grid grid-cols-2 gap-2 mt-3">
      <MetricBadge
        label="Potensial Mənfəət"
        value={currency(financialMetrics.potentialProfit, 0)}
        icon={financialMetrics.isProfitable ? TrendingUp : TrendingDown}
        colorClass={financialMetrics.isProfitable ? PROFIT_COLORS.positive.bg : PROFIT_COLORS.negative.bg}
        iconColorClass={financialMetrics.isProfitable ? PROFIT_COLORS.positive.text : PROFIT_COLORS.negative.text}
        isLargeValue
      />
      <MetricBadge
        label="Stok Vahidi"
        value={`${financialMetrics.totalStockQty} əd`}
        icon={Layers}
        colorClass={stockColorSet.bg}
        iconColorClass={stockColorSet.text}
      />
      <MetricBadge
        label="Potensial Gəlir"
        value={currency(financialMetrics.potentialRevenue, 0)}
        icon={ShoppingCart}
        colorClass="bg-blue-50 border-blue-200"
        iconColorClass="text-blue-700"
      />
      <MetricBadge
        label="Maya Dəyəri"
        value={currency(financialMetrics.totalCost, 0)}
        icon={DollarSign}
        colorClass="bg-slate-50 border-slate-200"
        iconColorClass="text-slate-700"
      />
    </div>
  );

  // ─────────────────────────────────────────────────────────────
  // LIST MODE
  // ─────────────────────────────────────────────────────────────
  if (viewMode === 'list') {
    return (
      <>
        <DeleteConfirmToast
          isOpen={showDeleteConfirm}
          productName={p.name}
          onConfirm={confirmDelete}
          onCancel={cancelDelete}
        />

        <motion.article
          layout
          initial={{ opacity: 0, y: 10 }}
          animate={justDeleted ? { opacity: 0, x: -40, scale: 0.95 } : { opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          whileHover={{ boxShadow: '0 10px 30px rgba(0,0,0,0.09)' }}
          transition={{ type: 'spring', stiffness: 300, damping: 25 }}
          className={`group relative overflow-hidden rounded-2xl border bg-white shadow-sm transition-all duration-300 ${
            isArchived ? 'border-slate-300 opacity-60' : 'border-slate-200 hover:border-emerald-300'
          }`}
        >
          {renderArchivedOverlay()}

          {/* ── Mobile layout (< sm) ─────────────────────────── */}
          <div className="sm:hidden">
            <div className="flex items-start gap-3 p-3">
              {/* Thumbnail */}
              <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-slate-50">
                <Image
                  src={imageUrl} alt={p.name ?? 'Məhsul'} fill quality={70}
                  sizes="80px" className="object-cover"
                />
                {renderBadges()}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="text-sm font-bold text-slate-900 line-clamp-2 leading-snug pr-1">
                    {p.name}
                  </h3>
                  {/* Mobile ⋮ menu */}
                  <div className="relative flex-shrink-0">
                    <button
                      onClick={() => setMobileMenuOpen(v => !v)}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    <MobileActionMenu
                      isOpen={mobileMenuOpen}
                      onClose={() => setMobileMenuOpen(false)}
                      isArchived={isArchived}
                      hasSlug={hasSlug}
                      slug={p.slug ?? ''}
                      onEdit={() => setEditingProduct(p)}
                      onArchive={() => isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id)}
                      onDelete={requestDelete}
                    />
                  </div>
                </div>

                {/* Category + stats */}
                <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1 text-[10px] text-slate-500">
                  <span className="flex items-center gap-0.5 text-emerald-600 font-medium">
                    <List className="h-3 w-3" /> {categoryName}
                  </span>
                  <span className="flex items-center gap-0.5">
                    <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                    {rating.toFixed(1)}
                  </span>
                  <span className={`flex items-center gap-0.5 font-semibold ${stockColorSet.text}`}>
                    <Layers className="h-3 w-3" /> {financialMetrics.totalStockQty} əd
                  </span>
                </div>
              </div>

              {/* Price */}
              <div className="flex-shrink-0">{renderPriceBlock()}</div>
            </div>

            {/* Compact financials bar */}
            <div className="flex items-center gap-3 border-t border-slate-100 bg-slate-50/60 px-3 py-2 text-[11px] font-bold">
              <span className={financialMetrics.isProfitable ? 'text-emerald-700' : 'text-red-600'}>
                {financialMetrics.isProfitable ? '↑' : '↓'} {currency(financialMetrics.potentialProfit, 0)}
              </span>
              <span className="text-blue-700">{currency(financialMetrics.potentialRevenue, 0)} gəlir</span>
              <span className="ml-auto text-slate-400">Marjа: {financialMetrics.profitMargin}%</span>
            </div>
          </div>

          {/* ── Desktop layout (sm+) ─────────────────────────── */}
          <div className="hidden sm:flex">
            {/* Image */}
            <div className="relative w-36 flex-shrink-0 overflow-hidden rounded-l-2xl bg-slate-50">
              <Image
                src={imageUrl} alt={p.name ?? 'Məhsul'} fill quality={70}
                sizes="144px" className="object-cover transition-transform duration-300 group-hover:scale-105"
              />
              {renderBadges()}
            </div>

            {/* Middle info */}
            <div className="flex flex-1 flex-col p-4 min-w-0">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-bold text-slate-900 truncate mb-1">{p.name}</h3>
                  <div className="flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-emerald-600 font-medium">
                      <List className="h-3 w-3" /> {categoryName}
                    </span>
                    <span className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                      {rating.toFixed(1)} ({p.reviews?.length ?? 0})
                    </span>
                    <span className="flex items-center gap-1 text-slate-400">
                      <Clock className="h-3 w-3" /> {productAgeDays} gün
                    </span>
                  </div>
                  {renderMetaTags()}
                </div>
                <div className="flex-shrink-0">{renderPriceBlock()}</div>
              </div>

              {/* Financials row */}
              <div className="mt-3 flex items-end justify-between border-t border-slate-100 pt-2">
                <div className="flex gap-4 text-[12px] font-bold text-slate-700">
                  <span className={financialMetrics.isProfitable ? 'text-emerald-700' : 'text-red-700'}>
                    {currency(financialMetrics.potentialProfit, 0)} mənfəət
                  </span>
                  <span className="text-blue-700">{financialMetrics.totalStockQty} vahid</span>
                </div>
                <div className="w-32">
                  <ProfitLine margin={financialMetrics.profitMargin} isProfitable={financialMetrics.isProfitable} />
                </div>
              </div>
            </div>

            {/* Action column */}
            <div className="flex flex-col gap-1 border-l border-slate-100 p-2.5 justify-center">
              {hasSlug && (
                <a
                  href={`/products/${p.slug}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition"
                  title="Vitrində bax"
                >
                  <Eye className="h-4 w-4" />
                </a>
              )}
              <button
                onClick={() => setEditingProduct(p)}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition shadow-sm"
                title="Redaktə et"
              >
                <Edit3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id)}
                className={`flex h-9 w-9 items-center justify-center rounded-xl border transition shadow-sm ${
                  isArchived
                    ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                    : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
                }`}
                title={isArchived ? 'Arxivdən çıxar' : 'Arxivə sal'}
              >
                {isArchived ? <RotateCcw className="h-4 w-4" /> : <Archive className="h-4 w-4" />}
              </button>
              {/* ── DELETE BUTTON ── */}
              <motion.button
                whileHover={{ scale: 1.08 }}
                whileTap={{ scale: 0.92 }}
                onClick={requestDelete}
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition shadow-sm"
                title="Məhsulu sil"
              >
                <Trash2 className="h-4 w-4" />
              </motion.button>
            </div>
          </div>
        </motion.article>
      </>
    );
  }

  // ─────────────────────────────────────────────────────────────
  // GRID MODE
  // ─────────────────────────────────────────────────────────────
  return (
    <>
      <DeleteConfirmToast
        isOpen={showDeleteConfirm}
        productName={p.name}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />

      <motion.article
        layout
        initial={{ opacity: 0, scale: 0.9, y: 15 }}
        animate={justDeleted ? { opacity: 0, scale: 0.85, y: -20 } : { opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 15 }}
        whileHover={{ y: -6, boxShadow: '0 22px 50px rgba(0,0,0,0.13)' }}
        transition={{ type: 'spring', stiffness: 280, damping: 20 }}
        className={`group relative flex flex-col overflow-hidden rounded-2xl border bg-white shadow-lg transition-all duration-300 ${
          isArchived ? 'border-slate-300 opacity-60' : 'border-slate-200 hover:border-emerald-300'
        }`}
      >
        {renderArchivedOverlay()}

        {/* Image */}
        <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-50">
          <Image
            src={imageUrl} alt={p.name ?? 'Məhsul'} fill quality={85}
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 33vw, 25vw"
            className="object-cover transition-transform duration-500 group-hover:scale-105"
          />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/20 to-transparent" />
          {renderBadges()}

          {/* ── Mobile ⋮ overlay (grid mode) ── */}
          <div className="absolute top-2.5 left-2.5 sm:hidden">
            <div className="relative">
              <button
                onClick={() => setMobileMenuOpen(v => !v)}
                className="flex h-8 w-8 items-center justify-center rounded-full bg-white/80 backdrop-blur-sm text-slate-600 shadow-sm"
              >
                <MoreVertical className="h-4 w-4" />
              </button>
              <MobileActionMenu
                isOpen={mobileMenuOpen}
                onClose={() => setMobileMenuOpen(false)}
                isArchived={isArchived}
                hasSlug={hasSlug}
                slug={p.slug ?? ''}
                onEdit={() => setEditingProduct(p)}
                onArchive={() => isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id)}
                onDelete={requestDelete}
              />
            </div>
          </div>
        </div>

        {/* Body */}
        <div className="flex flex-1 flex-col p-4">
          {/* Name + price */}
          <div className="flex items-start justify-between gap-2 mb-2">
            <div className="min-w-0 flex-1">
              <h3 className="line-clamp-2 text-base font-extrabold text-slate-900 leading-snug mb-1">
                {p.name}
              </h3>
              <p className="flex items-center gap-1 text-[11px] font-medium text-slate-500">
                <List className="h-3.5 w-3.5 text-emerald-500" />
                <span className="truncate">{categoryName}</span>
              </p>
            </div>
            {renderPriceBlock()}
          </div>

          {/* Stats row */}
          <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2 border-b border-slate-100 pb-2">
            <span className={`flex items-center gap-1 font-semibold ${stockColorSet.text}`}>
              <Layers className="h-3.5 w-3.5" /> {financialMetrics.totalStockQty} vahid
            </span>
            <span className="flex items-center gap-1 text-amber-500">
              <Star className="h-3.5 w-3.5 fill-amber-400" /> {rating.toFixed(1)}
            </span>
            <span className="flex items-center gap-1 text-slate-400">
              <Clock className="h-3.5 w-3.5" /> {productAgeDays} gün
            </span>
          </div>

          {renderMetaTags()}

          {/* Financials */}
          <div className="mt-auto pt-3">
            {renderFinancialMetrics()}
            <ProfitLine margin={financialMetrics.profitMargin} isProfitable={financialMetrics.isProfitable} />
          </div>

          {/* ── Action buttons (desktop) ── */}
          <div className="mt-4 hidden sm:flex gap-2 border-t border-slate-100 pt-3">
            {/* Edit */}
            <Button
              type="button"
              variant="secondary"
              onClick={() => setEditingProduct(p)}
              className="flex-1 justify-center gap-1.5 text-[12px] h-9 px-3 font-semibold rounded-xl"
            >
              <Edit3 className="h-3.5 w-3.5" /> Redaktə
            </Button>

            {/* View in storefront */}
            {hasSlug && (
              <a
                href={`/products/${p.slug}`}
                target="_blank"
                rel="noreferrer"
                className="flex h-9 w-9 items-center justify-center rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-600 hover:text-white transition shadow-sm"
                title="Vitrində bax"
              >
                <Eye className="h-3.5 w-3.5" />
              </a>
            )}

            {/* Archive / Unarchive */}
            <button
              onClick={() => isArchived ? unarchiveProduct(p.id) : archiveProduct(p.id)}
              className={`flex h-9 w-9 items-center justify-center rounded-xl border transition shadow-sm ${
                isArchived
                  ? 'border-indigo-200 bg-indigo-50 text-indigo-600 hover:bg-indigo-600 hover:text-white'
                  : 'border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-600 hover:text-white'
              }`}
              title={isArchived ? 'Arxivdən çıxar' : 'Arxivə sal'}
            >
              {isArchived ? <RotateCcw className="h-3.5 w-3.5" /> : <Archive className="h-3.5 w-3.5" />}
            </button>

            {/* ── DELETE ── */}
            <motion.button
              whileHover={{ scale: 1.08 }}
              whileTap={{ scale: 0.92 }}
              onClick={requestDelete}
              className="flex h-9 w-9 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 hover:bg-red-600 hover:text-white transition shadow-sm"
              title="Məhsulu sil"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </motion.button>
          </div>

          {/* Mobile quick actions row */}
          <div className="mt-3 flex gap-2 border-t border-slate-100 pt-3 sm:hidden">
            <button
              onClick={() => setEditingProduct(p)}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-3 py-2.5 text-xs font-bold text-white shadow-sm active:scale-95 transition"
            >
              <Edit3 className="h-3.5 w-3.5" /> Redaktə
            </button>
            <button
              onClick={requestDelete}
              className="flex h-10 w-10 items-center justify-center rounded-xl border border-red-200 bg-red-50 text-red-500 active:scale-95 transition"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        </div>
      </motion.article>
    </>
  );
};

export const ProductCard = memo(EnhancedProductCardBase);
ProductCard.displayName = 'ProductCard';