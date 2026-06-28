// src/components/admin/sales/SalesProductBrowser.tsx
"use client";

import React,
{
  useMemo,
  useState,
  useCallback,
  useEffect,
  useRef,
  useDeferredValue,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  Layers,
  X,
  Tag,
  ArrowUp,
  ArrowDown,
  Percent,
  Zap,
  Archive,
  AlertTriangle,
  RotateCcw,
  Mic,
  LayoutGrid,
  Rows3,
  TrendingUp,
  TrendingDown,
  Minus,
  Info,
} from "lucide-react";

import { useApp, Product, Variant } from "@/lib/store";
import { variantFinalPrice } from "@/lib/calc";
import { StockFilter, TagFilter, ViewMode } from "@/types/sales";

declare global {
  interface Window {
    webkitSpeechRecognition?: unknown;
    SpeechRecognition?: unknown;
  }
}

type Props = {
  onSelect: (productId: string, variantId: string) => void;
  heightClass?: string;
};

// Sadə mock funksiya – qiymət trendi
function getPriceTrend(productId: string | undefined): "up" | "down" | "stable" {
  if (!productId || !productId.length) return "stable";
  const lastCode = productId.charCodeAt(productId.length - 1);
  if (lastCode % 3 === 0) return "up";
  if (lastCode % 3 === 1) return "down";
  return "stable";
}

