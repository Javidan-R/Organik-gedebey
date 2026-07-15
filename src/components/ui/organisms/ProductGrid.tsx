// src/components/ui/organisms/ProductGrid.tsx
"use client";

import {
  useState,
  useCallback,
  useMemo,
  useEffect,
  useRef,
  memo,
  useTransition,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Product } from "@/types/products";
import { motion, AnimatePresence } from "framer-motion";
import { RusticProductCard } from "./RusticProductCard";
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
  Search,
  SlidersHorizontal,
  X,
  Banknote,
  PackageOpen,
  Percent,
} from "lucide-react";
import { Button } from "@/components/atoms/button";
import Link from "next/link";

// ─── Types ────────────────────────────────────────────────────────
export type ProductGridVariant =
  | "default"
  | "discount"
  | "breakfast"
  | "gedebey"
  | "highlight";

type SortKey = "default" | "price-asc" | "price-desc" | "rating" | "name";

interface ProductGridProps {
  products: Product[];
  currency: string;
  addToCart: (id: string, variantId?: string, qty?: number) => void;
  variant?: ProductGridVariant;
  showControls?: boolean;
  initialViewMode?: "grid" | "list";
  initialSort?: SortKey;
  itemsPerPage?: number;
  className?: string;
  enableUrlSync?: boolean;
}

// ─── Constants ────────────────────────────────────────────────────
const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: "default", label: "Tövsiyə olunan" },
  { key: "price-asc", label: "↑ Ucuz → Baha" },
  { key: "price-desc", label: "↓ Baha → Ucuz" },
  { key: "rating", label: "⭐ Reytinq" },
  { key: "name", label: "A → Z (ad)" },
];

const VARIANT_BADGE: Record<
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

const EMPTY_MESSAGES: Record<ProductGridVariant, string> = {
  default: "Bu bölmədə hələ məhsul yoxdur.",
  discount: "Hazırda endirimli məhsul yoxdur.",
  breakfast: "Səhər üçün xüsusi məhsul tapılmadı.",
  gedebey: "Gədəbəydən gələn məhsullar tezliklə əlavə olunacaq.",
  highlight: "Önə çıxan məhsul yoxdur.",
};

// ─── Pure sort function ──────────────────────────────────────────
function sortProducts(products: Product[], sort: SortKey): Product[] {
  if (sort === "default") return products;
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
          ? p.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) /
            p.reviews.length
          : 0;
      return arr.sort((a, b) => getRating(b) - getRating(a));
    }
    case "name":
      return arr.sort((a, b) => a.name.localeCompare(b.name, "az"));
    default:
      return arr;
  }
}

// ─── usePagination hook ──────────────────────────────────────────
function usePagination(
  totalItems: number,
  itemsPerPage: number,
  currentPage: number,
  onPageChange: (page: number) => void
) {
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const safePage = Math.min(currentPage, totalPages);

  const pages = useMemo(() => {
    const delta = 2;
    const range: (number | "...")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (
        i === 1 ||
        i === totalPages ||
        (i >= safePage - delta && i <= safePage + delta)
      ) {
        range.push(i);
      } else if (range[range.length - 1] !== "...") {
        range.push("...");
      }
    }
    return range;
  }, [totalPages, safePage]);

  return { totalPages, safePage, pages };
}

// ─── Filter types & hook ─────────────────────────────────────────
interface Filters {
  search: string;
  minPrice: string;
  maxPrice: string;
  inStock: boolean;
  onDiscount: boolean;
}

