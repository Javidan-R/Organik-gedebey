// src/components/ui/organisms/ProductGrid.tsx
"use client";

import { Product } from "@/types/products";
import { motion, AnimatePresence } from "framer-motion";
import { RusticProductCard } from "./RusticProductCard";
import { useState, useCallback, useMemo, useDeferredValue, useEffect } from "react";
import {
  Grid,
  List,
  ArrowUpDown,
  Sparkles,
  Flame,
  Coffee,
  MapPin,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import Link from "next/link";

// ─── Types ──────────────────────────────────────────────────────────
export type ProductGridVariant =
  | "default"
  | "discount"
  | "breakfast"
  | "gedebey"
  | "highlight";

type SortKey = "default" | "price-asc" | "price-desc" | "rating" | "name";

// ─── Sort Options ──────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Tövsiyə olunan" },
  { key: "price-asc", label: "↑ Ucuz → Baha" },
  { key: "price-desc", label: "↓ Baha → Ucuz" },
  { key: "rating", label: "⭐ Reytinq" },
  { key: "name", label: "A → Z (ad)" },
];

// ─── Variant Badges ───────────────────────────────────────────────
const variantBadge: Record<
  ProductGridVariant,
  { icon: React.ElementType; label: string; classes: string } | null
> = {
  default: null,
  discount: {
    icon: Flame,
    label: "Endirim",
    classes: "bg-red-100 text-red-700 border-red-200",
  },
  breakfast: {
    icon: Coffee,
    label: "Səhər",
    classes: "bg-amber-100 text-amber-700 border-amber-200",
  },
  gedebey: {
    icon: MapPin,
    label: "Gədəbəy",
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
  },
  highlight: {
    icon: Sparkles,
    label: "Önə çıxan",
    classes: "bg-purple-100 text-purple-700 border-purple-200",
  },
};

// ─── Sort Function ──────────────────────────────────────────────────
function sortProducts(products: Product[], sort: SortKey): Product[] {
  const arr = [...products];
  switch (sort) {
    case "price-asc":
      return arr.sort(
        (a, b) =>
          (a.variants?.[0]?.price ?? a.price ?? 0) -
          (b.variants?.[0]?.price ?? b.price ?? 0)
      );
    case "price-desc":
      return arr.sort(
        (a, b) =>
          (b.variants?.[0]?.price ?? b.price ?? 0) -
          (a.variants?.[0]?.price ?? a.price ?? 0)
      );
    case "rating": {
      const getRating = (p: Product) =>
        p.reviews?.length
          ? p.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / p.reviews.length
          : 0;
      return arr.sort((a, b) => getRating(b) - getRating(a));
    }
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name, "az"));
    default:
      return arr;
  }
}

// ─── Animation Variants ────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 120, damping: 16 },
  },
};

// ─── Main Component ──────────────────────────────────────────────────
interface ProductGridProps {
  products: Product[];
  currency: string;
  addToCart: (id: string, variantId?: string, qty?: number) => void;
  variant?: ProductGridVariant;
  showControls?: boolean;
  compareList?: string[];
  onWishlistToggle?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
  initialViewMode?: "grid" | "list";
  initialSort?: SortKey;
  itemsPerPage?: number;
  className?: string;
}

