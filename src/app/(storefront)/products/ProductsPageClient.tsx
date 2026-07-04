"use client";

import { useMemo, useState, useCallback, useEffect, useDeferredValue } from "react";
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

// ─── Sub-components ────────────────────────────────────────────────
const StatBox = ({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  color: "emerald" | "lime" | "rose" | "amber" | "blue" | "slate";
}) => {
  const colorMap = {
    emerald: "bg-emerald-50/80 text-emerald-800 border-emerald-200",
    lime: "bg-lime-50/80 text-lime-800 border-lime-200",
    rose: "bg-rose-50/80 text-rose-800 border-rose-200",
    amber: "bg-amber-50/80 text-amber-800 border-amber-200",
    blue: "bg-blue-50/80 text-blue-800 border-blue-200",
    slate: "bg-slate-50/80 text-slate-800 border-slate-200",
  };
  return (
    <div className={`rounded-2xl px-4 py-3 text-center backdrop-blur-sm border ${colorMap[color]}`}>
      <div className="flex items-center justify-center gap-1 text-2xl font-black">
        {icon}
        {value}
      </div>
      <p className="text-[10px] font-semibold uppercase tracking-wider">{label}</p>
    </div>
  );
};

// ─── Helper: ümumi stok hesabla ──────────────────────────────────
function getTotalStock(product: any): number {
  if (product.stock !== undefined && product.stock !== null) {
    return product.stock;
  }
  if (product.variants && Array.isArray(product.variants)) {
    return product.variants.reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0);
  }
  return 0;
}

// ─── Helper: məhsulu stock ilə zənginləşdir ──────────────────────
function enrichProductWithStock(product: any) {
  return {
    ...product,
    stock: getTotalStock(product),
  };
}