const SalesProductBrowser: React.FC<Props> = ({
  onSelect,
  heightClass = "h-[700px]",
}) => {
  const { products, categories } = useApp();

  const safeProducts = products ?? [];

  // ===========================
  // CORE UI STATE
  // ===========================
  const [search, setSearch] = useState("");
  const [selectedProductId, setSelectedProductId] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | "ALL">("ALL");
  const [openedVariantSheet, setOpenedVariantSheet] = useState<Product | null>(
    null
  );
  const [sort, setSort] = useState<"none" | "asc" | "desc">("none");
  const [stockFilter, setStockFilter] = useState<StockFilter>("IN_STOCK");
  const [tagFilter, setTagFilter] = useState<TagFilter>("ALL");
  const [viewMode, setViewMode] = useState<ViewMode>("grid");

  // Əlavə premium filter toggles
  const [includeOutOfStock, setIncludeOutOfStock] = useState(false);
  const [includeArchived, setIncludeArchived] = useState(false);

  // ===========================
  // VOICE SEARCH STATE
  // ===========================
  const [isListening, setIsListening] = useState(false);
  const [isVoiceSearchSupported, setIsVoiceSearchSupported] = useState(false);
  const recognitionRef = useRef<any | null>(null);

  // ===========================
  // HELPERS
  // ===========================
  const normalizedSearch = search.trim().toLowerCase();
  const deferredSearch = useDeferredValue(normalizedSearch);

  const getCategoryName = useCallback(
    (categoryId: string | undefined) =>
      categories.find((c) => c.id === categoryId)?.name || "Kateqoriya",
    [categories]
  );

  const getVariantStock = useCallback((v: Variant) => v.stock ?? 0, []);
  const getProductStock = useCallback(
    (p: Product) =>
      p.variants.reduce((sum, v) => sum + (v.stock ?? 0), 0),
    []
  );

  // ===========================
  // VOICE SEARCH INIT (SSR SAFE)
  // ===========================
  useEffect(() => {
    if (typeof window === "undefined") return;

    const SR =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      null;

    if (SR) {
      const recognition = new SR();
      recognitionRef.current = recognition;
      recognition.continuous = false;
      recognition.lang = "az-AZ";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        try {
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) setSearch(transcript);
        } finally {
          setIsListening(false);
        }
      };

      setIsVoiceSearchSupported(true);
    }
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current) return;
    try {
      recognitionRef.current.start();
    } catch {
      // already started
    }
  }, []);

  // ===========================
  // FILTER + SORT
  // ===========================
  const filtered = useMemo(() => {
    let list = safeProducts;

    // Archived filter
    if (!includeArchived) {
      list = list.filter((p) => !p.archived);
    }

    // Category filter
    if (selectedCategory !== "ALL") {
      list = list.filter((p) => p.categoryId === selectedCategory);
    }

    // Stock filter (IN_STOCK / LOW_STOCK) + extra toggle
    if (stockFilter === "IN_STOCK") {
      if (!includeOutOfStock) {
        list = list.filter((p) => getProductStock(p) > 0);
      }
      // includeOutOfStock = true → hamısı (tükənənlər də)
    } else if (stockFilter === "LOW_STOCK") {
      list = list.filter((p) => {
        const stock = getProductStock(p);
        const min = p.minStock ?? 5;
        return stock > 0 && stock <= min;
      });
    }

    // Tag filter
    if (tagFilter === "DISCOUNTED") {
      list = list.filter((p) => !!p.discountType && !!p.discountValue);
    } else if (tagFilter === "NEW") {
      const thirtyDaysAgo = new Date(
        Date.now() - 30 * 24 * 60 * 60 * 1000
      ).toISOString();
      list = list.filter((p) => (p.createdAt ?? "") > thirtyDaysAgo);
    }

    // Search (deferred)
    if (deferredSearch) {
      list = list.filter((p) => {
        const n = p.name.toLowerCase();
        const variantMatch = p.variants.some((v) =>
          v.name.toLowerCase().includes(deferredSearch)
        );
        return n.includes(deferredSearch) || variantMatch;
      });
    }

    // Sort
    if (sort !== "none") {
      list = [...list].sort((a, b) => {
        const va = a.variants[0];
        const vb = b.variants[0];
        const priceA = va ? variantFinalPrice(a, va) : 0;
        const priceB = vb ? variantFinalPrice(b, vb) : 0;
        return sort === "asc" ? priceA - priceB : priceB - priceA;
      });
    }

    return list;
  }, [
    safeProducts,
    selectedCategory,
    stockFilter,
    tagFilter,
    includeOutOfStock,
    includeArchived,
    deferredSearch,
    sort,
    getProductStock,
  ]);

  const totalCount = safeProducts.length;
  const filteredCount = filtered.length;

  // ===========================
  // SELECT HANDLERS
  // ===========================
  const handleSelect = useCallback(
    (product: Product) => {
      const stockVariant =
        product.variants.find((v) => getVariantStock(v) > 0) ||
        product.variants[0];
      setSelectedProductId(product.id);
      onSelect(product.id, stockVariant?.id ?? "");
    },
    [onSelect, getVariantStock]
  );

  const handleVariantSelect = useCallback(
    (product: Product, variant: Variant) => {
      setSelectedProductId(product.id);
      onSelect(product.id, variant.id);
      setOpenedVariantSheet(null);
    },
    [onSelect]
  );

  const handleClearSearch = useCallback(() => {
    setSearch("");
    setSort("none");
    setSelectedCategory("ALL");
    setStockFilter("IN_STOCK");
    setTagFilter("ALL");
    setIncludeOutOfStock(false);
    setIncludeArchived(false);
    setSelectedProductId("");
  }, []);

  // ===========================
  // PRODUCT CARD COMPONENT
  // ===========================
  const ProductItemCard: React.FC<{
    product: Product;
    index: number;
  }> = ({ product, index }) => {
    const active = product.id === selectedProductId;
    const stock = getProductStock(product);
    const baseVariant = product.variants[0];
    const basePrice = baseVariant ? variantFinalPrice(product, baseVariant) : 0;
    const trend = getPriceTrend(product.id);

    const TrendIcon =
      trend === "up" ? TrendingUp : trend === "down" ? TrendingDown : Minus;
    const trendColor =
      trend === "up"
        ? "text-red-500"
        : trend === "down"
        ? "text-green-500"
        : "text-slate-500";

    if (viewMode === "grid") {
      return (
        <motion.div
          layout
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{
            type: "spring",
            damping: 20,
            stiffness: 260,
            delay: index * 0.015,
          }}
          whileHover={{ scale: 1.04, zIndex: 5 }}
          whileTap={{ scale: 0.96 }}
          className={`rounded-2xl p-4 cursor-pointer relative shadow-md border transition min-h-[150px]
            ${
              active
                ? "border-emerald-600 bg-emerald-50 shadow-emerald-300"
                : "border-green-200 bg-white hover:border-emerald-400"
            }
            ${stock === 0 ? "opacity-60 grayscale" : ""}`}
        >
          <button
            type="button"
            onClick={() => stock > 0 && handleSelect(product)}
            disabled={stock === 0}
            className="w-full text-left space-y-2"
          >
            {/* Category */}
            <span className="text-[11px] font-semibold text-green-700 flex items-center gap-1">
              <Tag className="w-3 h-3" />
              {getCategoryName(product.categoryId)}
            </span>

            {/* Name */}
            <p className="font-semibold text-slate-900 text-sm line-clamp-2">
              {product.name}
            </p>

            {/* Badges */}
            <div className="flex flex-wrap gap-1 pt-1">
              {product.discountType && product.discountValue && (
                <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Percent className="w-3 h-3" />
                  Endirim
                </span>
              )}
              {stock > 0 && stock <= (product.minStock ?? 5) && (
                <span className="text-[10px] bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3" />
                  Az qalıb
                </span>
              )}
              {stock === 0 && (
                <span className="text-[10px] bg-gray-200 text-gray-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Archive className="w-3 h-3" />
                  Tükənib
                </span>
              )}
              {product.archived && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Arxiv
                </span>
              )}
            </div>

            {/* Price & Variants */}
            <div className="flex items-center justify-between pt-2">
              <span className="font-extrabold text-emerald-700 text-[16px]">
                {basePrice.toFixed(2)} ₼
              </span>
              {product.variants.length > 1 ? (
                <motion.span
                  onClick={(e) => {
                    e.stopPropagation();
                    setOpenedVariantSheet(product);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className="text-[11px] px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 hover:bg-emerald-200 transition shadow-sm font-semibold"
                >
                  {product.variants.length} variant
                </motion.span>
              ) : (
                <span className="text-[11px] px-3 py-1 rounded-full bg-slate-100 text-slate-500 font-medium">
                  Tək
                </span>
              )}
            </div>

            {/* Stock + Trend */}
            <div className="flex items-center justify-between pt-1">
              <p className="text-[10px] text-slate-500 flex items-center gap-1">
                <Layers className="w-3 h-3" />
                Stok: {stock}
              </p>
              <p
                className={`text-[10px] flex items-center gap-1 ${trendColor}`}
              >
                <TrendIcon className="w-3 h-3" />
                {trend === "up"
                  ? "Artım"
                  : trend === "down"
                  ? "Azalma"
                  : "Stabil"}
              </p>
            </div>
          </button>
        </motion.div>
      );
    }

    // LIST MODE
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: 10 }}
        transition={{
          type: "spring",
          damping: 20,
          stiffness: 260,
          delay: index * 0.01,
        }}
        whileHover={{ x: 4, scale: 1.01 }}
        className={`flex items-center justify-between p-3 rounded-xl border-b border-green-100 cursor-pointer
          ${
            active
              ? "border-l-4 border-emerald-600 bg-emerald-50"
              : "bg-white hover:bg-green-50"
          }
          ${stock === 0 ? "opacity-60" : ""}`}
      >
        <button
          type="button"
          onClick={() => stock > 0 && handleSelect(product)}
          disabled={stock === 0}
          className="flex flex-1 items-center gap-4 text-left"
        >
          <div className="min-w-0 flex-1 space-y-0.5">
            <p className="font-semibold text-slate-900 text-sm line-clamp-1">
              {product.name}
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Tag className="w-3 h-3 text-green-600" />
                {getCategoryName(product.categoryId)}
              </span>
              {product.variants.length > 1 && (
                <span className="text-emerald-700 font-semibold">
                  {product.variants.length} variant
                </span>
              )}
              {product.archived && (
                <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded-md flex items-center gap-1">
                  <Info className="w-3 h-3" />
                  Arxiv
                </span>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end gap-1">
            <span
              className={`text-[11px] flex items-center gap-1 ${
                stock === 0
                  ? "text-red-500"
                  : stock <= (product.minStock ?? 5)
                  ? "text-yellow-500"
                  : "text-green-600"
              }`}
            >
              <Layers className="w-3 h-3" />
              Stok: {stock}
            </span>
            <span className="text-lg font-extrabold text-emerald-700">
              {basePrice.toFixed(2)} ₼
            </span>
          </div>
        </button>
      </motion.div>
    );
  };

  // ===========================
  // RENDER
  // ===========================
  return (
    <div
      className={`relative flex flex-col bg-white rounded-3xl shadow-2xl p-4 border-4 border-green-50 ${heightClass}`}
    >
      <div className="flex-1 overflow-y-auto pr-2 custom-scroll-style">
        {/* TOP SEARCH + VOICE */}
        <div className="pb-4">
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col sm:flex-row gap-2"
          >
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-green-600 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={
                  isListening
                    ? "Dinləyirəm... Məhsul adını deyin"
                    : "Məhsul və ya variant axtar..."
                }
                className={`w-full h-12 pl-10 pr-24 rounded-xl bg-white border shadow-lg focus:ring-4 transition text-sm ${
                  isListening
                    ? "border-red-500 bg-red-50 focus:ring-red-100 text-red-700 animate-pulse"
                    : "border-green-300 focus:border-emerald-600 focus:ring-emerald-100"
                }`}
                disabled={isListening}
              />
              <div className="absolute right-1 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {search && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setSearch("")}
                    className="p-1.5 rounded-full bg-red-100 text-red-600 hover:bg-red-200 transition"
                  >
                    <X className="w-4 h-4" />
                  </motion.button>
                )}
                {isVoiceSearchSupported && (
                  <motion.button
                    type="button"
                    whileTap={{ scale: 0.9 }}
                    animate={
                      isListening
                        ? {
                            scale: [1, 1.15, 1],
                            transition: { duration: 1.2, repeat: Infinity },
                          }
                        : undefined
                    }
                    onClick={!isListening ? startListening : undefined}
                    className={`p-2 rounded-full transition shadow-md ${
                      isListening
                        ? "bg-red-600 text-white shadow-red-300"
                        : "bg-emerald-500 text-white hover:bg-emerald-600"
                    }`}
                  >
                    <Mic
                      className={`w-4 h-4 ${
                        isListening ? "animate-pulse" : ""
                      }`}
                    />
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>

          {/* SMALL INFO BAR */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-2 flex items-center justify-between text-[11px] text-slate-500 bg-slate-50 border border-slate-100 rounded-xl px-3 py-1.5"
          >
            <span>
              Nəticə:{" "}
              <span className="font-semibold text-emerald-700">
                {filteredCount}
              </span>{" "}
              /{" "}
              <span className="font-mono text-slate-700">{totalCount}</span>{" "}
              məhsul
            </span>
            {normalizedSearch && (
              <span className="hidden sm:flex items-center gap-1">
                <Search className="w-3 h-3" />
                <span className="line-clamp-1 max-w-[160px]">
                  Axtarış: <b>{normalizedSearch}</b>
                </span>
              </span>
            )}
          </motion.div>

          {/* CATEGORY CHIPS */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.05 }}
            className="flex items-center gap-2 pt-4 overflow-x-auto hide-scroll pb-2"
          >
            {[{ id: "ALL", name: "Hamısı" }, ...categories].map((cat) => (
              <motion.button
                key={cat.id}
                type="button"
                whileTap={{ scale: 0.95 }}
                onClick={() =>
                  setSelectedCategory(cat.id as string | "ALL")
                }
                className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap shrink-0 transition shadow-md flex items-center gap-1 ${
                  selectedCategory === cat.id
                    ? "bg-emerald-600 text-white shadow-emerald-400 ring-2 ring-emerald-500"
                    : "bg-white border border-green-300 text-green-800 hover:bg-green-50"
                }`}
              >
                {cat.id === "ALL" ? (
                  <Layers className="w-3 h-3" />
                ) : (
                  <Tag className="w-3 h-3" />
                )}
                {cat.name}
              </motion.button>
            ))}
          </motion.div>

          {/* FILTERS + VIEW MODE */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1 }}
            className="flex items-center gap-2 mt-2 overflow-x-auto hide-scroll pb-1 border-t border-green-100 pt-3"
          >
            {/* Sort ASC */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setSort((prev) => (prev === "asc" ? "none" : "asc"))
              }
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                sort === "asc"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-300"
                  : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              Qiymət {sort === "asc" ? <ArrowUp className="w-3 h-3" /> : "↑"}
            </motion.button>

            {/* Sort DESC */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setSort((prev) => (prev === "desc" ? "none" : "desc"))
              }
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                sort === "desc"
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-300"
                  : "bg-white border border-blue-200 text-blue-700 hover:bg-blue-50"
              }`}
            >
              Qiymət {sort === "desc" ? <ArrowDown className="w-3 h-3" /> : "↓"}
            </motion.button>

            {/* Stock filter (IN_STOCK / LOW_STOCK) */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setStockFilter((prev) =>
                  prev === "IN_STOCK" ? "LOW_STOCK" : "IN_STOCK"
                )
              }
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                stockFilter === "LOW_STOCK"
                  ? "bg-red-500 text-white shadow-lg shadow-red-300"
                  : "bg-white border border-green-300 text-green-800 hover:bg-green-50"
              }`}
            >
              {stockFilter === "LOW_STOCK" ? (
                <AlertTriangle className="w-3 h-3" />
              ) : (
                <Layers className="w-3 h-3" />
              )}
              {stockFilter === "LOW_STOCK" ? "Az stok" : "Stokda olanlar"}
            </motion.button>

            {/* OUT OF STOCK toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIncludeOutOfStock((prev) => !prev)}
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                includeOutOfStock
                  ? "bg-slate-900 text-white shadow-lg shadow-slate-400"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Archive className="w-3 h-3" />
              {includeOutOfStock ? "Tükənənlər daxil" : "Tükənənlər gizlən"}
            </motion.button>

            {/* Tag filter */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() =>
                setTagFilter((prev) =>
                  prev === "DISCOUNTED"
                    ? "NEW"
                    : prev === "NEW"
                    ? "ALL"
                    : "DISCOUNTED"
                )
              }
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                tagFilter === "DISCOUNTED"
                  ? "bg-purple-600 text-white shadow-lg shadow-purple-300"
                  : tagFilter === "NEW"
                  ? "bg-amber-500 text-white shadow-lg shadow-amber-300"
                  : "bg-white border border-purple-200 text-purple-700 hover:bg-purple-50"
              }`}
            >
              {tagFilter === "DISCOUNTED" && (
                <>
                  <Percent className="w-3 h-3" /> Endirimlər
                </>
              )}
              {tagFilter === "NEW" && (
                <>
                  <Zap className="w-3 h-3" /> Yenilər
                </>
              )}
              {tagFilter === "ALL" && "Bütün etiketlər"}
            </motion.button>

            {/* Archived toggle */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={() => setIncludeArchived((prev) => !prev)}
              className={`px-3 h-9 rounded-xl text-xs shrink-0 transition flex items-center gap-1 font-semibold ${
                includeArchived
                  ? "bg-slate-800 text-white shadow-lg shadow-slate-400"
                  : "bg-white border border-slate-300 text-slate-700 hover:bg-slate-50"
              }`}
            >
              <Archive className="w-3 h-3" />
              {includeArchived ? "Arxiv məhsulları da" : "Arxiv gizlən"}
            </motion.button>

            <div className="flex-1" />

            {/* View mode toggle */}
            <div className="flex items-center rounded-xl bg-slate-100 p-1 shrink-0">
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "grid"
                    ? "bg-white shadow-md text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </motion.button>
              <motion.button
                type="button"
                whileTap={{ scale: 0.93 }}
                onClick={() => setViewMode("list")}
                className={`p-2 rounded-lg transition ${
                  viewMode === "list"
                    ? "bg-white shadow-md text-emerald-600"
                    : "text-slate-500"
                }`}
              >
                <Rows3 className="w-4 h-4" />
              </motion.button>
            </div>

            {/* Clear */}
            <motion.button
              type="button"
              whileTap={{ scale: 0.95 }}
              onClick={handleClearSearch}
              className="px-3 h-9 rounded-xl border border-slate-300 bg-white text-slate-600 shrink-0 text-xs flex items-center gap-1 font-semibold hover:bg-slate-50"
            >
              <RotateCcw className="w-3 h-3" />
              Təmizlə
            </motion.button>
          </motion.div>
        </div>

        {/* PRODUCT LIST */}
        <div
          className={`mt-2 pb-8 ${
            viewMode === "grid"
              ? "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4"
              : "flex flex-col gap-1"
          }`}
        >
          <AnimatePresence mode="popLayout">
            {filtered.length > 0 ? (
              filtered.map((p, index) => (
                <ProductItemCard key={p.id} product={p} index={index} />
              ))
            ) : (
              <motion.div
                key="no-results"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-10 text-slate-400 text-sm bg-white/50 rounded-xl"
              >
                <Search className="w-5 h-5 mx-auto mb-2" />
                Axtarışa uyğun məhsul tapılmadı.
                <div className="mt-2 text-[11px] text-slate-500">
                  Filterləri yumşaltmağı sınayın (stok, arxiv, endirim və s.)
                </div>
                <motion.button
                  type="button"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleClearSearch}
                  className="mt-3 block mx-auto text-xs text-green-600 font-medium hover:underline"
                >
                  Bütün filterləri sıfırla
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* VARIANT BOTTOM SHEET (MOBILE FRIENDLY) */}
      <AnimatePresence>
        {openedVariantSheet && (
          <motion.div
            key="sheet-bg"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            onClick={() => setOpenedVariantSheet(null)}
          >
            <motion.div
              key="sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 20, stiffness: 220 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-white w-full max-h-[80vh] overflow-y-auto rounded-t-3xl p-6 shadow-2xl"
            >
              <div className="flex justify-between items-center mb-4 border-b pb-3">
                <h3 className="text-lg font-bold text-emerald-700 flex items-center gap-2">
                  <Layers className="w-5 h-5" />
                  Variant seçimi: {openedVariantSheet.name}
                </h3>
                <button
                  type="button"
                  className="p-2 bg-red-100 rounded-full hover:bg-red-200 transition"
                  onClick={() => setOpenedVariantSheet(null)}
                >
                  <X className="w-4 h-4 text-red-700" />
                </button>
              </div>

              <div className="space-y-3">
                {openedVariantSheet.variants.map((v) => {
                  const stock = getVariantStock(v);
                  const price = variantFinalPrice(openedVariantSheet, v);
                  return (
                    <motion.button
                      key={v.id}
                      type="button"
                      whileTap={{ scale: 0.98 }}
                      onClick={() =>
                        stock > 0 && handleVariantSelect(openedVariantSheet, v)
                      }
                      disabled={stock === 0}
                      className={`w-full flex items-center justify-between py-3 px-4 rounded-xl border-2 transition text-sm font-medium shadow-sm ${
                        stock > 0
                          ? "border-emerald-200 hover:bg-emerald-50"
                          : "border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      <span className="flex flex-col items-start">
                        <span className="font-semibold text-slate-800">
                          {v.name}
                        </span>
                        <span className="text-[11px] text-slate-500 flex items-center gap-1 mt-1">
                          <Layers className="w-3 h-3" />
                          Stokda: {stock}
                        </span>
                      </span>
                      <strong className="text-base text-emerald-700 font-extrabold">
                        {price.toFixed(2)} ₼
                      </strong>
                    </motion.button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SalesProductBrowser;
