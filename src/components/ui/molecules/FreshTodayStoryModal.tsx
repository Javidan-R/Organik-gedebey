"use client";

import { motion, AnimatePresence, PanInfo } from "framer-motion";
import {
  X, ChevronLeft, ChevronRight, ShoppingBag, Heart, Share2,
  CheckCircle2, Plus, Sparkles, Flame, Clock
} from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import { finalPrice } from "@/lib/calc";
import type { Product } from "@/types/products";

/* ────────────────────────────────────────────────────────────────── */
/* PROGRESS BAR (unchanged)                                          */
/* ────────────────────────────────────────────────────────────────── */
function StoryProgress({ total, current, progress, paused }: {
  total: number; current: number; progress: number; paused: boolean;
}) {
  return (
    <div className="flex items-center gap-1 w-full">
      {Array.from({ length: total }).map((_, i) => (
        <div key={i} className="flex-1 h-0.5 rounded-full bg-white/30 overflow-hidden">
          {i < current ? (
            <div className="h-full bg-white w-full" />
          ) : i === current ? (
            <motion.div className="h-full bg-white" style={{ width: `${progress}%` }} />
          ) : null}
        </div>
      ))}
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────── */
/* MAIN MODAL (HOOKS FIXED + REAL DATA)                              */
/* ────────────────────────────────────────────────────────────────── */
const STORY_DURATION = 8000;

interface FreshTodayStoryModalProps {
  open: boolean;
  initialIndex: number;
  onClose: () => void;
  items: Product[];           // <── real products from store
}

export function FreshTodayStoryModal({
  open,
  initialIndex,
  onClose,
  items,                      // now received as prop
}: FreshTodayStoryModalProps) {
  // ---------- ALL HOOKS (unconditional, top level) ----------
  const [idx, setIdx] = useState(initialIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  // Reset when modal opens or index changes
  useEffect(() => {
    if (open) {
      setIdx(initialIndex);
      setProgress(0);
      setQty(1);
      setAdded(false);
    }
  }, [open, initialIndex]);

  // Auto-advance timer
  const clearTimer = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    if (!open || items.length === 0) return;
    clearTimer();
    startRef.current = Date.now();
    if (paused) return;

    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min((elapsed / STORY_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearTimer();
        if (idx < items.length - 1) {
          setIdx(i => i + 1);
        } else {
          onClose();
        }
      }
    }, 50);

    return clearTimer;
  }, [open, idx, paused, items.length, onClose, clearTimer]);

  // Keyboard navigation
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goTo(idx - 1);
      if (e.key === "ArrowRight") goTo(idx + 1);
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, idx, onClose]);

  // ---------- Helper functions ----------
  const goTo = (i: number) => {
    if (i < 0 || i >= items.length) {
      onClose();
      return;
    }
    setIdx(i);
    setProgress(0);
  };

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -50) goTo(idx + 1);
    else if (info.offset.x > 50) goTo(idx - 1);
  };

  const handleAddToCart = () => {
    const product = items[idx];
    if (!product) return;
    const addToCart = useApp.getState().addToCart;
    addToCart(product.id, product.variants?.[0]?.id, qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    const product = items[idx];
    if (!product) return;
    const url = `${window.location.origin}/product/${product.slug || product.id}`;
    if (navigator.share) {
      navigator.share({ title: product.name, text: `${product.name} — ${formatCurrency(finalPrice(getProductBasePrice(product), product.discountType, product.discountValue))}`, url });
    } else {
      navigator.clipboard?.writeText(url);
    }
  };

  // Early return AFTER all hooks
  if (!open || items.length === 0) return null;

  const product = items[idx];
  if (!product) return null;

  const img = getFirstImageUrl(product);
  const base = getProductBasePrice(product);
  const price = finalPrice(base, product.discountType, product.discountValue);
  const discount = base > 0 ? Math.round((1 - price / base) * 100) : 0;
  const stock = product.variants?.[0]?.stock ?? 0;
  const isNew = product.isNewArrival || product.statusTags?.includes("newArrival");
  const isUpcoming = product.statusTags?.includes("upcoming");

  return (
    <AnimatePresence>
      <motion.div
        key="fresh-story-modal"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/90"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.15}
          onDragEnd={handleDragEnd}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="relative w-full max-w-sm h-[90vh] rounded-3xl overflow-hidden shadow-2xl bg-slate-900"
          onMouseDown={() => setPaused(true)}
          onMouseUp={() => setPaused(false)}
          onTouchStart={() => setPaused(true)}
          onTouchEnd={() => setPaused(false)}
        >
          {/* Background image */}
          <div className="absolute inset-0">
            <Image
              src={img}
              alt={product.name}
              fill
              className="object-cover opacity-60"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          </div>

          {/* Top bar */}
          <div className="absolute top-0 left-0 right-0 z-20 px-4 pt-4">
            <StoryProgress total={items.length} current={idx} progress={progress} paused={paused} />
            <div className="flex items-center justify-between mt-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500 flex items-center justify-center text-white font-black text-xs">
                  {product.name.charAt(0)}
                </div>
                <span className="text-white font-bold text-xs">
                  {isUpcoming ? 'Sabah Gəlir' : 'Bu Gün Gəldi'}
                </span>
              </div>
              <button onClick={onClose} className="w-8 h-8 rounded-full bg-black/25 backdrop-blur flex items-center justify-center text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Navigation arrows (desktop) */}
          {idx > 0 && (
            <button onClick={() => goTo(idx - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hidden md:flex items-center justify-center">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          {idx < items.length - 1 && (
            <button onClick={() => goTo(idx + 1)} className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur text-white hidden md:flex items-center justify-center">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}

          {/* Bottom content */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <div className="backdrop-blur-xl bg-black/40 rounded-3xl p-5 border border-white/10 space-y-3">
              <h2 className="text-xl font-black text-white leading-tight">{product.name}</h2>
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-black text-emerald-400">{formatCurrency(price)}</span>
                {discount > 0 && (
                  <>
                    <span className="text-sm text-white/50 line-through">{formatCurrency(base)}</span>
                    <span className="text-xs font-black text-red-400 bg-red-500/20 px-2 py-0.5 rounded-full">-{discount}%</span>
                  </>
                )}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {isNew && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full">
                    <Sparkles className="w-3 h-3" /> Təzə
                  </span>
                )}
                {stock > 0 && stock <= 5 && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-500/20 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3" /> Son {stock} ədəd!
                  </span>
                )}
                {isUpcoming && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-blue-300 bg-blue-500/20 px-2 py-0.5 rounded-full">
                    <Clock className="w-3 h-3" /> Sabah gəlir
                  </span>
                )}
              </div>
              {!isUpcoming ? (
                <div className="flex items-center gap-2 pt-1">
                  <div className="flex items-center bg-white/10 rounded-xl overflow-hidden">
                    <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-9 h-10 flex items-center justify-center text-white/80">
                      <span className="text-lg font-black">−</span>
                    </button>
                    <span className="min-w-[28px] text-center text-sm font-black text-white">{qty}</span>
                    <button onClick={() => setQty(q => Math.min(stock || 99, q + 1))} className="w-9 h-10 flex items-center justify-center text-white/80">
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.94 }}
                    onClick={handleAddToCart}
                    className={`flex-1 flex items-center justify-center gap-2 font-black text-sm rounded-2xl py-3 transition-all shadow-lg ${
                      added ? "bg-emerald-600 text-white" : "bg-yellow-400 text-emerald-900"
                    }`}
                  >
                    <AnimatePresence mode="wait">
                      {added ? (
                        <motion.span key="added" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <CheckCircle2 className="w-4 h-4" /> Əlavə edildi!
                        </motion.span>
                      ) : (
                        <motion.span key="add" initial={{ scale: 0 }} animate={{ scale: 1 }}>
                          <ShoppingBag className="w-4 h-4" /> Səbətə at
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </motion.button>
                </div>
              ) : (
                <button className="w-full bg-blue-600 text-white font-black text-sm rounded-2xl py-3">
                  Sabah üçün sifariş ver
                </button>
              )}
              <div className="flex items-center justify-between">
                <button onClick={handleShare} className="text-white/70 text-xs font-bold flex items-center gap-1">
                  <Share2 className="w-3.5 h-3.5" /> Paylaş
                </button>
                <button onClick={() => setLiked(s => { const n = new Set(s); n.has(product.id) ? n.delete(product.id) : n.add(product.id); return n; })} className={`text-xs font-bold flex items-center gap-1 ${liked.has(product.id) ? 'text-red-400' : 'text-white/70'}`}>
                  <Heart className={`w-3.5 h-3.5 ${liked.has(product.id) ? 'fill-red-400' : ''}`} /> Bəyən
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}