// src/app/category/[slug]/page.tsx
// Tam, qısaldılmamış, production-ready versiya
// Bütün animasiyalar, parallax effektləri, filtrlər və responsive düzəlişlər daxildir

"use client";

import { useParams, notFound, useRouter } from "next/navigation";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import {
  Search,
  Package,
  XCircle,
  Sparkles,
  Loader2,
  ArrowRight,
  ShieldCheck,
  Filter,
  ChevronDown,
  SlidersHorizontal,
  Star,
  Grid3X3,
  List,
  X,
  ArrowUp,
  Layers,
  Clock,
  TrendingUp,
  Eye,
  Heart,
  ShoppingBag,
  Zap,
  CheckCircle2,
  Percent,
  Calendar,
  Minus,
  Plus,
  Truck,
  Leaf,
  Award,
  Users,
  MessageCircle,
  Share2,
  Bookmark,
  ExternalLink,
  RotateCcw,
  ChevronLeft,
  ChevronRight,
  Maximize2,
  Info,
  AlertCircle,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState, useEffect, useRef, useCallback } from "react";
import { cn } from "@/lib/utils/cn";
import { useApp, useHasHydrated } from "@/lib/store";
import { getCategoryImageUrl, getCategoryImageAlt, getCategoryColor } from "@/lib/category-helpers";
import { RusticProductCard } from "@/components/ui/organisms/RusticProductCard";

// ─── Təhlükəsiz Qiymət və Stok Selectorlar ──────────────────────────────────
const safePrice = (p: any) => {
  if (!p) return 0;
  if (p.variants && p.variants.length > 0) return p.variants[0]?.price || 0;
  return p.price || p.basePrice || 0;
};

const safeStock = (p: any) => {
  if (!p) return 0;
  if (p.stock !== undefined && p.stock !== null) return p.stock;
  if (p.variants && p.variants.length > 0) {
    return p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0);
  }
  return 0;
};

const safeDiscount = (p: any) => {
  if (!p) return 0;
  return p.discountValue || p.discountPercent || 0;
};

const safeRating = (p: any) => {
  if (!p || !p.reviews || p.reviews.length === 0) return 0;
  return p.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / p.reviews.length;
};

// ─── Sub-komponentlər ──────────────────────────────────────────────────────────

/** Status nişanı (header üçün) */
const StatusChip = ({ icon: Icon, label, color }: any) => (
  <div
    className={cn(
      "inline-flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 shadow-md",
      color || "bg-white/20 text-white"
    )}
  >
    <Icon className="w-4 h-4" />
    <span className="text-xs font-black uppercase tracking-wider">{label}</span>
  </div>
);

/** Filter düyməsi */
const FilterChip = ({
  label,
  active,
  onClick,
  icon: Icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon?: any;
}) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={cn(
      "flex items-center gap-1.5 px-3 md:px-4 py-1.5 md:py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap",
      active
        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-500/30"
        : "bg-white/80 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300"
    )}
  >
    {Icon && <Icon className="w-3.5 h-3.5" />}
    {label}
  </motion.button>
);

/** Aktiv filtr nişanı */
const ActiveFilterPill = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
  >
    {label}
    <button onClick={onRemove} className="hover:bg-emerald-200 rounded-full p-0.5 transition">
      <X className="w-3 h-3" />
    </button>
  </motion.span>
);

/** Məhsul Skeleton */
const ProductSkeleton = () => (
  <div className="rounded-2xl bg-white border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-slate-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
      <div className="h-5 bg-slate-100 rounded-full w-1/3" />
    </div>
  </div>
);

/** Breadcrumb */
const Breadcrumb = ({
  items,
}: {
  items: { label: string; href: string; isCurrent?: boolean }[];
}) => (
  <nav className="flex items-center gap-1 text-xs md:text-sm text-slate-500 overflow-x-auto no-scrollbar py-2">
    <Link href="/" className="hover:text-emerald-600 transition-colors flex-shrink-0">
      Ana səhifə
    </Link>
    {items.map((item, index) => (
      <div key={item.href} className="flex items-center gap-1 flex-shrink-0">
        <span className="text-slate-300">/</span>
        {item.isCurrent ? (
          <span className="font-medium text-slate-800">{item.label}</span>
        ) : (
          <Link href={item.href} className="hover:text-emerald-600 transition-colors">
            {item.label}
          </Link>
        )}
      </div>
    ))}
  </nav>
);

