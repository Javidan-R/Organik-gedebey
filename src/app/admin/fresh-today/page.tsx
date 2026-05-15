"use client";

/**
 * Bu Gün Gələnlər — Admin Panel (Premium v2)
 * Clean, fast, intuitive product management
 * Drag-to-reorder, batch ops, live stats
 */

import { useMemo, useState, useCallback, useRef } from "react";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import {
  Leaf, Plus, Trash2, CheckCircle2, XCircle, Search,
  GripVertical, Clock, ChevronDown, ChevronUp, RefreshCw,
  Flame, Bell, ToggleLeft, ToggleRight, Package, Eye,
  AlertCircle, Sparkles, ArrowRight, BarChart3, TrendingUp,
  Users, Calendar, Save, X, Check, Star, Zap,
} from "lucide-react";
import Image from "next/image";
import { useApp, useHasHydrated } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import type { Product } from "@/types/products";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
type FreshState = "fresh" | "upcoming" | "none";

interface ManagedProduct extends Product {
  freshState: FreshState;
  arrivedAt?: string;
  freshLabel?: string;
  isHot?: boolean;
}

/* ══════════════════════════════════════════════════════════════════
   STAT CARD
══════════════════════════════════════════════════════════════════ */
function StatCard({
  icon,
  label,
  value,
  color,
  sub,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color: "green" | "amber" | "blue" | "slate";
  sub?: string;
}) {
  const colorMap = {
    green: "bg-emerald-50 text-emerald-700 border-emerald-100",
    amber: "bg-amber-50 text-amber-700 border-amber-100",
    blue: "bg-blue-50 text-blue-700 border-blue-100",
    slate: "bg-slate-50 text-slate-700 border-slate-200",
  };
  const iconMap = {
    green: "bg-emerald-100 text-emerald-600",
    amber: "bg-amber-100 text-amber-600",
    blue: "bg-blue-100 text-blue-600",
    slate: "bg-slate-100 text-slate-600",
  };
  return (
    <div className={`flex-1 rounded-2xl p-3.5 border ${colorMap[color]}`}>
      <div className={`w-8 h-8 rounded-xl ${iconMap[color]} flex items-center justify-center mb-2`}>
        {icon}
      </div>
      <p className="text-2xl font-black leading-none">{value}</p>
      <p className="text-[11px] font-bold mt-1 opacity-70">{label}</p>
      {sub && <p className="text-[10px] opacity-50 mt-0.5">{sub}</p>}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MANAGED PRODUCT ROW
══════════════════════════════════════════════════════════════════ */
function ManagedRow({
  product,
  onStateChange,
  mode,
}: {
  product: ManagedProduct;
  onStateChange: (id: string, state: FreshState, extra?: Partial<ManagedProduct>) => void;
  mode: FreshState;
}) {
  const [expanded, setExpanded] = useState(false);
  const [arrivedAt, setArrivedAt] = useState(product.arrivedAt ?? "");
  const [freshLabel, setFreshLabel] = useState(product.freshLabel ?? "");
  const [isHot, setIsHot] = useState(product.isHot ?? false);
  const [saving, setSaving] = useState(false);

  const stock = product.variants?.[0]?.stock ?? 0;
  const isLowStock = stock > 0 && stock <= 5;
  const isOut = stock <= 0;

  const handleSave = async () => {
    setSaving(true);
    await new Promise((r) => setTimeout(r, 400));
    onStateChange(product.id, mode, { arrivedAt, freshLabel, isHot });
    setSaving(false);
    setExpanded(false);
  };

  return (
    <Reorder.Item
      value={product}
      id={product.id}
      as="div"
      className="touch-none"
    >
      <motion.div
        layout
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, x: -20, height: 0 }}
        className="bg-white rounded-2xl border border-slate-100 overflow-hidden
          shadow-[0_1px_8px_rgba(0,0,0,0.04)]"
      >
        {/* Main row */}
        <div className="flex items-center gap-3 p-3.5">
          {/* Drag handle */}
          <div className="cursor-grab active:cursor-grabbing p-1 -ml-1">
            <GripVertical className="h-4 w-4 text-slate-300" />
          </div>

          {/* Thumbnail */}
          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-slate-100 shrink-0">
            {product.images?.[0] ? (
              <Image
                src={getFirstImageUrl(product)}
                alt={product.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-2xl">🥬</div>
            )}
            {isHot && (
              <div className="absolute -top-1 -right-1 w-4 h-4 bg-orange-500
                rounded-full flex items-center justify-center">
                <Flame className="w-2.5 h-2.5 text-white" />
              </div>
            )}
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <p className="font-black text-sm text-slate-900 truncate">{product.name}</p>
              {mode === "fresh" && isHot && (
                <span className="text-[9px] font-bold bg-orange-100 text-orange-700
                  px-1.5 py-0.5 rounded-full">🔥 Hot</span>
              )}
            </div>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[11px] text-slate-400 font-medium">
                {formatCurrency(getProductBasePrice(product))}
              </span>
              {isOut ? (
                <span className="text-[9px] font-bold text-red-600 bg-red-50
                  px-1.5 py-0.5 rounded-full">Tükənib</span>
              ) : isLowStock ? (
                <span className="text-[9px] font-bold text-orange-600 bg-orange-50
                  px-1.5 py-0.5 rounded-full">Son {stock} ədəd</span>
              ) : (
                <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50
                  px-1.5 py-0.5 rounded-full">✓ {stock} ədəd</span>
              )}
            </div>
            {arrivedAt && (
              <p className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                <Clock className="w-2.5 h-2.5" /> {arrivedAt}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Expand */}
            <button
              onClick={() => setExpanded((e) => !e)}
              className="w-8 h-8 rounded-lg bg-slate-50 hover:bg-slate-100
                flex items-center justify-center transition-colors"
            >
              {expanded
                ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" />
                : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />
              }
            </button>

            {/* Toggle state */}
            {mode === "fresh" ? (
              <button
                title="Gələcəyə keçir"
                onClick={() => onStateChange(product.id, "upcoming")}
                className="w-8 h-8 rounded-lg bg-amber-50 hover:bg-amber-100
                  flex items-center justify-center transition-colors"
              >
                <Clock className="h-3.5 w-3.5 text-amber-600" />
              </button>
            ) : (
              <button
                title="Bu günə keçir"
                onClick={() => onStateChange(product.id, "fresh")}
                className="w-8 h-8 rounded-lg bg-emerald-50 hover:bg-emerald-100
                  flex items-center justify-center transition-colors"
              >
                <Leaf className="h-3.5 w-3.5 text-emerald-600" />
              </button>
            )}

            {/* Remove */}
            <button
              title="Siyahıdan çıxar"
              onClick={() => onStateChange(product.id, "none")}
              className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100
                flex items-center justify-center transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5 text-red-500" />
            </button>
          </div>
        </div>

        {/* Expanded edit panel */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.22 }}
              className="overflow-hidden"
            >
              <div className="border-t border-slate-50 p-4 space-y-3 bg-slate-50/60">
                {/* Arrived at */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase
                    tracking-widest block mb-1.5">
                    Gəliş vaxtı
                  </label>
                  <input
                    type="time"
                    value={arrivedAt}
                    onChange={(e) => setArrivedAt(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2
                      outline-none focus:border-emerald-400 bg-white focus:ring-2
                      focus:ring-emerald-100 transition-all"
                  />
                </div>

                {/* Label */}
                <div>
                  <label className="text-[10px] font-black text-slate-500 uppercase
                    tracking-widest block mb-1.5">
                    Qısa açıqlama (isteğe bağlı)
                  </label>
                  <input
                    type="text"
                    placeholder="məs. Səhər dərilmiş, super xırtıldayan"
                    value={freshLabel}
                    onChange={(e) => setFreshLabel(e.target.value)}
                    className="w-full text-sm border border-slate-200 rounded-xl px-3 py-2.5
                      outline-none focus:border-emerald-400 bg-white focus:ring-2
                      focus:ring-emerald-100 transition-all"
                  />
                </div>

                {/* Hot toggle */}
                <div className="flex items-center justify-between p-3 bg-white
                  rounded-xl border border-slate-100">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">🔥</span>
                    <div>
                      <p className="text-xs font-bold text-slate-700">Çox satılan?</p>
                      <p className="text-[10px] text-slate-400">Kartda "Hot" etiketi göstərilir</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsHot((h) => !h)}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                      isHot ? "bg-orange-500" : "bg-slate-200"
                    }`}
                  >
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm
                      transition-transform duration-200 ${isHot ? "translate-x-5" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Save */}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2
                    bg-[#051F0A] hover:bg-[#0A2714] text-[#B5E935] font-black
                    text-sm py-3 rounded-xl transition-colors disabled:opacity-60"
                >
                  {saving ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    >
                      <RefreshCw className="h-4 w-4" />
                    </motion.div>
                  ) : (
                    <><Save className="h-4 w-4" /> Saxla</>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </Reorder.Item>
  );
}

/* ══════════════════════════════════════════════════════════════════
   ADD PRODUCT MODAL
══════════════════════════════════════════════════════════════════ */
function AddModal({
  open,
  onClose,
  available,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  available: Product[];
  onAdd: (p: Product, state: FreshState) => void;
}) {
  const [q, setQ] = useState("");
  const [addState, setAddState] = useState<FreshState>("fresh");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const query = q.toLowerCase();
    return available.filter(
      (p) => !query || p.name.toLowerCase().includes(query)
    );
  }, [available, q]);

  const handleConfirm = () => {
    filtered
      .filter((p) => selected.has(p.id))
      .forEach((p) => onAdd(p, addState));
    setSelected(new Set());
    setQ("");
    onClose();
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-end bg-black/50 backdrop-blur-sm"
        >
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="w-full bg-white rounded-t-[28px] flex flex-col"
            style={{ maxHeight: "88vh" }}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Header */}
            <div className="px-5 pt-2 pb-4 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-slate-900">Məhsul əlavə et</h3>
                <button onClick={onClose}
                  className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="h-4 w-4 text-slate-600" />
                </button>
              </div>

              {/* State switch */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl">
                {(["fresh", "upcoming"] as FreshState[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setAddState(s)}
                    className={`flex-1 flex items-center justify-center gap-1.5
                      text-xs font-black py-2.5 rounded-xl transition-all ${
                      addState === s
                        ? s === "fresh"
                          ? "bg-[#051F0A] text-[#B5E935] shadow-md"
                          : "bg-amber-500 text-white shadow-md"
                        : "text-slate-500"
                    }`}
                  >
                    {s === "fresh"
                      ? <><Leaf className="h-3.5 w-3.5" /> Bu Gün</>
                      : <><Clock className="h-3.5 w-3.5" /> Gələcək</>
                    }
                  </button>
                ))}
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Məhsul axtar..."
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200
                    text-sm outline-none focus:border-emerald-400 focus:ring-2
                    focus:ring-emerald-100 transition-all bg-slate-50"
                  autoFocus
                />
              </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-y-auto px-5 space-y-1.5">
              {filtered.length === 0 ? (
                <div className="text-center py-10 text-slate-400">
                  <Package className="w-10 h-10 mx-auto mb-2 text-slate-200" />
                  <p className="text-sm font-bold">Nəticə tapılmadı</p>
                </div>
              ) : (
                filtered.slice(0, 40).map((p) => {
                  const isSelected = selected.has(p.id);
                  return (
                    <motion.button
                      key={p.id}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => toggleSelect(p.id)}
                      className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left
                        transition-all border ${
                        isSelected
                          ? "bg-emerald-50 border-emerald-200"
                          : "bg-slate-50 border-transparent hover:border-slate-200"
                      }`}
                    >
                      <div className="relative w-11 h-11 rounded-xl overflow-hidden
                        bg-slate-200 shrink-0">
                        {p.images?.[0] ? (
                          <Image src={getFirstImageUrl(p)} alt={p.name} fill className="object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">🥬</div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-sm text-slate-900 truncate">{p.name}</p>
                        <p className="text-[11px] text-slate-400 mt-0.5">
                          {formatCurrency(getProductBasePrice(p))}
                        </p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center
                        transition-all ${isSelected
                          ? "bg-emerald-500 border-emerald-500"
                          : "border-slate-300"
                        }`}>
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </motion.button>
                  );
                })
              )}
            </div>

            {/* Confirm bar */}
            <AnimatePresence>
              {selected.size > 0 && (
                <motion.div
                  initial={{ y: 60, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: 60, opacity: 0 }}
                  className="px-5 py-4 border-t border-slate-100 bg-white pb-safe-bottom"
                >
                  <button
                    onClick={handleConfirm}
                    className="w-full flex items-center justify-center gap-2
                      bg-[#051F0A] text-[#B5E935] font-black text-sm rounded-2xl py-3.5"
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    {selected.size} məhsul əlavə et →{" "}
                    {addState === "fresh" ? "Bu Gün" : "Gələcək"}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN ADMIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function AdminFreshTodayPage() {
  const hasHydrated = useHasHydrated();
  const products = useApp((s) => s.products);
  const updateProduct = useApp((s) => s.updateProduct);

  const [activeTab, setActiveTab] = useState<FreshState>("fresh");
  const [showAdd, setShowAdd] = useState(false);
  const [searchQ, setSearchQ] = useState("");

  /* Derive fresh state */
  const getState = useCallback((p: Product): FreshState => {
    if (p.isNewArrival || p.statusTags?.includes("new")) return "fresh";
    if (p.statusTags?.includes("upcoming")) return "upcoming";
    return "none";
  }, []);

  const managedProducts = useMemo<ManagedProduct[]>(() => {
    if (!products) return [];
    return products
      .filter((p) => !p.archived)
      .map((p) => ({ ...p, freshState: getState(p) }));
  }, [products, getState]);

  const freshList = managedProducts.filter((p) => p.freshState === "fresh");
  const upcomingList = managedProducts.filter((p) => p.freshState === "upcoming");
  const noneList = managedProducts.filter((p) => p.freshState === "none");

  /* Filtered active list */
  const rawActiveList = activeTab === "fresh" ? freshList : upcomingList;
  const activeList = useMemo(() => {
    if (!searchQ) return rawActiveList;
    const q = searchQ.toLowerCase();
    return rawActiveList.filter((p) => p.name.toLowerCase().includes(q));
  }, [rawActiveList, searchQ]);

  const handleStateChange = useCallback((
    id: string,
    newState: FreshState,
    extra: Partial<ManagedProduct> = {}
  ) => {
    const product = managedProducts.find((p) => p.id === id);
    if (!product) return;

    const tags = (product.statusTags ?? []).filter(
      (t) => t !== "new" && t !== "upcoming"
    );

    updateProduct({
      ...product,
      ...extra,
      isNewArrival: newState === "fresh",
      statusTags: [
        ...tags,
        ...(newState === "fresh" ? ["new"] : []),
        ...(newState === "upcoming" ? ["upcoming"] : []),
      ],
    });
  }, [managedProducts, updateProduct]);

  const handleAdd = (p: Product, state: FreshState) => handleStateChange(p.id, state);

  /* Stats */
  const hotCount = freshList.filter((p) => (p as ManagedProduct).isHot).length;
  const lowStockCount = freshList.filter((p) => {
    const s = p.variants?.[0]?.stock ?? 0;
    return s > 0 && s <= 5;
  }).length;
  const outCount = freshList.filter((p) => (p.variants?.[0]?.stock ?? 0) <= 0).length;

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="flex gap-2">
          {[0,1,2].map((i) => (
            <div key={i}
              className="w-2.5 h-2.5 rounded-full bg-emerald-600 animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-white border-b border-slate-100 shadow-sm">
        <div className="flex items-center gap-3 px-4 pt-4 pb-3">
          <div className="w-10 h-10 rounded-2xl bg-[#051F0A] flex items-center justify-center shrink-0">
            <Leaf className="h-5 w-5 text-[#B5E935]" />
          </div>
          <div className="flex-1 min-w-0">
            <h1 className="font-black text-slate-900 text-base leading-tight">
              Bu Gün Gələnlər
            </h1>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {freshList.length} aktiv · {upcomingList.length} gözlənilir
            </p>
          </div>
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={() => setShowAdd(true)}
            className="flex items-center gap-1.5 bg-[#051F0A] text-[#B5E935]
              text-sm font-black px-3.5 py-2.5 rounded-xl shadow-lg
              shadow-[#051F0A]/20 active:scale-95 transition-all"
          >
            <Plus className="h-4 w-4" />
            <span className="hidden sm:inline">Əlavə et</span>
            <span className="sm:hidden">+</span>
          </motion.button>
        </div>

        {/* Stats row */}
        <div className="flex gap-2 px-4 pb-3">
          <StatCard
            icon={<Leaf className="w-4 h-4" />}
            label="Bu Gün"
            value={freshList.length}
            color="green"
          />
          <StatCard
            icon={<Clock className="w-4 h-4" />}
            label="Gələcək"
            value={upcomingList.length}
            color="amber"
          />
          <StatCard
            icon={<AlertCircle className="w-4 h-4" />}
            label="Az qalıb"
            value={lowStockCount + outCount}
            color={lowStockCount + outCount > 0 ? "blue" : "slate"}
            sub={outCount > 0 ? `${outCount} tükənib` : undefined}
          />
        </div>

        {/* Tabs */}
        <div className="flex gap-1.5 px-4 pb-3">
          {(["fresh", "upcoming"] as FreshState[]).map((tab) => {
            const count = tab === "fresh" ? freshList.length : upcomingList.length;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setSearchQ(""); }}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs
                  font-black transition-all ${active
                    ? "bg-[#051F0A] text-[#B5E935]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  }`}
              >
                {tab === "fresh" ? (
                  <><Leaf className="h-3.5 w-3.5" /> Bu Gün</>
                ) : (
                  <><Clock className="h-3.5 w-3.5" /> Gələcək</>
                )}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? "bg-[#B5E935]/20 text-[#B5E935]" : "bg-white text-slate-600"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="px-4 pb-3">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder={`${activeTab === "fresh" ? "Aktiv" : "Gözlənilən"} məhsullarda axtar...`}
              value={searchQ}
              onChange={(e) => setSearchQ(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-slate-100 text-sm
                outline-none focus:bg-white focus:ring-2 focus:ring-emerald-200
                border border-transparent focus:border-emerald-300 transition-all"
            />
          </div>
        </div>
      </div>

      {/* ── LIST ── */}
      <div className="p-4 space-y-2.5">
        <AnimatePresence mode="popLayout">
          {activeList.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <div className="w-16 h-16 bg-white rounded-3xl shadow-sm flex items-center
                justify-center text-4xl mx-auto mb-4">
                {activeTab === "fresh" ? "🌱" : "📭"}
              </div>
              <p className="font-black text-slate-700 text-sm">
                {searchQ
                  ? "Axtarış nəticəsi tapılmadı"
                  : activeTab === "fresh"
                    ? "Bu gün heç bir məhsul yoxdur"
                    : "Gələcək məhsul əlavə edilməyib"
                }
              </p>
              {!searchQ && (
                <p className="text-xs text-slate-400 mt-1.5 mb-4">
                  Sağ yuxarıdakı «+» düyməsini basın
                </p>
              )}
              {!searchQ && (
                <button
                  onClick={() => setShowAdd(true)}
                  className="inline-flex items-center gap-2 bg-[#051F0A] text-[#B5E935]
                    text-sm font-black px-5 py-2.5 rounded-xl"
                >
                  <Plus className="h-4 w-4" /> Məhsul əlavə et
                </button>
              )}
            </motion.div>
          ) : (
            <Reorder.Group
              axis="y"
              values={activeList}
              onReorder={() => {}}
              as="div"
              className="space-y-2.5"
            >
              {activeList.map((p) => (
                <ManagedRow
                  key={p.id}
                  product={p}
                  onStateChange={handleStateChange}
                  mode={activeTab}
                />
              ))}
            </Reorder.Group>
          )}
        </AnimatePresence>
      </div>

      {/* ── ADD MODAL ── */}
      <AddModal
        open={showAdd}
        onClose={() => setShowAdd(false)}
        available={noneList}
        onAdd={handleAdd}
      />
    </div>
  );
}