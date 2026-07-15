"use client";

/**
 * Bu Gün Gələnlər — Premium Storefront
 * Instagram Stories + Luxury E-Commerce hybrid
 * Mobile-first, gesture-friendly, cinematic animations
 */
 
import {
  useMemo, useState, useCallback, useRef, useEffect, 
} from "react";
import {
  motion, AnimatePresence,  useInView
} from "framer-motion";
import {
  Leaf, ShoppingBag, Heart, Share2, Bell, BellOff, X,
  Flame, Sparkles, MapPin,
  Clock, Star, Minus, Plus, Ban, ArrowRight, Check,
  Bookmark, BookmarkCheck, Eye, Zap, TimerOff, 
  Calendar, ShieldCheck, Truck, Crown,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useApp, useHasHydrated } from "@/lib/store";
import { finalPrice } from "@/lib/calc";
import {
  getFirstImageUrl,
  getProductBasePrice,
  formatCurrency,
} from "@/utils/product";
import type { ID, Product } from "@/types/products";

/* ══════════════════════════════════════════════════════════════════
   TYPES & CONSTANTS
══════════════════════════════════════════════════════════════════ */
type ViewMode = "grid" | "feed";
type TabMode = "fresh" | "upcoming";

const STORY_DURATION = 5000; // ms per story slide

/* ══════════════════════════════════════════════════════════════════
   HOOKS
══════════════════════════════════════════════════════════════════ */
function useLocalStorage<T>(key: string, initial: T) {
  const [val, setVal] = useState<T>(() => {
    if (typeof window === "undefined") return initial;
    try {
      const s = localStorage.getItem(key);
      return s ? (JSON.parse(s) as T) : initial;
    } catch {
      return initial;
    }
  });
  useEffect(() => {
    try { localStorage.setItem(key, JSON.stringify(val)); } catch {}
  }, [key, val]);
  return [val, setVal] as const;
}