// ─── Əsas Səhifə ──────────────────────────────────────────────────────────────

export default function CategoryPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;
  const hasHydrated = useApp((state) => state._hasHydrated);

  // ─── Store ──────────────────────────────────────────────────────────────────
  const categories = useApp((state) => state.categories);
  const products = useApp((state) => state.products);
  const addToCart = useApp((state) => state.addToCart);
  const storefrontConfig = useApp((state) => state.storefrontConfig);
  const currency = useMemo(() => storefrontConfig?.currency || "AZN", [storefrontConfig?.currency]);

  // ─── Refs ──────────────────────────────────────────────────────────────────
  const scrollRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const productsRef = useRef<HTMLDivElement>(null);
  const [headerHeight, setHeaderHeight] = useState(0);

  // ─── Scroll ─────────────────────────────────────────────────────────────────
  const { scrollYProgress } = useScroll({
    target: scrollRef,
    offset: ["start start", "end start"],
  });

  // Parallax dəyərləri
  const headerY = useTransform(scrollYProgress, [0, 0.4], ["0%", "20%"]);
  const headerOpacity = useTransform(scrollYProgress, [0, 0.25], [1, 0.6]);
  const headerScale = useTransform(scrollYProgress, [0, 0.25], [1, 0.95]);
  const contentY = useTransform(scrollYProgress, [0, 0.5], ["0%", "-5%"]);

  // ─── Kateqoriya ─────────────────────────────────────────────────────────────
  const category = useMemo(() => {
    if (!hasHydrated || !categories) return null;
    return categories.find((c) => c.slug === slug && !c.archived);
  }, [categories, slug, hasHydrated]);

  // ─── UI State ──────────────────────────────────────────────────────────────
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"recent" | "price_asc" | "price_desc" | "rating" | "discount" | "popular">(
    "popular"
  );
  const [minPrice, setMinPrice] = useState(0);
  const [maxPrice, setMaxPrice] = useState(500);
  const [showOnlyInStock, setShowOnlyInStock] = useState(false);
  const [onlyDiscounted, setOnlyDiscounted] = useState(false);
  const [minRating, setMinRating] = useState<0 | 3 | 4>(0);
  const [onlyNew, setOnlyNew] = useState(false);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [visibleCount, setVisibleCount] = useState(12);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [showBackToTop, setShowBackToTop] = useState(false);

  // ─── Filtrlənmiş Məhsullar ──────────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    if (!category || !products) return [];

    return products
      .filter((p) => {
        if (!p || p.archived || p.categoryId !== category.id) return false;
        if (showOnlyInStock && safeStock(p) <= 0) return false;
        if (onlyDiscounted && safeDiscount(p) <= 0) return false;
        if (onlyNew) {
          const createdAt = new Date(p.createdAt || "");
          const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24);
          if (daysAgo > 7) return false;
        }
        const matchesSearch =
          !searchTerm ||
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some((t: string) => t.toLowerCase().includes(searchTerm.toLowerCase())) ||
          p.description?.toLowerCase().includes(searchTerm.toLowerCase());

        const currentPrice = safePrice(p);
        const matchesPrice = currentPrice >= minPrice && currentPrice <= maxPrice;

        const rating = safeRating(p);
        const matchesRating = rating >= minRating;

        return matchesSearch && matchesPrice && matchesRating;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "price_asc":
            return safePrice(a) - safePrice(b);
          case "price_desc":
            return safePrice(b) - safePrice(a);
          case "rating": {
            const ra = safeRating(a);
            const rb = safeRating(b);
            return rb - ra;
          }
          case "discount": {
            const da = safeDiscount(a);
            const db = safeDiscount(b);
            return db - da;
          }
          case "popular":
            return (b.soldCount || 0) - (a.soldCount || 0);
          case "recent":
          default:
            return new Date(b.createdAt || "").getTime() - new Date(a.createdAt || "").getTime();
        }
      });
  }, [category, products, searchTerm, sortBy, minPrice, maxPrice, showOnlyInStock, onlyDiscounted, minRating, onlyNew]);

  const displayedProducts = filteredProducts.slice(0, visibleCount);
  const hasMore = filteredProducts.length > visibleCount;

  // ─── Filtr sayı ─────────────────────────────────────────────────────────────
  const activeFilterCount = useMemo(
    () =>
      [
        showOnlyInStock,
        onlyDiscounted,
        onlyNew,
        minRating > 0,
        searchTerm !== "",
        minPrice > 0 || maxPrice < 500,
      ].filter(Boolean).length,
    [showOnlyInStock, onlyDiscounted, onlyNew, minRating, searchTerm, minPrice, maxPrice]
  );

  // ─── Handlerlər ─────────────────────────────────────────────────────────────
  const clearAllFilters = useCallback(() => {
    setSearchTerm("");
    setMinPrice(0);
    setMaxPrice(500);
    setShowOnlyInStock(false);
    setOnlyDiscounted(false);
    setMinRating(0);
    setOnlyNew(false);
    setSortBy("popular");
    setVisibleCount(12);
  }, []);

  const loadMore = useCallback(() => {
    if (isLoadingMore) return;
    setIsLoadingMore(true);
    setTimeout(() => {
      setVisibleCount((prev) => Math.min(prev + 12, filteredProducts.length));
      setIsLoadingMore(false);
    }, 300);
  }, [filteredProducts.length, isLoadingMore]);

  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const scrollToProducts = useCallback(() => {
    productsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // ─── Reset visible count on filter change ──────────────────────────────────
  useEffect(() => {
    setVisibleCount(12);
  }, [
    searchTerm,
    sortBy,
    minPrice,
    maxPrice,
    showOnlyInStock,
    onlyDiscounted,
    minRating,
    onlyNew,
  ]);

  // ─── Scroll to top button visibility ──────────────────────────────────────
  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 500);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // ─── Header height tracking ───────────────────────────────────────────────
  useEffect(() => {
    if (headerRef.current) {
      setHeaderHeight(headerRef.current.offsetHeight);
    }
    const observer = new ResizeObserver(() => {
      if (headerRef.current) {
        setHeaderHeight(headerRef.current.offsetHeight);
      }
    });
    if (headerRef.current) observer.observe(headerRef.current);
    return () => observer.disconnect();
  }, []);

  // ─── Hydration ─────────────────────────────────────────────────────────────
  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-emerald-50">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
          <p className="mt-4 text-emerald-800 font-bold">Yüklənir...</p>
        </div>
      </div>
    );
  }

  if (!category) return notFound();

  const categoryImage = getCategoryImageUrl(category);
  const categoryAlt = getCategoryImageAlt(category);
  const categoryColor = getCategoryColor(category);

  // ─── Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FCF9] via-white to-[#F0F9F0]">
      {/* ==================== HEADER (Parallax) ==================== */}
      <div ref={scrollRef} className="relative h-[55vh] md:h-[70vh] overflow-hidden">
        {/* Background */}
        <motion.div style={{ y: headerY }} className="absolute inset-0">
          {categoryImage && categoryImage !== "/images/category-default.jpg" ? (
            <Image
              src={categoryImage}
              alt={categoryAlt}
              fill
              priority
              className="object-cover scale-105"
              sizes="100vw"
              quality={85}
            />
          ) : (
            <div
              className="absolute inset-0 bg-gradient-to-br"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}dd, ${categoryColor}55)`,
              }}
            />
          )}
          {/* Overlay gradient-lər */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-black/30 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9FCF9] via-transparent to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-black/20 to-transparent" />

          {/* Dekorativ elementlər */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-teal-500/10 rounded-full blur-3xl" />
        </motion.div>

        {/* Content */}
        <motion.div
          style={{ opacity: headerOpacity, scale: headerScale }}
          className="relative z-10 h-full flex flex-col items-center justify-center text-center px-4 sm:px-6"
        >
          <motion.div
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl mx-auto"
          >
            {/* Status chip */}
            <StatusChip
              icon={Sparkles}
              label="Premium Kolleksiya"
              color="bg-white/20 text-white backdrop-blur-md"
            />

            {/* Kateqoriya adı */}
            <h1 className="mt-4 md:mt-6 text-4xl sm:text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
              {category.name}
              <span className="text-emerald-300">.</span>
            </h1>

            {/* Təsvir */}
            {category.description && (
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="mt-4 md:mt-6 max-w-2xl mx-auto text-white/90 text-base sm:text-lg md:text-xl font-medium"
              >
                {category.description}
              </motion.p>
            )}

            {/* Statistikalar */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 md:mt-10 flex flex-wrap justify-center gap-3 md:gap-4"
            >
              <div className="backdrop-blur-md bg-white/20 rounded-full px-4 md:px-6 py-2 md:py-3 text-white font-bold flex items-center gap-2 shadow-lg text-sm md:text-base">
                <Package className="w-4 h-4 md:w-5 md:h-5" />
                {filteredProducts.length} Məhsul
              </div>
              {category._count?.products && (
                <div className="backdrop-blur-md bg-white/20 rounded-full px-4 md:px-6 py-2 md:py-3 text-white font-bold flex items-center gap-2 shadow-lg text-sm md:text-base">
                  <Layers className="w-4 h-4 md:w-5 md:h-5" />
                  {category._count.products} Kateqoriya
                </div>
              )}
              <button
                onClick={scrollToProducts}
                className="backdrop-blur-md bg-emerald-500/30 hover:bg-emerald-500/40 rounded-full px-4 md:px-6 py-2 md:py-3 text-white font-bold flex items-center gap-2 shadow-lg transition-all text-sm md:text-base"
              >
                Məhsullara bax
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-6 md:bottom-8 left-1/2 -translate-x-1/2 w-7 h-10 md:w-8 md:h-12 border-2 border-white/30 rounded-full flex justify-center p-2"
        >
          <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" />
        </motion.div>
      </div>

      {/* ==================== STICKY FILTER BAR ==================== */}
      <div
        ref={headerRef}
        className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-emerald-100/50 shadow-sm"
      >
        <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 md:py-3">
          <div className="flex flex-wrap items-center justify-between gap-2 md:gap-3">
            {/* Breadcrumb (desktop) */}
            <div className="hidden lg:block flex-1 min-w-0">
              <Breadcrumb
                items={[
                  { label: category.name, href: `/category/${category.slug}`, isCurrent: true },
                ]}
              />
            </div>

            {/* Search */}
            <div className="relative flex-1 min-w-[140px] md:max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Məhsul axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-xl md:rounded-2xl py-1.5 md:py-2.5 pl-8 md:pl-10 pr-3 md:pr-4 text-xs md:text-sm focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* View toggle (desktop) */}
              <div className="hidden sm:flex bg-emerald-50/50 rounded-xl p-1 border border-emerald-100">
                <button
                  onClick={() => setViewMode("grid")}
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg transition",
                    viewMode === "grid"
                      ? "bg-white shadow text-emerald-700"
                      : "text-emerald-500 hover:text-emerald-700"
                  )}
                >
                  <Grid3X3 className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={cn(
                    "p-1.5 md:p-2 rounded-lg transition",
                    viewMode === "list"
                      ? "bg-white shadow text-emerald-700"
                      : "text-emerald-500 hover:text-emerald-700"
                  )}
                >
                  <List className="w-3.5 h-3.5 md:w-4 md:h-4" />
                </button>
              </div>

              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-emerald-50 border border-emerald-100 rounded-xl px-3 md:px-4 py-1.5 md:py-2.5 pr-7 md:pr-8 text-xs md:text-sm font-medium text-emerald-800 cursor-pointer focus:ring-2 focus:ring-emerald-300 outline-none transition"
                >
                  <option value="popular">Ən çox satılan</option>
                  <option value="recent">Ən yeni</option>
                  <option value="price_asc">Qiymət: artan</option>
                  <option value="price_desc">Qiymət: azalan</option>
                  <option value="rating">Reytinq</option>
                  <option value="discount">Endirim</option>
                </select>
                <ChevronDown className="absolute right-2 md:right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 md:w-4 md:h-4 text-emerald-500 pointer-events-none" />
              </div>

              {/* Filter button (mobile) */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="lg:hidden flex items-center gap-1 md:gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-3 md:px-4 py-1.5 md:py-2.5 text-emerald-700 font-semibold text-xs md:text-sm"
              >
                <Filter className="w-3.5 h-3.5 md:w-4 md:h-4" />
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-[10px] w-4 h-4 md:w-5 md:h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Active filter chips */}
          {(activeFilterCount > 0 || searchTerm) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex flex-wrap items-center gap-1.5 md:gap-2 mt-2"
            >
              {searchTerm && (
                <ActiveFilterPill label={`Axtarış: ${searchTerm}`} onRemove={() => setSearchTerm("")} />
              )}
              {showOnlyInStock && (
                <ActiveFilterPill label="Yalnız stokda" onRemove={() => setShowOnlyInStock(false)} />
              )}
              {onlyDiscounted && (
                <ActiveFilterPill label="Endirimlilər" onRemove={() => setOnlyDiscounted(false)} />
              )}
              {onlyNew && <ActiveFilterPill label="Yeni gələnlər" onRemove={() => setOnlyNew(false)} />}
              {minRating > 0 && (
                <ActiveFilterPill label={`${minRating}+ ulduz`} onRemove={() => setMinRating(0)} />
              )}
              {(minPrice > 0 || maxPrice < 500) && (
                <ActiveFilterPill
                  label={`Qiymət: ${minPrice}₼ - ${maxPrice}₼`}
                  onRemove={() => {
                    setMinPrice(0);
                    setMaxPrice(500);
                  }}
                />
              )}
              <button
                onClick={clearAllFilters}
                className="text-[10px] md:text-xs text-emerald-600 font-semibold hover:underline"
              >
                Hamısını təmizlə
              </button>
            </motion.div>
          )}
        </div>
      </div>

      {/* ==================== MAIN CONTENT ==================== */}
      <div ref={productsRef} className="max-w-7xl mx-auto px-3 sm:px-4 py-6 md:py-10">
        <div className="flex flex-col lg:flex-row gap-6 md:gap-8">
          {/* ─── DESKTOP SIDEBAR ────────────────────────────────────────── */}
          <aside className="hidden lg:block w-64 xl:w-72 shrink-0 space-y-6">
            {/* Filter panel */}
            <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-emerald-100 shadow-sm sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto no-scrollbar">
              <h3 className="font-black text-emerald-900 flex items-center gap-2 mb-4 text-sm">
                <SlidersHorizontal className="w-4 h-4" />
                Filtrlər
              </h3>

              {/* Price range */}
              <div className="mb-5">
                <label className="text-xs font-bold text-slate-700 block mb-2">Qiymət aralığı</label>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5"
                  />
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600 h-1.5"
                  />
                  <div className="flex justify-between text-xs font-medium text-emerald-700">
                    <span>{minPrice} ₼</span>
                    <span>{maxPrice} ₼</span>
                  </div>
                </div>
              </div>

              {/* Stock */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showOnlyInStock}
                    onChange={() => setShowOnlyInStock(!showOnlyInStock)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Yalnız stokda olanlar</span>
                </label>
              </div>

              {/* Discount */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={() => setOnlyDiscounted(!onlyDiscounted)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Endirimli məhsullar</span>
                </label>
              </div>

              {/* New */}
              <div className="mb-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={() => setOnlyNew(!onlyNew)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-xs font-medium text-slate-700">Son 7 gündə gələnlər</span>
                </label>
              </div>

              {/* Rating */}
              <div>
                <p className="text-xs font-bold text-slate-700 mb-1.5">Minimum reytinq</p>
                <div className="flex gap-1.5">
                  {[0, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r as any)}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-xs font-bold transition",
                        minRating === r
                          ? "bg-emerald-600 text-white"
                          : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                      )}
                    >
                      {r === 0 ? "Hamısı" : `${r}+ ★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Info card */}
            <div
              className="rounded-2xl p-5 border shadow-sm"
              style={{
                background: `linear-gradient(135deg, ${categoryColor}15, ${categoryColor}08)`,
                borderColor: `${categoryColor}30`,
              }}
            >
              <ShieldCheck className="w-7 h-7 mb-2" style={{ color: categoryColor }} />
              <h4 className="font-black text-slate-800 text-sm">100% Organik</h4>
              <p className="text-xs text-slate-500 mt-1">Bütün məhsullarımız təbii və heç bir kimyəvi qatqısızdır.</p>
              <div className="mt-3 flex items-center gap-2 text-xs text-slate-400">
                <Leaf className="w-3.5 h-3.5" />
                <span>Gədəbəy təsərrüfatı</span>
              </div>
            </div>

            {/* Quick stats */}
            <div className="bg-white/40 rounded-2xl p-4 border border-emerald-100/50 text-xs text-slate-500 space-y-1.5">
              <div className="flex justify-between">
                <span>Ümumi məhsul</span>
                <span className="font-bold text-slate-700">{filteredProducts.length}</span>
              </div>
              <div className="flex justify-between">
                <span>Stokda olanlar</span>
                <span className="font-bold text-emerald-600">
                  {filteredProducts.filter((p) => safeStock(p) > 0).length}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Endirimlilər</span>
                <span className="font-bold text-amber-600">
                  {filteredProducts.filter((p) => safeDiscount(p) > 0).length}
                </span>
              </div>
            </div>
          </aside>

          {/* ─── PRODUCTS ────────────────────────────────────────────────── */}
          <div className="flex-1 min-w-0">
            {/* Result count */}
            <div className="flex justify-between items-center mb-4">
              <p className="text-xs md:text-sm text-slate-500">
                <span className="font-bold text-emerald-700">{filteredProducts.length}</span> məhsul tapıldı
                {searchTerm && ` · "${searchTerm}" üçün`}
              </p>
            </div>

            {/* Products grid */}
            <AnimatePresence mode="wait">
              {filteredProducts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-16 bg-white/60 rounded-3xl border border-dashed border-emerald-200"
                >
                  <Package className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">Nəticə tapılmadı</h3>
                  <p className="text-sm text-slate-500 mt-2">
                    Filtirləri dəyişdirin və ya axtarış sözünü yeniləyin.
                  </p>
                  <button
                    onClick={clearAllFilters}
                    className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold hover:bg-emerald-700 transition"
                  >
                    Filtrləri təmizlə
                  </button>
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={cn(
                    "grid gap-4 md:gap-5",
                    viewMode === "grid"
                      ? "grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3"
                      : "grid-cols-1"
                  )}
                >
                  <AnimatePresence>
                    {displayedProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{
                          delay: idx * 0.03,
                          duration: 0.3,
                          ease: [0.22, 1, 0.36, 1],
                        }}
                      >
                        <RusticProductCard
                          product={product}
                          currency={currency}
                          addToCart={addToCart}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Load more */}
            {filteredProducts.length > 0 && hasMore && (
              <div className="text-center mt-8 md:mt-10">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMore}
                  disabled={isLoadingMore}
                  className="inline-flex items-center gap-2 px-6 md:px-8 py-2.5 md:py-3 bg-white border-2 border-emerald-200 text-emerald-700 font-bold rounded-full shadow-md hover:bg-emerald-50 hover:border-emerald-400 transition-all disabled:opacity-50 text-sm md:text-base"
                >
                  {isLoadingMore ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Yüklənir...
                    </>
                  ) : (
                    <>
                      Daha çox yüklə ({visibleCount} / {filteredProducts.length})
                    </>
                  )}
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================== SCROLL TO TOP ==================== */}
      <AnimatePresence>
        {showBackToTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-11 h-11 md:w-12 md:h-12 rounded-full bg-emerald-600 text-white shadow-lg shadow-emerald-500/30 hover:bg-emerald-700 transition-all flex items-center justify-center"
          >
            <ArrowUp className="w-4 h-4 md:w-5 md:h-5" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* ==================== MOBILE FILTER DRAWER ==================== */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed top-0 right-0 bottom-0 w-[85vw] max-w-sm bg-white z-50 shadow-2xl p-5 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-emerald-800 flex items-center gap-2">
                  <SlidersHorizontal className="w-5 h-5" />
                  Filtrlər
                </h3>
                <button
                  onClick={() => setIsFilterDrawerOpen(false)}
                  className="p-2 rounded-full bg-gray-100 hover:bg-gray-200 transition"
                >
                  <X className="w-5 h-5 text-slate-500" />
                </button>
              </div>

              <div className="space-y-6">
                {/* Price */}
                <div>
                  <label className="text-sm font-bold block mb-2 text-slate-700">Qiymət aralığı</label>
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full mt-2 accent-emerald-600"
                  />
                  <div className="flex justify-between text-sm font-medium text-emerald-700 mt-1">
                    <span>{minPrice}₼</span>
                    <span>{maxPrice}₼</span>
                  </div>
                </div>

                {/* Checkboxes */}
                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={showOnlyInStock}
                    onChange={() => setShowOnlyInStock(!showOnlyInStock)}
                    className="rounded text-emerald-600"
                  />
                  Yalnız stokda
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyDiscounted}
                    onChange={() => setOnlyDiscounted(!onlyDiscounted)}
                    className="rounded text-emerald-600"
                  />
                  Endirimlilər
                </label>

                <label className="flex items-center gap-2 text-sm text-slate-700">
                  <input
                    type="checkbox"
                    checked={onlyNew}
                    onChange={() => setOnlyNew(!onlyNew)}
                    className="rounded text-emerald-600"
                  />
                  Yeni gələnlər
                </label>

                {/* Rating */}
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Minimum reytinq</p>
                  <div className="flex gap-2">
                    {[0, 3, 4].map((r) => (
                      <button
                        key={r}
                        onClick={() => setMinRating(r as any)}
                        className={cn(
                          "px-3 py-1.5 rounded-full text-xs font-bold transition",
                          minRating === r
                            ? "bg-emerald-600 text-white"
                            : "bg-gray-100 text-slate-600 hover:bg-gray-200"
                        )}
                      >
                        {r === 0 ? "Hamısı" : `${r}+ ★`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div>
                  <p className="text-sm font-bold text-slate-700 mb-2">Sıralama</p>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as any)}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-emerald-300 outline-none transition"
                  >
                    <option value="popular">Ən çox satılan</option>
                    <option value="recent">Ən yeni</option>
                    <option value="price_asc">Qiymət: artan</option>
                    <option value="price_desc">Qiymət: azalan</option>
                    <option value="rating">Reytinq</option>
                    <option value="discount">Endirim</option>
                  </select>
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-2">
                  <button
                    onClick={clearAllFilters}
                    className="flex-1 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold text-sm"
                  >
                    Sıfırla
                  </button>
                  <button
                    onClick={() => setIsFilterDrawerOpen(false)}
                    className="flex-1 py-3 bg-emerald-600 text-white rounded-xl font-bold text-sm"
                  >
                    Tətbiq et
                  </button>
                </div>
              </div>
            </motion.aside>
          </>
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
        ::-webkit-scrollbar {
          width: 6px;
        }
        ::-webkit-scrollbar-track {
          background: transparent;
        }
        ::-webkit-scrollbar-thumb {
          background: #22c55e66;
          border-radius: 10px;
        }
      `}</style>
    </div>
  );
}