function useProductFilters(products: Product[], filters: Filters): Product[] {
  return useMemo(() => {
    let filtered = products;
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.description?.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (filters.minPrice) {
      const min = parseFloat(filters.minPrice);
      if (!isNaN(min))
        filtered = filtered.filter(
          (p) => (p.variants?.[0]?.price ?? p.price ?? 0) >= min
        );
    }
    if (filters.maxPrice) {
      const max = parseFloat(filters.maxPrice);
      if (!isNaN(max))
        filtered = filtered.filter(
          (p) => (p.variants?.[0]?.price ?? p.price ?? 0) <= max
        );
    }
    if (filters.inStock) {
      filtered = filtered.filter((p) => {
        const stock =
          p.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? 0;
        return stock > 0;
      });
    }
    if (filters.onDiscount) {
      filtered = filtered.filter((p) => {
        const now = new Date();
        return (
          p.discountType &&
          p.discountValue &&
          (!p.discountStart || new Date(p.discountStart) <= now) &&
          (!p.discountEnd || new Date(p.discountEnd) >= now)
        );
      });
    }
    return filtered;
  }, [products, filters]);
}

// ─── SkeletonCard ─────────────────────────────────────────────────
const SkeletonCard = memo(function SkeletonCard() {
  return (
    <div className="animate-pulse rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
      <div className="aspect-[4/3] w-full rounded-xl bg-slate-200" />
      <div className="mt-3 h-4 w-3/4 rounded bg-slate-200" />
      <div className="mt-2 h-3 w-1/2 rounded bg-slate-200" />
      <div className="mt-4 h-8 w-full rounded-xl bg-slate-200" />
    </div>
  );
});

