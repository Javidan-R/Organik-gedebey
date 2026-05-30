"use client";

/**
 * FreshTodayStoryBar — Enhanced v2
 *
 * Yeniliklər:
 * - Kateqoriya filter tabları
 * - Farmer avatar + ad
 * - Freshness countdown (neçə saat əvvəl dərildi)
 * - "Bu gün gəldi" vs "Sabah gəlir" seksiyas
 * - Stok durumu (az qalıb badge)
 * - Animated "Yeni" badge
 * - Horizontal scroll story rings (Instagram-style)
 */

import { motion, AnimatePresence } from "framer-motion";
import {
  Leaf, Clock, MapPin, Truck, Zap, Sun,
  CheckCircle2, AlertCircle, ChevronRight,
  Wheat, Apple, Droplets, Egg,
} from "lucide-react";
import { useState, useRef, useMemo } from "react";

/* ══════════════════════════════════════════════════════════════════
   TYPES
══════════════════════════════════════════════════════════════════ */
export interface FreshStoryItem {
  id: string;
  productName: string;
  farmName: string;
  farmerInitials: string;
  farmerColor: string;       // tailwind bg class e.g. "bg-emerald-600"
  region: string;
  category: "meyvə" | "tərəvəz" | "süd" | "bal" | "taxıl" | "digər";
  hoursAgo: number;          // neçə saat əvvəl dərildi / hazırlandı
  availableToday: boolean;
  stockLeft?: number;        // undefined = bol stok
  imageEmoji: string;        // fallback emoji
  imageSrc?: string;
  isNew?: boolean;
  isBestSeller?: boolean;
  preOrderAvailable?: boolean; // sabah üçün sifariş vermək olar
  pricePerUnit?: string;
}

interface FreshTodayStoryBarProps {
  onOpenStory: (index: number) => void;
  items?: FreshStoryItem[];
}

/* ══════════════════════════════════════════════════════════════════
   MOCK DATA — real data olmadıqda
══════════════════════════════════════════════════════════════════ */
const DEMO_ITEMS: FreshStoryItem[] = [
  {
    id: "1", productName: "Çiçək Balı", farmName: "Bəylər Arıxanası",
    farmerInitials: "BK", farmerColor: "bg-yellow-600",
    region: "Gədəbəy", category: "bal", hoursAgo: 2,
    availableToday: true, stockLeft: 8,
    imageEmoji: "🍯", isNew: false, isBestSeller: true, pricePerUnit: "18₼/kg",
  },
  {
    id: "2", productName: "Kənd Südü", farmName: "Əhmədli Ferması",
    farmerInitials: "ƏF", farmerColor: "bg-sky-600",
    region: "Gəncə", category: "süd", hoursAgo: 1,
    availableToday: true, stockLeft: 15,
    imageEmoji: "🥛", isNew: true, pricePerUnit: "2.5₼/L",
  },
  {
    id: "3", productName: "Pomidor", farmName: "Qasımov Bağı",
    farmerInitials: "QB", farmerColor: "bg-red-500",
    region: "Gədəbəy", category: "tərəvəz", hoursAgo: 3,
    availableToday: true,
    imageEmoji: "🍅", isBestSeller: false, pricePerUnit: "3₼/kg",
  },
  {
    id: "4", productName: "Üzüm", farmName: "Nəcəfov Bağı",
    farmerInitials: "NB", farmerColor: "bg-purple-600",
    region: "Gəncə", category: "meyvə", hoursAgo: 4,
    availableToday: true, stockLeft: 5,
    imageEmoji: "🍇", isNew: false, pricePerUnit: "5₼/kg",
  },
  {
    id: "5", productName: "Kənd Yumurtası", farmName: "Muradov Ferması",
    farmerInitials: "MF", farmerColor: "bg-amber-600",
    region: "Göygöl", category: "süd", hoursAgo: 2,
    availableToday: true,
    imageEmoji: "🥚", isNew: true, pricePerUnit: "6₼/12 ədəd",
  },
  {
    id: "6", productName: "Alma (Aport)", farmName: "İsmayılov Bağı",
    farmerInitials: "İB", farmerColor: "bg-rose-500",
    region: "Gədəbəy", category: "meyvə", hoursAgo: 5,
    availableToday: true, isBestSeller: true,
    imageEmoji: "🍎", pricePerUnit: "4₼/kg",
  },
  {
    id: "7", productName: "Lobya", farmName: "Hüseynov Bağçası",
    farmerInitials: "HB", farmerColor: "bg-green-700",
    region: "Gədəbəy", category: "tərəvəz", hoursAgo: 6,
    availableToday: false, preOrderAvailable: true,
    imageEmoji: "🫘", pricePerUnit: "7₼/kg",
  },
  {
    id: "8", productName: "Buğda Unu", farmName: "Kəlbəliyev Dəyirmanı",
    farmerInitials: "KD", farmerColor: "bg-stone-600",
    region: "Gəncə", category: "taxıl", hoursAgo: 8,
    availableToday: true,
    imageEmoji: "🌾", isNew: true, pricePerUnit: "2₼/kg",
  },
];

