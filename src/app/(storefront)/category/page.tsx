// src/app/categories/page.tsx
// Tam, qısaldılmamış, production-ready versiya

"use client";

import { useApp, useHasHydrated } from "@/lib/store";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Sprout,
  ArrowRight,
  Search,
  Filter,
  X,
  Grid3X3,
  List,
  ChevronDown,
  ChevronUp,
  Star,
  StarOff,
  Eye,
  EyeOff,
  RefreshCw,
  Loader2,
  AlertCircle,
  Layers,
  TrendingUp,
  Clock,
  Sparkles,
  ArrowUp,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils/cn";
import { getCategoryMeta } from "@/lib/category-helpers";

// ─── Sub-komponentlər ──────────────────────────────────────────────────────────

/** Kateqoriya kartı – təkmilləşdirilmiş versiya */
const CategoryCard = ({
  category,
  index,
}: {
  category: any;
  index: number;
}) => {
  const meta = getCategoryMeta(category.name);
  const Icon = meta.icon;
  const count = category._count?.products ?? 0;
  const [imageError, setImageError] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        duration: 0.4,
        delay: index * 0.035,
        ease: [0.22, 1, 0.36, 1],
      }}
      whileHover={{ y: -6, transition: { duration: 0.2 } }}
      className="h-full"
    >
      <Link
        href={`/category/${category.slug}`}
        className="group relative flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100/60 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/10 transition-all duration-300 h-full overflow-hidden"
      >
        {/* Hover gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/0 via-emerald-500/0 to-emerald-500/5 group-hover:from-emerald-500/5 group-hover:via-emerald-500/5 group-hover:to-emerald-500/10 transition-all duration-500" />

        {/* İkon / Şəkil */}
        <div
          className={cn(
            "relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300",
            meta.bg || "bg-emerald-50"
          )}
        >
          {category.image && !imageError ? (
            <Image
              src={category.image}
              alt={category.name}
              fill
              className="object-cover rounded-2xl p-1.5"
              onError={() => setImageError(true)}
              sizes="(max-width: 640px) 64px, 80px"
            />
          ) : (
            <Icon
              className={cn(
                "w-7 h-7 sm:w-8 sm:h-8 transition-colors duration-300",
                meta.color || "text-emerald-500",
                "group-hover:text-emerald-600"
              )}
              strokeWidth={1.8}
            />
          )}

          {/* Badge */}
          {meta.badge && (
            <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md z-10">
              {meta.badge}
            </span>
          )}

          {/* Featured indicator */}
          {category.featured && (
            <span className="absolute -bottom-1 -right-1 w-4 h-4 bg-amber-400 rounded-full flex items-center justify-center shadow-md border-2 border-white">
              <Star className="w-2.5 h-2.5 text-white fill-white" />
            </span>
          )}
        </div>

        {/* Ad */}
        <h3 className="text-sm sm:text-base font-bold text-slate-800 line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors duration-300">
          {category.name}
        </h3>

        {/* Təsvir (əgər varsa) */}
        {category.description && (
          <p className="text-xs text-slate-400 line-clamp-2 max-w-[90%] mx-auto mb-1">
            {category.description}
          </p>
        )}

        {/* Say */}
        <p className="text-xs text-slate-500 mt-auto flex items-center gap-1">
          <Package className="w-3 h-3" />
          {count} məhsul
        </p>

        {/* Hover arrow */}
        <div className="absolute bottom-4 right-4 w-6 h-6 rounded-full bg-emerald-100/80 flex items-center justify-center opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all duration-300">
          <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
        </div>
      </Link>
    </motion.div>
  );
};

/** Skeleton loader – təkmilləşdirilmiş */
const CategorySkeleton = () => (
  <div className="rounded-2xl bg-white/60 backdrop-blur-sm border border-emerald-100/60 overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-slate-100/60" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-200/60 rounded-full w-3/4 mx-auto" />
      <div className="h-3 bg-slate-200/60 rounded-full w-1/2 mx-auto" />
      <div className="h-4 bg-slate-200/60 rounded-full w-1/3 mx-auto" />
    </div>
  </div>
);

/** Aktiv filtr nişanı */
const FilterPill = ({
  label,
  onRemove,
}: {
  label: string;
  onRemove: () => void;
}) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
  >
    {label}
    <button
      onClick={onRemove}
      className="hover:bg-emerald-200 rounded-full p-0.5 transition"
    >
      <X className="w-3 h-3" />
    </button>
  </motion.span>
);

// ─── Package import (for CategoryCard) ─────────────────────────────────────────
import { Package } from "lucide-react";

// ─── Əsas Səhifə ──────────────────────────────────────────────────────────────

