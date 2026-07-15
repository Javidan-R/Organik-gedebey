// src/app/(storefront)/products/ProductsPageClient.tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  useEffect,
  useTransition,
  useDeferredValue,
  useRef,
  memo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  BadgePercent,
  X,
  Leaf,
  Filter,
  Sparkles,
  Mountain,
  Package,
  AlertTriangle,
  TrendingUp,
} from "lucide-react";
import { useApp } from "@/lib/store";
import { ProductFilter } from "@/components/admin/products/ProductFilter";
import { ProductGrid } from "@/components/ui/organisms/ProductGrid";
import { Button } from "@/components/atoms/button";
import { Input } from "@/components/atoms/input";
import { Select } from "@/components/atoms/select";
import { FilterState } from "@/utils/useProductFilter";

// ─── Types ────────────────────────────────────────────────────────
export interface FormattedProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  basePrice: number;
  stock: number;
  totalStock: number;
  variants: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    isDefault: boolean;
    unit?: string;
    costPrice?: number;
    arrivalCost?: number;
    minStock?: number;
    grade?: string;
    batchDate?: string;
  }>;
  tags: string[];
  categoryId?: string | null;
  isOrganic: boolean;
  archived: boolean;
  discountType?: string | null;
  discountValue?: number | null;
  discountStart?: string | null;
  discountEnd?: string | null;
  minStock: number;
  images: Array<{ id?: string; url: string; alt: string; displayOrder?: number }>;
  reviews?: Array<{ rating: number; id?: string }>;
  createdAt: string;
  updatedAt?: string;
  description?: string;
  shortDescription?: string;
  originRegion?: string;
  isFeatured?: boolean;
  isNewArrival?: boolean;
  statusTags?: string[];
  benefits?: string[];
  unit?: string;
}

interface CategoryItem {
  id: string;
  name: string;
  slug: string;
  archived: boolean;
}

interface InitialData {
  products: FormattedProduct[];
  categories: CategoryItem[];
}

