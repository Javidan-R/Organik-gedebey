"use client";

/**
 * Bu Gün Gələnlər — Admin Page v2
 *
 * Yeniliklər:
 *  • Discount editor (faiz / sabit / yox)
 *  • Stok ± tənzimi
 *  • Flash Deal toggle + zaman aralığı
 *  • Gəliş bildirişi (Upcoming → Fresh bir klikdə)
 *  • Upcoming vaxtı seçimi
 *  • Marja kalkulyatoru (canlı)
 *  • Bulk seçim + toplu əməliyyatlar
 *  • Sort: stok / marja / ad / vəziyyət
 *  • Saxlandı toast bildirişi
 *  • Rəng: ağ / yaşıl / sarı
 */

import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Search, ChevronDown, ChevronUp, RefreshCw,
  Flame, Package, AlertCircle, Save, DollarSign, TrendingDown,
  Clock, Zap, CheckCheck, X, ArrowUpDown, CheckSquare,
  Square, Percent, Tag, TrendingUp, SortAsc, BarChart3,
  ChevronRight, ShoppingBag, Sparkles, Plus, Minus,
  Check, Timer, BadgePercent,
} from "lucide-react";
import Image from "next/image";
import { useApp, useHasHydrated } from "@/lib/store";
import { getFirstImageUrl, formatCurrency } from "@/utils/storefront_home";
import type { Product, ProductStatus, Variant } from "@/types/products";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type FreshState = "fresh" | "upcoming" | "none";
type SortKey = "default" | "stock-asc" | "stock-desc" | "margin-desc" | "name" | "state";

interface ManagedProduct extends Product {
  freshState: FreshState;
  arrivedAt?: string;
  freshLabel?: string;
  isHot?: boolean;
  flashDeal?: boolean;
  flashDealStart?: string;
  flashDealEnd?: string;
  upcomingTime?: string;
}

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function calcMargin(sale: number, cost: number) {
  if (sale <= 0) return 0;
  return Math.round(((sale - cost) / sale) * 100);
}

function MarginChip({ sale, cost }: { sale: number; cost: number }) {
  const m = calcMargin(sale, cost);
  const profit = sale - cost;
  const color =
    m >= 40 ? "bg-emerald-100 text-emerald-700 border-emerald-200"
    : m >= 20 ? "bg-yellow-100 text-amber-700 border-yellow-200"
    : "bg-red-50 text-red-600 border-red-100";
  return (
    <span className={`inline-flex items-center gap-1 text-[9px] font-black
      px-1.5 py-0.5 rounded-full border ${color}`}>
      <TrendingUp className="w-2.5 h-2.5" />
      {m}% · +{formatCurrency(profit)}
    </span>
  );
}

/* Mini stock bar */
function MiniStockBar({ stock, max = 20 }: { stock: number; max?: number }) {
  const pct = Math.min(100, (stock / max) * 100);
  const color =
    pct <= 25 ? "bg-red-400" : pct <= 55 ? "bg-amber-400" : "bg-emerald-500";
  return (
    <div className="flex items-center gap-1.5">
      <div className="h-1 w-12 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-[9px] font-bold ${
        pct <= 25 ? "text-red-500" : pct <= 55 ? "text-amber-600" : "text-emerald-600"
      }`}>
        {stock}
      </span>
    </div>
  );
}

/* Toast */
function SavedToast({ visible }: { visible: boolean }) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50
            flex items-center gap-2 bg-emerald-700 text-white
            font-black text-sm rounded-2xl px-4 py-2.5 shadow-2xl
            shadow-emerald-700/30"
        >
          <Check className="w-4 h-4 text-yellow-300" />
          Saxlandı!
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* Toggle switch */
function Toggle({
  value,
  onChange,
  colorOn = "bg-emerald-500",
}: {
  value: boolean;
  onChange: (v: boolean) => void;
  colorOn?: string;
}) {
  return (
    <button
      onClick={() => onChange(!value)}
      className={`relative w-11 h-6 rounded-full transition-colors duration-200
        ${value ? colorOn : "bg-slate-200"}`}
    >
      <span
        className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
          transition-transform duration-200
          ${value ? "translate-x-5" : "translate-x-0.5"}`}
      />
    </button>
  );
}

/* Section label */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
      {children}
    </p>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT ROW