/* ══════════════════════════════════════════════════════════════════
   CATEGORY CONFIG
══════════════════════════════════════════════════════════════════ */
const CATEGORIES = [
  { key: "hamısı", label: "Hamısı", icon: <Leaf className="w-3.5 h-3.5" /> },
  { key: "meyvə", label: "Meyvə", icon: <Apple className="w-3.5 h-3.5" /> },
  { key: "tərəvəz", label: "Tərəvəz", icon: <span className="text-xs">🥬</span> },
  { key: "süd", label: "Süd məh.", icon: <Droplets className="w-3.5 h-3.5" /> },
  { key: "bal", label: "Bal", icon: <span className="text-xs">🍯</span> },
  { key: "taxıl", label: "Taxıl", icon: <Wheat className="w-3.5 h-3.5" /> },
] as const;

/* ══════════════════════════════════════════════════════════════════
   FRESHNESS LABEL
══════════════════════════════════════════════════════════════════ */
function freshnessLabel(h: number): { label: string; color: string } {
  if (h <= 1) return { label: "1 saat əvvəl", color: "text-emerald-600" };
  if (h <= 3) return { label: `${h} saat əvvəl`, color: "text-emerald-600" };
  if (h <= 6) return { label: `${h} saat əvvəl`, color: "text-amber-600" };
  return { label: `${h} saat əvvəl`, color: "text-orange-600" };
}

/* ══════════════════════════════════════════════════════════════════
   STORY RING CARD
══════════════════════════════════════════════════════════════════ */
function StoryRing({
  item,
  index,
  seen,
  onClick,
}: {
  item: FreshStoryItem;
  index: number;
  seen: boolean;
  onClick: () => void;
}) {
  const fresh = freshnessLabel(item.hoursAgo);

  return (
    <motion.button
      whileHover={{ y: -3, scale: 1.02 }}
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      className="flex flex-col items-center gap-2 shrink-0 w-[76px]"
    >
      {/* Ring */}
      <div className={`relative p-[2.5px] rounded-full transition-all ${
        seen
          ? "bg-slate-200"
          : item.availableToday
          ? "bg-gradient-to-br from-emerald-400 via-yellow-400 to-emerald-600"
          : "bg-gradient-to-br from-slate-300 to-slate-400"
      }`}>
        <div className={`w-14 h-14 rounded-full overflow-hidden flex items-center
          justify-center text-2xl border-2 border-white
          ${seen ? "opacity-60" : "opacity-100"}
          ${item.farmerColor}`}
        >
          {item.imageSrc ? (
            <img src={item.imageSrc} alt={item.productName}
              className="w-full h-full object-cover" />
          ) : (
            <span className="text-2xl select-none">{item.imageEmoji}</span>
          )}
        </div>

        {/* "Yeni" badge */}
        {item.isNew && !seen && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full
              bg-yellow-400 border-2 border-white
              flex items-center justify-center z-10"
          >
            <Zap className="w-2.5 h-2.5 text-emerald-900" />
          </motion.div>
        )}

        {/* Low stock badge */}
        {item.stockLeft !== undefined && item.stockLeft <= 5 && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.15, 1] }}
            transition={{ delay: 0.2 }}
            className="absolute -bottom-1 -right-1 bg-red-500 border-2 border-white
              rounded-full px-1.5 py-0.5 z-10"
          >
            <span className="text-[7px] font-black text-white leading-none">{item.stockLeft}</span>
          </motion.div>
        )}

        {/* Pre-order badge */}
        {item.preOrderAvailable && !item.availableToday && (
          <div className="absolute -bottom-1 -right-1 bg-blue-500 border-2 border-white
            rounded-full px-1 py-0.5 z-10">
            <span className="text-[7px] font-black text-white leading-none">SB</span>
          </div>
        )}
      </div>

      {/* Label */}
      <div className="text-center w-full">
        <p className={`text-[10px] font-black leading-tight line-clamp-2
          ${seen ? "text-slate-400" : "text-slate-800"}`}>
          {item.productName}
        </p>
        <p className={`text-[9px] font-semibold mt-0.5 ${fresh.color}`}>
          {fresh.label}
        </p>
        {item.pricePerUnit && (
          <p className="text-[9px] font-black text-emerald-700 mt-0.5">
            {item.pricePerUnit}
          </p>
        )}
      </div>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN COMPONENT
