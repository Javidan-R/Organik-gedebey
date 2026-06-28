"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform, PanInfo } from "framer-motion";
import Image from "next/image";
import {
  Leaf, Heart, Share2, Eye, X, ChevronLeft, ChevronRight,
  ShoppingBag, Clock, Award, Sparkles, Droplets, Milk, Cherry,
  Plus, Minus, Volume2, VolumeX, Flower2, TrendingUp, Calendar,
  HeartHandshake, Truck, ShieldCheck, Star, MapPin, Users, Flame
} from "lucide-react";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";

// ========== KÖMƏKÇİ FUNKSİYALAR ==========
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

// ========== SƏS İDARƏSİ (tək AudioContext) ==========
class OrganicSound {
  private ctx: AudioContext | null = null;
  private natureBuffer: AudioBuffer | null = null;
  private natureSource: AudioBufferSourceNode | null = null;
  private natureGain: GainNode | null = null;
  private isPlaying = false;

  async init() {
    if (this.ctx) return;
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    this.ctx = new AudioContextClass();
    await this.ctx.suspend();
    // təbiət səsi (ağ səs)
    const sampleRate = this.ctx.sampleRate;
    const duration = 2.0;
    const buffer = this.ctx.createBuffer(1, sampleRate * duration, sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) {
      data[i] = Math.random() * 2 - 1;
    }
    this.natureBuffer = buffer;
  }

  async enable(enabled: boolean) {
    if (!this.ctx) await this.init();
    if (!this.ctx) return;
    if (enabled) {
      if (this.ctx.state === "suspended") await this.ctx.resume();
      if (!this.isPlaying && this.natureBuffer) {
        this.natureSource = this.ctx.createBufferSource();
        this.natureGain = this.ctx.createGain();
        this.natureSource.buffer = this.natureBuffer;
        this.natureSource.loop = true;
        this.natureGain.gain.value = 0.08;
        this.natureSource.connect(this.natureGain);
        this.natureGain.connect(this.ctx.destination);
        this.natureSource.start();
        this.isPlaying = true;
      }
    } else {
      if (this.natureSource) {
        this.natureSource.stop();
        this.natureSource.disconnect();
        this.natureSource = null;
      }
      if (this.natureGain) this.natureGain.disconnect();
      this.isPlaying = false;
      await this.ctx?.suspend();
    }
  }

  dispose() {
    if (this.natureSource) this.natureSource.stop();
    this.ctx?.close();
  }
}

const organicSound = new OrganicSound();

// ========== WİSHLIST HOOK (lokal storage, SSR təhlükəsiz) ==========
const useWishlist = () => {
  const [wishlist, setWishlist] = useState<string[] | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("organic_wishlist");
    setWishlist(saved ? JSON.parse(saved) : []);
    setLoading(false);
  }, []);

  const toggle = useCallback((id: string) => {
    setWishlist(prev => {
      if (prev === null) return prev;
      const next = prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id];
      localStorage.setItem("organic_wishlist", JSON.stringify(next));
      return next;
    });
  }, []);

  return { wishlist: wishlist || [], loading, toggle };
};

// ========== TƏZƏLİK DƏİRƏVİ PROQRESS (düzəldilmiş) ==========
const FreshnessRing = ({ percent }: { percent: number }) => {
  const radius = 18;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percent / 100) * circumference;
  return (
    <div className="relative w-12 h-12">
      <svg className="w-full h-full transform -rotate-90">
        <circle cx="24" cy="24" r={radius} stroke="#e2e8f0" strokeWidth="3" fill="none" />
        <circle
          cx="24" cy="24" r={radius} stroke="#10b981" strokeWidth="3"
          fill="none" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-[stroke-dashoffset] duration-700 ease-out"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-emerald-600">
        {percent}%
      </div>
    </div>
  );
};