export default function CategoriesPage() {
  const hasHydrated = useHasHydrated();
  const categories = useApp((state) => state.categories);
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const currency = storefrontConfig?.currency || "AZN";

  // ─── State ──────────────────────────────────────────────────────────────────
  const [search, setSearch] = useState("");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"name" | "products" | "featured">("products");
  const [showFeatured, setShowFeatured] = useState(false);
  const [showOnlyActive, setShowOnlyActive] = useState(true);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: scrollRef, offset: ["start start", "end start"] });

  // Parallax
  const headerY = useTransform(scrollYProgress, [0, 0.4], ["0%", "15%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0.7]);
  const headerScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.97]);

  // ─── Filtered Categories ──────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (!categories) return [];

    let result = [...categories];

    // Axtarış
    if (search) {
      const term = search.toLowerCase().trim();
      result = result.filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.slug.toLowerCase().includes(term) ||
          c.description?.toLowerCase().includes(term)
      );
    }

    // Arxiv
    result = result.filter((c) => !c.archived);

    // Aktivlik
    if (showOnlyActive) {
      result = result.filter((c) => c.archived !== true);
    }

    // Önə çıxanlar
    if (showFeatured) {
      result = result.filter((c) => c.featured === true);
    }

    // Sort
    switch (sortBy) {
      case "name":
        result.sort((a, b) => a.name.localeCompare(b.name, "az"));
        break;
      case "products":
        result.sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0));
        break;
      case "featured":
        result.sort((a, b) => {
          if (a.featured && !b.featured) return -1;
          if (!a.featured && b.featured) return 1;
          return (b._count?.products ?? 0) - (a._count?.products ?? 0);
        });
        break;
      default:
        break;
    }

    return result;
  }, [categories, search, showOnlyActive, showFeatured, sortBy]);

  // Pagination
  const displayed = filtered.slice(0, visibleCount);
  const hasMore = filtered.length > visibleCount;

  // Filtrlərin sayı
  const activeFilterCount = [
    search,
    showFeatured,
    !showOnlyActive,
  ].filter(Boolean).length;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const clearAllFilters = useCallback(() => {
    setSearch("");
    setShowFeatured(false);
    setShowOnlyActive(true);
    setSortBy("products");
    setVisibleCount(12);
  }, []);

  const loadMore = useCallback(() => {
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 12, filtered.length));
      setIsLoadingMore(false);
    }, 300);
  }, [filtered.length]);

  // Reset visible count on filter change
  useEffect(() => {
    setVisibleCount(12);
  }, [search, showFeatured, showOnlyActive, sortBy]);

  // ─── Hydration ─────────────────────────────────────────────────────────────
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F9FCF9] to-[#F0F9F0]">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-emerald-800 font-bold">Kateqoriyalar yüklənir...</p>
        </div>
      </div>
    );
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9e7] via-white to-[#eef7ea]">
      {/* ─── Header ────────────────────────────────────────────────────────── */}
      <div ref={scrollRef} className="relative overflow-hidden">
        <motion.div
          style={{ y: headerY, opacity: headerOpacity, scale: headerScale }}
          className="relative pt-16 pb-12 md:pt-24 md:pb-20 px-6 text-center"
        >
          {/* Dekorativ elementlər */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-200/20 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-72 h-72 bg-teal-200/20 rounded-full blur-3xl" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/20 rounded-full blur-3xl" />
          </div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="relative z-10 max-w-4xl mx-auto"
          >
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100/80 backdrop-blur-sm text-emerald-700 text-xs font-bold mb-4 md:mb-6">
              <Sprout className="w-3.5 h-3.5" />
              {filtered.length} kateqoriya
              {storefrontConfig?.siteTitle && (
                <span className="text-emerald-500/60">· {storefrontConfig.siteTitle}</span>
              )}
            </span>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-3xl md:text-5xl lg:text-6xl font-black text-emerald-950 tracking-tight"
            >
              Bütün Kateqoriyalar
              <span className="text-emerald-400">.</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="mt-3 md:mt-4 text-emerald-700/70 text-base md:text-lg max-w-2xl mx-auto"
            >
              Gədəbəyin təbii məhsullarını kateqoriyalara görə kəşf edin
            </motion.p>

            {/* Axtarış */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 md:mt-8 max-w-md mx-auto relative"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Kateqoriya axtar..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-12 py-3 rounded-2xl border-2 border-emerald-100/80 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm shadow-sm"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              )}
            </motion.div>
          </motion.div>
        </motion.div>
      </div>

      {/* ─── Filters Bar ──────────────────────────────────────────────────── */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-emerald-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Sort & View */}
            <div className="flex items-center gap-2">
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-emerald-50/50 border border-emerald-100 rounded-xl px-3 md:px-4 py-2 pr-8 text-sm font-medium text-slate-700 cursor-pointer focus:ring-2 focus:ring-emerald-300 outline-none transition"
                >
                  <option value="products">Ən çox məhsul</option>
                  <option value="name">A-Z</option>
                  <option value="featured">Önə çıxanlar</option>
                </select>
                <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              </div>

              {/* View toggle */}
              <div className="hidden sm:flex bg-emerald-50/50 rounded-xl p-1 border border-emerald-100">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-2 rounded-lg transition",
                    viewMode === "grid"
                      ? "bg-white shadow text-emerald-700"
                      : "text-emerald-500 hover:text-emerald-700"
                  )}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-2 rounded-lg transition",
                    viewMode === "list"
                      ? "bg-white shadow text-emerald-700"
                      : "text-emerald-500 hover:text-emerald-700"
                  )}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Filter buttons */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center gap-1.5 px-3 md:px-4 py-2 rounded-xl border border-emerald-100 text-sm font-medium text-slate-600 hover:bg-emerald-50 transition"
              >
                <Filter className="w-4 h-4" />
                Filtrlər
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
                <ChevronDown
                  className={cn(
                    "w-3.5 h-3.5 transition-transform",
                    isFilterOpen && "rotate-180"
                  )}
                />
              </button>

              <button
                onClick={() => {
                  setShowFeatured(false);
                  setShowOnlyActive(true);
                  setSearch("");
                }}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-medium hidden sm:block"
              >
                Sıfırla
              </button>
            </div>
          </div>

          {/* Active filters */}
          {(activeFilterCount > 0 || search) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-2 mt-3"
            >
              {search && (
                <FilterPill label={`Axtarış: ${search}`} onRemove={() => setSearch("")} />
              )}
              {showFeatured && (
                <FilterPill label="Önə çıxanlar" onRemove={() => setShowFeatured(false)} />
              )}
              {!showOnlyActive && (
                <FilterPill label="Arxivdəkilər də" onRemove={() => setShowOnlyActive(true)} />
              )}
              <button
                onClick={clearAllFilters}
                className="text-xs text-emerald-600 font-semibold hover:underline"
              >
                Hamısını təmizlə
              </button>
            </motion.div>
          )}
        </div>

        {/* Filter drawer */}
        <AnimatePresence>
          {isFilterOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-t border-emerald-100/50"
            >
              <div className="max-w-7xl mx-auto px-4 py-4 flex flex-wrap gap-4">
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={showFeatured}
                    onChange={() => setShowFeatured(!showFeatured)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <Star className="w-4 h-4 text-amber-400" />
                  Yalnız önə çıxanlar
                </label>
                <label className="flex items-center gap-2 text-sm text-slate-600">
                  <input
                    type="checkbox"
                    checked={!showOnlyActive}
                    onChange={() => setShowOnlyActive(!showOnlyActive)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  Arxivdəkiləri də göstər
                </label>
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  Bütün filtrləri sıfırla
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ─── Content ────────────────────────────────────────────────────────── */}
      <section className="max-w-7xl mx-auto px-4 pb-16 md:pb-24 pt-6 md:pt-8">
        {filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Search className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-slate-700">Heç bir kateqoriya tapılmadı</h3>
            <p className="text-slate-500 mt-2">
              Axtarış sözünü dəyişdirin və ya filtrləri yoxlayın.
            </p>
            <button
              onClick={clearAllFilters}
              className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition"
            >
              Filtrləri təmizlə
            </button>
          </motion.div>
        ) : (
          <>
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm text-slate-500">
                <span className="font-bold text-emerald-700">{filtered.length}</span> kateqoriya
                {search && ` · "${search}" üçün`}
              </p>
            </div>

            {/* Grid / List */}
            <div
              className={cn(
                "grid gap-4 md:gap-5",
                viewMode === "grid"
                  ? "grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                  : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3"
              )}
            >
              {displayed.map((cat, idx) => (
                <CategoryCard key={cat.id} category={cat} index={idx} />
              ))}
            </div>

            {/* Load more */}
            {hasMore && (
              <div className="text-center mt-10 md:mt-12">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-8 py-3 bg-white border-2 border-emerald-200 text-emerald-700 font-bold rounded-full shadow-md hover:bg-emerald-50 hover:border-emerald-400 transition-all disabled:opacity-50"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yüklənir...
                    </>
                  ) : (
                    <>
                      Daha çox yüklə ({visibleCount} / {filtered.length})
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ─── Sticky Scroll to Top ────────────────────────────────────────── */}
      <AnimatePresence>
        {scrollYProgress.get() > 0.15 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}