══════════════════════════════════════════════════════════════════ */
function ProductRow({
  product,
  selected,
  onSelect,
  onUpdate,
  onToggleFresh,
  onToggleUpcoming,
  onMarkArrived,
}: {
  product: ManagedProduct;
  selected: boolean;
  onSelect: (id: string) => void;
  onUpdate: (id: string, updates: Partial<ManagedProduct>) => void;
  onToggleFresh: (id: string) => void;
  onToggleUpcoming: (id: string) => void;
  onMarkArrived: (id: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<"general" | "price" | "deal">("general");
  const [showToast, setShowToast] = useState(false);

  /* ── Local editable state ── */
  const [arrivedAt, setArrivedAt]     = useState(product.arrivedAt ?? "");
  const [upcomingTime, setUpcomingTime] = useState(product.upcomingTime ?? "");
  const [freshLabel, setFreshLabel]   = useState(product.freshLabel ?? "");
  const [isHot, setIsHot]             = useState(product.isHot ?? false);

  const [localSalePrice, setLocalSalePrice] = useState<number>(
    product.variants?.[0]?.price ?? product.price ?? 0
  );
  const [localCostPrice, setLocalCostPrice] = useState<number>(
    product.variants?.[0]?.costPrice ?? product.costPrice ?? 0
  );
  const [applyToAllVariants, setApplyToAllVariants] = useState(false);

  /* Discount */
  const [discountType, setDiscountType] = useState<"none" | "percent" | "fixed">(
    (product.discountType as any) ?? "none"
  );
  const [discountValue, setDiscountValue] = useState<number>(
    product.discountValue ?? 0
  );

  /* Stock */
  const baseStock = product.variants?.[0]?.stock ?? 0;
  const [localStock, setLocalStock] = useState<number>(baseStock);

  /* Flash Deal */
  const [flashDeal, setFlashDeal]       = useState(product.flashDeal ?? false);
  const [flashStart, setFlashStart]     = useState(product.flashDealStart ?? "");
  const [flashEnd, setFlashEnd]         = useState(product.flashDealEnd ?? "");

  const [saving, setSaving] = useState(false);

  /* Derived */
  const stock      = localStock;
  const isLowStock = stock > 0 && stock <= 5;
  const isOut      = stock <= 0;
  const isFresh    = product.freshState === "fresh";
  const isUpcoming = product.freshState === "upcoming";
  const margin     = calcMargin(localSalePrice, localCostPrice);
  const profit     = localSalePrice - localCostPrice;

  const discountedPrice =
    discountType === "percent"
      ? localSalePrice * (1 - discountValue / 100)
      : discountType === "fixed"
      ? localSalePrice - discountValue
      : localSalePrice;

 // AdminFreshTodayPage - ProductRow daxilində handleSave funksiyası

const handleSave = async () => {
  setSaving(true);
  await new Promise((r) => setTimeout(r, 280));

  const updates: Partial<ManagedProduct> = {
    arrivedAt,
    upcomingTime,
    freshLabel,
    isHot,
    flashDeal,
    flashDealStart: flashStart,
    flashDealEnd: flashEnd,
    discountType: discountType === "none" ? undefined : discountType as any,
    discountValue: discountType === "none" ? 0 : discountValue,
    price: localSalePrice,
    costPrice: localCostPrice,
  };

  /* ✅ DÜZƏLİŞ: id təkrarı aradan qaldırılıb */
  if (product.variants?.length) {
    if (applyToAllVariants) {
      // Bütün variantları yenilə - id ayrıca təyin edilmir, spread qoruyur
      const newVariants = product.variants.map((v: Variant) => ({
        ...v, // id buradan gəlir
        price: localSalePrice,
        costPrice: localCostPrice,
        stock: localStock,
      }));
      updates.variants = newVariants;
    } else {
      // Yalnız birinci variantı yenilə
      const newVariants = product.variants.map((v: Variant, i: number) => {
        if (i === 0) {
          return {
            ...v, // id buradan gəlir
            price: localSalePrice,
            costPrice: localCostPrice,
            stock: localStock,
          };
        }
        return { ...v }; // id buradan gəlir
      });
      updates.variants = newVariants;
    }
  }

  onUpdate(product.id, updates);
  setSaving(false);
  setExpanded(false);
  setShowToast(true);
  setTimeout(() => setShowToast(false), 2200);
};

  const tabs = [
    { key: "general" as const, label: "Ümumi", icon: <Leaf className="w-3 h-3" /> },
    { key: "price"   as const, label: "Qiymət", icon: <DollarSign className="w-3 h-3" /> },
    { key: "deal"    as const, label: "Flash Deal", icon: <Zap className="w-3 h-3" /> },
  ];

  return (
    <>
      <SavedToast visible={showToast} />
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, height: 0 }}
        className={`rounded-2xl border overflow-hidden shadow-[0_1px_8px_rgba(0,0,0,0.04)]
          transition-colors ${
          selected
            ? "bg-yellow-50 border-yellow-300"
            : "bg-white border-slate-100"
        }`}
      >
        {/* ── MAIN ROW ── */}
        <div className="flex items-center gap-2.5 p-3">

          {/* Checkbox */}
          <button
            onClick={() => onSelect(product.id)}
            className="shrink-0 text-slate-300 hover:text-emerald-600 transition-colors"
          >
            {selected
              ? <CheckSquare className="w-4.5 h-4.5 text-emerald-600" />
              : <Square className="w-4.5 h-4.5" />}
          </button>

          {/* Thumbnail */}
          <div className="relative w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {product.images?.[0] ? (
              <Image src={getFirstImageUrl(product)} alt={product.name} fill className="object-cover" />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-xl">🥬</div>
            )}
            {isHot && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500 rounded-full
                flex items-center justify-center shadow-sm">
                <Flame className="w-2.5 h-2.5 text-white" />
              </div>
            )}
            {flashDeal && (
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full
                flex items-center justify-center shadow-sm">
                <Zap className="w-2.5 h-2.5 text-emerald-900" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-black text-sm text-slate-900 truncate">{product.name}</p>
              {isFresh && (
                <span className="text-[9px] font-bold bg-emerald-100 text-emerald-700
                  px-1.5 py-0.5 rounded-full border border-emerald-200">
                  Bu Gün ✓
                </span>
              )}
              {isUpcoming && (
                <span className="text-[9px] font-bold bg-amber-100 text-amber-700
                  px-1.5 py-0.5 rounded-full border border-amber-200">
                  ⏰ Gəlir {upcomingTime ? `· ${upcomingTime}` : ""}
                </span>
              )}
              {flashDeal && (
                <span className="text-[9px] font-bold bg-yellow-100 text-amber-800
                  px-1.5 py-0.5 rounded-full border border-yellow-200">
                  ⚡ Flash
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <span className="text-[11px] text-emerald-700 font-bold">
                {formatCurrency(localSalePrice)}
              </span>
              {discountType !== "none" && discountValue > 0 && (
                <span className="text-[10px] text-amber-700 font-bold bg-yellow-100
                  px-1.5 rounded-full">
                  → {formatCurrency(discountedPrice)}
                  {discountType === "percent" ? ` (-%${discountValue})` : ""}
                </span>
              )}
              <MiniStockBar stock={stock} />
              {isOut && (
                <span className="text-[9px] font-bold text-red-600 bg-red-50
                  px-1.5 py-0.5 rounded-full">Tükənib</span>
              )}
              {isLowStock && !isOut && (
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50
                  px-1.5 py-0.5 rounded-full">⚡ Son {stock}</span>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            {/* Upcoming → Fresh quick action */}
            {isUpcoming && (
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={() => onMarkArrived(product.id)}
                title="Gəldi! — Aktiv et"
                className="flex items-center gap-1 bg-emerald-600 text-white
                  text-[9px] font-black rounded-lg px-2 py-1.5 shadow-sm
                  hover:bg-emerald-700 transition-colors"
              >
                <Check className="w-3 h-3" />
                Gəldi!
              </motion.button>
            )}

            {/* Fresh toggle */}
            <button
              onClick={() => onToggleFresh(product.id)}
              title={isFresh ? "Aktiv siyahıdan çıxar" : "Aktiv siyahıya əlavə et"}
              className={`w-8 h-8 rounded-lg flex items-center justify-center
                transition-colors ${
                isFresh
                  ? "bg-emerald-100 text-emerald-700"
                  : "bg-slate-50 text-slate-400 hover:bg-emerald-50 hover:text-emerald-500"
              }`}
            >
              <Leaf className="w-4 h-4" />
            </button>

            {/* Upcoming toggle */}
            <button
              onClick={() => onToggleUpcoming(product.id)}
              title={isUpcoming ? "Gəlir siyahısından çıxar" : "Gəlir siyahısına əlavə et"}
              className={`w-8 h-8 rounded-lg flex items-center justify-center
                transition-colors ${
                isUpcoming
                  ? "bg-amber-100 text-amber-700"
                  : "bg-slate-50 text-slate-400 hover:bg-amber-50 hover:text-amber-500"
              }`}
            >
              <Clock className="w-4 h-4" />
            </button>

            {/* Expand */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100
                flex items-center justify-center transition-colors"
            >
              {expanded
                ? <ChevronUp className="w-4 h-4 text-slate-500" />
                : <ChevronDown className="w-4 h-4 text-slate-500" />}
            </button>
          </div>
        </div>

        {/* ── EXPANDED PANEL ── */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              {/* Tab bar */}
              <div className="flex gap-1 px-4 pt-3 border-t border-slate-50">
                {tabs.map((t) => (
                  <button
                    key={t.key}
                    onClick={() => setActiveTab(t.key)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                      text-[11px] font-black transition-all ${
                      activeTab === t.key
                        ? "bg-emerald-700 text-white shadow-sm"
                        : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                    }`}
                  >
                    {t.icon}
                    {t.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3 bg-slate-50/40">

                {/* ══ TAB: ÜMUMI ══ */}
                {activeTab === "general" && (
                  <div className="space-y-3">
                    {/* Gəliş vaxtı */}
                    <div>
                      <SectionLabel>🕐 Gəliş vaxtı</SectionLabel>
                      <input
                        type="time"
                        value={arrivedAt}
                        onChange={(e) => setArrivedAt(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2
                          outline-none focus:border-emerald-400 bg-white
                          focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>

                    {/* Upcoming vaxtı */}
                    {isUpcoming && (
                      <div>
                        <SectionLabel>⏰ Gəlmə vaxtı (gözlənilən)</SectionLabel>
                        <input
                          type="time"
                          value={upcomingTime}
                          onChange={(e) => setUpcomingTime(e.target.value)}
                          className="w-full text-sm border border-amber-200 rounded-xl px-3 py-2
                            outline-none focus:border-amber-400 bg-amber-50
                            focus:ring-2 focus:ring-amber-100 transition-all"
                        />
                      </div>
                    )}

                    {/* Qısa açıqlama */}
                    <div>
                      <SectionLabel>📝 Qısa açıqlama</SectionLabel>
                      <input
                        type="text"
                        placeholder="məs. Səhər dərilmiş, super xırtıldayan"
                        value={freshLabel}
                        onChange={(e) => setFreshLabel(e.target.value)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                          outline-none focus:border-emerald-400 bg-white
                          focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>

                    {/* Hot toggle */}
                    <div className="flex items-center justify-between p-3
                      bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">🔥</span>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Çox satılan</p>
                          <p className="text-[10px] text-slate-400">Kartda "Hot" etiketi</p>
                        </div>
                      </div>
                      <Toggle value={isHot} onChange={setIsHot} colorOn="bg-orange-500" />
                    </div>
                  </div>
                )}

                {/* ══ TAB: QİYMƏT ══ */}
                {activeTab === "price" && (
                  <div className="space-y-3">
                    {/* Live margin display */}
                    <div className="flex items-center justify-between p-3
                      bg-white rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400">Marja / Mənfəət</p>
                        <p className="text-lg font-black text-emerald-700">
                          {margin}%
                          <span className="text-xs font-bold text-slate-500 ml-2">
                            +{formatCurrency(profit)} hər ədəddən
                          </span>
                        </p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          Stok ilə: <span className="font-bold text-emerald-600">
                            +{formatCurrency(profit * stock)}
                          </span>
                        </p>
                      </div>
                      <BarChart3 className="w-8 h-8 text-emerald-200" />
                    </div>

                    {/* Sale price */}
                    <div>
                      <SectionLabel><DollarSign className="w-3 h-3 inline mr-0.5" />Satış qiyməti (AZN)</SectionLabel>
                      <input
                        type="number" step="0.01" min="0"
                        value={localSalePrice}
                        onChange={(e) => setLocalSalePrice(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2
                          outline-none focus:border-emerald-400 bg-white
                          focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>

                    {/* Cost price */}
                    <div>
                      <SectionLabel><TrendingDown className="w-3 h-3 inline mr-0.5" />Alış qiyməti (AZN)</SectionLabel>
                      <input
                        type="number" step="0.01" min="0"
                        value={localCostPrice}
                        onChange={(e) => setLocalCostPrice(parseFloat(e.target.value) || 0)}
                        className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2
                          outline-none focus:border-emerald-400 bg-white
                          focus:ring-2 focus:ring-emerald-100 transition-all"
                      />
                    </div>

                    {/* Discount type */}
                    <div>
                      <SectionLabel><BadgePercent className="w-3 h-3 inline mr-0.5" />Endirim növü</SectionLabel>
                      <div className="flex gap-1.5">
                        {(["none", "percent", "fixed"] as const).map((t) => (
                          <button
                            key={t}
                            onClick={() => setDiscountType(t)}
                            className={`flex-1 py-2 rounded-xl text-[11px] font-black
                              border transition-all ${
                              discountType === t
                                ? "bg-emerald-700 text-white border-emerald-700"
                                : "bg-white text-slate-500 border-slate-200 hover:border-emerald-300"
                            }`}
                          >
                            {t === "none" ? "Yox" : t === "percent" ? "% Faiz" : "₼ Sabit"}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Discount value */}
                    {discountType !== "none" && (
                      <div>
                        <SectionLabel>
                          Endirim miqdarı ({discountType === "percent" ? "%" : "AZN"})
                        </SectionLabel>
                        <div className="relative">
                          <input
                            type="number" step="0.01" min="0"
                            value={discountValue}
                            onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
                            className="w-full text-sm border border-yellow-200 rounded-xl
                              px-3 py-2 pr-20 outline-none focus:border-yellow-400 bg-yellow-50
                              focus:ring-2 focus:ring-yellow-100 transition-all"
                          />
                          <div className="absolute right-3 top-1/2 -translate-y-1/2
                            text-xs font-bold text-amber-700">
                            → {formatCurrency(discountedPrice)}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Stock */}
                    <div>
                      <SectionLabel><Package className="w-3 h-3 inline mr-0.5" />Stok (ədəd)</SectionLabel>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => setLocalStock((s) => Math.max(0, s - 1))}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200
                            flex items-center justify-center text-slate-600
                            hover:bg-slate-50 transition-colors"
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number" min="0"
                          value={localStock}
                          onChange={(e) => setLocalStock(parseInt(e.target.value) || 0)}
                          className="flex-1 text-center text-sm font-black border border-slate-200
                            rounded-xl px-3 py-2 outline-none focus:border-emerald-400 bg-white
                            focus:ring-2 focus:ring-emerald-100 transition-all"
                        />
                        <button
                          onClick={() => setLocalStock((s) => s + 1)}
                          className="w-9 h-9 rounded-xl bg-white border border-slate-200
                            flex items-center justify-center text-slate-600
                            hover:bg-slate-50 transition-colors"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Apply to all variants */}
                    {(product.variants?.length ?? 0) > 1 && (
                      <label className="flex items-center gap-2 cursor-pointer
                        p-2.5 bg-white rounded-xl border border-slate-100">
                        <input
                          type="checkbox"
                          checked={applyToAllVariants}
                          onChange={(e) => setApplyToAllVariants(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-emerald-600
                            focus:ring-emerald-500"
                        />
                        <span className="text-xs text-slate-600 font-medium">
                          Bütün variantlara tətbiq et
                        </span>
                      </label>
                    )}
                  </div>
                )}

                {/* ══ TAB: FLASH DEAL ══ */}
                {activeTab === "deal" && (
                  <div className="space-y-3">
                    {/* Flash deal toggle */}
                    <div className="flex items-center justify-between p-3
                      bg-white rounded-xl border border-slate-100">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-xl bg-yellow-100
                          flex items-center justify-center">
                          <Zap className="w-4 h-4 text-amber-600" />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-slate-700">Flash Deal</p>
                          <p className="text-[10px] text-slate-400">
                            Hero sliderdə önə çəkilir
                          </p>
                        </div>
                      </div>
                      <Toggle
                        value={flashDeal}
                        onChange={setFlashDeal}
                        colorOn="bg-yellow-400"
                      />
                    </div>

                    {flashDeal && (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <SectionLabel>⏱ Başlama saatı</SectionLabel>
                            <input
                              type="time"
                              value={flashStart}
                              onChange={(e) => setFlashStart(e.target.value)}
                              className="w-full text-sm border border-yellow-200 rounded-xl
                                px-3 py-2 outline-none focus:border-yellow-400 bg-yellow-50
                                focus:ring-2 focus:ring-yellow-100 transition-all"
                            />
                          </div>
                          <div>
                            <SectionLabel>⏹ Bitmə saatı</SectionLabel>
                            <input
                              type="time"
                              value={flashEnd}
                              onChange={(e) => setFlashEnd(e.target.value)}
                              className="w-full text-sm border border-yellow-200 rounded-xl
                                px-3 py-2 outline-none focus:border-yellow-400 bg-yellow-50
                                focus:ring-2 focus:ring-yellow-100 transition-all"
                            />
                          </div>
                        </div>

                        {/* Flash deal preview */}
                        <div className="flex items-center gap-2 p-3 rounded-xl
                          bg-gradient-to-r from-yellow-400/20 to-amber-300/20
                          border border-yellow-200">
                          <Flame className="w-4 h-4 text-red-500 shrink-0" />
                          <div className="text-xs text-amber-900">
                            <span className="font-black">Flash Deal aktiv:</span>{" "}
                            {discountType !== "none" && discountValue > 0
                              ? `${discountType === "percent" ? `${discountValue}%` : formatCurrency(discountValue)} endirim`
                              : "Endirim yoxdur — Qiymət tabından əlavə et"}
                            {flashStart && flashEnd
                              ? ` · ${flashStart}–${flashEnd}`
                              : " · Vaxt seçilməyib"}
                          </div>
                        </div>
                      </>
                    )}

                    {!flashDeal && (
                      <p className="text-xs text-slate-400 text-center py-4">
                        Flash Deal aktiv deyil. Yuxarıdakı açarı aktiv edin.
                      </p>
                    )}
                  </div>
                )}

                {/* ── SAVE ── */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2
                    bg-emerald-700 hover:bg-emerald-800 text-white
                    font-black text-sm py-3 rounded-xl transition-colors
                    disabled:opacity-60 shadow-lg shadow-emerald-700/20"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <><Save className="h-4 w-4" /><span>Saxla</span></>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function AdminFreshTodayPage() {
  const hasHydrated  = useHasHydrated();
  const products     = useApp((s) => s.products);
  const updateProduct = useApp((s) => s.updateProduct);

  const [filter, setFilter]   = useState<"all" | "fresh" | "upcoming">("all");
  const [searchQ, setSearchQ] = useState("");
  const [sortBy, setSortBy]   = useState<SortKey>("default");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showSortMenu, setShowSortMenu] = useState(false);
  const sortRef = useRef<HTMLDivElement>(null);

  /* Close sort menu on outside click */
  useEffect(() => {
    const fn = (e: MouseEvent) => {
      if (sortRef.current && !sortRef.current.contains(e.target as Node))
        setShowSortMenu(false);
    };
    document.addEventListener("mousedown", fn);
    return () => document.removeEventListener("mousedown", fn);
  }, []);

  /* Derive fresh state */
  const getState = useCallback((p: Product): FreshState => {
    if (p.isNewArrival || p.statusTags?.includes("newArrival")) return "fresh";
    if (p.statusTags?.includes("upcoming")) return "upcoming";
    return "none";
  }, []);

  const managedProducts = useMemo<ManagedProduct[]>(() => {
    if (!products) return [];
    return products
      .filter((p) => !p.archived)
      .map((p) => ({ ...p, freshState: getState(p) }));
  }, [products, getState]);

  const freshList    = managedProducts.filter((p) => p.freshState === "fresh");
  const upcomingList = managedProducts.filter((p) => p.freshState === "upcoming");

  /* Filtered + sorted list */
  const filteredList = useMemo(() => {
    let list = managedProducts;
    if (filter === "fresh")    list = freshList;
    if (filter === "upcoming") list = upcomingList;
    if (searchQ) {
      const q = searchQ.toLowerCase();
      list = list.filter((p) => p.name.toLowerCase().includes(q));
    }
    /* Sort */
    const sorted = [...list];
    if (sortBy === "stock-asc")
      sorted.sort((a, b) => (a.variants?.[0]?.stock ?? 0) - (b.variants?.[0]?.stock ?? 0));
    else if (sortBy === "stock-desc")
      sorted.sort((a, b) => (b.variants?.[0]?.stock ?? 0) - (a.variants?.[0]?.stock ?? 0));
    else if (sortBy === "name")
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    else if (sortBy === "margin-desc")
      sorted.sort((a, b) => {
        const mA = calcMargin(a.variants?.[0]?.price ?? a.price ?? 0, a.variants?.[0]?.costPrice ?? a.costPrice ?? 0);
        const mB = calcMargin(b.variants?.[0]?.price ?? b.price ?? 0, b.variants?.[0]?.costPrice ?? b.costPrice ?? 0);
        return mB - mA;
      });
    else if (sortBy === "state")
      sorted.sort((a, b) => {
        const order = { fresh: 0, upcoming: 1, none: 2 };
        return order[a.freshState] - order[b.freshState];
      });
    return sorted;
  }, [managedProducts, filter, searchQ, freshList, upcomingList, sortBy]);

  /* Revenue potential for fresh items */
  const revenuePotential = useMemo(() => {
    return freshList.reduce((sum, p) => {
      const price = p.variants?.[0]?.price ?? p.price ?? 0;
      const stock = p.variants?.[0]?.stock ?? 0;
      return sum + price * stock;
    }, 0);
  }, [freshList]);

  const profitPotential = useMemo(() => {
    return freshList.reduce((sum, p) => {
      const price = p.variants?.[0]?.price ?? p.price ?? 0;
      const cost  = p.variants?.[0]?.costPrice ?? p.costPrice ?? 0;
      const stock = p.variants?.[0]?.stock ?? 0;
      return sum + (price - cost) * stock;
    }, 0);
  }, [freshList]);

  const lowStockCount = freshList.filter((p) => {
    const s = p.variants?.[0]?.stock ?? 0;
    return s > 0 && s <= 5;
  }).length;
  const outCount = freshList.filter((p) => (p.variants?.[0]?.stock ?? 0) <= 0).length;

  /* Selection helpers */
  const toggleSelect = (id: string) =>
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const selectAll = () =>
    setSelectedIds(new Set(filteredList.map((p) => p.id)));

  const clearSelect = () => setSelectedIds(new Set());

  /* Bulk actions */
  const bulkMarkFresh = () => {
    managedProducts
      .filter((p) => selectedIds.has(p.id))
      .forEach((p) => {
        const tags = (p.statusTags ?? []).filter(
          (t) => t !== "newArrival" && t !== "upcoming"
        );
        updateProduct({
          ...p,
          isNewArrival: true,
          statusTags: [...tags, "newArrival"] as ProductStatus[],
        });
      });
    clearSelect();
  };

  const bulkMarkUpcoming = () => {
    managedProducts
      .filter((p) => selectedIds.has(p.id))
      .forEach((p) => {
        const tags = (p.statusTags ?? []).filter(
          (t) => t !== "newArrival" && t !== "upcoming"
        );
        updateProduct({
          ...p,
          isNewArrival: false,
          statusTags: [...tags, "upcoming"] as ProductStatus[],
        });
      });
    clearSelect();
  };

  const bulkClearState = () => {
    managedProducts
      .filter((p) => selectedIds.has(p.id))
      .forEach((p) => {
        const tags = (p.statusTags ?? []).filter(
          (t) => t !== "newArrival" && t !== "upcoming"
        );
        updateProduct({
          ...p,
          isNewArrival: false,
          statusTags: tags as ProductStatus[],
        });
      });
    clearSelect();
  };

  /* Toggle helpers */
  const handleToggleFresh = useCallback((id: string) => {
    const p = managedProducts.find((x) => x.id === id);
    if (!p) return;
    const tags = (p.statusTags ?? []).filter((t) => t !== "newArrival" && t !== "upcoming");
    const newFresh = p.freshState !== "fresh";
    updateProduct({
      ...p,
      isNewArrival: newFresh,
      statusTags: [...tags, ...(newFresh ? ["newArrival"] : [])] as ProductStatus[],
    });
  }, [managedProducts, updateProduct]);

  const handleToggleUpcoming = useCallback((id: string) => {
    const p = managedProducts.find((x) => x.id === id);
    if (!p) return;
    const tags = (p.statusTags ?? []).filter((t) => t !== "newArrival" && t !== "upcoming");
    const newUpcoming = p.freshState !== "upcoming";
    updateProduct({
      ...p,
      isNewArrival: false,
      statusTags: [...tags, ...(newUpcoming ? ["upcoming"] : [])] as ProductStatus[],
    });
  }, [managedProducts, updateProduct]);

  const handleMarkArrived = useCallback((id: string) => {
    const p = managedProducts.find((x) => x.id === id);
    if (!p) return;
    const tags = (p.statusTags ?? []).filter((t) => t !== "newArrival" && t !== "upcoming");
    updateProduct({
      ...p,
      isNewArrival: true,
      statusTags: [...tags, "newArrival"] as ProductStatus[],
    });
  }, [managedProducts, updateProduct]);

  const handleUpdate = useCallback((id: string, partial: Partial<ManagedProduct>) => {
    const p = managedProducts.find((x) => x.id === id);
    if (!p) return;
    updateProduct({ ...p, ...partial });
  }, [managedProducts, updateProduct]);

  /* Loading */
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex gap-2">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  const sortLabels: Record<SortKey, string> = {
    default:     "Standart",
    "stock-asc": "Stok ↑ Az → Çox",
    "stock-desc":"Stok ↓ Çox → Az",
    "margin-desc":"Marja ↓ Yüksək",
    name:        "Ad A→Z",
    state:       "Vəziyyət",
  };

  return (
    <div className="min-h-screen bg-slate-50 pb-24">

      {/* ══ HEADER ══ */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100
        shadow-[0_1px_12px_rgba(0,0,0,0.05)]">

        {/* Title row */}
        <div className="flex items-center gap-3 px-4 pt-4 pb-2">
          <div className="w-10 h-10 rounded-2xl bg-emerald-700
            flex items-center justify-center shrink-0 shadow-lg shadow-emerald-700/20">
            <Leaf className="h-5 w-5 text-yellow-300" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-emerald-900 text-base leading-tight">
              Bu Gün Gələnlər
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {freshList.length} aktiv · {upcomingList.length} gözlənilir
            </p>
          </div>
          {/* Sort button */}
          <div ref={sortRef} className="relative">
            <button
              onClick={() => setShowSortMenu((v) => !v)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold
                border transition-all ${
                sortBy !== "default"
                  ? "bg-emerald-700 text-white border-emerald-700"
                  : "bg-slate-50 text-slate-500 border-slate-200 hover:bg-slate-100"
              }`}
            >
              <SortAsc className="w-3.5 h-3.5" />
              {sortBy !== "default" ? sortLabels[sortBy].split(" ")[0] : "Sort"}
            </button>
            <AnimatePresence>
              {showSortMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.97 }}
                  className="absolute right-0 top-full mt-1.5 w-48
                    bg-white rounded-2xl shadow-xl border border-slate-100
                    overflow-hidden z-50"
                >
                  {(Object.keys(sortLabels) as SortKey[]).map((k) => (
                    <button
                      key={k}
                      onClick={() => { setSortBy(k); setShowSortMenu(false); }}
                      className={`w-full text-left px-3.5 py-2.5 text-xs font-bold
                        transition-colors flex items-center justify-between ${
                        sortBy === k
                          ? "bg-emerald-50 text-emerald-700"
                          : "text-slate-600 hover:bg-slate-50"
                      }`}
                    >
                      {sortLabels[k]}
                      {sortBy === k && <Check className="w-3.5 h-3.5" />}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-4 gap-1.5 px-4 pb-3">
        <div className="rounded-2xl p-2.5 bg-blue-50 border border-blue-100">
  <ShoppingBag className="w-3.5 h-3.5 text-blue-600 mb-1" />
  <p className="text-xl font-black text-blue-700 leading-none">
    {formatCurrency(revenuePotential)}
  </p>
  <p className="text-[9px] font-bold text-blue-500 mt-0.5">Ümumi gəlir</p>
</div>
          {/* Active */}
          <div className="rounded-2xl p-2.5 bg-emerald-50 border border-emerald-100">
            <Leaf className="w-3.5 h-3.5 text-emerald-600 mb-1" />
            <p className="text-xl font-black text-emerald-700 leading-none">
              {freshList.length}
            </p>
            <p className="text-[9px] font-bold text-emerald-500 mt-0.5">Aktiv</p>
          </div>
          {/* Upcoming */}
          <div className="rounded-2xl p-2.5 bg-amber-50 border border-amber-100">
            <Clock className="w-3.5 h-3.5 text-amber-500 mb-1" />
            <p className="text-xl font-black text-amber-700 leading-none">
              {upcomingList.length}
            </p>
            <p className="text-[9px] font-bold text-amber-500 mt-0.5">Gəlir</p>
          </div>
          {/* Tükənən */}
          <div className={`rounded-2xl p-2.5 border ${
            lowStockCount + outCount > 0
              ? "bg-red-50 border-red-100"
              : "bg-slate-50 border-slate-100"
          }`}>
            <AlertCircle className={`w-3.5 h-3.5 mb-1 ${
              lowStockCount + outCount > 0 ? "text-red-500" : "text-slate-400"
            }`} />
            <p className={`text-xl font-black leading-none ${
              lowStockCount + outCount > 0 ? "text-red-700" : "text-slate-500"
            }`}>
              {lowStockCount + outCount}
            </p>
            <p className={`text-[9px] font-bold mt-0.5 ${
              lowStockCount + outCount > 0 ? "text-red-400" : "text-slate-400"
            }`}>Tükənən</p>
          </div>
          {/* Profit */}
          <div className="rounded-2xl p-2.5 bg-yellow-50 border border-yellow-100">
            <TrendingUp className="w-3.5 h-3.5 text-amber-600 mb-1" />
            <p className="text-[13px] font-black text-amber-700 leading-none">
              {formatCurrency(profitPotential)}
            </p>
            <p className="text-[9px] font-bold text-amber-500 mt-0.5">Potensial</p>
          </div>
        </div>

        {/* Filter tabs + Search */}
        <div className="flex flex-col gap-2 px-4 pb-3">
          <div className="flex gap-1.5">
            {(["all", "fresh", "upcoming"] as const).map((tab) => {
              const count =
                tab === "fresh" ? freshList.length
                : tab === "upcoming" ? upcomingList.length
                : managedProducts.length;
              const active = filter === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setFilter(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-xl
                    text-xs font-black transition-all ${
                    active
                      ? "bg-emerald-700 text-white shadow-sm"
                      : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
                >
                  {tab === "all"
                    ? "Hamısı"
                    : tab === "fresh"
                    ? <><Leaf className="h-3 w-3" />Bu Gün</>
                    : <><Clock className="h-3 w-3" />Gələcək</>}
                  <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                    active ? "bg-white/20 text-white" : "bg-white text-slate-600"
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Məhsul axtar..."
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-slate-100 text-sm
                outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200
                border border-transparent focus:border-emerald-300 transition-all"
            />
            {searchQ && (
              <button
                onClick={() => setSearchQ("")}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-3.5 h-3.5 text-slate-400 hover:text-slate-700" />
              </button>
            )}
          </div>

          {/* Select all row */}
          <div className="flex items-center justify-between">
            <button
              onClick={selectedIds.size === filteredList.length ? clearSelect : selectAll}
              className="flex items-center gap-1.5 text-xs font-bold text-slate-500
                hover:text-emerald-700 transition-colors"
            >
              {selectedIds.size === filteredList.length && filteredList.length > 0
                ? <><CheckSquare className="w-3.5 h-3.5" /> Seçimi ləğv et</>
                : <><Square className="w-3.5 h-3.5" /> Hamısını seç</>}
            </button>
            <span className="text-[11px] text-slate-400 font-medium">
              {filteredList.length} məhsul
              {selectedIds.size > 0 && ` · ${selectedIds.size} seçilib`}
            </span>
          </div>
        </div>
      </div>

      {/* ══ BULK ACTION BAR ══ */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div
            initial={{ y: 80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 80, opacity: 0 }}
            className="fixed bottom-4 left-4 right-4 z-50
              bg-emerald-900 rounded-2xl px-4 py-3 shadow-2xl
              flex items-center gap-2 flex-wrap"
          >
            <span className="text-yellow-300 text-xs font-black shrink-0">
              {selectedIds.size} seçilib
            </span>
            <div className="flex gap-1.5 flex-wrap flex-1">
              <button
                onClick={bulkMarkFresh}
                className="flex items-center gap-1 bg-emerald-600 text-white
                  text-xs font-black rounded-xl px-3 py-2
                  hover:bg-emerald-500 transition-colors"
              >
                <Leaf className="w-3 h-3" /> Bu Gün et
              </button>
              <button
                onClick={bulkMarkUpcoming}
                className="flex items-center gap-1 bg-amber-500 text-white
                  text-xs font-black rounded-xl px-3 py-2
                  hover:bg-amber-400 transition-colors"
              >
                <Clock className="w-3 h-3" /> Gəlir et
              </button>
              <button
                onClick={bulkClearState}
                className="flex items-center gap-1 bg-white/10 text-white
                  text-xs font-bold rounded-xl px-3 py-2
                  hover:bg-white/20 transition-colors"
              >
                <X className="w-3 h-3" /> Sil
              </button>
            </div>
            <button onClick={clearSelect} className="text-white/50 hover:text-white">
              <X className="w-4 h-4" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ══ PRODUCT LIST ══ */}
      <div className="p-4 space-y-2">
        <AnimatePresence mode="popLayout">
          {filteredList.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm
                flex items-center justify-center text-4xl mx-auto mb-4">
                {filter === "fresh" ? "🌿" : filter === "upcoming" ? "⏰" : "📭"}
              </div>
              <p className="font-black text-slate-700 text-sm">
                {filter === "fresh" ? "Aktiv məhsul yoxdur"
                : filter === "upcoming" ? "Gözlənilən məhsul yoxdur"
                : "Nəticə tapılmadı"}
              </p>
              <p className="text-xs text-slate-400 mt-1.5">
                {searchQ
                  ? "Axtarış parametrlərini dəyişdirin"
                  : filter !== "all"
                  ? "Məhsullara Yarpaq düyməsindən vəziyyət təyin edin"
                  : "Heç bir məhsul yoxdur"}
              </p>
            </motion.div>
          ) : (
            filteredList.map((p) => (
              <ProductRow
                key={p.id}
                product={p}
                selected={selectedIds.has(p.id)}
                onSelect={toggleSelect}
                onUpdate={handleUpdate}
                onToggleFresh={handleToggleFresh}
                onToggleUpcoming={handleToggleUpcoming}
                onMarkArrived={handleMarkArrived}
              />
            ))
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}