// ========== QUICK VIEW MODAL ==========
const QuickViewModal = ({ product, onClose }: { product: Product | null; onClose: () => void }) => {
  const addToCart = useApp(s => s.addToCart);
  const [qty, setQty] = useState(1);
  if (!product) return null;
  const base = getProductBasePrice(product);
  const price = finalPrice(base, product.discountType, product.discountValue);
  const stock = product.variants?.[0]?.stock ?? 10;
  return (
    <motion.div
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 30 }}
        className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl"
        onClick={e => e.stopPropagation()}
      >
        <div className="relative h-56 bg-slate-100">
          <Image src={getFirstImageUrl(product)} alt={product.name} fill className="object-contain p-4" />
          <button onClick={onClose} className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/80 shadow-md flex items-center justify-center">
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5">
          <h3 className="text-xl font-black text-slate-800">{product.name}</h3>
          <p className="text-sm text-slate-500 mt-1 line-clamp-2">{product.description || "Təbii və saf kənd məhsulu"}</p>
          <div className="flex items-baseline gap-2 mt-3">
            <span className="text-2xl font-black text-emerald-700">{formatCurrency(price)}</span>
            {getDiscountPct(product) > 0 && <span className="line-through text-slate-400">{formatCurrency(base)}</span>}
          </div>
          <div className="flex items-center gap-3 mt-4">
            <div className="flex items-center bg-slate-100 rounded-xl">
              <button onClick={() => setQty(Math.max(1, qty-1))} className="w-8 h-8 flex items-center justify-center"><Minus className="w-3 h-3" /></button>
              <span className="w-8 text-center font-bold">{qty}</span>
              <button onClick={() => setQty(Math.min(stock, qty+1))} className="w-8 h-8 flex items-center justify-center"><Plus className="w-3 h-3" /></button>
            </div>
            <button onClick={() => { addToCart(product.id, product.variants?.[0]?.id, qty); onClose(); }} 
              className="flex-1 bg-slate-900 text-white font-bold py-2.5 rounded-xl flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4" /> Səbətə at
            </button>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

