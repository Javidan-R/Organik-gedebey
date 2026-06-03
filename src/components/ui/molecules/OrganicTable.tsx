"use client";

import React, { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from "framer-motion";
import { ShoppingBag, Eye, X, Plus, Minus, Sparkle } from "lucide-react";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";

// ======================= KÖMƏKÇİ FUNKSİYALAR =======================
const getDiscountPct = (p: Product): number => {
  const base = getProductBasePrice(p);
  const price = finalPrice(base, p.discountType, p.discountValue);
  if (base <= 0 || price >= base) return 0;
  return Math.round((1 - price / base) * 100);
};

const getIconForProduct = (p: Product): string => {
  const name = p.name.toLowerCase();
  if (name.includes("bal")) return "🍯";
  if (name.includes("pendir")) return "🧀";
  if (name.includes("yumurta")) return "🥚";
  if (name.includes("alma")) return "🍎";
  if (name.includes("yağ")) return "🧈";
  if (name.includes("çörək")) return "🍞";
  if (name.includes("tərəvəz")) return "🥕";
  return "🌾";
};

const getBenefit = (p: Product): string => {
  const name = p.name.toLowerCase();
  if (name.includes("bal")) return "Antioksidant";
  if (name.includes("pendir")) return "Kalsium";
  if (name.includes("yumurta")) return "Protein";
  if (name.includes("alma")) return "Vitamin C";
  if (name.includes("yağ")) return "A,D,E";
  return "Təbii";
};

const getDescription = (p: Product): string => {
  return p.description?.slice(0, 65) || "Təmiz kənd məhsulu";
};

// Tək AudioContext ilə səs (bir dəfə yaradılır)
let audioCtx: AudioContext | null = null;
const playClickSound = () => {
  if (typeof window === "undefined") return;
  try {
    if (!audioCtx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      audioCtx = new AudioContextClass();
    }
    // Brauzer autoplay siyasəti – istifadəçi ilk dəfə klik edəndə səs çıxar
    if (audioCtx.state === "suspended") {
      audioCtx.resume();
    }
    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();
    osc.connect(gain);
    gain.connect(audioCtx.destination);
    osc.frequency.value = 600;
    gain.gain.setValueAtTime(0.05, audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);
    osc.start();
    osc.stop(audioCtx.currentTime + 0.1);
  } catch (e) {
    // Səs dəstəklənməyən brauzerlər üçün
  }
};

// Quick View Modal (təkmilləşdirilmiş)
const QuickViewModal = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
  const addToCart = useApp((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const base = getProductBasePrice(product);
  const price = finalPrice(base, product.discountType, product.discountValue);
  const stock = product.variants?.[0]?.stock ?? 10;
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="relative h-56 bg-slate-100">
          <Image
            src={getFirstImageUrl(product)}
            alt={product.name}
            fill
            className="object-contain p-4"
          />
          <button
            onClick={onClose}
            className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 shadow-md flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-black text-slate-800">{product.name}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">
            {product.description || "Təbii və saf kənd məhsulu"}
          </p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black text-emerald-700">{formatCurrency(price)}</span>
            {getDiscountPct(product) > 0 && (
              <span className="line-through text-slate-400">{formatCurrency(base)}</span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center bg-slate-100 rounded-xl">
              <button
                onClick={() => setQty(Math.max(1, qty - 1))}
                className="w-8 h-8 flex items-center justify-center"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button
                onClick={() => setQty(Math.min(stock, qty + 1))}
                className="w-8 h-8 flex items-center justify-center"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
            <button
              onClick={() => {
                addToCart(product.id, product.variants?.[0]?.id, qty);
                onClose();
              }}
              className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2"
            >
              <ShoppingBag className="w-4 h-4" /> Səbətə at
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ======================= ƏSAS ORGANIC TABLE =======================
export const OrganicTable = ({ products = [] }: { products?: Product[] }) => {
  const [activeItem, setActiveItem] = useState<Product | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 3D tilt üçün motion dəyərləri
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 80, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 80, damping: 30 });
  const rotateX = useTransform(springY, [-300, 300], [8, -8]);
  const rotateY = useTransform(springX, [-300, 300], [-8, 8]);
  const shadowX = useTransform(springX, [-200, 200], [10, -10]);
  const shadowY = useTransform(springY, [-200, 200], [10, -10]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    mouseX.set(x);
    mouseY.set(y);
  }, [mouseX, mouseY]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    setActiveItem(null);
  }, [mouseX, mouseY]);

  // Təhlükəsiz məhsul siyahısı (SSR üçün)
  const activeProducts = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products
      .filter((p) => p && !p.archived)
      .sort((a, b) => getDiscountPct(b) - getDiscountPct(a))
      .slice(0, 16); // daha çox məhsul göstərmək üçün 16
  }, [products]);

  const handleItemClick = (product: Product) => {
    playClickSound();
    setQuickViewProduct(product);
  };

  // Fallback
  if (!activeProducts.length) {
    return (
      <div className="w-full aspect-square md:aspect-[4/3] rounded-3xl bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center text-slate-400">
        Məhsul yoxdur
      </div>
    );
  }

  return (
    <>
      <div
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        className="relative w-full aspect-square md:aspect-[4/3] rounded-[2.5rem] overflow-hidden bg-gradient-to-br from-emerald-50/70 via-lime-50/40 to-amber-50/50 shadow-inner border border-emerald-100/40"
      >
        {/* Dekorativ radials */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,250,230,0.9),transparent_75%)] pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-200/20 rounded-full blur-[90px] animate-pulse pointer-events-none" />

        {/* 3D kölgə */}
        <motion.div
          style={{ x: shadowX, y: shadowY }}
          className="absolute w-[85%] h-[85%] bg-emerald-950/5 rounded-[3rem] blur-2xl pointer-events-none"
        />

        {/* 3D əyilən süfrə səthi */}
        <motion.div
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
          }}
          className="relative w-full h-full flex items-center justify-center"
        >
          {/* Süfrə bazası (kağız/taxta görünüş) */}
          <div className="absolute w-[90%] h-[90%] rounded-[2rem] bg-white shadow-[0_30px_50px_-15px_rgba(16,83,19,0.1)] border border-emerald-50/80 overflow-hidden">
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(240,245,230,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(240,245,230,0.4)_1px,transparent_1px)] bg-[size:32px_32px]" />
            {/* Dairəvi naxışlar */}
            <div className="w-[75%] h-[75%] rounded-full border border-dashed border-emerald-200/50 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            <div className="w-[60%] h-[60%] rounded-full border border-dashed border-emerald-100/40 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>

          {/* Məhsul grid (CSS Grid – daha etibarlı) */}
          <div className="absolute inset-0 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-6 md:p-8 z-10">
            {activeProducts.map((product, idx) => {
              const isActive = activeItem?.id === product.id;
              const discount = getDiscountPct(product);
              const icon = getIconForProduct(product);
              return (
                <motion.div
                  key={product.id}
                  className="flex flex-col items-center justify-center cursor-pointer group"
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1, y: [0, -4, 0] }}
                  transition={{
                    delay: idx * 0.03,
                    duration: 0.4,
                    y: { repeat: Infinity, duration: 2.5, delay: idx * 0.1, ease: "easeInOut" },
                  }}
                  whileHover={{ scale: 1.1, z: 20 }}
                  onMouseEnter={() => setActiveItem(product)}
                  onMouseLeave={() => setActiveItem(null)}
                  onClick={() => handleItemClick(product)}
                >
                  <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-md border border-emerald-100 flex items-center justify-center transition-all duration-200 hover:shadow-xl hover:border-emerald-300">
                    <div className="absolute inset-1 rounded-full border border-dashed border-emerald-100/60" />
                    <span className="text-2xl md:text-4xl drop-shadow-md transition-transform duration-200 group-hover:scale-110">
                      {icon}
                    </span>
                    {discount > 0 && (
                      <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] md:text-[9px] font-black px-1.5 py-0.5 rounded-full shadow-sm">
                        -{discount}%
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] md:text-xs font-semibold text-slate-600 mt-1.5 text-center line-clamp-1 max-w-[70px]">
                    {product.name}
                  </span>

                  {/* Tooltip – yalnız hover zamanı (desktop) */}
                  <AnimatePresence>
                    {isActive && (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.9 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 8, scale: 0.9 }}
                        transition={{ duration: 0.15 }}
                        className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-30 bg-white/95 backdrop-blur-md rounded-xl px-3 py-2 shadow-lg border border-emerald-100 w-48 text-center pointer-events-none"
                      >
                        <p className="text-xs font-bold text-slate-800">{product.name}</p>
                        <p className="text-[9px] text-emerald-600">{getBenefit(product)}</p>
                        <p className="text-[9px] text-slate-500 line-clamp-2">{getDescription(product)}</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>

          {/* Təlimat mesajı (aktiv məhsul yoxdursa) */}
          <AnimatePresence>
            {!activeItem && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute bottom-4 left-4 right-4 z-20 text-center"
              >
                <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-full px-4 py-2 border border-emerald-100 shadow-lg text-xs md:text-sm">
                  <Sparkle className="w-3 h-3 text-amber-500" />
                  <span className="font-bold text-emerald-800">Məhsullara toxun / hover et</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Mobil alt göstərici */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 md:hidden">
          {activeProducts.slice(0, 5).map((_, i) => (
            <div key={i} className="w-1.5 h-1.5 rounded-full bg-emerald-400/50" />
          ))}
        </div>
      </div>

      {/* Quick View Modal */}
      <AnimatePresence>
        {quickViewProduct && (
          <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
        )}
      </AnimatePresence>
    </>
  );
};