// ─── Main Component ──────────────────────────────────────────────────
export function ProductsPageClient({
  initialData,
}: {
  initialData?: { products: any[]; categories: any[] };
}) {
  // ── Store ─────────────────────────────────────────────────────────
  const {
    products: storeProducts,
    categories: storeCategories,
    productPriceNow,
    isDiscountActive,
    addToCart,
    storefrontConfig,
    _hasHydrated,
    setProducts,
    setCategories,
  } = useApp();

  const currency = storefrontConfig?.currency || "AZN";

  // ── Filter State ──────────────────────────────────────────────────
  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    categoryId: "",
    showArchived: false,
    stockFilter: "all",
    discountOnly: false,
    minPrice: "",
    maxPrice: "",
    minRating: "",
    sortKey: "newest",
  });

  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);

  // ── Deferred search ──────────────────────────────────────────────
  const deferredSearch = useDeferredValue(filters.searchTerm);

  // ── Hydrate store with server data ──────────────────────────────
  useEffect(() => {
    if (initialData) {
      // ✅ Məhsulları stok məlumatı ilə zənginləşdir
      const enrichedProducts = initialData.products.map(enrichProductWithStock);
      setProducts(enrichedProducts);
      setCategories(initialData.categories);
    }
  }, [initialData, setProducts, setCategories]);

  // ── URL sync ──────────────────────────────────────────────────────
  useEffect(() => {
    const params = new URLSearchParams();
    if (deferredSearch) params.set("q", deferredSearch);
    if (filters.categoryId) params.set("cat", filters.categoryId);
    if (filters.stockFilter !== "all") params.set("stock", filters.stockFilter);
    if (filters.discountOnly) params.set("sale", "1");
    if (filters.minPrice) params.set("min", filters.minPrice);
    if (filters.maxPrice) params.set("max", filters.maxPrice);
    if (filters.minRating) params.set("rating", filters.minRating);
    if (filters.sortKey !== "newest") params.set("sort", filters.sortKey);
    const query = params.toString();
    window.history.replaceState(null, "", query ? `?${query}` : window.location.pathname);
  }, [
    deferredSearch,
    filters.categoryId,
    filters.stockFilter,
    filters.discountOnly,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.sortKey,
  ]);

  // ── Filtered products ─────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    // 1. Store-dan gələn məhsulları stock ilə zənginləşdir
    let list = storeProducts.map(enrichProductWithStock).filter((p) => !p.archived);

    // 2. Search
    if (deferredSearch) {
      const term = deferredSearch.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(term) ||
          (p.tags || []).some((tag: string) => tag.toLowerCase().includes(term))
      );
    }

    // 3. Category
    if (filters.categoryId) {
      list = list.filter((p) => p.categoryId === filters.categoryId);
    }

    // 4. Price range
    const min = parseFloat(filters.minPrice);
    const max = parseFloat(filters.maxPrice);
    if (!isNaN(min) && min > 0) {
      list = list.filter((p) => productPriceNow(p) >= min);
    }
    if (!isNaN(max) && max > 0) {
      list = list.filter((p) => productPriceNow(p) <= max);
    }

    // 5. Stock filter (endirim hissədən sonra, çünki stock artıq var)
    if (filters.stockFilter === "in_stock") {
      list = list.filter((p) => (p.stock ?? 0) > 0);
    } else if (filters.stockFilter === "low_stock") {
      list = list.filter((p) => (p.stock ?? 0) > 0 && (p.stock ?? 0) <= (p.minStock ?? 5));
    } else if (filters.stockFilter === "out_of_stock") {
      list = list.filter((p) => (p.stock ?? 0) === 0);
    }

    // 6. Discount
    if (filters.discountOnly) {
      list = list.filter((p) => isDiscountActive(p));
    }

    // 7. Min rating
    const minRating = parseFloat(filters.minRating);
    if (!isNaN(minRating) && minRating > 0) {
      list = list.filter((p) => {
        const avg =
          p.reviews?.length
            ? p.reviews.reduce((s: any, r: { rating: any; }) => s + (r.rating ?? 0), 0) / p.reviews.length
            : 0;
        return avg >= minRating;
      });
    }

    // 8. Sort
    const sorted = [...list];
    switch (filters.sortKey) {
      case "price_asc":
        sorted.sort((a, b) => productPriceNow(a) - productPriceNow(b));
        break;
      case "price_desc":
        sorted.sort((a, b) => productPriceNow(b) - productPriceNow(a));
        break;
      case "rating":
        sorted.sort((a, b) => {
          const ra =
            a.reviews?.length
              ? a.reviews.reduce((s: any, r: { rating: any; }) => s + (r.rating ?? 0), 0) / a.reviews.length
              : 0;
          const rb =
            b.reviews?.length
              ? b.reviews.reduce((s: any, r: { rating: any; }) => s + (r.rating ?? 0), 0) / b.reviews.length
              : 0;
          return rb - ra;
        });
        break;
      case "newest":
        sorted.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        break;
      default:
        break;
    }

    // ✅ Hər məhsulda stock sahəsi artıq var, qaytar
    return sorted;
  }, [
    storeProducts,
    deferredSearch,
    filters.categoryId,
    filters.stockFilter,
    filters.discountOnly,
    filters.minPrice,
    filters.maxPrice,
    filters.minRating,
    filters.sortKey,
    productPriceNow,
    isDiscountActive,
  ]);

  // ── Stats ─────────────────────────────────────────────────────────
  const stats = useMemo(() => {
    const total = filteredProducts.length;
    const organicCount = filteredProducts.filter((p) => p.isOrganic).length;
    const discountedCount = filteredProducts.filter((p) => isDiscountActive(p)).length;
    let avgSaving = 0;
    let savingItems = 0;
    filteredProducts.forEach((p) => {
      const base = getProductBasePrice(p);
      if (base && isDiscountActive(p)) {
        const now = productPriceNow(p);
        if (now < base) {
          avgSaving += base - now;
          savingItems++;
        }
      }
    });
    avgSaving = savingItems > 0 ? avgSaving / savingItems : 0;
    return { total, organicCount, discountedCount, avgSaving };
  }, [filteredProducts, isDiscountActive, productPriceNow]);

  // ── Filter handlers ──────────────────────────────────────────────
  const handleFilterChange = useCallback(
    (newFilters: FilterState) => {
      setFilters(newFilters);
    },
    []
  );

  const clearAllFilters = useCallback(() => {
    setFilters({
      searchTerm: "",
      categoryId: "",
      showArchived: false,
      stockFilter: "all",
      discountOnly: false,
      minPrice: "",
      maxPrice: "",
      minRating: "",
      sortKey: "newest",
    });
  }, []);

  // ── Render ────────────────────────────────────────────────────────
  if (!_hasHydrated) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-emerald-600 border-r-transparent align-[-0.125em]"></div>
          <p className="mt-4 text-slate-600">Yüklənir...</p>
        </div>
      </div>
    );
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* ── Background Decorations ────────────────────────────────── */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
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
        {/* ── Header Banner ────────────────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="relative mb-10 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm p-6 shadow-xl shadow-emerald-100/30"
        >
          <div className="absolute -right-16 -top-16 h-64 w-64 rounded-full bg-emerald-200/20 blur-3xl" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-amber-100/20 blur-3xl" />
          <div className="absolute bottom-4 right-8 text-emerald-100/40">
            <Mountain className="h-24 w-24" strokeWidth={0.5} />
          </div>
          <div className="absolute left-6 top-6 rotate-12 text-emerald-100/40">
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

        {/* ── Filter Component ────────────────────────────────────── */}
        <ProductFilter
          filters={filters}
          onFilterChange={handleFilterChange}
          onViewModeChange={setViewMode}
          defaultViewMode={viewMode}
          className="mb-6"
        />

        {/* ── Mobile Filter Drawer Trigger ────────────────────────── */}
        <div className="lg:hidden mb-4 flex items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <Input
              name="mobileSearch"
              value={filters.searchTerm}
              onChange={(value) =>
                handleFilterChange({
                  ...filters,
                  searchTerm: value as string,
                })
              }
              placeholder="Axtar..."
              className="pl-9"
            />
          </div>
          <Button
            variant="primary"
            onClick={() => setIsFilterDrawerOpen(true)}
            className="inline-flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filtr
            {Object.values(filters).some(
              (v) =>
                v !== "" &&
                v !== "all" &&
                v !== false &&
                v !== "newest" &&
                v !== 0
            ) && (
              <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-white text-[10px] font-black text-emerald-600">
                {
                  Object.values(filters).filter(
                    (v) =>
                      v !== "" &&
                      v !== "all" &&
                      v !== false &&
                      v !== "newest" &&
                      v !== 0
                  ).length
                }
              </span>
            )}
          </Button>
        </div>

        {/* ── Product Grid ────────────────────────────────────────── */}
        {filteredProducts.length > 0 ? (
          <ProductGrid
            products={filteredProducts}
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
            <h3 className="mt-4 text-xl font-bold text-slate-800">Məhsul tapılmadı</h3>
            <p className="mt-2 text-sm text-slate-500">
              Cari filtrlərə uyğun heç bir məhsul yoxdur. Filtrləri dəyişdirin.
            </p>
            <Button variant="primary" onClick={clearAllFilters} className="mt-6">
              <X className="h-4 w-4" /> Filtrləri sıfırla
            </Button>
          </motion.div>
        )}
      </div>

      {/* ── Mobile Filter Drawer ──────────────────────────────────── */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsFilterDrawerOpen(false)}
              className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25 }}
              className="fixed bottom-0 right-0 top-0 z-50 flex w-full max-w-sm flex-col bg-white shadow-2xl lg:hidden"
            >
              <div className="flex items-center justify-between border-b p-4">
                <h2 className="text-lg font-bold text-slate-800">Filtrlər</h2>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="rounded-full p-2 text-slate-500 hover:bg-slate-100"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-5">
                {/* Kateqoriya */}
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
                        categoryId: value as unknown as string,
                      })
                    }
                    options={[
                      { value: "", label: "Hamısı" },
                      ...storeCategories.map((c) => ({ value: c.id, label: c.name })),
                    ]}
                  />
                </div>

                {/* Qiymət aralığı */}
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
                    <span>—</span>
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

                {/* Xüsusiyyətlər */}
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
                            filters.stockFilter === "low_stock" ? "all" : "low_stock",
                        })
                      }
                      icon={AlertTriangle}
                      label="Az stok"
                    />
                  </div>
                </div>
              </div>

              <div className="border-t p-4">
                <Button
                  variant="primary"
                  className="w-full"
                  onClick={() => setIsFilterDrawerOpen(false)}
                >
                  Tətbiq et ({filteredProducts.length} məhsul)
                </Button>
                <Button
                  variant="ghost"
                  className="mt-2 w-full"
                  onClick={() => {
                    clearAllFilters();
                    setIsFilterDrawerOpen(false);
                  }}
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

// ─── Reusable Filter Chip ──────────────────────────────────────────
const FilterChip = ({
  active,
  onClick,
  icon: Icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ElementType;
  label: string;
}) => (
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

// ─── Helper: əsas qiyməti al (variant-lardan və ya birbaşa) ──────
function getProductBasePrice(product: any): number {
  if (product.variants && product.variants.length > 0) {
    const defaultVariant = product.variants.find((v: any) => v.isDefault) || product.variants[0];
    return defaultVariant?.price ?? product.basePrice ?? 0;
  }
  return product.basePrice ?? product.price ?? 0;
}