/* ══════════════════════════════════════════════════════════════════
   STORY PROGRESS BAR
══════════════════════════════════════════════════════════════════ */
function StoryProgressBars({
  total,
  current,
  progress,
}: {
  total: number;
  current: number;
  progress: number;
}) {
  return (
    <div className="flex gap-1 w-full px-3">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden"
        >
          <motion.div
            className="h-full bg-white rounded-full origin-left"
            initial={{ scaleX: 0 }}
            animate={{
              scaleX: i < current ? 1 : i === current ? progress / 100 : 0,
            }}
            transition={{ ease: "linear", duration: 0 }}
          />
        </div>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FULL-SCREEN STORY VIEWER
══════════════════════════════════════════════════════════════════ */
function StoryViewer({
  products,
  startIndex,
  open,
  onClose,
}: {
  products: Product[];
  startIndex: number;
  open: boolean;
  onClose: () => void;
}) {
  const addToCart = useApp((s) => s.addToCart);
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [swipedUp, setSwipedUp] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const product = products[current];

  const clearTimer = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setProgress(0);
    if (paused) return;
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - start;
      const p = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearTimer();
        setCurrent((c) => {
          if (c < products.length - 1) return c + 1;
          onClose();
          return c;
        });
      }
    }, 50);
  }, [paused, products.length, onClose]);

  useEffect(() => {
    if (open) { setCurrent(startIndex); setProgress(0); }
  }, [open, startIndex]);

  useEffect(() => {
    if (open) startTimer();
    return clearTimer;
  }, [open, current, paused, startTimer]);

  const goNext = () => {
    if (current < products.length - 1) setCurrent((c) => c + 1);
    else onClose();
  };
  const goPrev = () => {
    if (current > 0) setCurrent((c) => c - 1);
  };

  if (!product || !open) return null;

  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  const stock = product.variants?.[0]?.stock ?? 0;

  const handleShare = async () => {
    const text = `🌿 *${product.name}*\n\n💰 ${formatCurrency(price)}\n\n🛒 Sifarişlər üçün WhatsApp:\nhttps://wa.me/994773676021`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text });
      else window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
    } catch {}
  };

  return (
    <AnimatePresence>
      <motion.div
        key="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black"
      >
        {/* Background Image */}
        <div className="absolute inset-0">
          <Image
            src={getFirstImageUrl(product)}
            alt={product.name}
            fill
            className="object-cover"
            priority
          />
          {/* Gradient overlays */}
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
        </div>

        {/* TOP BAR */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top pt-4 space-y-2">
          <StoryProgressBars
            total={products.length}
            current={current}
            progress={progress}
          />
          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#B5E935] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#051F0A]" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Organik Gədəbəy</p>
                <p className="text-white/60 text-[10px]">Bu gün gəldi · {current + 1}/{products.length}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                className="p-1.5"
              >
                <div className={`w-4 h-4 flex gap-0.5 items-center ${paused ? "opacity-100" : "opacity-60"}`}>
                  {paused ? (
                    <div className="w-3 h-3 border-l-2 border-r-2 border-white" />
                  ) : (
                    <>
                      <div className="w-1 h-4 bg-white rounded-full" />
                      <div className="w-1 h-4 bg-white rounded-full" />
                    </>
                  )}
                </div>
              </button>
              <button onClick={onClose} className="p-1">
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>
          </div>
        </div>

        {/* TAP ZONES */}
        <button
          onClick={goPrev}
          className="absolute left-0 top-0 bottom-0 w-1/3 z-10"
        />
        <button
          onClick={goNext}
          className="absolute right-0 top-0 bottom-0 w-2/3 z-10"
        />

        {/* BOTTOM PRODUCT INFO */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={product.id}
          className="absolute bottom-0 left-0 right-0 z-20 p-5 pb-safe-bottom"
        >
          {/* Glassmorphism card */}
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/20 space-y-3">
            {/* Tags */}
            <div className="flex items-center gap-2">
              {discount > 0 && (
                <span className="bg-red-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Zap className="w-2.5 h-2.5" />
                  -{discount}%
                </span>
              )}
              {stock > 0 && stock <= 5 && (
                <span className="bg-orange-500/90 text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                  <Flame className="w-2.5 h-2.5" />
                  Son {stock} ədəd!
                </span>
              )}
              <span className="bg-[#B5E935]/90 text-[#051F0A] text-[10px] font-bold px-2.5 py-1 rounded-full">
                {product.originRegion || "Gədəbəy"}
              </span>
            </div>

            {/* Name & Price */}
            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-black text-xl leading-tight">
                  {product.name}
                </h2>
                {product.description && (
                  <p className="text-white/60 text-xs mt-1 line-clamp-2">
                    {product.description}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#B5E935] font-black text-2xl leading-none">
                  {formatCurrency(price)}
                </p>
                {discount > 0 && (
                  <p className="text-white/40 text-xs line-through mt-0.5">
                    {formatCurrency(basePrice)}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2.5 pt-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  addToCart(product.id, product.variants?.[0]?.id, 1);
                  setSwipedUp(true);
                  setTimeout(() => setSwipedUp(false), 1500);
                }}
                disabled={stock <= 0}
                className="flex-1 flex items-center justify-center gap-2 bg-[#B5E935] text-[#051F0A]
                  font-black text-sm rounded-2xl py-3.5 shadow-xl active:scale-95 transition-all
                  disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {swipedUp ? (
                  <><Check className="w-4 h-4" /> Əlavə edildi!</>
                ) : stock <= 0 ? (
                  <><Ban className="w-4 h-4" /> Bitib</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Səbətə əlavə et</>
                )}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center
                  border border-white/20 active:bg-white/25 transition-all"
              >
                <Share2 className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            {/* WhatsApp quick order */}
            <a
              href={`https://wa.me/994773676021?text=${encodeURIComponent(`Salam! ${product.name} sifariş etmək istəyirəm 🌿`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366]/90 text-white
                font-bold text-xs rounded-xl py-2.5 w-full active:opacity-80 transition-all"
              onClick={(e) => e.stopPropagation()}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4 fill-white">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
              </svg>
              WhatsApp ilə sifariş ver
            </a>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   STORY BUBBLE
══════════════════════════════════════════════════════════════════ */
function StoryBubble({
  product,
  index,
  seen,
  onClick,
}: {
  product: Product | null;
  index: number;
  seen: boolean;
  onClick: () => void;
}) {
  const isAll = product === null;
  const stock = product?.variants?.[0]?.stock ?? 999;
  const isHot = !isAll && stock > 0 && stock <= 3;

  const ringClass = seen
    ? "bg-slate-300"
    : isHot
    ? "bg-gradient-to-tr from-red-400 via-orange-400 to-yellow-500"
    : isAll
    ? "bg-gradient-to-tr from-[#B5E935] via-emerald-400 to-teal-500"
    : "bg-gradient-to-tr from-[#B5E935] via-lime-400 to-emerald-500";

  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 snap-start"
    >
      <div className={`relative p-[2.5px] rounded-full ${ringClass}`}>
        <div className="p-[2.5px] rounded-full bg-white">
          <div className="relative w-[62px] h-[62px] rounded-full overflow-hidden bg-emerald-50">
            {isAll ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B5E935] to-emerald-500">
                <Sparkles className="w-7 h-7 text-[#051F0A]" />
              </div>
            ) : (
              <Image
                src={getFirstImageUrl(product!)}
                alt={product!.name}
                fill
                className="object-cover"
              />
            )}
          </div>
        </div>
        {isHot && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full
            flex items-center justify-center shadow-lg">
            <Flame className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {seen && !isAll && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-slate-400 rounded-full
            flex items-center justify-center">
            <Eye className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-600 text-center max-w-[70px] line-clamp-1">
        {isAll ? "Hamısı" : product!.name}
      </span>
    </motion.button>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD — GRID MODE (compact, premium)
══════════════════════════════════════════════════════════════════ */
function GridCard({
  product,
  saved,
  onSave,
  onQuickView,
  onShare,
  index,
}: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onQuickView: () => void;
  onShare: () => void;
  index: number;
}) {
  const addToCart = useApp((s) => s.addToCart);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-30px" });
  const [added, setAdded] = useState(false);

  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  // Use product.stock if available (from server-side fetch with variants)
  // Otherwise calculate from all variants
  const stock = (product.stock !== undefined && product.stock !== null) 
    ? product.stock 
    : (product.variants?.reduce((sum: number, v: any) => sum + (v.stock || 0), 0) ?? 0);
  const isOut = stock <= 0;
  const isLow = stock > 0 && stock <= 5;

  const handleAdd = () => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id, 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: (index % 6) * 0.06,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group bg-white rounded-2xl overflow-hidden
        shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)]
        transition-shadow duration-500 border border-slate-100/80"
    >
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-slate-100 cursor-pointer"
        onClick={onQuickView}
      >
        <Image
          src={getFirstImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 50vw, 33vw"
        />

        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent
          opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Badges */}
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full
            px-2 py-[3px] text-[9px] font-black text-emerald-700 shadow-sm">
            <Leaf className="w-2.5 h-2.5 text-emerald-500" />
            TƏZƏ
          </div>
          {discount > 0 && (
            <div className="flex items-center gap-1 bg-red-500 rounded-full
              px-2 py-[3px] text-[9px] font-black text-white shadow-sm">
              <Zap className="w-2.5 h-2.5" />
              -{discount}%
            </div>
          )}
        </div>

        {/* Save button */}
        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-md
            flex items-center justify-center transition-all duration-200
            ${saved
              ? "bg-red-500 text-white"
              : "bg-white/90 text-slate-500 hover:bg-white"
            }`}
        >
          <Heart className={`w-3.5 h-3.5 ${saved ? "fill-white" : ""}`} />
        </motion.button>

        {/* Low stock banner */}
        {isLow && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-red-500/90
            to-transparent px-3 py-2 flex items-center gap-1">
            <TimerOff className="w-3 h-3 text-white" />
            <span className="text-[10px] font-black text-white">Son {stock} ədəd!</span>
          </div>
        )}
        {isOut && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px]
            flex items-center justify-center">
            <span className="bg-black/70 text-white text-[11px] font-black
              px-3 py-1.5 rounded-full">Tükənib</span>
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50
            px-2 py-0.5 rounded-full">
            {product.originRegion || "Gədəbəy"}
          </span>
          <div className="flex gap-0.5">
            {[1,2,3,4,5].map((s) => (
              <Star key={s} className={`w-2.5 h-2.5 ${s<=4?"fill-amber-400 text-amber-400":"text-slate-200"}`} />
            ))}
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-[#051F0A]">
            {formatCurrency(price)}
          </span>
          {discount > 0 && (
            <span className="text-[11px] text-slate-400 line-through">
              {formatCurrency(basePrice)}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-1.5 pt-0.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={isOut}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5
              rounded-xl py-2.5 text-[11px] font-black transition-all
              ${isOut
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : added
                ? "bg-emerald-500 text-white"
                : "bg-[#051F0A] text-[#B5E935] hover:bg-[#0A2714] active:scale-95"
              }`}
          >
            {added ? (
              <><Check className="w-3.5 h-3.5" /> Əlavə edildi</>
            ) : isOut ? (
              <><Ban className="w-3 h-3" /> Bitib</>
            ) : (
              <><ShoppingBag className="w-3.5 h-3.5" /> Səbətə</>
            )}
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={onShare}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center
              hover:bg-slate-200 active:scale-95 transition-all"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRODUCT CARD — FEED MODE (editorial, large)
══════════════════════════════════════════════════════════════════ */
function FeedCard({
  product,
  saved,
  onSave,
  onShare,
  index,
}: {
  product: Product;
  saved: boolean;
  onSave: () => void;
  onShare: () => void;
  index: number;
}) {
  const addToCart = useApp((s) => s.addToCart);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-40px" });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  const stock = product.variants?.[0]?.stock ?? 0;
  const isOut = stock <= 0;

  const handleAdd = () => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22,1,0.36,1] }}
      className="bg-white rounded-3xl overflow-hidden
        shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={getFirstImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

        {/* Top badges */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#B5E935] text-[#051F0A]
            rounded-full px-3 py-1 text-[10px] font-black shadow-lg">
            <Leaf className="w-3 h-3" />
            BU GÜN GƏLDİ
          </div>
          {discount > 0 && (
            <div className="flex items-center gap-1 bg-red-500 text-white
              rounded-full px-2.5 py-1 text-[10px] font-black shadow-lg">
              <Flame className="w-2.5 h-2.5" />
              -{discount}%
            </div>
          )}
        </div>

        {/* Top right */}
        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSave}
            className={`w-9 h-9 rounded-full shadow-lg flex items-center justify-center
              ${saved ? "bg-red-500" : "bg-white/90 backdrop-blur-sm"}`}
          >
            <Heart className={`w-4 h-4 ${saved ? "fill-white text-white" : "text-slate-600"}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onShare}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg
              flex items-center justify-center"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>

        {/* Bottom product name overlay */}
        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-black text-xl leading-tight drop-shadow-lg">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3 h-3 text-[#B5E935]" />
            <span className="text-[#B5E935] text-xs font-bold">
              {product.originRegion || "Gədəbəy"}
            </span>
          </div>
        </div>
      </div>

      {/* Bottom info */}
      <div className="p-4 space-y-3.5">
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#051F0A]">{formatCurrency(price)}</span>
            {discount > 0 && (
              <span className="text-sm text-slate-400 line-through">{formatCurrency(basePrice)}</span>
            )}
          </div>
          {stock > 0 && stock <= 5 && (
            <span className="text-[11px] font-bold text-orange-600 bg-orange-50
              px-2.5 py-1 rounded-full">
              Son {stock} ədəd
            </span>
          )}
        </div>

        {/* Qty + Cart */}
        <div className="flex items-center gap-3">
          {!isOut && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  hover:bg-white transition-all active:scale-95"
              >
                <Minus className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <span className="w-8 text-center text-sm font-black text-slate-700">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock || 99, qty + 1))}
                className="w-8 h-8 rounded-lg flex items-center justify-center
                  hover:bg-white transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          )}
          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={isOut}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-2
              rounded-2xl py-3 text-sm font-black transition-all duration-300
              ${isOut
                ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                : added
                ? "bg-emerald-500 text-white shadow-lg shadow-emerald-200"
                : "bg-[#051F0A] text-[#B5E935] shadow-xl hover:shadow-2xl active:scale-95"
              }`}
          >
            {added ? (
              <><Check className="w-4 h-4" /> Səbətə əlavə edildi!</>
            ) : isOut ? (
              <><Ban className="w-4 h-4" /> Tükənib</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> {formatCurrency(price * qty)} - Əlavə et</>
            )}
          </motion.button>
        </div>

        {/* WhatsApp */}
        <a
          href={`https://wa.me/994773676021?text=${encodeURIComponent(`Salam! ${product.name} - ${qty} ədəd sifariş etmək istəyirəm 🌿`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-2 border-[#25D366]
            text-[#25D366] font-bold text-xs rounded-2xl py-2.5 w-full
            active:bg-[#25D366] active:text-white transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp ilə sifariş ver
        </a>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   UPCOMING PRODUCT CARD (pre-save / notify)
══════════════════════════════════════════════════════════════════ */
function UpcomingCard({
  product,
  notified,
  onNotify,
  index,
}: {
  product: Product;
  notified: boolean;
  onNotify: () => void;
  index: number;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: "-30px" });

  const basePrice = getProductBasePrice(product);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      className="relative bg-white rounded-2xl overflow-hidden
        border border-dashed border-slate-200 shadow-sm"
    >
      {/* Blurred image */}
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <Image
          src={getFirstImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover blur-[3px] scale-105 brightness-75"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-600/40" />

        {/* Coming soon badge */}
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 bg-amber-400 text-amber-900
            rounded-full px-2.5 py-1 text-[9px] font-black shadow-lg">
            <Clock className="w-2.5 h-2.5" />
            GƏLƏCƏK
          </div>
        </div>

        {/* Center lock icon */}
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl
            flex items-center justify-center border border-white/30">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <span className="text-white/70 text-xs font-bold">Tezliklə</span>
        </div>
      </div>

      {/* Info */}
      <div className="p-3 space-y-2">
        <h3 className="text-sm font-black text-slate-700 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-slate-400">
          Gözlənilən qiymət: <span className="font-bold text-slate-600">{formatCurrency(basePrice)}</span>
        </p>
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNotify}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5
            text-[11px] font-black transition-all duration-300
            ${notified
              ? "bg-amber-100 text-amber-700 border border-amber-200"
              : "bg-slate-900 text-amber-400 hover:bg-slate-800"
            }`}
        >
          {notified ? (
            <><BellOff className="w-3.5 h-3.5" /> Bildiriş aktiv</>
          ) : (
            <><Bell className="w-3.5 h-3.5" /> Xəbər ver</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   QUICK VIEW BOTTOM SHEET
══════════════════════════════════════════════════════════════════ */
function QuickViewSheet({
  product,
  open,
  onClose,
}: {
  product: Product | null;
  open: boolean;
  onClose: () => void;
}) {
  const addToCart = useApp((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  const stock = product.variants?.[0]?.stock ?? 0;
  const isOut = stock <= 0;

  const handleAdd = () => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id, qty);
    setAdded(true);
    setTimeout(() => { setAdded(false); onClose(); }, 1500);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          {/* Sheet */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white
              rounded-t-[32px] max-h-[88vh] overflow-y-auto"
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-slate-200 rounded-full" />
            </div>

            {/* Image */}
            <div className="relative aspect-[4/3] mx-4 rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={getFirstImageUrl(product)}
                alt={product.name}
                fill
                className="object-cover"
              />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 bg-black/40
                  backdrop-blur-sm rounded-full flex items-center justify-center"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white
                  text-xs font-black px-2.5 py-1 rounded-full">
                  -{discount}%
                </div>
              )}
            </div>

            {/* Content */}
            <div className="p-5 space-y-4 pb-safe-bottom pb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 mb-1">
                    {product.originRegion || "Gədəbəy"} · Ekoloji
                  </p>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {product.name}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-[#051F0A]">{formatCurrency(price)}</p>
                  {discount > 0 && (
                    <p className="text-sm text-slate-400 line-through">{formatCurrency(basePrice)}</p>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
              )}

              {/* Features */}
              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Leaf className="w-4 h-4" />, label: "Ekoloji" },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: "Keyfiyyətli" },
                  { icon: <Truck className="w-4 h-4" />, label: "Çatdırılma" },
                ].map((f) => (
                  <div key={f.label}
                    className="flex flex-col items-center gap-1 bg-slate-50
                      rounded-xl py-2.5 text-center">
                    <span className="text-emerald-600">{f.icon}</span>
                    <span className="text-[10px] font-bold text-slate-600">{f.label}</span>
                  </div>
                ))}
              </div>

              {/* Stock warning */}
              {stock > 0 && stock <= 5 && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100
                  rounded-xl px-3 py-2.5">
                  <TimerOff className="w-4 h-4 text-orange-500 shrink-0" />
                  <p className="text-xs font-bold text-orange-700">
                    Diqqət! Yalnız {stock} ədəd qalıb!
                  </p>
                </div>
              )}

              {/* Qty + Cart */}
              <div className="flex items-center gap-3">
                {!isOut && (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                    <button onClick={() => setQty(Math.max(1, qty-1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center
                        hover:bg-white transition-all">
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-9 text-center text-sm font-black">{qty}</span>
                    <button onClick={() => setQty(Math.min(stock||99, qty+1))}
                      className="w-9 h-9 rounded-xl flex items-center justify-center
                        hover:bg-white transition-all">
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}
                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={isOut}
                  onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-2
                    rounded-2xl py-3.5 text-sm font-black transition-all
                    ${isOut
                      ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                      : added
                      ? "bg-emerald-500 text-white"
                      : "bg-[#051F0A] text-[#B5E935]"
                    }`}
                >
                  {added ? (
                    <><Check className="w-4 h-4" /> Əlavə edildi!</>
                  ) : isOut ? (
                    <><Ban className="w-4 h-4" /> Tükənib</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /> {formatCurrency(price*qty)} - Əlavə et</>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   SAVED DRAWER
══════════════════════════════════════════════════════════════════ */
function SavedDrawer({
  open,
  onClose,
  savedIds,
  products,
  onRemove,
}: {
  open: boolean;
  onClose: () => void;
  savedIds: ID[];
  products: Product[];
  onRemove: (id: ID) => void;
}) {
  const saved = products.filter((p) => savedIds.includes(p.id));

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 32, stiffness: 350 }}
            className="fixed right-0 top-0 bottom-0 z-50 bg-white w-80 max-w-full
              shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-emerald-600" />
                Saxlanılanlar
              </h3>
              <button onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {saved.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Hələ saxlanılmayıb</p>
                  <p className="text-xs text-slate-400 mt-1">Məhsul kartındakı ♡ düyməsinə basın</p>
                </div>
              ) : (
                saved.map((p) => {
                  const price = finalPrice(
                    getProductBasePrice(p), p.discountType, p.discountValue
                  );
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug || p.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50
                        hover:bg-emerald-50 transition group"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        <Image src={getFirstImageUrl(p)} alt={p.name} fill className="object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          {formatCurrency(price)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => { e.preventDefault(); onRemove(p.id); }}
                        className="p-1.5 rounded-lg hover:bg-red-100 transition"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </button>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function FreshTodayPage() {
  const hasHydrated = useHasHydrated();
  const products = useApp((s) => s.products);
  const categories = useApp((s) => s.categories);

  const [savedIds, setSavedIds] = useLocalStorage<ID[]>("ft-saved", []);
  const [notifiedIds, setNotifiedIds] = useLocalStorage<ID[]>("ft-notified", []);
  const [seenStoryIds, setSeenStoryIds] = useLocalStorage<ID[]>("ft-seen", []);

  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [activeTab, setActiveTab] = useState<TabMode>("fresh");
  const [activeFilter, setActiveFilter] = useState<string>("all");

  const [storyViewerOpen, setStoryViewerOpen] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);

  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [showSaved, setShowSaved] = useState(false);

  const [toast, setToast] = useState<{ msg: string; icon?: React.ReactNode } | null>(null);

  const showToast = useCallback((msg: string, icon?: React.ReactNode) => {
    setToast({ msg, icon });
    setTimeout(() => setToast(null), 2200);
  }, []);

  /* Fresh products */
  const freshProducts = useMemo(() => {
    if (!products) return [];
    const now = Date.now();
    const twoDaysAgo = now - 48 * 60 * 60 * 1000;
    return products
      .filter((p) => {
        if (p.archived) return false;
        const isNew = p.isNewArrival || p.statusTags?.includes("newArrival");
        const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        return isNew || createdAt > twoDaysAgo;
      })
      .sort((a, b) => {
        const aT = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const bT = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return bT - aT;
      });
  }, [products]);

  /* Upcoming products */
  const upcomingProducts = useMemo(() => {
    if (!products) return [];
    return products.filter(
      (p) => !p.archived && p.statusTags?.includes("upcoming")
    );
  }, [products]);

  /* Category filter */
  const freshCategories = useMemo(() => {
    const ids = new Set(freshProducts.map((p) => p.categoryId));
    return categories.filter((c) => ids.has(c.id));
  }, [freshProducts, categories]);

  const displayProducts = useMemo(() => {
    const list = activeTab === "fresh" ? freshProducts : upcomingProducts;
    if (activeFilter === "all") return list;
    const cat = categories.find((c) => c.slug === activeFilter || c.id === activeFilter);
    if (!cat) return list;
    return list.filter((p) => p.categoryId === cat.id);
  }, [activeTab, freshProducts, upcomingProducts, activeFilter, categories]);

  /* Actions */
  const handleSave = useCallback((id: ID) => {
    setSavedIds((prev) => {
      const has = prev.includes(id);
      showToast(has ? "Siyahıdan çıxarıldı" : "Saxlanıldı!", has ? undefined : <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500" />);
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, [setSavedIds, showToast]);

  const handleNotify = useCallback((id: ID) => {
    setNotifiedIds((prev) => {
      const has = prev.includes(id);
      showToast(has ? "Bildiriş ləğv edildi" : "Bildiriş quruldu! 🔔");
      return has ? prev.filter((x) => x !== id) : [...prev, id];
    });
  }, [setNotifiedIds, showToast]);

  const handleShare = useCallback(async (product: Product) => {
    const basePrice = getProductBasePrice(product);
    const price = finalPrice(basePrice, product.discountType, product.discountValue);
    const text = `🌿 *${product.name}*\n💰 ${formatCurrency(price)}\n\n📍 Organik Gədəbəy — Təzə kənd məhsulları\n\n🛒 Sifariş: ${window.location.origin}/product/${product.slug || product.id}`;
    const waUrl = `https://wa.me/?text=${encodeURIComponent(text)}`;
    try {
      if (navigator.share) await navigator.share({ title: product.name, text, url: window.location.href });
      else window.open(waUrl, "_blank");
    } catch {}
    showToast("Paylaşma linki kopyalandı!");
  }, [showToast]);

  const openStory = (index: number) => {
    setStoryStartIndex(index);
    setStoryViewerOpen(true);
    // Mark as seen
    const p = freshProducts[index];
    if (p && !seenStoryIds.includes(p.id)) {
      setSeenStoryIds((prev) => [...prev, p.id]);
    }
  };

  /* Loading state */
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-[#FDFBF4] flex flex-col items-center justify-center gap-4">
        <motion.div
          animate={{ rotate: 360, scale: [1, 1.1, 1] }}
          transition={{ rotate: { repeat: Infinity, duration: 1.2, ease: "linear" }, scale: { repeat: Infinity, duration: 2 } }}
        >
          <Leaf className="w-10 h-10 text-emerald-500" />
        </motion.div>
        <motion.p
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="text-sm font-bold text-slate-500"
        >
          Təzə məhsullar yüklənir...
        </motion.p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FDFBF4] font-sans">
     
      {/* ── HEADER ── */}
      <div className="sticky top-0 z-40 bg-[#FDFBF4]/90 backdrop-blur-xl
        border-b border-slate-200/60">

        {/* Top bar */}
        <div className="flex items-center justify-between px-4 pt-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="w-10 h-10 rounded-2xl bg-[#051F0A] flex items-center justify-center">
                <Leaf className="w-5 h-5 text-[#B5E935]" />
              </div>
              {/* Live dot */}
              <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full
                border-2 border-[#FDFBF4]">
                <span className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-75" />
              </span>
            </div>
            <div>
              <h1 className="text-base font-black text-slate-900 leading-tight">
                Bu Gün Gələnlər
              </h1>
              <p className="text-[10px] text-emerald-600 font-bold">
                {freshProducts.length} təzə · {upcomingProducts.length} gözlənilir
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* View toggle */}
            <button
              onClick={() => setViewMode(viewMode === "grid" ? "feed" : "grid")}
              className="w-9 h-9 rounded-xl bg-white border border-slate-200
                flex items-center justify-center shadow-sm active:scale-95 transition-all"
            >
              {viewMode === "grid" ? (
                <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="8" height="11" rx="2" />
                  <rect x="13" y="3" width="8" height="11" rx="2" />
                  <rect x="3" y="17" width="18" height="4" rx="2" />
                </svg>
              ) : (
                <svg className="w-4 h-4 text-slate-600" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.5">
                  <rect x="3" y="3" width="8" height="8" rx="2" />
                  <rect x="13" y="3" width="8" height="8" rx="2" />
                  <rect x="3" y="13" width="8" height="8" rx="2" />
                  <rect x="13" y="13" width="8" height="8" rx="2" />
                </svg>
              )}
            </button>

            {/* Saved */}
            <motion.button
              whileTap={{ scale: 0.92 }}
              onClick={() => setShowSaved(true)}
              className="relative w-9 h-9 rounded-xl bg-white border border-slate-200
                flex items-center justify-center shadow-sm"
            >
              <Bookmark className="w-4 h-4 text-slate-600" />
              <AnimatePresence>
                {savedIds.length > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] bg-red-500
                      rounded-full text-[9px] font-black text-white flex items-center justify-center px-1"
                  >
                    {savedIds.length}
                  </motion.span>
                )}
              </AnimatePresence>
            </motion.button>
          </div>
        </div>

        {/* ── STORY BAR ── */}
        {freshProducts.length > 0 && (
          <div className="relative py-2">
            <div className="absolute left-0 top-0 bottom-0 w-6
              bg-gradient-to-r from-[#FDFBF4] to-transparent z-10 pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-6
              bg-gradient-to-l from-[#FDFBF4] to-transparent z-10 pointer-events-none" />
            <div className="flex gap-3 overflow-x-auto scrollbar-hide px-4">
              {/* "All" bubble */}
              <StoryBubble
                product={null}
                index={-1}
                seen={false}
                onClick={() => openStory(0)}
              />
              {freshProducts.slice(0, 12).map((p, i) => (
                <StoryBubble
                  key={p.id}
                  product={p}
                  index={i}
                  seen={seenStoryIds.includes(p.id)}
                  onClick={() => openStory(i)}
                />
              ))}
            </div>
          </div>
        )}

        {/* ── TABS ── */}
        <div className="flex items-center gap-2 px-4 pb-2.5 pt-1">
          {(["fresh", "upcoming"] as TabMode[]).map((tab) => {
            const count = tab === "fresh" ? freshProducts.length : upcomingProducts.length;
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => { setActiveTab(tab); setActiveFilter("all"); }}
                className={`flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-black
                  transition-all duration-200 ${active
                    ? "bg-[#051F0A] text-[#B5E935] shadow-lg"
                    : "bg-white text-slate-500 border border-slate-200"
                  }`}
              >
                {tab === "fresh" ? (
                  <><Leaf className="w-3 h-3" /> Bu Gün</>
                ) : (
                  <><Clock className="w-3 h-3" /> Gələcək</>
                )}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-full ${
                  active ? "bg-[#B5E935]/20 text-[#B5E935]" : "bg-slate-100 text-slate-500"
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* ── CATEGORY FILTERS ── */}
        {activeTab === "fresh" && freshCategories.length > 0 && (
          <div className="flex items-center gap-1.5 px-4 pb-3 overflow-x-auto scrollbar-hide">
            <button
              onClick={() => setActiveFilter("all")}
              className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                activeFilter === "all"
                  ? "bg-[#B5E935] text-[#051F0A]"
                  : "bg-white text-slate-500 border border-slate-200"
              }`}
            >
              Hamısı
            </button>
            {freshCategories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveFilter(cat.id)}
                className={`shrink-0 rounded-full px-3 py-1 text-[10px] font-bold transition-all ${
                  activeFilter === cat.id
                    ? "bg-[#B5E935] text-[#051F0A]"
                    : "bg-white text-slate-500 border border-slate-200"
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── MAIN CONTENT ── */}
      <main className="max-w-2xl mx-auto px-3 py-4 pb-24">
        {displayProducts.length > 0 ? (
          activeTab === "fresh" ? (
            viewMode === "grid" ? (
              <div className="grid grid-cols-2 gap-3">
                {displayProducts.map((p, i) => (
                  <GridCard
                    key={p.id}
                    product={p}
                    index={i}
                    saved={savedIds.includes(p.id)}
                    onSave={() => handleSave(p.id)}
                    onQuickView={() => setQuickViewProduct(p)}
                    onShare={() => handleShare(p)}
                  />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {displayProducts.map((p, i) => (
                  <FeedCard
                    key={p.id}
                    product={p}
                    index={i}
                    saved={savedIds.includes(p.id)}
                    onSave={() => handleSave(p.id)}
                    onShare={() => handleShare(p)}
                  />
                ))}
              </div>
            )
          ) : (
            /* Upcoming grid */
            <div className="space-y-4">
              {/* Header */}
              <div className="flex items-center gap-3 bg-amber-50 border border-amber-100
                rounded-2xl p-4">
                <div className="w-10 h-10 bg-amber-100 rounded-xl flex items-center justify-center">
                  <Bell className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-black text-amber-900">Gələcək Məhsullar</p>
                  <p className="text-xs text-amber-700">
                    Bildiriş qurun, gələn kimi xəbər alın!
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {displayProducts.map((p, i) => (
                  <UpcomingCard
                    key={p.id}
                    product={p}
                    index={i}
                    notified={notifiedIds.includes(p.id)}
                    onNotify={() => handleNotify(p.id)}
                  />
                ))}
              </div>
            </div>
          )
        ) : (
          /* Empty state */
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
            >
              {activeTab === "fresh" ? (
                <Leaf className="w-16 h-16 text-slate-200" />
              ) : (
                <Calendar className="w-16 h-16 text-slate-200" />
              )}
            </motion.div>
            <h3 className="mt-5 text-lg font-black text-slate-700">
              {activeTab === "fresh" ? "Bu gün yeni məhsul yoxdur" : "Gözlənilən məhsul yoxdur"}
            </h3>
            <p className="text-sm text-slate-400 mt-1.5">
              {activeTab === "fresh"
                ? "Sabah daha çox olacaq 🌱"
                : "Tezliklə yeni məhsullar gəlir!"
              }
            </p>
            <Link
              href="/products"
              className="mt-6 inline-flex items-center gap-2 rounded-full
                bg-[#051F0A] px-6 py-3 text-sm font-bold text-[#B5E935]
                shadow-xl active:scale-95 transition-all"
            >
              <ShoppingBag className="w-4 h-4" />
              Bütün məhsullar
              <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>
        )}

        {/* ── BOTTOM CTA ── */}
        {displayProducts.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mt-6 relative overflow-hidden rounded-3xl
              bg-[#051F0A] p-6 text-center"
          >
            {/* Decorative blobs */}
            <div className="absolute -top-8 -right-8 w-32 h-32 bg-[#B5E935]/20
              rounded-full blur-2xl" />
            <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-emerald-500/20
              rounded-full blur-2xl" />

            <div className="relative z-10">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0], scale: [1, 1.05, 1] }}
                transition={{ repeat: Infinity, duration: 4 }}
              >
                <Crown className="w-10 h-10 text-[#B5E935] mx-auto" />
              </motion.div>
              <h2 className="mt-3 text-lg font-black text-white">
                Gələcək məhsullardan<br />ilk siz xəbərdar olun!
              </h2>
              <p className="mt-2 text-xs text-white/50 max-w-xs mx-auto">
                Bəyəndiyiniz məhsulları saxlayın, gələn kimi bildiriş alın
              </p>
              <div className="mt-4 flex flex-col gap-2.5">
                <button
                  onClick={() => setActiveTab("upcoming")}
                  className="flex items-center justify-center gap-2 bg-[#B5E935]
                    text-[#051F0A] font-black text-sm rounded-2xl py-3
                    active:scale-95 transition-all"
                >
                  <Bell className="w-4 h-4" />
                  Gələcək məhsulları gör ({upcomingProducts.length})
                </button>
                <Link
                  href="/products"
                  className="flex items-center justify-center gap-2 border border-white/20
                    text-white/70 font-bold text-sm rounded-2xl py-3
                    active:bg-white/10 transition-all"
                >
                  Bütün məhsullar <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* ── STORY VIEWER ── */}
      <StoryViewer
        products={freshProducts}
        startIndex={storyStartIndex}
        open={storyViewerOpen}
        onClose={() => setStoryViewerOpen(false)}
      />

      {/* ── QUICK VIEW ── */}
      <QuickViewSheet
        product={quickViewProduct}
        open={!!quickViewProduct}
        onClose={() => setQuickViewProduct(null)}
      />

      {/* ── SAVED DRAWER ── */}
      <SavedDrawer
        open={showSaved}
        onClose={() => setShowSaved(false)}
        savedIds={savedIds}
        products={products ?? []}
        onRemove={handleSave}
      />
    </div>
  );
}