// ─── StatBox ──────────────────────────────────────────────────────
const StatBox = memo(function StatBox({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "emerald" | "lime" | "rose" | "amber" | "blue" | "slate";
}) {
  const colorMap: Record<typeof color, string> = {
    emerald: "bg-emerald-50/80 text-emerald-800 border-emerald-200",
    lime: "bg-lime-50/80 text-lime-800 border-lime-200",
    rose: "bg-rose-50/80 text-rose-800 border-rose-200",
    amber: "bg-amber-50/80 text-amber-800 border-amber-200",
    blue: "bg-blue-50/80 text-blue-800 border-blue-200",
    slate: "bg-slate-50/80 text-slate-800 border-slate-200",
  };
  return (
    <div
      className={`rounded-2xl px-4 py-3 text-center backdrop-blur-sm border ${colorMap[color]}`}
    >
      <div className="flex items-center justify-center gap-1 text-2xl font-black">
        {icon}
        {value}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
});

// ─── FilterChip ───────────────────────────────────────────────────
const FilterChip = memo(function FilterChip({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition-all ${
        active
          ? "bg-emerald-600 text-white shadow-sm"
          : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
      }`}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
});

// ─── Pure helpers (module scope – re-render-dan azad) ─────────────

function getTotalStock(product: FormattedProduct): number {
  if (typeof product.totalStock === "number" && product.totalStock >= 0) {
    return product.totalStock;
  }
  if (typeof product.stock === "number" && product.stock >= 0) {
    return product.stock;
  }
  if (Array.isArray(product.variants)) {
    return product.variants.reduce((s, v) => s + (Number(v.stock) || 0), 0);
  }
  return 0;
}

function getProductBasePrice(product: FormattedProduct): number {
  if (product.variants && product.variants.length > 0) {
    const def =
      product.variants.find((v) => v.isDefault) || product.variants[0];
    return Number(def?.price) || 0;
  }
  return Number(product.basePrice) || Number(product.price) || 0;
}

/**
 * Stock normallaşdırması.
 * Formatter artıq düzgün qiymət verir, buna görə bu funksiya
 * yalnız ehtiyat olaraq işləyir. Nəticə memoize edilib.
 */
function normalizeStock(product: FormattedProduct): FormattedProduct {
  const stock = getTotalStock(product);
  if (product.stock === stock && product.totalStock === stock) return product;
  return { ...product, stock, totalStock: stock };
}

// ─── Default filter (ref kimi saxlanır, yenidən yaradılmır) ──────
const DEFAULT_FILTERS: FilterState = {
  searchTerm: "",
  categoryId: "",
  showArchived: false,
  stockFilter: "all",
  discountOnly: false,
  minPrice: "",
  maxPrice: "",
  minRating: "",
  sortKey: "newest",
};

// ─── Main Component ───────────────────────────────────────────────
export function ProductsPageClient({
  initialData,
}: {
  initialData?: InitialData;
}) {
  // ── Yalnız cart/price funksiyaları üçün store ─────────────────
  // ƏSAS OPTİMİZASİYA: products/categories store-dan götürülmür.
  // initialData həmişə SSR-dən gəlir → race condition yoxdur.
  // setProducts yalnız bir dəfə, startTransition ilə çağırılır.
  const {
    productPriceNow,
    isDiscountActive,
    addToCart,
    storefrontConfig,
    setProducts,
    setCategories,
  } = useApp();

  const currency = storefrontConfig?.currency || "AZN";

  // ── Transition: filter dəyişiklikləri UI-ı bloklamır ─────────
  const [isPending, startTransition] = useTransition();

  // ── Filter State ──────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>(DEFAULT_FILTERS);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // useDeferredValue: axtarış hər keystroke-da filter-i bloklamır
  const deferredSearch = useDeferredValue(filters.searchTerm);
  const deferredFilters = useDeferredValue(filters);

  // ── Normalize products bir dəfə (initialData dəyişmirsə) ─────
  // Bu useMemo yalnız initialData dəyişdikdə işləyir (praktikada: 1 dəfə)
  const normalizedProducts = useMemo<FormattedProduct[]>(() => {
    if (!initialData?.products) return [];
    return initialData.products.map(normalizeStock);
  }, [initialData?.products]);

  const categoriesList = useMemo<CategoryItem[]>(() => {
    return initialData?.categories ?? [];
  }, [initialData?.categories]);

  // ── Store hydratasiyası: bir dəfə, non-blocking ───────────────
  // startTransition ilə bağlandığı üçün UI-ı bloklamır
  const hydratedRef = useRef(false);
  useEffect(() => {
    if (hydratedRef.current || normalizedProducts.length === 0) return;
    hydratedRef.current = true;
    startTransition(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      setProducts(normalizedProducts as any);
      if (categoriesList.length > 0) {
        setCategories(categoriesList);
      }
    });
  }, [normalizedProducts, categoriesList, setProducts, setCategories]);

  // ── URL sync (deferred, non-blocking) ────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set("q", deferredSearch);
    if (deferredFilters.categoryId) params.set("cat", deferredFilters.categoryId);
    if (deferredFilters.stockFilter !== "all")
      params.set("stock", deferredFilters.stockFilter);
    if (deferredFilters.discountOnly) params.set("sale", "1");
    if (deferredFilters.minPrice) params.set("min", deferredFilters.minPrice);
    if (deferredFilters.maxPrice) params.set("max", deferredFilters.maxPrice);
    if (deferredFilters.minRating) params.set("rating", deferredFilters.minRating);
    if (deferredFilters.sortKey !== "newest")
      params.set("sort", deferredFilters.sortKey);
    const query = params.toString();
    window.history.replaceState(
      null,
      "",
      query ? `?${query}` : window.location.pathname
    );
  }, [deferredSearch, deferredFilters]);

  // ── Filtered products (ağır hesablama deferred filters ilə) ──
  const filteredProducts = useMemo<FormattedProduct[]>(() => {
    if (normalizedProducts.length === 0) return [];

    // 1. Arxivdən çıxar
    let list = normalizedProducts.filter((p) => !p.archived);

    // 2. Search (deferredSearch ilə → keystroke-da UI donmur)
    if (deferredSearch) {
      const term = deferredSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          p.tags.some((t) => t.toLowerCase().includes(term))
      );
    }

    // 3. Category
    if (deferredFilters.categoryId) {
      list = list.filter((p) => p.categoryId === deferredFilters.categoryId);
    }

    // 4. Price range
    const minP = parseFloat(deferredFilters.minPrice);
    const maxP = parseFloat(deferredFilters.maxPrice);
    if (!isNaN(minP) && minP > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list = list.filter((p) => productPriceNow(p as any) >= minP);
    }
    if (!isNaN(maxP) && maxP > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list = list.filter((p) => productPriceNow(p as any) <= maxP);
    }

    // 5. Stock filter
    if (deferredFilters.stockFilter === "in_stock") {
      list = list.filter((p) => p.stock > 0);
    } else if (deferredFilters.stockFilter === "low_stock") {
      list = list.filter((p) => p.stock > 0 && p.stock <= (p.minStock ?? 5));
    } else if (deferredFilters.stockFilter === "out_of_stock") {
      list = list.filter((p) => p.stock <= 0);
    }

    // 6. Discount only
    if (deferredFilters.discountOnly) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      list = list.filter((p) => isDiscountActive(p as any));
    }

    // 7. Min rating
    const minRating = parseFloat(deferredFilters.minRating);
    if (!isNaN(minRating) && minRating > 0) {
      list = list.filter((p) => {
        const reviews = p.reviews ?? [];
        if (reviews.length === 0) return false;
        const avg =
          reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / reviews.length;
        return avg >= minRating;
      });
    }

    // 8. Sort
    const sorted = [...list];
    switch (deferredFilters.sortKey) {
      case "price_asc":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sorted.sort((a, b) => productPriceNow(a as any) - productPriceNow(b as any));
        break;
      case "price_desc":
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        sorted.sort((a, b) => productPriceNow(b as any) - productPriceNow(a as any));
        break;
      case "rating":
        sorted.sort((a, b) => {
          const ra =
            (a.reviews?.length ?? 0) > 0
              ? (a.reviews ?? []).reduce((s, r) => s + (r.rating ?? 0), 0) /
                (a.reviews ?? []).length
              : 0;
          const rb =
            (b.reviews?.length ?? 0) > 0
              ? (b.reviews ?? []).reduce((s, r) => s + (r.rating ?? 0), 0) /
                (b.reviews ?? []).length
              : 0;
          return rb - ra;
        });
        break;
      case "newest":
      default:
        sorted.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
    }

    return sorted;
  }, [
    normalizedProducts,
    deferredSearch,
    deferredFilters,
    productPriceNow,
    isDiscountActive,
  ]);

  // ── Stats (filteredProducts-dan, memoized) ────────────────────
  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const organicCount = filteredProducts.filter((p) => p.isOrganic).length;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const discountedCount = filteredProducts.filter((p) => isDiscountActive(p as any)).length;

    let avgSaving = 0;
    let savingItems = 0;

    for (const p of filteredProducts) {
      const base = getProductBasePrice(p);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (base > 0 && isDiscountActive(p as any)) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const now = productPriceNow(p as any);
        if (now < base) {
          avgSaving += base - now;
          savingItems++;
        }
      }
    }

    return {
      total,
      organicCount,
      discountedCount,
      avgSaving: savingItems > 0 ? avgSaving / savingItems : 0,
    };
  }, [filteredProducts, isDiscountActive, productPriceNow]);

  // ── Active filter count ───────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.searchTerm) count++;
    if (filters.categoryId) count++;
    if (filters.stockFilter !== "all") count++;
    if (filters.discountOnly) count++;
    if (filters.minPrice) count++;
    if (filters.maxPrice) count++;
    if (filters.minRating) count++;
    if (filters.sortKey !== "newest") count++;
    return count;
  }, [filters]);

  // ── Handlers (useCallback – referans sabit qalır) ─────────────
  const handleFilterChange = useCallback((newFilters: FilterState) => {
    startTransition(() => {
      setFilters(newFilters);
    });
  }, []);

  const clearAllFilters = useCallback(() => {
    startTransition(() => {
      setFilters(DEFAULT_FILTERS);
    });
  }, []);

  const handleViewModeChange = useCallback((mode: "grid" | "list") => {
    startTransition(() => {
      setViewMode(mode);
    });
  }, []);

  const handleOpenDrawer = useCallback(() => setIsFilterDrawerOpen(true), []);
  const handleCloseDrawer = useCallback(() => setIsFilterDrawerOpen(false), []);

  const handleClearAndClose = useCallback(() => {
    startTransition(() => {
      setFilters(DEFAULT_FILTERS);
    });
    setIsFilterDrawerOpen(false);
  }, []);

  // ─── Render ────────────────────────────────────────────────────
  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" aria-hidden>
        <svg
          className="absolute bottom-0 left-0 w-full h-48 opacity-10"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#064e3b"
            fillOpacity="0.2"
            d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,176C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* Header Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative mb-10 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm p-6 shadow-xl shadow-emerald-100/30"
        >
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-100/20 blur-3xl" />
          <div className="absolute bottom-4 right-8 text-emerald-100/40" aria-hidden>
            <Mountain className="h-24 w-24" strokeWidth={0.5} />
          </div>
          <div className="absolute left-6 top-6 rotate-12 text-emerald-100/40" aria-hidden>
            <Leaf className="h-12 w-12" strokeWidth={0.5} />
          </div>

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-emerald-100/80 px-3 py-1 text-xs font-semibold text-emerald-700 backdrop-blur-sm">
                <Sparkles className="h-3.5 w-3.5" />
                Gədəbəy dağlarından birbaşa
              </div>
              <h1 className="text-3xl font-black tracking-tight text-emerald-900 md:text-4xl">
                Təbii məhsullar kataloqu
              </h1>
              <p className="mt-2 max-w-xl text-sm text-slate-600">
                Ən təzə, ən keyfiyyətli kənd məhsullarını kəşf edin. Hamısı
                sertifikatlı, heç bir kimyəvi qatqısız.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <StatBox
                label="Məhsul"
                value={stats.total}
                icon={<Package className="h-4 w-4" />}
                color="emerald"
              />
              <StatBox
                label="Organik"
                value={stats.organicCount}
                icon={<Leaf className="h-4 w-4" />}
                color="lime"
              />
              <StatBox
                label="Endirim"
                value={stats.discountedCount}
                icon={<BadgePercent className="h-4 w-4" />}
                color="rose"
              />
              <StatBox
                label="Orta qənaət"
                value={`${stats.avgSaving.toFixed(2)} ₼`}
                icon={<TrendingUp className="h-4 w-4" />}
                color="amber"
              />
            </div>
          </div>
        </motion.div>

        {/* Desktop Filter */}
        <ProductFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onViewModeChange={handleViewModeChange}
          defaultViewMode={viewMode}
          className="mb-6"
        />

        {/* Mobile search + filter trigger */}
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="mobileSearch"
              value={filters.searchTerm}
              onChange={(value) =>
                handleFilterChange({ ...filters, searchTerm: value as string })
              }
              placeholder="Axtar..."
              className="pl-9"
            />
          </div>
          <Button
            variant="primary"
            onClick={handleOpenDrawer}
            className="inline-flex items-center gap-2 shrink-0"
          >
            <Filter className="h-4 w-4" />
            Filtr
            {activeFilterCount > 0 && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-emerald-600">
                {activeFilterCount}
              </span>
            )}
          </Button>
        </div>

        {/* Pending indicator (filter işlənərkən) */}
        {isPending && (
          <div className="mb-3 flex items-center gap-2 text-xs text-emerald-600 font-semibold">
            <span className="inline-block h-3 w-3 rounded-full border-2 border-emerald-400 border-t-transparent animate-spin" />
            Filtrlənir...
          </div>
        )}

        {/* Product Grid */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            products={filteredProducts as any}
            currency={currency}
            addToCart={addToCart}
            variant="default"
            showControls={false}
            initialViewMode={viewMode}
            itemsPerPage={12}
          />
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-12 rounded-3xl border-2 border-dashed border-emerald-200 bg-white/60 p-12 text-center backdrop-blur-sm"
          >
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h3 className="mt-4 text-xl font-bold text-slate-800">
              Məhsul tapılmadı
            </h3>
            <p className="mt-2 text-sm text-slate-500">
              Cari filtrlərə uyğun heç bir məhsul yoxdur.
            </p>
            <Button variant="primary" onClick={clearAllFilters} className="mt-6">
              <X className="h-4 w-4" /> Filtrləri sıfırla
            </Button>
          </motion.div>
        )}
      </div>

      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleCloseDrawer}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 220 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-bold text-slate-800">Filtrlər</h2>
                <button
                  onClick={handleCloseDrawer}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100 transition-colors"
                  aria-label="Bağla"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Kateqoriya
                  </label>
                  <Select
                    name="mobileCategory"
                    value={filters.categoryId}
                    onChange={(value) =>
                      handleFilterChange({
                        ...filters,
                        categoryId: value as string,
                      })
                    }
                    options={[
                      { value: "", label: "Hamısı" },
                      ...categoriesList.map((c) => ({
                        value: c.id,
                        label: c.name,
                      })),
                    ]}
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-semibold uppercase text-slate-500">
                    Qiymət (₼)
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      name="mobileMinPrice"
                      type="number"
                      min={0}
                      placeholder="Min"
                      value={filters.minPrice}
                      onChange={(value) =>
                        handleFilterChange({
                          ...filters,
                          minPrice: value as string,
                        })
                      }
                    />
                    <span className="text-slate-400 font-bold">—</span>
                    <Input
                      name="mobileMaxPrice"
                      type="number"
                      min={0}
                      placeholder="Max"
                      value={filters.maxPrice}
                      onChange={(value) =>
                        handleFilterChange({
                          ...filters,
                          maxPrice: value as string,
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-xs font-semibold uppercase text-slate-500">
                    Xüsusiyyətlər
                  </label>
                  <div className="flex flex-wrap gap-2">
                    <FilterChip
                      active={filters.stockFilter === "in_stock"}
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          stockFilter:
                            filters.stockFilter === "in_stock" ? "all" : "in_stock",
                        })
                      }
                      icon={Package}
                      label="Stokda"
                    />
                    <FilterChip
                      active={filters.discountOnly}
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          discountOnly: !filters.discountOnly,
                        })
                      }
                      icon={BadgePercent}
                      label="Endirim"
                    />
                    <FilterChip
                      active={filters.stockFilter === "low_stock"}
                      onClick={() =>
                        handleFilterChange({
                          ...filters,
                          stockFilter:
                            filters.stockFilter === "low_stock"
                              ? "all"
                              : "low_stock",
                        })
                      }
                      icon={AlertTriangle}
                      label="Az stok"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t p-4 space-y-2">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={handleCloseDrawer}
                >
                  Tətbiq et ({filteredProducts.length} məhsul)
                </Button>
                <Button
                  variant="ghost"
                  className="w-full"
                  onClick={handleClearAndClose}
                >
                  Bütün filtrləri sıfırla
                </Button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
}