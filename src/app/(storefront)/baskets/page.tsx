// src/app/(storefront)/baskets/page.tsx
'use client';

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import {
  motion, AnimatePresence, useScroll, useTransform,
  useMotionValue, useSpring, type MotionValue,
} from 'framer-motion';
import {
  ShoppingCart, Leaf, Sparkles, Check, Truck, ShieldCheck, Heart,
  Sunrise, Gift, TrendingUp, Package, Eye, Mountain, Trees,
  Droplets, Wind, Phone, ChevronDown, Star, Users, Award,
  Video, X, Share2, MessageCircle, Send, Facebook, Twitter, Mail, Copy,
  PenTool, ArrowRight, BadgeCheck, Zap, Palette, Smile,
} from 'lucide-react';
import { useBaskets, type Basket as APIBasket } from '@/hooks/useBaskets';
import { useBasketStore } from '@/stores/basketStore';
import Image from 'next/image';
import Link from 'next/link';
import toast from 'react-hot-toast';

// ─── Types ──────────────────────────────────────────────────
interface BasketItem {
  id: string;
  name: string;
  tagline?: string;
  description?: string;
  type: string;
  bestseller?: boolean;
  trending?: boolean;
  new?: boolean;
  lowStock?: boolean;
  discount?: number;
  origin?: string;
  freshness?: string;
  nutrition?: string[];
  highlights?: string[];
  media?: { id: string; type: string; url: string; altText?: string; displayOrder: number }[];
  variants?: {
    id: string;
    variant: 'econom' | 'standard' | 'premium';
    price: string;
    originalPrice?: string;
    stock: number;
    gift?: string;
    contents?: { id: string; content: string; displayOrder: number }[];
    extras?: { id: string; extra: string; displayOrder: number }[];
  }[];
}

// ─── 3D Tilt Hook ──────────────────────────────────────────
const use3DTilt = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX: MotionValue<string> = useTransform(mouseYSpring, [-0.5, 0.5], ['12deg', '-12deg']) as any;
  const rotateY: MotionValue<string> = useTransform(mouseXSpring, [-0.5, 0.5], ['-12deg', '12deg']) as any;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    x.set(mouseX / rect.width - 0.5);
    y.set(mouseY / rect.height - 0.5);
  };

  const handleMouseLeave = () => { x.set(0); y.set(0); };

  return { handleMouseMove, handleMouseLeave, rotateX, rotateY };
};

// ─── Floating Icon ──────────────────────────────────────────
const FloatingIcon = ({
  icon: Icon, delay, x, y,
}: {
  icon: React.ComponentType<{ className?: string }>;
  delay: number;
  x: string | number;
  y: string | number;
}) => (
  <motion.div
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{ y: [0, -40, 0], rotate: [0, 20, -20, 0], opacity: [0, 0.15, 0] }}
    transition={{ duration: 10 + Math.random() * 5, repeat: Infinity, delay, ease: 'easeInOut' }}
    className="fixed pointer-events-none select-none z-0 text-emerald-200/40"
    style={{ left: x, top: y }}
  >
    <Icon className="w-16 h-16" />
  </motion.div>
);