══════════════════════════════════════════════════════════════════ */
export function FreshTodayStoryBar({
  onOpenStory,
  items = DEMO_ITEMS,
}: FreshTodayStoryBarProps) {
  const [activeCategory, setActiveCategory] = useState<string>("hamısı");
  const [seen, setSeen] = useState<Set<string>>(new Set());
  const scrollRef = useRef<HTMLDivElement>(null);

  const filtered = useMemo(() => {
    if (activeCategory === "hamısı") return items;
    return items.filter((i) => i.category === activeCategory);
  }, [items, activeCategory]);

  const todayItems = filtered.filter((i) => i.availableToday);
  const tomorrowItems = filtered.filter((i) => !i.availableToday && i.preOrderAvailable);

  const handleOpen = (index: number) => {
    const item = filtered[index];
    if (item) setSeen((s) => new Set([...s, item.id]));
    onOpenStory(index);
  };

  const totalToday = items.filter((i) => i.availableToday).length;
  const lowStockCount = items.filter((i) => i.stockLeft !== undefined && i.stockLeft <= 5).length;

  return (
    <div className="space-y-3">
      {/* Header row */}
      <div className="flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <motion.div
              animate={{ scale: [1, 1.15, 1] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full bg-emerald-500"
            />
            <span className="text-sm font-black text-emerald-900">Bu Gün Gəldi</span>
          </div>
          <span className="text-xs bg-emerald-100 text-emerald-700 font-black
            px-2 py-0.5 rounded-full">
            {totalToday} məhsul
          </span>
          {lowStockCount > 0 && (
            <motion.span
              animate={{ opacity: [1, 0.6, 1] }}
              transition={{ repeat: Infinity, duration: 1.5 }}
              className="text-xs bg-red-100 text-red-600 font-black px-2 py-0.5 rounded-full"
            >
              ⚡ {lowStockCount} az qalıb
            </motion.span>
          )}
        </div>
        <button
          className="flex items-center gap-1 text-xs font-bold text-emerald-600
            hover:text-emerald-800 transition-colors"
        >
          Hamısı <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Category filter tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide pb-0.5">
        {CATEGORIES.map(({ key, label, icon }) => (
          <motion.button
            key={key}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.96 }}
            onClick={() => setActiveCategory(key)}
            className={`flex items-center gap-1.5 shrink-0 px-3 py-1.5 rounded-full
              text-xs font-bold transition-all border ${
              activeCategory === key
                ? "bg-emerald-700 text-white border-emerald-700 shadow-md shadow-emerald-700/20"
                : "bg-white text-slate-600 border-slate-200 hover:border-emerald-300"
            }`}
          >
            {icon}
            {label}
            {key !== "hamısı" && (
              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-black ${
                activeCategory === key
                  ? "bg-white/20 text-white"
                  : "bg-slate-100 text-slate-500"
              }`}>
                {items.filter((i) => key === "hamısı" || i.category === key).length}
              </span>
            )}
          </motion.button>
        ))}
      </div>

      {/* Today's items */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeCategory}
          initial={{ opacity: 0, x: 10 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -10 }}
          transition={{ duration: 0.2 }}
        >
          {todayItems.length > 0 ? (
            <div
              ref={scrollRef}
              className="flex items-start gap-3 overflow-x-auto scrollbar-hide pb-2 pt-1 px-0.5"
            >
              {todayItems.map((item, i) => (
                <StoryRing
                  key={item.id}
                  item={item}
                  index={filtered.indexOf(item)}
                  seen={seen.has(item.id)}
                  onClick={() => handleOpen(filtered.indexOf(item))}
                />
              ))}

              {/* "Sabah gəlir" items in same row */}
              {tomorrowItems.length > 0 && (
                <>
                  <div className="w-px self-stretch bg-slate-200 shrink-0 mx-1" />
                  {tomorrowItems.map((item) => (
                    <StoryRing
                      key={item.id}
                      item={item}
                      index={filtered.indexOf(item)}
                      seen={false}
                      onClick={() => handleOpen(filtered.indexOf(item))}
                    />
                  ))}
                </>
              )}
            </div>
          ) : (
            <div className="flex items-center justify-center py-6 rounded-2xl
              border border-dashed border-emerald-200 bg-emerald-50/50">
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-700">Bu kateqoriyada bu gün məhsul yoxdur</p>
                <p className="text-xs text-slate-400 mt-1">Digər kateqoriyanı yoxlayın</p>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Info strip */}
      <div className="flex items-center gap-3 overflow-x-auto scrollbar-hide pb-0.5">
        {[
          { icon: <Sun className="w-3 h-3 text-yellow-500" />, text: "Sübh dərilir, axşam çatdırılır" },
          { icon: <Truck className="w-3 h-3 text-emerald-600" />, text: "Eyni gün çatdırılma" },
          { icon: <CheckCircle2 className="w-3 h-3 text-emerald-600" />, text: "100% təzəlik zəmanəti" },
        ].map((info) => (
          <div key={info.text}
            className="flex items-center gap-1.5 shrink-0 text-[10px] font-bold
              text-slate-500 bg-white border border-slate-100 rounded-full px-3 py-1.5">
            {info.icon}
            {info.text}
          </div>
        ))}
      </div>
    </div>
  );
}