export function ProductGrid({
  products,
  currency,
  addToCart,
  variant = "default",
  showControls = true,
  compareList = [],
  onWishlistToggle,
  onCompareToggle,
  initialViewMode = "grid",
  initialSort = "default",
  itemsPerPage = 8,
  className = "",
}: ProductGridProps) {
  // ── State ──────────────────────────────────────────────────────────
  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [sortOpen, setSortOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(itemsPerPage);

  // ── Deferred values for performance ─────────────────────────────
  const deferredSortKey = useDeferredValue(sortKey);
  const deferredViewMode = useDeferredValue(viewMode);

  // ── Sort & Paginate ──────────────────────────────────────────────
  const sorted = useMemo(
    () => sortProducts(products, deferredSortKey),
    [products, deferredSortKey]
  );

  const visible = useMemo(
    () => sorted.slice(0, visibleCount),
    [sorted, visibleCount]
  );

  const hasMore = visibleCount < sorted.length;

  // ── Handlers ──────────────────────────────────────────────────────
  const handleLoadMore = useCallback(() => {
    setVisibleCount((prev) => prev + itemsPerPage);
  }, [itemsPerPage]);

  const handleReset = useCallback(() => {
    setVisibleCount(itemsPerPage);
  }, [itemsPerPage]);

  // ── Reset pagination when sort changes ──────────────────────────
  useEffect(() => {
    setVisibleCount(itemsPerPage);
  }, [sortKey, itemsPerPage]);

  // ── Empty State ──────────────────────────────────────────────────
  if (!products.length) {
    const emptyMessages: Record<ProductGridVariant, string> = {
      default: "Bu bölmədə hələ məhsul yoxdur.",
      discount: "Hazırda endirimli məhsul yoxdur.",
      breakfast: "Səhər üçün xüsusi məhsul tapılmadı.",
      gedebey: "Gədəbəydən gələn məhsullar tezliklə əlavə olunacaq.",
      highlight: "Önə çıxan məhsul yoxdur.",
    };
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-lime-300 bg-white/70 px-6 py-16 text-center"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-5xl"
        >
          🍃
        </motion.span>
        <p className="font-black text-slate-700">
          {emptyMessages[variant] || emptyMessages.default}
        </p>
        <p className="text-xs text-slate-500 max-w-xs">
          Tezliklə bura yeni kənd məhsulları əlavə olunacaq. Bildiriş almaq üçün
          qeydiyyatdan keç!
        </p>
        <Button variant="primary" asChild className="mt-2">
          <Link href="/products">Bütün məhsullara bax →</Link>
        </Button>
      </motion.div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Controls bar */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3"
        >
          <p className="text-xs text-slate-500 font-semibold">
            {sorted.length} məhsul tapıldı
          </p>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setSortOpen((prev) => !prev)}
                className="flex items-center gap-2 rounded-xl border-slate-200 text-xs font-semibold shadow-sm hover:border-emerald-300 transition-colors"
                aria-expanded={sortOpen}
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "Sırala"}
                <ChevronDown
                  className={`w-3.5 h-3.5 transition-transform ${
                    sortOpen ? "rotate-180" : ""
                  }`}
                />
              </Button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  >
                    {SORT_OPTIONS.map((opt) => (
                      <button
                        key={opt.key}
                        onClick={() => {
                          setSortKey(opt.key);
                          setSortOpen(false);
                        }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                          sortKey === opt.key
                            ? "bg-emerald-50 text-emerald-700"
                            : "text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {([
                { mode: "grid" as const, icon: Grid },
                { mode: "list" as const, icon: List },
              ]).map(({ mode, icon: Icon }) => (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 transition-colors ${
                    viewMode === mode
                      ? "bg-emerald-600 text-white"
                      : "text-slate-500 hover:bg-slate-50"
                  }`}
                  aria-pressed={viewMode === mode}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Product grid / list */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${deferredViewMode}-${deferredSortKey}`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={
            deferredViewMode === "grid"
              ? "grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
              : "flex flex-col gap-3"
          }
        >
          {visible.map((product) => {
            const badge = variantBadge[variant];
            return (
              <motion.div
                key={product.id}
                variants={itemVariants}
                className="relative group"
              >
                {/* Variant badge */}
                {badge && (
                  <div
                    className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm ${badge.classes}`}
                  >
                    <badge.icon className="w-3 h-3" />
                    <span>{badge.label}</span>
                  </div>
                )}

                {/* Highlight glow */}
                {variant === "highlight" && (
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 rounded-2xl opacity-30 blur-md group-hover:opacity-60 transition-opacity -z-10" />
                )}

                <RusticProductCard
                  product={product}
                  currency={currency}
                  addToCart={addToCart}
                  isInCompare={compareList.includes(product.id)}
                  onWishlistToggle={onWishlistToggle}
                  onCompareToggle={onCompareToggle}
                />
              </motion.div>
            );
          })}
        </motion.div>
      </AnimatePresence>

      {/* Load more / Reset */}
      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center pt-2"
          >
            <Button
              variant="secondary"
              size="lg"
              onClick={handleLoadMore}
              className="flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Daha çox göstər ({sorted.length - visibleCount} qalıb)
            </Button>
          </motion.div>
        )}
        {!hasMore && visibleCount > itemsPerPage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center pt-2"
          >
            <Button
              variant="ghost"
              size="sm"
              onClick={handleReset}
              className="text-slate-400 hover:text-emerald-600 text-xs"
            >
              <ChevronUp className="w-3.5 h-3.5 mr-1" />
              Başlanğıca qayıt
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}