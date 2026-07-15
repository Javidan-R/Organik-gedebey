// src/app/(storefront)/baskets/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  motion, AnimatePresence, useScroll, useTransform,
  useMotionValue,
} from 'framer-motion';
import {
  ShoppingCart, Leaf, Sparkles, Check, Truck, ShieldCheck, Heart,
  Sunrise, Gift, TrendingUp, Package, Eye, Mountain, Trees,
  Droplets, Wind, Star, Users, Award,
  Video, X, Share2, MessageCircle, Send, Facebook, Twitter, Mail, Copy,
  PenTool, ArrowRight, BadgeCheck, Zap, Palette, Smile, AlertCircle, Linkedin,
} from 'lucide-react';
import { useBasketStore } from '@/stores/basketStore';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { useBaskets } from '@/hooks/useBaskets';
import { useApp } from '@/lib/store';
import type { Basket, BasketVariant, BasketProductComposition } from '@/types/basket';

// ─── Performanslı 3D Tilt ─────────────────────────────────────────────
function use3DTilt() {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const rotateX = useTransform(y, [-0.5, 0.5], ['6deg', '-6deg']);
  const rotateY = useTransform(x, [-0.5, 0.5], ['-6deg', '6deg']);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    x.set((e.clientX - rect.left) / rect.width - 0.5);
    y.set((e.clientY - rect.top) / rect.height - 0.5);
  }, [x, y]);

  const handleMouseLeave = useCallback(() => {
    x.set(0);
    y.set(0);
  }, [x, y]);

  return { handleMouseMove, handleMouseLeave, rotateX, rotateY };
}