// ─── Live Counter ──────────────────────────────────────────
const LiveCounter = () => {
  const [count, setCount] = useState(12);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(Math.floor(Math.random() * 15) + 12);
    const interval = setInterval(() => {
      setCount(prev => Math.max(8, Math.min(30, prev + Math.floor(Math.random() * 5) - 2)));
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

// ─── Premium Badge ──────────────────────────────────────────
const PremiumBadge = ({ text, icon: Icon, gradient }: { text: string; icon: any; gradient: string }) => (
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

// ─── Basket Card ────────────────────────────────────────────
const BasketCard3D = ({ item, onAdd }: { item: BasketItem; onAdd: (data: any) => void }) => {
  const [selectedVariant, setSelectedVariant] = useState<'econom' | 'standard' | 'premium'>('standard');
  const [qty, setQty] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  const { handleMouseMove, handleMouseLeave, rotateX, rotateY } = use3DTilt();

  const variantData = item.variants?.find(v => v.variant === selectedVariant) || item.variants?.[0];
  const price = parseFloat(variantData?.price || '0') * qty;
  const originalPrice = variantData?.originalPrice ? parseFloat(variantData.originalPrice) : null;
  const discount = originalPrice
    ? Math.round(((originalPrice - parseFloat(variantData?.price || '0')) / originalPrice) * 100)
    : item.discount || 0;

  const hasVideo = item.media?.some(m => m.type === 'video') || false;

  // ─── Share handler ───────────────────────────────────
  const handleShare = async (platform: string) => {
    const url = typeof window !== 'undefined' ? window.location.href : '';
    const text = `🌿 *${item.name}*\n💰 ${parseFloat(variantData?.price || '0').toFixed(2)} AZN\n\n📍 Organik Gədəbəy — Təzə kənd məhsulları\n\n🛒 ${url}`;

    try {
      if (platform === 'native') {
        await navigator.share({ title: item.name, text, url });
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(item.name)}&body=${encodeURIComponent(text)}`;
      } else if (platform === 'copy') {
        await navigator.clipboard?.writeText(`${text}\n\n${url}`);
        toast.success('Link kopyalandı! 📋');
      }
    } catch {}
    setShowShareMenu(false);
  };

  // Outside click handler for share menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(event.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ transform: 'perspective(1000px)', rotateX: rotateX as any, rotateY: rotateY as any }}
          className="relative bg-white rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500"
        >
          {/* Image */}
          <div className="relative h-96 overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50">
            <Image
              src={item.media?.[0]?.url || '/placeholder.png'}
              alt={item.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Share button */}
            <div className="absolute top-6 right-6 z-20" ref={shareRef}>
              <button
                onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                className="flex items-center gap-1 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-white transition-all shadow-lg"
                aria-label="Paylaş"
              >
                <Share2 className="h-4 w-4 text-emerald-600" />
                <span className="hidden sm:inline">Paylaş</span>
              </button>
              <AnimatePresence>
                {showShareMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 top-full mt-2 w-56 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50"
                  >
                    {[
                      { label: 'Cihaz ilə paylaş', icon: Share2, platform: 'native', color: 'text-emerald-600' },
                      { label: 'WhatsApp', icon: MessageCircle, platform: 'whatsapp', color: 'text-[#25D366]' },
                      { label: 'Telegram', icon: Send, platform: 'telegram', color: 'text-[#0088cc]' },
                      { label: 'Facebook', icon: Facebook, platform: 'facebook', color: 'text-[#1877f2]' },
                      { label: 'X (Twitter)', icon: Twitter, platform: 'twitter', color: 'text-black' },
                      { label: 'Email', icon: Mail, platform: 'email', color: 'text-slate-600' },
                      { label: 'Linki kopyala', icon: Copy, platform: 'copy', color: 'text-slate-600' },
                    ].map(opt => (
                      <button
                        key={opt.platform}
                        onClick={(e) => { e.stopPropagation(); handleShare(opt.platform); }}
                        className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition ${opt.color}`}
                      >
                        <opt.icon className="h-4 w-4" /> {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Badges */}
            <div className="absolute top-6 left-6 flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {item.bestseller && (
                  <motion.div key="bestseller" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }}>
                    <PremiumBadge text="BESTSELLER" icon={Award} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
                  </motion.div>
                )}
                {item.new && (
                  <motion.div key="new" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ delay: 0.1 }}>
                    <PremiumBadge text="YENİ" icon={Sparkles} gradient="bg-gradient-to-r from-emerald-600 to-green-600" />
                  </motion.div>
                )}
                {item.trending && (
                  <motion.div key="trending" initial={{ x: -100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -100, opacity: 0 }} transition={{ delay: 0.2 }}>
                    <PremiumBadge text="TREND" icon={TrendingUp} gradient="bg-gradient-to-r from-red-500 to-pink-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {discount > 0 && (
              <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}
                className="absolute bottom-6 left-6 bg-gradient-to-br from-red-500 to-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-black leading-none">-{discount}%</div>
                  <div className="text-[10px] font-bold">ENDİRİM</div>
                </div>
              </motion.div>
            )}

            {item.origin && (
              <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }}
                className="absolute bottom-6 right-6 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-xl text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl"
              >
                <Mountain className="w-4 h-4" /> {item.origin}
              </motion.div>
            )}

            {hasVideo && (
              <motion.button whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }} onClick={() => setShowVideo(true)}
                className="absolute bottom-6 left-28 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:bg-white transition z-10"
              >
                <Video className="w-6 h-6 text-emerald-600" />
              </motion.button>
            )}
          </div>

          {/* Content */}
          <div className="p-10 space-y-6">
            <div>
              <motion.h3 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-slate-900 mb-3 leading-tight"
              >
                {item.name}
              </motion.h3>
              <p className="text-slate-600 text-base leading-relaxed">{item.tagline}</p>
            </div>

            {item.freshness && (
              <motion.div whileHover={{ x: 5 }} className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-2xl border border-emerald-100">
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center"><Sunrise className="w-5 h-5 text-emerald-600" /></div>
                <div><div className="text-xs text-emerald-600 font-bold uppercase">Təravət</div><div className="text-sm font-bold text-emerald-800">{item.freshness}</div></div>
              </motion.div>
            )}

            {/* Variant selection */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Paket Seçimi</div>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-2">
                {(item.variants || []).map(v => (
                  <motion.button
                    key={v.id}
                    onClick={() => { setSelectedVariant(v.variant); setQty(1); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-4 rounded-xl text-xs font-black uppercase transition-all ${
                      selectedVariant === v.variant
                        ? 'bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-xl shadow-emerald-200'
                        : 'bg-white text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {v.variant}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contents */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Tərkib</div>
              <div className="space-y-2">
                {variantData?.contents?.slice(0, 3).map((c, i) => (
                  <motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5"><Check className="w-3 h-3 text-emerald-600" /></div>
                    <span className="flex-1">{c.content}</span>
                  </motion.div>
                ))}
                {(variantData?.contents?.length || 0) > 3 && (
                  <motion.button whileHover={{ x: 5 }} onClick={() => setShowDetails(true)}
                    className="text-emerald-600 text-sm font-bold flex items-center gap-2 mt-2"
                  >
                    +{(variantData?.contents?.length || 0) - 3} daha çox məhsul <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Price & CTA */}
            <div className="flex items-end justify-between pt-6 border-t-2 border-slate-100">
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <motion.span key={price} initial={{ scale: 1.2 }} animate={{ scale: 1 }}
                    className="text-5xl font-black text-emerald-600"
                  >
                    {price.toFixed(2)}
                  </motion.span>
                  <span className="text-xl font-bold text-slate-400">AZN</span>
                </div>
                {originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-base text-slate-400 line-through">{(originalPrice * qty).toFixed(2)} AZN</span>
                    <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-full">{discount}% qənaət</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-12 h-12 rounded-xl bg-white shadow-md font-black text-xl">−</button>
                <span className="font-black text-2xl w-10 text-center">{qty}</span>
                <button onClick={() => setQty(q => q + 1)} className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md font-black text-xl">+</button>
              </div>
            </div>

            <motion.button whileHover={{ scale: 1.02, y: -2 }} whileTap={{ scale: 0.98 }}
              onClick={() =>
                onAdd({
                  basketId: item.id,
                  variantId: variantData?.id,
                  basketName: item.name,
                  variantName: variantData?.variant || 'standard',
                  price: parseFloat(variantData?.price || '0'),
                  originalPrice: originalPrice || undefined,
                  quantity: qty,
                  image: item.media?.[0]?.url || '/placeholder.png',
                  stock: variantData?.stock || 0,
                  contents: variantData?.contents?.map(c => c.content) || [],
                  extras: variantData?.extras?.map(e => e.extra) || [],
                })
              }
              className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-[length:200%_auto] hover:bg-right text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-500 group"
            >
              <ShoppingCart className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Səbətə əlavə et
              <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
            </motion.button>

            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: ShieldCheck, text: '100% təbii' },
                { icon: Truck, text: 'Sürətli çatdırılma' },
                { icon: Gift, text: 'Hədiyyə qablaşdırma' },
              ].map((feature, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <feature.icon className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-600 text-center">{feature.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowDetails(false)} className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]" />
            <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="fixed inset-0 z-[90] flex items-center justify-center p-6">
              <div className="bg-white rounded-[3rem] max-w-3xl w-full max-h-[85vh] overflow-y-auto p-12 relative shadow-2xl">
                <button onClick={() => setShowDetails(false)} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center"><X className="w-6 h-6" /></button>
                <div className="mb-8"><h3 className="text-5xl font-black mb-4 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{item.name}</h3><p className="text-slate-600 text-lg">{item.description}</p></div>
                {item.nutrition && (
                  <div className="mb-8"><h4 className="text-sm font-black uppercase text-slate-400 mb-4">Qida Dəyəri</h4><div className="grid grid-cols-2 gap-3">{item.nutrition.map((n, i) => (<motion.div key={i} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-emerald-50 px-5 py-3 rounded-xl text-sm font-bold text-emerald-700">{n}</motion.div>))}</div></div>
                )}
                <div className="mb-8"><h4 className="text-sm font-black uppercase text-slate-400 mb-4">Tam Tərkib ({selectedVariant})</h4><div className="space-y-3">{variantData?.contents?.map((c, i) => (<motion.div key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="flex items-start gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl"><Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" /><span>{c.content}</span></motion.div>))}</div></div>
                {variantData?.extras && variantData.extras.length > 0 && (
                  <div><h4 className="text-sm font-black uppercase text-slate-400 mb-4">Bonuslar</h4><div className="space-y-3">{variantData.extras.map((e, i) => (<motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-3 text-emerald-700 font-semibold bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl"><Sparkles className="w-5 h-5" />{e.extra}</motion.div>))}</div></div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// ─── Marketing Banner ──────────────────────────────────────
const CustomBasketBanner = () => {
  return (
    <motion.section
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="max-w-7xl mx-auto px-6 mb-20"
    >
      <div className="relative overflow-hidden rounded-[3rem] bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 p-10 sm:p-16 shadow-2xl">
        {/* Animated background */}
        <motion.div
          animate={{ backgroundPosition: ['0% 0%', '100% 100%'] }}
          transition={{ duration: 20, repeat: Infinity, repeatType: 'reverse' }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: '60px 60px',
          }}
        />

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: Math.random() * 100 + '%', y: Math.random() * 100 + '%' }}
              animate={{
                opacity: [0, 0.6, 0],
                x: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
                y: [Math.random() * 100 + '%', Math.random() * 100 + '%'],
              }}
              transition={{ duration: 8 + Math.random() * 10, repeat: Infinity, delay: i * 1.5 }}
              className="absolute w-3 h-3 rounded-full bg-emerald-400/30"
            />
          ))}
        </div>

        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-10">
          {/* Left: Text */}
          <div className="flex-1 text-center lg:text-left">
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              viewport={{ once: true }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white px-5 py-2 rounded-full text-sm font-bold mb-6 shadow-lg"
            >
              <PenTool className="w-4 h-4" />
              ÖZ SƏBƏTİNİ DİZAYN ET
            </motion.div>

            <h2 className="text-4xl sm:text-5xl lg:text-6xl font-black text-white mb-6 leading-tight">
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

            <p className="text-lg text-slate-300 max-w-2xl mb-8 leading-relaxed">
              Mağazamızda gördüyünüz məhsullardan <span className="text-emerald-400 font-bold">öz zövqünüzə</span> və{' '}
              <span className="text-emerald-400 font-bold">büdcənizə</span> uyğun tamamilə unikal səbət dizayn edə bilərsiniz.
              İstədiyiniz məhsulları seçin, əlavə bonuslar tələb edin — biz sizin üçün{' '}
              <span className="text-amber-400 font-bold">xüsusi təklif</span> hazırlayaq!
            </p>

            <div className="flex flex-wrap items-center gap-4 justify-center lg:justify-start">
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
                  className="flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/10 rounded-xl px-4 py-2"
                >
                  <item.icon className="w-4 h-4 text-emerald-400" />
                  <span className="text-xs font-semibold text-white">{item.text}</span>
                </motion.div>
              ))}
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6 }}
              className="mt-8 flex flex-wrap gap-4 justify-center lg:justify-start"
            >
              <a
                href="https://wa.me/994773676021?text=Salam,%20özümə%20xüsusi%20səbət%20hazırlamaq%20istəyirəm"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-3 bg-gradient-to-r from-emerald-500 to-green-600 text-white px-8 py-4 rounded-2xl font-black text-base shadow-2xl hover:shadow-emerald-500/50 transition-all hover:scale-105"
              >
                <MessageCircle className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                WhatsApp ilə müraciət et
                <motion.span animate={{ x: [0, 5, 0] }} transition={{ duration: 1.5, repeat: Infinity }}>→</motion.span>
              </a>
              <Link
                href="/products"
                className="inline-flex items-center gap-3 border-2 border-white/30 text-white px-8 py-4 rounded-2xl font-black text-base hover:bg-white/10 hover:border-white/50 transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                Məhsullara bax
                <ArrowRight className="w-5 h-5" />
              </Link>
            </motion.div>
          </div>

          {/* Right: Decorative illustration */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="hidden lg:block flex-shrink-0"
          >
            <motion.div
              animate={{ y: [0, -15, 0], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
              className="relative w-72 h-72"
            >
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-emerald-400/30 to-green-500/30 blur-3xl" />
              <div className="relative w-full h-full rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-2xl border-4 border-white/20">
                <div className="text-center text-white">
                  <PenTool className="w-16 h-16 mx-auto mb-3" />
                  <p className="text-2xl font-black">SİZİN</p>
                  <p className="text-3xl font-black text-amber-300">DİZAYN</p>
                  <p className="text-2xl font-black">SİZİN</p>
                  <p className="text-3xl font-black text-amber-300">SƏBƏT</p>
                </div>
              </div>
              {/* Floating elements around the circle */}
              {[Gift, Leaf, Star, Sparkles].map((Icon, i) => (
                <motion.div
                  key={i}
                  animate={{
                    rotate: [0, 360],
                  }}
                  transition={{ duration: 15 + i * 3, repeat: Infinity, ease: 'linear' }}
                  className="absolute"
                  style={{
                    top: `${25 + Math.sin((i * Math.PI * 2) / 4) * 35}%`,
                    left: `${25 + Math.cos((i * Math.PI * 2) / 4) * 35}%`,
                  }}
                >
                  <Icon className="w-8 h-8 text-white/60" />
                </motion.div>
              ))}
            </motion.div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};

// ─── Main Component ─────────────────────────────────────────
export default function PremiumBasketsPage() {
  const [filter, setFilter] = useState<string>('all');
  const { scrollYProgress } = useScroll();
  const { baskets, loading: basketsLoading } = useBaskets();
  const addToBasketStore = useBasketStore(state => state.addItem);

  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  const filteredBaskets = useMemo(() => {
    if (!baskets || baskets.length === 0) return [];
    if (filter === 'all') return baskets;
    if (filter === 'trending') return baskets.filter((b: BasketItem) => b.trending);
    if (filter === 'new') return baskets.filter((b: BasketItem) => b.new);
    if (filter === 'bestseller') return baskets.filter((b: BasketItem) => b.bestseller);
    return baskets.filter((b: BasketItem) => b.type === filter);
  }, [baskets, filter]);

  const handleAddToBasket = useCallback(
    (basketItem: any) => {
      addToBasketStore(basketItem);
      toast.success(`${basketItem.basketName} səbətə əlavə edildi! 🎉`);
    },
    [addToBasketStore]
  );

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fafcf9] via-emerald-50/40 to-[#fafcf9] overflow-x-hidden">
      {/* Floating Background */}
      <div className="hidden lg:block">
        <FloatingIcon icon={Mountain} delay={0} x="8%" y="15%" />
        <FloatingIcon icon={Trees} delay={2} x="88%" y="20%" />
        <FloatingIcon icon={Droplets} delay={1} x="15%" y="65%" />
        <FloatingIcon icon={Wind} delay={3} x="82%" y="75%" />
        <FloatingIcon icon={Leaf} delay={4} x="45%" y="12%" />
        <FloatingIcon icon={Sunrise} delay={5} x="92%" y="45%" />
      </div>

      {/* Hero */}
      <motion.section style={{ y: heroY as any, opacity: heroOpacity as any }} className="relative py-32 px-6 text-center overflow-hidden">
        <motion.div animate={{ background: ['radial-gradient(circle at 20% 50%, rgba(16,185,129,0.1) 0%, transparent 50%)'] }} transition={{ duration: 10, repeat: Infinity }} className="absolute inset-0 -z-10" />
        <div className="max-w-6xl mx-auto relative z-10">
          <motion.div initial={{ opacity: 0, scale: 0.8, y: -20 }} animate={{ opacity: 1, scale: 1, y: 0 }} transition={{ type: 'spring', stiffness: 200 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-100 via-green-50 to-emerald-100 text-emerald-700 px-8 py-3 rounded-full text-sm font-black mb-10 shadow-lg border border-emerald-200"
          >
            <Sparkles className="w-5 h-5 animate-pulse" /> 2200M YÜKSƏKLIKDƏN DAĞLARIN BƏRƏKƏTI <Mountain className="w-5 h-5" />
          </motion.div>
          <motion.h1 initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
            className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-10"
          >
            Organik Gədəbəyin <br />
            <motion.span animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }} transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 via-emerald-400 to-emerald-600 bg-[length:200%_auto]"
            >xüsusi <br />səbətləri</motion.span>
          </motion.h1>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }}
            className="text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Murovdağ silsiləsinin yüksək yaylaqlarından birbaşa sizə — <br />
            <span className="text-emerald-600 font-bold">heç bir qatqı və konservant olmadan</span>
          </motion.p>
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <LiveCounter />
            <motion.div animate={{ scale: [1, 1.05, 1] }} transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg"
            ><Users className="w-4 h-4" /><span>500+ xoşbəxt müştəri</span></motion.div>
            <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg"
            ><Award className="w-4 h-4" /><span>Premium keyfiyyət</span></motion.div>
          </motion.div>
        </div>
      </motion.section>

      {/* Trust Badges */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { icon: ShieldCheck, label: '100% Təbii', desc: 'Heç bir qatqı yoxdur', gradient: 'from-emerald-500 to-green-500', delay: 0 },
            { icon: Truck, label: '24 Saat', desc: 'Sürətli çatdırılma', gradient: 'from-blue-500 to-cyan-500', delay: 0.1 },
            { icon: Mountain, label: '2200m', desc: 'Yüksək dağlıq', gradient: 'from-purple-500 to-pink-500', delay: 0.2 },
            { icon: Heart, label: 'Premium', desc: 'Əla keyfiyyət', gradient: 'from-red-500 to-orange-500', delay: 0.3 },
          ].map((item, i) => (
            <motion.div key={i} initial={{ opacity: 0, y: 30 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: item.delay }}
              whileHover={{ y: -8, scale: 1.02 }} className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[2rem] shadow-xl group-hover:shadow-2xl transition-all" />
              <div className="relative bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-white">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-600 font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-20 sticky top-6 z-30">
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-[3rem] p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {[
              { key: 'all', label: 'Hamısı', icon: Package, gradient: 'from-slate-500 to-slate-600' },
              { key: 'gence', label: 'Səhər', icon: Sunrise, gradient: 'from-amber-500 to-orange-500' },
              { key: 'gedebey', label: 'Gədəbəy', icon: Mountain, gradient: 'from-emerald-600 to-green-600' },
              { key: 'trending', label: 'Trend', icon: TrendingUp, gradient: 'from-red-500 to-pink-500' },
              { key: 'bestseller', label: 'Bestseller', icon: Award, gradient: 'from-amber-600 to-yellow-500' },
              { key: 'new', label: 'Yeni', icon: Sparkles, gradient: 'from-blue-500 to-cyan-500' },
            ].map(item => (
              <motion.button key={item.key} onClick={() => setFilter(item.key)} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all overflow-hidden ${
                  filter === item.key ? 'text-white shadow-xl' : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filter === item.key && (
                  <motion.div layoutId="activeFilter" className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`} transition={{ type: 'spring', stiffness: 300, damping: 30 }} />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${filter === item.key ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* 🎨 Marketing Banner */}
      <CustomBasketBanner />

      {/* Products Grid */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        {basketsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4" />
              <p className="text-slate-500">Səbətlər yüklənir...</p>
            </div>
          </div>
        ) : (
          <motion.div layout className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            <AnimatePresence mode="wait">
              {filteredBaskets.map((basket: any) => (
                <BasketCard3D key={basket.id} item={basket as BasketItem} onAdd={handleAddToBasket} />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {!basketsLoading && filteredBaskets.length === 0 && (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-20">
            <Package className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-400 mb-2">Məhsul tapılmadı</h3>
            <p className="text-slate-500">Bu kateqoriyada hələ məhsul yoxdur</p>
          </motion.div>
        )}
      </div>

      {/* Social Proof */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-12">
            <h3 className="text-4xl font-black text-slate-900 mb-4">Müştərilərimiz nə deyir?</h3>
            <p className="text-slate-600">Real rəylər, real insanlar</p>
          </motion.div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: 'Aynur H.', text: 'Gədəbəy səbətini aldım və ailəmlə birlikdə çox bəyəndik. Hər şey təzə və dad əla idi!', rating: 5 },
              { name: 'Rəşad M.', text: 'Premium paket heyrətamizdir! Qonaqlarımıza təqdim etdim, hamı çox bəyəndi.', rating: 5 },
              { name: 'Leyla S.', text: 'Təbii məhsulları sevənlər üçün ideal. Çatdırılma da çox sürətli oldu.', rating: 5 },
            ].map((review, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }} className="bg-white p-8 rounded-3xl shadow-lg border border-emerald-100"
              >
                <div className="flex gap-1 mb-4">{[...Array(review.rating)].map((_, idx) => (<Star key={idx} className="w-5 h-5 text-amber-400 fill-amber-400" />))}</div>
                <p className="text-slate-700 mb-4 leading-relaxed">"{review.text}"</p>
                <p className="text-sm font-bold text-emerald-600">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}