// ─── useIntersection hook ─────────────────────────────────────────
function useIntersection(
  ref: React.RefObject<Element | null>,
  onIntersect: () => void,
  enabled: boolean
) {
  useEffect(() => {
    if (!enabled || !ref.current) return;
    const el = ref.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) onIntersect();
      },
      { rootMargin: "200px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [ref, onIntersect, enabled]);
}

// ─── CardWrapper ──────────────────────────────────────────────────
const CardWrapper = memo(function CardWrapper({
  product,
  currency,
  addToCart,
  variant,
  index,
  viewMode,
}: {
  product: Product;
  currency: string;
  addToCart: (id: string, variantId?: string, qty?: number) => void;
  variant: ProductGridVariant;
  index: number;
  viewMode: "grid" | "list";
}) {
  const badge = VARIANT_BADGE[variant];
  return (
    <motion.div
      initial={index < 12 ? { opacity: 0, y: 12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={
        index < 12
          ? { duration: 0.25, delay: Math.min(index * 0.04, 0.4) }
          : undefined
      }
      className="relative group"
    >
      {badge && (
        <div
          className={`absolute top-2 left-2 z-10 flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border shadow-sm pointer-events-none ${badge.classes}`}
        >
          <badge.icon className="w-3 h-3" />
          <span>{badge.label}</span>
        </div>
      )}
      {variant === "highlight" && (
        <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-400 via-pink-300 to-amber-300 rounded-2xl opacity-20 blur-md group-hover:opacity-50 transition-opacity -z-10" />
      )}
      <RusticProductCard
        product={product}
        currency={currency}
        addToCart={addToCart}
        layout={viewMode}
      />
    </motion.div>
  );
});

// ─── ControlsBar ──────────────────────────────────────────────────
const ControlsBar = memo(function ControlsBar({
  total,
  sortKey,
  onSort,
  viewMode,
  onView,
  onToggleFilters,
  isFiltersOpen,
}: {
  total: number;
  sortKey: SortKey;
  onSort: (k: SortKey) => void;
  viewMode: "grid" | "list";
  onView: (m: "grid" | "list") => void;
  onToggleFilters: () => void;
  isFiltersOpen: boolean;
}) {
  const [sortOpen, setSortOpen] = useState(false);

  return (
    <div className="flex flex-wrap items-center justify-between gap-3">
      <p className="text-xs text-slate-500 font-semibold">
        {total} məhsul tapıldı
      </p>
      <div className="flex items-center gap-2">
        <button
          onClick={onToggleFilters}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold shadow-sm transition-colors ${
            isFiltersOpen
              ? "border-emerald-500 bg-emerald-50 text-emerald-700"
              : "border-slate-200 bg-white hover:border-emerald-300"
          }`}
        >
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Filter</span>
        </button>
        <div className="relative">
          <button
            onClick={() => setSortOpen((p) => !p)}
            className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold shadow-sm hover:border-emerald-300 transition-colors"
            aria-expanded={sortOpen}
            aria-haspopup="listbox"
          >
            <ArrowUpDown className="w-3.5 h-3.5" />
            {SORT_OPTIONS.find((s) => s.key === sortKey)?.label ?? "Sırala"}
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                sortOpen ? "rotate-180" : ""
              }`}
            />
          </button>
          <AnimatePresence>
            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setSortOpen(false)}
                />
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.97 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 6, scale: 0.97 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  role="listbox"
                >
                  {SORT_OPTIONS.map((opt) => (
                    <button
                      key={opt.key}
                      role="option"
                      aria-selected={sortKey === opt.key}
                      onClick={() => {
                        onSort(opt.key);
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
              </>
            )}
          </AnimatePresence>
        </div>
        <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
          {(
            [
              { mode: "grid" as const, icon: Grid },
              { mode: "list" as const, icon: List },
            ] as const
          ).map(({ mode, icon: Icon }) => (
            <button
              key={mode}
              onClick={() => onView(mode)}
              aria-pressed={viewMode === mode}
              className={`p-2 transition-colors ${
                viewMode === mode
                  ? "bg-emerald-600 text-white"
                  : "text-slate-500 hover:bg-slate-50"
              }`}
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
});

// ─── FilterPanel (strukturlaşdırılmış) ────────────────────────────
const FilterPanel = memo(function FilterPanel({
  isOpen,
  onClose,
  filters,
  setFilters,
  clearFilters,
  totalFiltered,
}: {
  isOpen: boolean;
  onClose: () => void;
  filters: Filters;
  setFilters: (f: Filters) => void;
  clearFilters: () => void;
  totalFiltered: number;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm sm:hidden"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.97 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="relative z-50 w-full max-w-3xl mx-auto mt-2 sm:mt-0 sm:rounded-2xl sm:border sm:border-slate-200 bg-white shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-5">
              <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-emerald-600" />
                Filtrlər
              </h3>
              <button
                onClick={onClose}
                className="h-8 w-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Search className="w-3.5 h-3.5" /> Axtar
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="Məhsul adı..."
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-600 flex items-center gap-1.5 mb-1.5">
                  <Banknote className="w-3.5 h-3.5" /> Qiymət (₼)
                </label>
                <div className="flex gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={filters.minPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, minPrice: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 outline-none"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={filters.maxPrice}
                    onChange={(e) =>
                      setFilters({ ...filters, maxPrice: e.target.value })
                    }
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-xs focus:border-emerald-500 outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <PackageOpen className="w-3.5 h-3.5" /> Ancaq stokda olanlar
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFilters({ ...filters, inStock: !filters.inStock });
                    }}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      filters.inStock ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow"
                      animate={{ x: filters.inStock ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </label>
              </div>
              <div>
                <label className="flex items-center justify-between gap-2 cursor-pointer">
                  <span className="text-xs font-semibold text-slate-600 flex items-center gap-1.5">
                    <Percent className="w-3.5 h-3.5" /> Ancaq endirimdə olanlar
                  </span>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      setFilters({ ...filters, onDiscount: !filters.onDiscount });
                    }}
                    className={`relative h-5 w-9 rounded-full transition-colors ${
                      filters.onDiscount ? "bg-emerald-500" : "bg-slate-300"
                    }`}
                  >
                    <motion.div
                      className="absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow"
                      animate={{ x: filters.onDiscount ? 16 : 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  </button>
                </label>
              </div>
            </div>
            <div className="flex items-center justify-between mt-6 pt-4 border-t border-slate-200">
              <button
                onClick={clearFilters}
                className="text-xs font-semibold text-rose-600 hover:underline"
              >
                Bütün filtrləri sıfırla
              </button>
              <span className="text-xs text-slate-500 font-medium">
                {totalFiltered} nəticə
              </span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

// ─── SEO Structured Data ──────────────────────────────────────────
function ProductListStructuredData({ products }: { products: Product[] }) {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    itemListElement: products.slice(0, 20).map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: p.name,
        url: `https://gedebey.az/products/${p.slug}`,
        image: p.images?.[0]?.url ?? "",
        offers: {
          "@type": "Offer",
          price: p.variants?.[0]?.price ?? p.price,
          priceCurrency: "AZN",
          availability:
            (p.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? 0) > 0
              ? "https://schema.org/InStock"
              : "https://schema.org/OutOfStock",
        },
      },
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
  );
}

// ─── Main ProductGrid ─────────────────────────────────────────────
export function ProductGrid({
  products,
  currency,
  addToCart,
  variant = "default",
  showControls = true,
  initialViewMode = "grid",
  initialSort = "default",
  itemsPerPage = 12,
  className = "",
  enableUrlSync = false,
}: ProductGridProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  const initialFilters: Filters = useMemo(() => {
    if (!enableUrlSync)
      return { search: "", minPrice: "", maxPrice: "", inStock: false, onDiscount: false };
    return {
      search: searchParams.get("q") ?? "",
      minPrice: searchParams.get("minPrice") ?? "",
      maxPrice: searchParams.get("maxPrice") ?? "",
      inStock: searchParams.get("inStock") === "1",
      onDiscount: searchParams.get("onDiscount") === "1",
    };
  }, [enableUrlSync, searchParams]);

  const [viewMode, setViewMode] = useState<"grid" | "list">(initialViewMode);
  const [sortKey, setSortKey] = useState<SortKey>(initialSort);
  const [currentPage, setCurrentPage] = useState(1);
  const [filters, setFilters] = useState<Filters>(initialFilters);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const sentinelRef = useRef<HTMLDivElement>(null);

  const filtered = useProductFilters(products, filters);
  const sorted = useMemo(
    () => sortProducts(filtered, sortKey),
    [filtered, sortKey]
  );
  const { totalPages, safePage, pages } = usePagination(
    sorted.length,
    itemsPerPage,
    currentPage,
    setCurrentPage
  );

  useEffect(() => {
    if (safePage !== currentPage) setCurrentPage(safePage);
  }, [safePage, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters, sortKey]);

  const visible = useMemo(() => {
    const start = (safePage - 1) * itemsPerPage;
    return sorted.slice(start, start + itemsPerPage);
  }, [sorted, safePage, itemsPerPage]);

  // URL sync
  useEffect(() => {
    if (!enableUrlSync) return;
    const params = new URLSearchParams();
    if (filters.search) params.set("q", filters.search);
    if (filters.minPrice) params.set("minPrice", filters.minPrice);
    if (filters.maxPrice) params.set("maxPrice", filters.maxPrice);
    if (filters.inStock) params.set("inStock", "1");
    if (filters.onDiscount) params.set("onDiscount", "1");
    if (sortKey !== "default") params.set("sort", sortKey);
    if (currentPage > 1) params.set("page", String(currentPage));
    const newUrl = params.toString()
      ? `?${params.toString()}`
      : window.location.pathname;
    router.replace(newUrl, { scroll: false });
  }, [filters, sortKey, currentPage, enableUrlSync, router]);

  const handleSort = useCallback(
    (key: SortKey) => startTransition(() => setSortKey(key)),
    []
  );
  const handleView = useCallback(
    (mode: "grid" | "list") => startTransition(() => setViewMode(mode)),
    []
  );
  const clearFilters = useCallback(
    () =>
      startTransition(() =>
        setFilters({
          search: "",
          minPrice: "",
          maxPrice: "",
          inStock: false,
          onDiscount: false,
        })
      ),
    []
  );
  const handleLoadMore = useCallback(() => {
    if (currentPage < totalPages)
      startTransition(() => setCurrentPage((p) => p + 1));
  }, [currentPage, totalPages]);

  useIntersection(
    sentinelRef,
    handleLoadMore,
    currentPage < totalPages && !isPending
  );

  if (products.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-lime-300 bg-white/70 px-6 py-16 text-center"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-5xl"
          aria-hidden
        >
          🍃
        </motion.span>
        <p className="font-black text-slate-700">
          {EMPTY_MESSAGES[variant] ?? EMPTY_MESSAGES.default}
        </p>
        <p className="text-xs text-slate-500 max-w-xs">
          Tezliklə bura yeni kənd məhsulları əlavə olunacaq.
        </p>
        <Button variant="primary" asChild className="mt-2">
          <Link href="/products">Bütün məhsullara bax →</Link>
        </Button>
      </motion.div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <ProductListStructuredData products={visible} />

      {showControls && (
        <ControlsBar
          total={sorted.length}
          sortKey={sortKey}
          onSort={handleSort}
          viewMode={viewMode}
          onView={handleView}
          onToggleFilters={() => setIsFiltersOpen((p) => !p)}
          isFiltersOpen={isFiltersOpen}
        />
      )}

      <FilterPanel
        isOpen={isFiltersOpen}
        onClose={() => setIsFiltersOpen(false)}
        filters={filters}
        setFilters={(f) => startTransition(() => setFilters(f))}
        clearFilters={clearFilters}
        totalFiltered={sorted.length}
      />

      {isPending && (
        <div className="flex items-center gap-2 text-xs text-emerald-600 font-semibold">
          <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
          Yüklənir...
        </div>
      )}

      <div
        key={`${viewMode}-${sortKey}`}
        className={
          viewMode === "grid"
            ? "grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
            : "flex flex-col gap-3"
        }
      >
        {isPending && visible.length === 0
          ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
          : visible.map((product, index) => (
              <CardWrapper
                key={product.id}
                product={product}
                currency={currency}
                addToCart={addToCart}
                variant={variant}
                index={index}
                viewMode={viewMode}
              />
            ))}
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center pt-6">
          <nav className="flex items-center gap-1.5">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              ‹
            </button>
            {pages.map((page, i) =>
              page === "..." ? (
                <span key={`ellipsis-${i}`} className="px-1 text-slate-400">
                  ...
                </span>
              ) : (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page as number)}
                  className={`h-8 w-8 rounded-xl text-xs font-bold transition-all ${
                    currentPage === page
                      ? "bg-emerald-600 text-white shadow-md"
                      : "border border-slate-200 hover:bg-slate-50"
                  }`}
                >
                  {page}
                </button>
              )
            )}
            <button
              onClick={() =>
                setCurrentPage((p) => Math.min(totalPages, p + 1))
              }
              disabled={currentPage === totalPages}
              className="h-8 w-8 rounded-xl border border-slate-200 flex items-center justify-center text-xs font-bold disabled:opacity-40 hover:bg-slate-50 transition-colors"
            >
              ›
            </button>
          </nav>
        </div>
      )}

      {!isPending && currentPage > 1 && (
        <div className="flex justify-center pt-2">
          <button
            onClick={() => setCurrentPage(1)}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-emerald-600 transition-colors"
          >
            <ChevronUp className="w-3.5 h-3.5" />
            Başlanğıca qayıt
          </button>
        </div>
      )}

      {currentPage < totalPages && (
        <div ref={sentinelRef} className="flex justify-center pt-2">
          <Button
            variant="secondary"
            onClick={handleLoadMore}
            disabled={isPending}
            className="flex items-center gap-2 rounded-2xl border-2 border-emerald-200 bg-white text-emerald-700 font-bold hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm disabled:opacity-60"
          >
            {isPending ? (
              <>
                <span className="h-4 w-4 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
                Yüklənir...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Daha çox göstər
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}