// ─── Floating Icon ─────────────────────────────────────────────────────
const FloatingIcon = ({
  icon: Icon,
  delay,
  x,
  y,
}: {
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
  x: string | number;
  y: string | number;
}) => (
  <motion.div
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{
      y: [0, -40, 0],
      rotate: [0, 20, -20, 0],
      opacity: [0, 0.15, 0],
    }}
    transition={{
      duration: 10 + Math.random() * 5,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
    className="fixed pointer-events-none select-none z-0 text-emerald-200/40"
    style={{ left: x, top: y }}
  >
    <Icon className="w-16 h-16" />
  </motion.div>
);

// ─── Live Counter ─────────────────────────────────────────────────────
const LiveCounter = () => {
  const [count, setCount] = useState(12);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(Math.floor(Math.random() * 15) + 12);
    const interval = setInterval(() => {
      setCount((prev) => Math.max(8, Math.min(30, prev + Math.floor(Math.random() * 5) - 2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg"
    >
      <Eye className="w-4 h-4 animate-pulse" />
      <span suppressHydrationWarning>{mounted ? count : 12} nəfər indi baxır</span>
    </motion.div>
  );
};

// ─── Premium Badge ─────────────────────────────────────────────────────
const PremiumBadge = ({
  text,
  icon: Icon,
  gradient,
}: {
  text: string;
  icon: React.ElementType;
  gradient: string;
}) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: 'spring', stiffness: 200 }}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-black shadow-lg ${gradient}`}
  >
    <Icon className="w-4 h-4" />
    {text}
  </motion.div>
);

// ─── Basket Composition (real məhsul adları ilə) ─────────────────────
function BasketComposition({ products }: { products?: Basket['products'] }) {
  const allProducts = useApp((s) => s.products);
  if (!products?.length) return null;
  return (
    <div className="space-y-2 pt-3 border-t border-slate-100">
      <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-wider">
        Səbətin tərkibi
      </p>
      <div className="space-y-1.5">
        {products.map((comp, i) => {
          const prod = allProducts.find((p) => p.id === comp.productId);
          return (
            <div
              key={comp.id ?? i}
              className="flex items-center gap-2 text-xs sm:text-sm text-slate-700 bg-slate-50 px-2 py-1.5 rounded-xl"
            >
              <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
              <span className="flex-1 truncate">{prod?.name || comp.productId}</span>
              <span className="text-[11px] font-bold text-emerald-600 whitespace-nowrap">
                {comp.quantity} {comp.unit || 'əd'}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Basket Card 3D (Premium Edition) ────────────────────────────────
function BasketCard3D({
  item,
  onAdd,
}: {
  item: Basket;
  onAdd: (data: any) => void;
}) {
  const [selectedVariant, setSelectedVariant] = useState<'econom' | 'standard' | 'premium'>('standard');
  const [qty, setQty] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [added, setAdded] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);
  const { handleMouseMove, handleMouseLeave, rotateX, rotateY } = use3DTilt();

  const variantData = item.variants?.find((v) => v.variant === selectedVariant) ?? item.variants?.[0];
  const price = parseFloat(variantData?.price ?? '0') * qty;
  const originalPrice = variantData?.originalPrice ? parseFloat(variantData.originalPrice) : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - parseFloat(variantData?.price ?? '0')) / originalPrice) * 100)
    : item.discount || 0;
  const hasVideo = item.media?.some((m) => m.type === 'video') || false;

  const handleAdd = useCallback(() => {
    onAdd({
      basketId: item.id,
      variantId: variantData?.id,
      basketName: item.name,
      variantName: variantData?.variant || 'standard',
      price: parseFloat(variantData?.price ?? '0'),
      originalPrice: originalPrice ?? undefined,
      quantity: qty,
      image: item.media?.[0]?.url || '/placeholder.png',
      stock: variantData?.stock || 0,
      contents: variantData?.contents?.map((c) => typeof c === 'string' ? c : c.content) || [],
      extras: variantData?.extras?.map((e) => typeof e === 'string' ? e : e.extra) || [],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1600);
  }, [item, variantData, qty, originalPrice, onAdd]);

  const handleShare = useCallback(async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `🌿 *${item.name}*\n💰 ${parseFloat(variantData?.price ?? '0').toFixed(2)} AZN\n\n📍 Organik Gədəbəy\n\n🛒 ${url}`;
    try {
      if (platform === 'native') await navigator.share({ title: item.name, text, url });
      else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      else if (platform === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      else if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
      else if (platform === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(item.name)}&body=${encodeURIComponent(text)}`;
      else if (platform === 'copy') { await navigator.clipboard?.writeText(`${text}\n\n${url}`); toast.success('Link kopyalandı! 📋'); }
    } catch {}
    setShowShareMenu(false);
  }, [item, variantData]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) setShowShareMenu(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const contentLength = variantData?.contents?.length ?? 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: '-40px' }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transform: 'perspective(1200px)', rotateX: rotateX as any, rotateY: rotateY as any }}
          className="relative bg-white rounded-[2rem] sm:rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.25)] transition-shadow duration-500"
        >
          {/* Shine hover overlay */}
          <motion.div
            className="absolute inset-0 z-20 pointer-events-none bg-gradient-to-tr from-white/0 via-white/5 to-white/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
          />

          {/* ── Şəkil ────────────────────────────────── */}
          <div className="relative h-44 sm:h-64 lg:h-80 overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50">
            <Image
              src={item.media?.[0]?.url || '/placeholder.png'}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* ── Paylaş düyməsi ──────────────────────── */}
            <div className="absolute top-3 right-3 sm:top-5 sm:right-5 z-30" ref={shareRef}>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                className="flex items-center gap-1 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-700 hover:bg-white transition-all shadow-lg"
              >
                <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                <span className="hidden sm:inline">Paylaş</span>
              </motion.button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-44 sm:w-52 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50"
                  >
                    {[
                      { label: 'Paylaş', icon: Share2, platform: 'native', color: 'text-emerald-600' },
                      { label: 'WhatsApp', icon: MessageCircle, platform: 'whatsapp', color: 'text-[#25D366]' },
                      { label: 'Telegram', icon: Send, platform: 'telegram', color: 'text-[#0088cc]' },
                      { label: 'Facebook', icon: Facebook, platform: 'facebook', color: 'text-[#1877f2]' },
                      { label: 'X', icon: Twitter, platform: 'twitter', color: 'text-black' },
                      { label: 'LinkedIn', icon: Linkedin, platform: 'linkedin', color: 'text-[#0A66C2]' },
                      { label: 'Email', icon: Mail, platform: 'email', color: 'text-slate-600' },
                      { label: 'Kopyala', icon: Copy, platform: 'copy', color: 'text-slate-600' },
                    ].map((opt) => (
                      <button
                        key={opt.platform}
                        onClick={(e) => { e.stopPropagation(); handleShare(opt.platform); }}
                        className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition ${opt.color}`}
                      >
                        <opt.icon className="h-4 w-4" /> {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Badges ──────────────────────────────── */}
            <div className="absolute top-3 left-3 sm:top-5 sm:left-5 flex flex-col gap-2 z-20">
              <AnimatePresence mode="popLayout">
                {item.bestseller && (
                  <motion.div key="bestseller" initial={{ x: -100 }} animate={{ x: 0 }}>
                    <PremiumBadge text="BESTSELLER" icon={Award} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
                  </motion.div>
                )}
                {item.new && (
                  <motion.div key="new" initial={{ x: -100 }} animate={{ x: 0 }} transition={{ delay: 0.1 }}>
                    <PremiumBadge text="YENİ" icon={Sparkles} gradient="bg-gradient-to-r from-emerald-600 to-green-600" />
                  </motion.div>
                )}
                {item.trending && (
                  <motion.div key="trending" initial={{ x: -100 }} animate={{ x: 0 }} transition={{ delay: 0.2 }}>
                    <PremiumBadge text="TREND" icon={TrendingUp} gradient="bg-gradient-to-r from-red-500 to-pink-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* ── Endirim nişanı ──────────────────────── */}
            {discount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.08, 1], rotateZ: [0, 2, -2, 0] }}
                transition={{ duration: 2.2, repeat: Infinity }}
                className="absolute bottom-3 left-3 sm:bottom-5 sm:left-5 bg-gradient-to-br from-red-500 to-rose-600 text-white w-14 h-14 sm:w-18 sm:h-18 rounded-full flex items-center justify-center shadow-2xl z-20"
              >
                <div className="text-center leading-none">
                  <span className="text-lg sm:text-2xl font-black">-{discount}%</span>
                  <span className="text-[8px] sm:text-[10px] font-bold block opacity-90">ENDİRİM</span>
                </div>
              </motion.div>
            )}

            {/* ── Mənşə nişanı ────────────────────────── */}
            {item.origin && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-3 right-3 sm:bottom-5 sm:right-5 bg-slate-900/80 backdrop-blur-md text-white px-3 py-1.5 sm:px-4 sm:py-2 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-1.5 shadow-xl z-20"
              >
                <Mountain className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> {item.origin}
              </motion.div>
            )}

            {/* ── Video düyməsi ───────────────────────── */}
            {hasVideo && (
              <motion.button
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVideo(true)}
                className="absolute bottom-3 left-20 sm:bottom-5 sm:left-28 w-9 h-9 sm:w-11 sm:h-11 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-lg hover:bg-white transition z-20"
              >
                <Video className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
              </motion.button>
            )}
          </div>

          {/* ── Məzmun ─────────────────────────────────── */}
          <div className="p-4 sm:p-5 lg:p-8 space-y-4 sm:space-y-5">
            {/* Başlıq */}
            <div>
              <motion.h3
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-xl sm:text-2xl lg:text-3xl font-black text-slate-900 leading-tight"
              >
                {item.name}
              </motion.h3>
              {item.tagline && (
                <p className="text-slate-500 text-sm sm:text-base mt-1">{item.tagline}</p>
              )}
            </div>

            {/* Təravət */}
            {item.freshness && (
              <motion.div
                whileHover={{ x: 5 }}
                className="relative flex items-center gap-2 sm:gap-3 bg-emerald-50/80 px-3 py-2 rounded-2xl border border-emerald-100 overflow-hidden"
              >
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-emerald-200/20 to-transparent"
                  animate={{ x: ['-100%', '100%'] }}
                  transition={{ duration: 3, repeat: Infinity, ease: 'linear' }}
                />
                <Sunrise className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600 flex-shrink-0 relative z-10" />
                <div className="text-xs sm:text-sm text-emerald-800 font-semibold relative z-10">{item.freshness}</div>
              </motion.div>
            )}

            {/* Variant seçimi */}
            <div className="space-y-2">
              <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-wider">
                Paket seçimi
              </p>
              <div className="flex flex-wrap gap-1.5 sm:gap-2">
                {(item.variants || []).map((v) => (
                  <motion.button
                    key={v.id}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => { setSelectedVariant(v.variant); setQty(1); }}
                    className={`px-3 py-1.5 sm:px-4 sm:py-2 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all ${
                      selectedVariant === v.variant
                        ? 'bg-gradient-to-r from-emerald-600 to-green-600 text-white shadow-lg shadow-emerald-200'
                        : 'bg-white text-slate-600 border border-gray-200 hover:border-emerald-300 hover:shadow'
                    }`}
                  >
                    {v.variant}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Tərkib önizləmə */}
            {contentLength > 0 && (
              <div className="space-y-1.5">
                <p className="text-[10px] sm:text-xs font-black uppercase text-slate-400 tracking-wider">
                  Tərkib
                </p>
                <div className="space-y-1">
                  {variantData?.contents?.slice(0, 3).map((c, i) => (
                    <motion.div
                      key={c.id ?? i}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-start gap-2 text-xs sm:text-sm text-slate-600"
                    >
                      <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                      <span className="truncate">{c.content}</span>
                    </motion.div>
                  ))}
                  {contentLength > 3 && (
                    <button
                      onClick={() => setShowDetails(true)}
                      className="text-emerald-600 text-xs font-bold hover:underline mt-1"
                    >
                      +{contentLength - 3} daha çox
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Basket məhsulları (real adlarla) */}
            <BasketComposition products={item.products} />

            {/* Qiymət & Ədəd */}
            <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 pt-4 border-t-2 border-slate-100">
              <div className="space-y-1">
                <div className="flex items-baseline gap-1.5 sm:gap-2">
                  <motion.span
                    key={price}
                    initial={{ scale: 1.3, color: '#059669' }}
                    animate={{ scale: 1, color: '#059669' }}
                    className="text-xl sm:text-3xl lg:text-4xl font-black text-emerald-600"
                  >
                    {price.toFixed(2)}
                  </motion.span>
                  <span className="text-sm sm:text-lg font-bold text-slate-400">AZN</span>
                </div>
                {originalPrice && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs sm:text-sm text-slate-400 line-through">
                      {(originalPrice * qty).toFixed(2)} AZN
                    </span>
                    <span className="text-[10px] sm:text-xs font-black text-red-500 bg-red-50 px-2 py-0.5 rounded-full">
                      {discount}% qənaət
                    </span>
                  </div>
                )}
              </div>

              {/* Quantity Controls – overflow‑dan qorunur */}
              <div className="flex items-center gap-1.5 sm:gap-2 bg-slate-100 rounded-2xl p-1 flex-shrink-0">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-white shadow-sm font-bold text-lg sm:text-xl text-slate-600 hover:bg-slate-50 transition"
                >
                  −
                </motion.button>
                <span className="min-w-[1.8rem] text-center font-black text-base sm:text-lg text-slate-800 select-none">
                  {qty}
                </span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty((q) => q + 1)}
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-emerald-500 text-white shadow-sm font-bold text-lg sm:text-xl hover:bg-emerald-600 transition"
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* CTA */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleAdd}
              className="relative w-full bg-gradient-to-r from-emerald-600 to-green-600 text-white py-3 sm:py-4 rounded-2xl font-black text-sm sm:text-base flex items-center justify-center gap-2 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden group/cta"
            >
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 -skew-x-12 translate-x-[-150%] group-hover/cta:translate-x-[150%] transition-transform duration-700"
              />
              {added ? (
                <motion.span
                  key="added"
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-2"
                >
                  <Check className="w-4 h-4 sm:w-5 sm:h-5" />
                  Əlavə edildi!
                </motion.span>
              ) : (
                <motion.span key="add" initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex items-center gap-2">
                  <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                  Səbətə əlavə et
                  <motion.span
                    className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-emerald-900 shadow-lg"
                    animate={{ scale: [1, 1.15, 1] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  >
                    +
                  </motion.span>
                </motion.span>
              )}
            </motion.button>

            {/* Etibar indikatorları */}
            <div className="grid grid-cols-3 gap-2 sm:gap-3 pt-2">
              {[
                { icon: ShieldCheck, text: '100% təbii' },
                { icon: Truck, text: 'Sürətli çatdırılma' },
                { icon: Gift, text: 'Hədiyyə qablaşdırma' },
              ].map((f, i) => (
                <motion.div
                  key={i}
                  whileHover={{ y: -2, scale: 1.02 }}
                  className="flex flex-col items-center gap-1 p-2 bg-slate-50 rounded-xl shadow-sm hover:shadow-md transition-shadow"
                >
                  <f.icon className="w-4 h-4 sm:w-5 sm:h-5 text-emerald-600" />
                  <span className="text-[9px] sm:text-[10px] font-bold text-slate-600 text-center leading-tight">
                    {f.text}
                  </span>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* ── Details Modal ────────────────────────────── */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]" />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4"
            >
              <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] overflow-y-auto p-6 sm:p-8 relative shadow-2xl">
                <button onClick={() => setShowDetails(false)} className="absolute top-4 right-4 w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
                  <X className="w-4 h-4" />
                </button>
                <h3 className="text-2xl font-black mb-4">{item.name}</h3>
                <p className="text-slate-600 text-sm mb-4">{item.description}</p>
                {variantData?.contents?.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-bold text-sm text-slate-500">Tərkib</h4>
                    {variantData.contents.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm text-slate-700">
                        <Check className="w-4 h-4 text-emerald-500" /> {c.content}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* ── Video Modal ──────────────────────────────── */}
      <AnimatePresence>
        {showVideo && hasVideo && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[80]" />
            <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} exit={{ scale: 0.9 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-4">
              <div className="relative max-w-4xl w-full">
                <button onClick={() => setShowVideo(false)} className="absolute -top-12 right-0 w-10 h-10 rounded-full bg-white flex items-center justify-center shadow">
                  <X className="w-5 h-5" />
                </button>
                <video
                  src={item.media?.find((m) => m.type === 'video')?.url}
                  controls autoPlay className="w-full rounded-2xl shadow-2xl"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

// ─── Marketing Banner ─────────────────────────────────────────────────
const CustomBasketBanner = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-7xl mx-auto px-4 sm:px-6 mb-16 sm:mb-20"
    >
      <div className="relative overflow-hidden rounded-[2rem] sm:rounded-[3rem] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-6 sm:p-10 lg:p-16 shadow-2xl">
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage:
              "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '60px 60px',
          }}
        />
        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-8 sm:gap-10">
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-4 py-1.5 sm:px-5 sm:py-2 rounded-full text-xs sm:text-sm font-bold mb-4 sm:mb-6 shadow-lg"
            >
              <PenTool className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              ÖZ SƏBƏTİNİ DİZAYN ET
            </motion.div>
            <h2 className="text-3xl sm:text-4xl lg:text-6xl font-black text-white mb-4 sm:mb-6 leading-tight">
              Öz Xüsusi{' '}
              <motion.span
                animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                transition={{ duration: 5, repeat: Infinity }}
                className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-green-300 to-emerald-400 bg-[length:200%_auto]"
              >
                Səbətini
              </motion.span>{' '}
              Qur!
            </h2>
            <p className="text-sm sm:text-lg text-slate-300 max-w-2xl mb-6 sm:mb-8 leading-relaxed">
              Mağazamızda gördüyünüz məhsullardan <span className="text-emerald-400 font-bold">öz zövqünüzə</span> və{' '}
              <span className="text-emerald-400 font-bold">büdcənizə</span> uyğun tamamilə unikal səbət dizayn edə
              bilərsiniz. İstədiyiniz məhsulları seçin, əlavə bonuslar tələb edin — biz sizin üçün{' '}
              <span className="text-amber-400 font-bold">xüsusi təklif</span> hazırlayaq!
            </p>
            <div className="flex flex-wrap items-center gap-3 sm:gap-4 justify-center lg:justify-start mb-6 sm:mb-8">
              {[
                { icon: Palette, text: 'İstədiyiniz məhsullar' },
                { icon: BadgeCheck, text: 'Premium keyfiyyət' },
                { icon: Zap, text: 'Xüsusi endirim' },
                { icon: Smile, text: '100% məmnuniyyət' },
              ].map((item, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.3 + i * 0.1 }}
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-1.5 sm:px-4 sm:py-2"
                >
                  <item.icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-emerald-400" />
                  <span className="text-[10px] sm:text-xs font-semibold text-white">{item.text}</span>
                </motion.div>
              ))}
            </div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="flex flex-wrap gap-3 sm:gap-4 justify-center lg:justify-start"
            >
              <a
                href="https://wa.me/994773676021?text=Salam,%20özümə%20xüsusi%20səbət%20hazırlamaq%20istəyirəm"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-black text-xs sm:text-base shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105"
              >
                <MessageCircle className="w-4 h-4 sm:w-5 sm:h-5 group-hover:rotate-12 transition-transform" />
                WhatsApp ilə müraciət et
                <motion.span
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.span>
              </a>
              <Link
                href="/products"
                className="inline-flex items-center gap-2 sm:gap-3 border-2 border-white/30 text-white px-6 py-3 sm:px-8 sm:py-4 rounded-2xl font-black text-xs sm:text-base hover:bg-white/10 hover:border-white/50 transition-all"
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                Məhsullara bax
                <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
              </Link>
            </motion.div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hidden lg:block flex-shrink-0"
          >
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-56 xl:w-72 h-56 xl:h-72"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-500/30 blur-3xl" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                <div className="text-center text-white">
                  <PenTool className="w-12 h-12 xl:w-16 xl:h-16 mx-auto mb-2 sm:mb-3" />
                  <p className="text-lg xl:text-2xl font-black">SİZİN</p>
                  <p className="text-xl xl:text-3xl font-black text-amber-300">DİZAYN</p>
                  <p className="text-lg xl:text-2xl font-black">SİZİN</p>
                  <p className="text-xl xl:text-3xl font-black text-amber-300">SƏBƏT</p>
                </div>
              </div>
              {[Gift, Leaf, Star, Sparkles].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute"
                  style={{
                    top: `${25 + Math.sin((i * Math.PI * 2) / 4) * 35}%`,
                    left: `${25 + Math.cos((i * Math.PI * 2) / 4) * 35}%`,
                  }}
                >
                  <Icon className="w-6 h-6 xl:w-8 xl:h-8 text-white/60" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// ─── Main Component ──────────────────────────────────────────────────────
export default function PremiumBasketsPage() {
  const [filter, setFilter] = useState<string>('all');
  const { scrollYProgress } = useScroll();
  const { data: baskets, isLoading: basketsLoading, error } = useBaskets();
  const addToBasketStore = useBasketStore((state) => state.addItem);

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  const handleAddToBasket = useCallback(
    (basketItem: any) => {
      addToBasketStore(basketItem);
      toast.success(`${basketItem.basketName} səbətə əlavə edildi! 🎉`);
    },
    [addToBasketStore]
  );

  const filteredBaskets = useMemo(() => {
    if (!baskets) return [];
    if (filter === 'all') return baskets;
    if (filter === 'trending') return baskets.filter((b) => b.trending);
    if (filter === 'new') return baskets.filter((b) => b.new);
    if (filter === 'bestseller') return baskets.filter((b) => b.bestseller);
    return baskets.filter((b) => b.type === filter);
  }, [baskets, filter]);

  if (basketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-4 border-emerald-200 border-t-emerald-600 mx-auto mb-4" />
          <p className="text-slate-500 font-medium">Səbətlər yüklənir...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        <div className="text-center max-w-md">
          <AlertCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-slate-800">Xəta baş verdi</h2>
          <p className="text-slate-600 mt-2">{(error as any)?.message || 'Səbətlər yüklənə bilmədi'}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-6 inline-flex items-center gap-2 bg-emerald-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-700 transition"
          >
            Yenidən cəhd et
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fafcf9] via-emerald-50/40 to-[#fafcf9] overflow-x-hidden">
      <div className="hidden lg:block">
        <FloatingIcon icon={Mountain} delay={0} x="8%" y="15%" />
        <FloatingIcon icon={Trees} delay={2} x="88%" y="20%" />
        <FloatingIcon icon={Droplets} delay={1} x="15%" y="65%" />
        <FloatingIcon icon={Wind} delay={3} x="82%" y="75%" />
        <FloatingIcon icon={Leaf} delay={4} x="45%" y="12%" />
        <FloatingIcon icon={Sunrise} delay={5} x="92%" y="45%" />
      </div>

      {/* Hero Section */}
      <motion.section
        style={{ y: heroY as any, opacity: heroOpacity as any }}
        className="relative py-20 sm:py-32 px-4 sm:px-6 text-center overflow-hidden"
      >
        <motion.div
          animate={{
            background: [
              'radial-gradient(circle at 20% 50%, rgba(16,185,129,0.1) 0%, transparent 50%)',
            ],
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 -z-10"
        />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-emerald-100 via-green-50 to-emerald-100 text-emerald-700 px-5 py-2 sm:px-8 sm:py-3 rounded-full text-xs sm:text-sm font-black mb-6 sm:mb-10 shadow-lg border border-emerald-200"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 animate-pulse" />
            2200M YÜKSƏKLIKDƏN DAĞLARIN BƏRƏKƏTI
            <Mountain className="w-4 h-4 sm:w-5 sm:h-5" />
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-5xl sm:text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.9] sm:leading-[0.85] mb-6 sm:mb-10"
          >
            Organik Gədəbəyin <br />
            <motion.span
              animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 via-emerald-400 to-emerald-600 bg-[length:200%_auto]"
            >
              xüsusi <br />
              səbətləri
            </motion.span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-lg sm:text-2xl text-slate-600 max-w-3xl mx-auto mb-8 sm:mb-12 leading-relaxed font-medium px-2"
          >
            Murovdağ silsiləsinin yüksək yaylaqlarından birbaşa sizə — <br />
            <span className="text-emerald-600 font-bold">heç bir qatqı və konservant olmadan</span>
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-4 sm:gap-6"
          >
            <LiveCounter />
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg"
            >
              <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>500+ xoşbəxt müştəri</span>
            </motion.div>
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-4 py-2 sm:px-6 sm:py-3 rounded-full text-xs sm:text-sm font-bold shadow-lg"
            >
              <Award className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span>Premium keyfiyyət</span>
            </motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-20">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-6">
          {[
            {
              icon: ShieldCheck,
              label: '100% Təbii',
              desc: 'Heç bir qatqı yoxdur',
              gradient: 'from-emerald-500 to-green-500',
              delay: 0,
            },
            {
              icon: Truck,
              label: '24 Saat',
              desc: 'Sürətli çatdırılma',
              gradient: 'from-blue-500 to-cyan-500',
              delay: 0.1,
            },
            {
              icon: Mountain,
              label: '2200m',
              desc: 'Yüksək dağlıq',
              gradient: 'from-purple-500 to-pink-500',
              delay: 0.2,
            },
            {
              icon: Heart,
              label: 'Premium',
              desc: 'Əla keyfiyyət',
              gradient: 'from-red-500 to-orange-500',
              delay: 0.3,
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[1.5rem] sm:rounded-[2rem] shadow-xl group-hover:shadow-2xl transition-all" />
              <div className="relative bg-white/60 backdrop-blur-sm p-4 sm:p-8 rounded-[1.5rem] sm:rounded-[2rem] border border-white">
                <div
                  className={`w-12 h-12 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-3 sm:mb-5 shadow-lg group-hover:scale-110 transition-transform`}
                >
                  <item.icon className="w-6 h-6 sm:w-8 sm:h-8" />
                </div>
                <h3 className="text-lg sm:text-2xl font-black text-slate-900 mb-1 sm:mb-2">{item.label}</h3>
                <p className="text-xs sm:text-sm text-slate-600 font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 mb-12 sm:mb-20 sticky top-4 sm:top-6 z-30">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-[2rem] sm:rounded-[3rem] p-2 sm:p-3 shadow-2xl"
        >
          <div className="flex items-center gap-1.5 sm:gap-3 flex-wrap justify-center">
            {[
              { key: 'all', label: 'Hamısı', icon: Package, gradient: 'from-slate-500 to-slate-600' },
              { key: 'gence', label: 'Səhər', icon: Sunrise, gradient: 'from-amber-500 to-orange-500' },
              { key: 'gedebey', label: 'Gədəbəy', icon: Mountain, gradient: 'from-emerald-600 to-green-600' },
              { key: 'trending', label: 'Trend', icon: TrendingUp, gradient: 'from-red-500 to-pink-500' },
              { key: 'bestseller', label: 'Bestseller', icon: Award, gradient: 'from-amber-600 to-yellow-500' },
              { key: 'new', label: 'Yeni', icon: Sparkles, gradient: 'from-blue-500 to-cyan-500' },
            ].map((item) => (
              <motion.button
                key={item.key}
                onClick={() => setFilter(item.key)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-1.5 sm:gap-2 px-3 py-2.5 sm:px-6 sm:py-4 rounded-[1.5rem] sm:rounded-[2rem] text-[10px] sm:text-sm font-bold transition-all overflow-hidden ${
                  filter === item.key ? 'text-white shadow-xl' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter === item.key && (
                  <motion.div
                    layoutId="activeFilter"
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-3.5 h-3.5 sm:w-5 sm:h-5 relative z-10 ${filter === item.key ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Marketing Banner */}
      <CustomBasketBanner />

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pb-24 sm:pb-32">
        {filteredBaskets.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-16 sm:py-20"
          >
            <Package className="w-16 h-16 sm:w-20 sm:h-20 text-slate-300 mx-auto mb-4 sm:mb-6" />
            <h3 className="text-xl sm:text-2xl font-black text-slate-400 mb-1 sm:mb-2">Məhsul tapılmadı</h3>
            <p className="text-sm sm:text-base text-slate-500">Bu kateqoriyada hələ məhsul yoxdur</p>
          </motion.div>
        ) : (
          <motion.div layout className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 lg:gap-10">
            <AnimatePresence mode="wait">
              {filteredBaskets.map((basket) => (
                <BasketCard3D key={basket.id} item={basket} onAdd={handleAddToBasket} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      {/* Social Proof */}
      <section className="py-12 sm:py-20 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-8 sm:mb-12"
          >
            <h3 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 sm:mb-4">Müştərilərimiz nə deyir?</h3>
            <p className="text-sm sm:text-base text-slate-600">Real rəylər, real insanlar</p>
          </motion.div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {[
              {
                name: 'Aynur H.',
                text: 'Gədəbəy səbətini aldım və ailəmlə birlikdə çox bəyəndik. Hər şey təzə və dad əla idi!',
                rating: 5,
              },
              {
                name: 'Rəşad M.',
                text: 'Premium paket heyrətamizdir! Qonaqlarımıza təqdim etdim, hamı çox bəyəndi.',
                rating: 5,
              },
              {
                name: 'Leyla S.',
                text: 'Təbii məhsulları sevənlər üçün ideal. Çatdırılma da çox sürətli oldu.',
                rating: 5,
              },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-6 sm:p-8 rounded-2xl sm:rounded-3xl shadow-lg border border-emerald-100"
              >
                <div className="flex gap-1 mb-3 sm:mb-4">
                  {[...Array(review.rating)].map((_, idx) => (
                    <Star key={idx} className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 text-sm sm:text-base mb-3 sm:mb-4 leading-relaxed">"{review.text}"</p>
                <p className="text-xs sm:text-sm font-bold text-emerald-600">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}