// ========== TƏKMİLLƏŞDİRİLMİŞ ORQANİK SÜFRƏ (3D tilt, 10+ məhsul) ==========
const EnhancedOrganicTable = ({ products, onQuickView, wishlist, toggleWishlist }: any) => {
  const [activeId, setActiveId] = useState<string | null>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const springX = useSpring(mouseX, { stiffness: 50, damping: 20 });
  const springY = useSpring(mouseY, { stiffness: 50, damping: 20 });
  const rotateX = useTransform(springY, [-300, 300], [10, -10]);
  const rotateY = useTransform(springX, [-300, 300], [-10, 10]);

  if (products.length === 0) {
    return <div className="w-full aspect-square rounded-3xl bg-gradient-to-br from-emerald-50 to-amber-50 flex items-center justify-center text-slate-400">Məhsul yoxdur</div>;
  }

  const items = products.slice(0, 10).map((p: Product, i: number) => ({
    id: p.id,
    name: p.name,
    icon: getIconForProduct(p),
    x: `${15 + (i % 5) * 18}%`,
    y: `${20 + Math.floor(i / 5) * 35}%`,
    delay: i * 0.1,
  }));

  return (
    <div
      className="relative w-full aspect-square rounded-3xl overflow-hidden bg-gradient-to-br from-emerald-50 to-amber-50/40 shadow-inner border border-emerald-100"
      onMouseMove={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        mouseX.set(e.clientX - rect.left - rect.width / 2);
        mouseY.set(e.clientY - rect.top - rect.height / 2);
      }}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); setActiveId(null); }}
    >
      <motion.div style={{ rotateX, rotateY, transformStyle: "preserve-3d" }} className="relative w-full h-full">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(250,245,235,0.8),transparent)]" />
        {items.map((item: any) => {
          const isActive = activeId === item.id;
          return (
            <motion.div
              key={item.id}
              className="absolute z-20 cursor-pointer"
              style={{ left: item.x, top: item.y }}
              animate={{ y: [0, -6, 0] }}
              transition={{ duration: 4, repeat: Infinity, delay: item.delay }}
              whileHover={{ scale: 1.3, z: 50 }}
              onMouseEnter={() => setActiveId(item.id)}
              onMouseLeave={() => setActiveId(null)}
              onClick={() => onQuickView(products.find((p: Product) => p.id === item.id))}
            >
              <div className="relative w-16 h-16 md:w-20 md:h-20 rounded-full bg-white shadow-lg border border-emerald-100 flex items-center justify-center">
                <span className="text-3xl md:text-4xl">{item.icon}</span>
                {wishlist.includes(item.id) && <Heart className="absolute -top-1 -right-1 w-4 h-4 text-red-500 fill-red-500" />}
                {isActive && <motion.div layoutId="glow" className="absolute inset-0 rounded-full bg-emerald-200/40 blur-md" />}
              </div>
              <AnimatePresence>
                {isActive && (
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-white/95 backdrop-blur rounded-xl px-3 py-1.5 shadow-lg text-xs font-bold whitespace-nowrap">
                    {item.name}
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}
        <div className="absolute bottom-3 left-3 text-[10px] text-slate-400 flex items-center gap-1">
          <Flower2 className="w-3 h-3" /> Kənd nemətləri
        </div>
      </motion.div>
    </div>
  );
};

// ========== SÜRÜŞDÜRÜLƏN SLİDER (PREMIUM) ==========
const EnhancedSwipeSlider = ({ products, onQuickView, wishlist, toggleWishlist }: any) => {
  const [idx, setIdx] = useState(0);
  const addToCart = useApp(s => s.addToCart);
  if (products.length === 0) return null;
  const cur = products[idx];
  const price = finalPrice(getProductBasePrice(cur), cur.discountType, cur.discountValue);
  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -50) setIdx((idx + 1) % products.length);
    else if (info.offset.x > 50) setIdx((idx - 1 + products.length) % products.length);
  };
  return (
    <div className="relative">
      <div className="flex justify-between items-center mb-2">
        <span className="text-xs font-black text-emerald-700"><Sparkles className="inline w-3 h-3" /> Günün sürprizi</span>
        <span className="text-[10px]">{idx+1}/{products.length}</span>
      </div>
      <motion.div drag="x" dragConstraints={{ left:0, right:0 }} onDragEnd={handleDragEnd}
        className="bg-white rounded-3xl p-4 shadow-xl border border-emerald-50">
        <div className="flex gap-4">
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-100 shrink-0 cursor-pointer" onClick={() => onQuickView(cur)}>
            <Image src={getFirstImageUrl(cur)} alt={cur.name} fill className="object-cover" />
            {getDiscountPct(cur) > 0 && <span className="absolute top-1 left-1 bg-red-500 text-white text-[9px] font-black px-1.5 rounded-full">-{getDiscountPct(cur)}%</span>}
            <button onClick={(e) => { e.stopPropagation(); toggleWishlist(cur.id); }} className="absolute bottom-1 right-1 bg-white/80 rounded-full p-1">
              <Heart className={`w-3 h-3 ${wishlist.includes(cur.id) ? "fill-red-500 text-red-500" : ""}`} />
            </button>
          </div>
          <div className="flex-1">
            <p className="font-black text-slate-800">{cur.name}</p>
            <p className="text-[10px] text-slate-400 line-clamp-1">{cur.originRegion || "Gədəbəy"}</p>
            <div className="flex items-baseline gap-2 mt-1"><span className="text-lg font-black text-emerald-700">{formatCurrency(price)}</span></div>
            <div className="flex gap-2 mt-2">
              <button onClick={() => { addToCart(cur.id, cur.variants?.[0]?.id, 1); }} className="bg-slate-800 text-white text-xs font-bold py-1.5 px-3 rounded-full flex items-center gap-1">
                <ShoppingBag className="w-3 h-3" /> Səbət
              </button>
              <button onClick={() => onQuickView(cur)} className="border border-slate-200 text-xs font-bold py-1.5 px-3 rounded-full"><Eye className="w-3 h-3 inline" /> Bax</button>
            </div>
          </div>
        </div>
      </motion.div>
      <div className="flex justify-center gap-1 mt-3">
        {products.map((_: any, i: number) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-1 rounded-full transition-all ${i===idx ? "w-5 bg-emerald-600" : "w-1 bg-slate-300"}`} />
        ))}
      </div>
    </div>
  );
};

// ========== MOBİL ÜÇÜN ÜFÜQİ SÜRÜŞƏN (scrollbar gizlədilib) ==========
const HorizontalScroll = ({ products, onQuickView, wishlist, toggleWishlist }: any) => {
  if (products.length === 0) return null;
  return (
    <div className="md:hidden">
      <p className="text-xs font-bold text-slate-500 mb-2">✨ Ən çox bəyənilənlər</p>
      <div className="flex overflow-x-auto gap-3 pb-2 snap-x [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        {products.map((p: Product) => {
          const price = finalPrice(getProductBasePrice(p), p.discountType, p.discountValue);
          return (
            <div key={p.id} className="snap-start w-36 shrink-0 bg-white rounded-2xl p-2 shadow-sm border border-emerald-50">
              <div className="relative h-24 rounded-xl overflow-hidden bg-slate-50 cursor-pointer" onClick={() => onQuickView(p)}>
                <Image src={getFirstImageUrl(p)} alt={p.name} fill className="object-cover" />
                <button onClick={(e) => { e.stopPropagation(); toggleWishlist(p.id); }} className="absolute top-1 right-1 bg-white/70 rounded-full p-1">
                  <Heart className={`w-3 h-3 ${wishlist.includes(p.id) ? "fill-red-500 text-red-500" : ""}`} />
                </button>
              </div>
              <p className="font-bold text-xs mt-1 line-clamp-1">{p.name}</p>
              <p className="text-emerald-700 font-black text-sm">{formatCurrency(price)}</p>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ========== ƏSAS SAĞ TƏRƏF (BÜTÜN BİR ARAYA) ==========
export const EnhancedRightSide = ({ products }: { products: Product[] }) => {
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const { wishlist, loading: wishlistLoading, toggle: toggleWishlist } = useWishlist();
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [dailyOrders] = useState(() => Math.floor(Math.random() * 80) + 45);
  const [seasonEnd, setSeasonEnd] = useState("");

  useEffect(() => {
    const today = new Date();
    const end = new Date(today.getFullYear(), 9, 15);
    if (today > end) end.setFullYear(end.getFullYear() + 1);
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    setSeasonEnd(`${diff} gün qaldı`);
  }, []);

  const topProducts = products.filter(p => !p.archived).sort((a,b) => getDiscountPct(b) - getDiscountPct(a)).slice(0, 10);

  const handleSoundToggle = async () => {
    if (!soundEnabled) {
      await organicSound.enable(true);
    } else {
      await organicSound.enable(false);
    }
    setSoundEnabled(!soundEnabled);
  };

  useEffect(() => {
    organicSound.init();
    return () => organicSound.dispose();
  }, []);

  if (wishlistLoading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-8">
      {/* Canlı sifariş + təzəlik + səs */}
      <div className="flex items-center justify-between bg-white/70 backdrop-blur-sm rounded-2xl p-3 shadow-sm border border-white/50">
        <div className="flex items-center gap-2">
          <div className="bg-emerald-100 rounded-full p-2"><TrendingUp className="w-4 h-4 text-emerald-600" /></div>
          <div>
            <p className="text-[10px] font-bold text-slate-400">Bu gün sifariş</p>
            <motion.p key={dailyOrders} initial={{ scale: 1.2 }} animate={{ scale: 1 }} className="text-lg font-black text-slate-800">{dailyOrders}+</motion.p>
          </div>
        </div>
        <FreshnessRing percent={98} />
        <button onClick={handleSoundToggle} className="p-2 rounded-full bg-slate-100">
          {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
        </button>
      </div>

      {/* 3D Süfrə */}
      <EnhancedOrganicTable products={topProducts} onQuickView={setQuickViewProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} />

      {/* Mövsüm sayğacı + paylaş */}
      <div className="flex items-center justify-between bg-gradient-to-r from-amber-50 to-emerald-50 rounded-2xl p-3 border border-emerald-100">
        <div className="flex items-center gap-2"><Calendar className="w-4 h-4 text-amber-600" /><span className="text-xs font-bold text-slate-700">Mövsüm: {seasonEnd}</span></div>
        <button className="flex items-center gap-1 text-xs bg-white rounded-full px-3 py-1.5 shadow-sm" onClick={() => { if (navigator.share) navigator.share({ title: "Gədəbəy Organik", text: "Təbii məhsullar burada!" }); }}>
          <Share2 className="w-3 h-3" /> Paylaş
        </button>
      </div>

      {/* Premium Swipe Slider */}
      <EnhancedSwipeSlider products={topProducts.slice(0,6)} onQuickView={setQuickViewProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} />

      {/* Horizontal scroll (mobile) */}
      <HorizontalScroll products={topProducts.slice(0,6)} onQuickView={setQuickViewProduct} wishlist={wishlist} toggleWishlist={toggleWishlist} />

      {/* Quick View Modal */}
      <AnimatePresence>{quickViewProduct && <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />}</AnimatePresence>
    </div>
  );
};