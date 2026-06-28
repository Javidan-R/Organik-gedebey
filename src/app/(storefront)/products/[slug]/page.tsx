// src/app/(storefront)/products/[slug]/page.tsx
'use client';
 
import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useApp } from '@/lib/store';
import {
  getProductBasePrice,
  getFirstImageUrl,
  formatCurrency,
} from '@/utils/storefront_home';
import { finalPrice } from '@/lib/calc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  ShoppingBag,
  Heart,
  Share2,
  MapPin,
  Clock,
  Star,
  Minus,
  Plus,
  Ban,
  Check,
  ArrowLeft,
  Truck,
  ShieldCheck,
  Award,
  Sparkles,
  Package,
  ChevronRight,
  X,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
 
  Mail,
  MessageCircle,
  Facebook,
  Twitter,
  Copy,
  CheckCircle2,
  AlertCircle,
  Info,

  Crown,
  Gift,

  Calendar,
 
  TimerOff,
  Send,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { Variant } from '@/types/products';
import { RusticProductCard } from '@/components/ui/organisms/RusticProductCard';

// ─── Audio Engine ──────────────────────────────────────────────
const playOrganicSynth = (type: 'drop' | 'click' | 'success' | 'breeze') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (type === 'drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    } else if (type === 'success') {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.type = 'sine';
        osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.06, t);
        gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t);
        osc.stop(t + 0.21);
      });
    } else if (type === 'breeze') {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    }
  } catch (_) {}
};

// ─── Loading Skeleton ──────────────────────────────────────────
function ProductSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 py-8">
      <div className="mx-auto max-w-7xl px-4">
        <div className="mb-6 h-6 w-32 animate-pulse rounded-xl bg-slate-200" />
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-3xl bg-slate-200" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-4 w-1/2 animate-pulse rounded-xl bg-slate-200" />
            <div className="h-12 w-1/3 animate-pulse rounded-xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-4 w-full animate-pulse rounded-xl bg-slate-200" />
              <div className="h-4 w-2/3 animate-pulse rounded-xl bg-slate-200" />
            </div>
            <div className="flex gap-4">
              <div className="h-12 w-32 animate-pulse rounded-xl bg-slate-200" />
              <div className="h-12 w-32 animate-pulse rounded-xl bg-slate-200" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Toast Notification ────────────────────────────────────────
function Toast({ message, type, onClose }: { message: string; type: 'success' | 'error' | 'info'; onClose: () => void }) {
  useEffect(() => {
    const timer = setTimeout(onClose, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  const colors = {
    success: 'bg-emerald-600 text-white',
    error: 'bg-red-600 text-white',
    info: 'bg-blue-600 text-white',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: -50, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -30, scale: 0.95 }}
      className={`fixed top-20 left-1/2 -translate-x-1/2 z-50 rounded-2xl px-6 py-3 shadow-2xl ${colors[type]}`}
    >
      <div className="flex items-center gap-3">
        {type === 'success' && <CheckCircle2 className="h-5 w-5" />}
        {type === 'error' && <AlertCircle className="h-5 w-5" />}
        {type === 'info' && <Info className="h-5 w-5" />}
        <span className="font-bold">{message}</span>
        <button onClick={onClose} className="ml-2 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Image Gallery with Zoom ──────────────────────────────────
function ImageGallery({ images, productName }: { images: string[]; productName: string }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const imageRef = useRef<HTMLDivElement>(null);

  const mainImage = images[activeIndex] || '/placeholder.jpg';

  const handleZoomIn = () => setZoomLevel((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setZoomLevel((prev) => Math.max(prev - 0.25, 0.5));

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isZoomed) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setPosition({ x, y });
  };

  return (
    <div className="space-y-3">
      {/* Main Image */}
      <div
        ref={imageRef}
        className="relative aspect-square overflow-hidden rounded-3xl bg-white shadow-xl"
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsZoomed(true)}
        onMouseLeave={() => { setIsZoomed(false); setPosition({ x: 50, y: 50 }); }}
      >
        <motion.div
          animate={{
            scale: isZoomed ? zoomLevel : 1,
            x: isZoomed ? -(position.x - 50) * (zoomLevel - 1) * 2 : 0,
            y: isZoomed ? -(position.y - 50) * (zoomLevel - 1) * 2 : 0,
          }}
          transition={{ duration: 0.1 }}
          className="relative h-full w-full"
          style={{ transformOrigin: 'center center' }}
        >
          <Image
            src={mainImage}
            alt={productName}
            fill
            className="object-cover"
            priority
          />
        </motion.div>

        {/* Zoom Controls */}
        <div className="absolute bottom-4 right-4 flex gap-1 rounded-2xl bg-white/90 backdrop-blur-sm p-1 shadow-lg">
          <button
            onClick={handleZoomOut}
            className="rounded-xl p-2 hover:bg-slate-100 transition"
            aria-label="Kiçilt"
          >
            <ZoomOut className="h-4 w-4 text-slate-700" />
          </button>
          <button
            onClick={() => setZoomLevel(1)}
            className="rounded-xl px-2 py-1 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
          >
            {Math.round(zoomLevel * 100)}%
          </button>
          <button
            onClick={handleZoomIn}
            className="rounded-xl p-2 hover:bg-slate-100 transition"
            aria-label="Böyüt"
          >
            <ZoomIn className="h-4 w-4 text-slate-700" />
          </button>
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="rounded-xl p-2 hover:bg-slate-100 transition"
            aria-label="Tam ekran"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4 text-slate-700" /> : <Maximize2 className="h-4 w-4 text-slate-700" />}
          </button>
        </div>

        {/* Image Counter */}
        <div className="absolute bottom-4 left-4 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
          {activeIndex + 1} / {images.length}
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => { setActiveIndex(idx); playOrganicSynth('click'); }}
              className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border-2 transition-all ${
                idx === activeIndex ? 'border-emerald-500 ring-2 ring-emerald-200' : 'border-slate-200 hover:border-emerald-300'
              }`}
            >
              <Image src={img} alt={`${productName} - ${idx + 1}`} fill className="object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Variant Selector ──────────────────────────────────────────
function VariantSelector({
  variants,
  selectedIndex,
  onSelect,
  discountType,
  discountValue,
  currency,
}: {
  variants: Variant[];
  selectedIndex: number;
  onSelect: (index: number) => void;
  discountType?: string;
  discountValue?: number;
  currency: string;
}) {
  return (
    <div className="space-y-3">
      <p className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        <Package className="h-4 w-4 text-emerald-600" />
        Variant seçin:
      </p>
      <div className="flex flex-wrap gap-2">
        {variants.map((v, i) => {
          const validDiscountType = (discountType === 'percentage' || discountType === 'fixed') ? discountType as "percentage" | "fixed" : undefined;
          const varPrice = finalPrice(v.price, validDiscountType, discountValue);
          const isSelected = i === selectedIndex;
          const varStock = v.stock ?? 0;
          const isOut = varStock <= 0;
          const label = v.name || v.label || v.unit || 'Standart';
          const discount = v.price > varPrice ? Math.round(((v.price - varPrice) / v.price) * 100) : 0;

          return (
            <motion.button
              key={v.id}
              whileTap={{ scale: 0.95 }}
              onClick={() => !isOut && onSelect(i)}
              disabled={isOut}
              className={`relative rounded-2xl border-2 px-4 py-3 text-sm font-bold transition-all ${
                isSelected
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-lg shadow-emerald-100'
                  : isOut
                  ? 'border-slate-200 bg-slate-50 text-slate-400 cursor-not-allowed opacity-60'
                  : 'border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/50'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="text-left">
                  <p className="font-bold">{label}</p>
                  <p className="text-xs font-normal text-slate-500">
                    {formatCurrency(varPrice, currency)}
                    {discount > 0 && (
                      <span className="ml-1.5 text-red-500 font-bold">-{discount}%</span>
                    )}
                  </p>
                </div>
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="rounded-full bg-emerald-500 p-0.5"
                  >
                    <Check className="h-3 w-3 text-white" />
                  </motion.div>
                )}
                {isOut && (
                  <span className="text-[10px] font-bold text-red-500">(bitib)</span>
                )}
                {!isOut && varStock <= 5 && (
                  <span className="text-[10px] font-bold text-orange-500">son {varStock}</span>
                )}
              </div>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}

// ─── Stock Status ──────────────────────────────────────────────
function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-red-100 px-4 py-2">
        <Ban className="h-4 w-4 text-red-600" />
        <span className="text-sm font-bold text-red-700">Stok yoxdur</span>
      </div>
    );
  }
  if (stock <= 5) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-orange-100 px-4 py-2">
        <TimerOff className="h-4 w-4 text-orange-600" />
        <span className="text-sm font-bold text-orange-700">Son {stock} ədəd!</span>
      </div>
    );
  }
  if (stock <= 20) {
    return (
      <div className="flex items-center gap-2 rounded-full bg-yellow-100 px-4 py-2">
        <Clock className="h-4 w-4 text-yellow-700" />
        <span className="text-sm font-bold text-yellow-700">Məhdud sayda</span>
      </div>
    );
  }
  return (
    <div className="flex items-center gap-2 rounded-full bg-emerald-100 px-4 py-2">
      <CheckCircle2 className="h-4 w-4 text-emerald-600" />
      <span className="text-sm font-bold text-emerald-700">Stokda var</span>
    </div>
  );
}

// ─── Trust Badges ──────────────────────────────────────────────
function TrustBadges() {
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          <Truck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Sürətli çatdırılma</p>
          <p className="text-[10px] text-slate-400">24-48 saat ərzində</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          <ShieldCheck className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Keyfiyyət zəmanəti</p>
          <p className="text-[10px] text-slate-400">100% təbii məhsul</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          <Award className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Sertifikatlı</p>
          <p className="text-[10px] text-slate-400">Laboratoriya təsdiqli</p>
        </div>
      </div>
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
        <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
          <Gift className="h-5 w-5" />
        </div>
        <div>
          <p className="text-xs font-bold text-slate-800">Hədiyyə qutusu</p>
          <p className="text-[10px] text-slate-400">Zərif qablaşdırma</p>
        </div>
      </div>
    </div>
  );
}

// ─── Ana Səhifə ────────────────────────────────────────────────
export default function ProductDetailPage({ params }: { params: { slug: string } }) {
  const { products, addToCart } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);

  const product = useMemo(
    () => products.find((p) => p.slug === params.slug || p.id === params.slug),
    [products, params.slug]
  );

  const shareRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
        <div className="text-center max-w-md">
          <Package className="mx-auto h-20 w-20 text-slate-300" />
          <h2 className="mt-4 text-2xl font-black text-slate-700">Məhsul tapılmadı</h2>
          <p className="mt-2 text-sm text-slate-500">Axtardığınız məhsul hazırda mövcud deyil.</p>
          <div className="mt-6 space-y-3">
            <Link
              href="/products"
              className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 px-8 py-4 text-sm font-black text-white shadow-xl shadow-emerald-200 hover:bg-emerald-700 transition-all"
            >
              <ArrowLeft className="h-5 w-5" /> Bütün məhsullar
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const selectedVariant = product.variants?.[selectedVariantIdx];
  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const imageUrl = getFirstImageUrl(product);
  const stock = selectedVariant?.stock ?? product.stock ?? 0;
  const isOut = stock <= 0;
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / product.reviews.length
    : 0;

  const handleAddToCart = () => {
    if (isOut) return;
    addToCart(product.id, selectedVariant?.id, qty);
    setAdded(true);
    playOrganicSynth('success');
    setToast({ message: 'Məhsul səbətə əlavə edildi! 🎉', type: 'success' });
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `🌿 *${product.name}*\n💰 ${formatCurrency(price)}\n\n📍 Organik Gədəbəy — Təzə kənd məhsulları\n\n🛒 ${url}`;

    try {
      if (platform === 'native') {
        await navigator.share({ title: product.name, text, url });
      } else if (platform === 'whatsapp') {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      } else if (platform === 'telegram') {
        window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, '_blank');
      } else if (platform === 'facebook') {
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'twitter') {
        window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'linkedin') {
        window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
      } else if (platform === 'email') {
        window.location.href = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text)}`;
      } else if (platform === 'copy') {
        await navigator.clipboard?.writeText(`${text}\n\n${url}`);
        setToast({ message: 'Link kopyalandı! 📋', type: 'success' });
      }
      playOrganicSynth('click');
    } catch {}
    setShowShareMenu(false);
  };

  const handleSubmitReview = () => {
    if (!reviewText.trim()) return;
    // Burada real API çağırışı olmalıdır
    setToast({ message: 'Rəyiniz üçün təşəkkürlər! ⭐', type: 'success' });
    setReviewText('');
    setReviewRating(5);
    setShowReviewForm(false);
    playOrganicSynth('success');
  };

  const relatedProducts = products
    .filter((p) => p.id !== product.id && !p.archived && p.categoryId === product.categoryId)
    .slice(0, 4);

  return (
    <main className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <Toast
            message={toast.message}
            type={toast.type}
            onClose={() => setToast(null)}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between">
            <Link
              href="/products"
              className="flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" /> Bütün məhsullar
            </Link>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setLiked(!liked)}
                className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 transition-all"
              >
                <Heart className={liked ? 'fill-red-500 text-red-500' : 'text-slate-400'} />
                <span className="hidden sm:inline">{liked ? 'Saxlanıldı' : 'Saxla'}</span>
              </button>
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-emerald-300 transition-all"
                >
                  <Share2 className="h-4 w-4 text-slate-400" />
                  <span className="hidden sm:inline">Paylaş</span>
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-52 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50"
                    >
                      <button
                        onClick={() => handleShare('native')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Share2 className="h-4 w-4 text-emerald-600" /> Paylaş
                      </button>
                      <button
                        onClick={() => handleShare('whatsapp')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <MessageCircle className="h-4 w-4 text-[#25D366]" /> WhatsApp
                      </button>
                      <button
                        onClick={() => handleShare('telegram')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Send className="h-4 w-4 text-[#0088cc]" /> Telegram
                      </button>
                      <button
                        onClick={() => handleShare('facebook')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Facebook className="h-4 w-4 text-[#1877f2]" /> Facebook
                      </button>
                      <button
                        onClick={() => handleShare('twitter')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Twitter className="h-4 w-4 text-[#000]" /> X
                      </button>
                      <button
                        onClick={() => handleShare('email')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Mail className="h-4 w-4 text-slate-600" /> Email
                      </button>
                      <button
                        onClick={() => handleShare('copy')}
                        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition"
                      >
                        <Copy className="h-4 w-4 text-slate-600" /> Linki kopyala
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8">
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* ─── Left: Image Gallery ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <ImageGallery
              images={product.images?.map((img) => img.url) || [imageUrl]}
              productName={product.name}
            />
          </motion.div>

          {/* ─── Right: Product Info ────────────────────────── */}
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-6"
          >
            {/* Breadcrumbs */}
            <div className="flex items-center gap-1 text-xs text-slate-400">
              <Link href="/" className="hover:text-emerald-600">Ana səhifə</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/products" className="hover:text-emerald-600">Məhsullar</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-600 font-medium">{product.name}</span>
            </div>

            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-emerald-600">
                <MapPin className="h-3.5 w-3.5" />
                {product.originRegion || 'Gədəbəy'}
                {product.isOrganic && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Leaf className="h-3.5 w-3.5" /> 100% Təbii
                  </>
                )}
                {product.isFeatured && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Crown className="h-3.5 w-3.5 text-amber-500" /> Xüsusi
                  </>
                )}
                {product.isSeasonal && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Calendar className="h-3.5 w-3.5 text-orange-500" /> Mövsümi
                  </>
                )}
              </div>
              <h1 className="mt-2 text-3xl font-black text-slate-900 lg:text-4xl">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="mt-1 text-sm text-slate-500">{product.shortDescription}</p>
              )}
            </div>

            {/* Rating */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-4 w-4 ${
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-sm text-slate-400">({product.reviews.length} rəy)</span>
              </div>
            )}

            {/* Price */}
            <div className="flex items-baseline gap-4 rounded-2xl bg-emerald-50/50 px-6 py-4">
              <span className="text-4xl font-black text-emerald-700">
                {formatCurrency(price)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-lg text-slate-400 line-through">
                    {formatCurrency(basePrice)}
                  </span>
                  <span className="rounded-full bg-red-500 px-3 py-1 text-xs font-black text-white shadow-lg shadow-red-200">
                    -{discount}%
                  </span>
                </>
              )}
            </div>

            {/* Description */}
            {product.description && (
              <div className="prose prose-sm max-w-none text-slate-600">
                <p>{product.description}</p>
              </div>
            )}

            {/* Variants */}
            {(product.variants?.length ?? 0) > 1 && (
              <VariantSelector
                variants={product.variants!}
                selectedIndex={selectedVariantIdx}
                onSelect={(idx) => { setSelectedVariantIdx(idx); playOrganicSynth('click'); }}
                discountType={product.discountType}
                discountValue={product.discountValue}
                currency="AZN"
              />
            )}

            {/* Stock & Delivery */}
            <div className="flex flex-wrap items-center gap-4">
              <StockStatus stock={stock} />
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <Clock className="h-4 w-4" />
                Çatdırılma: 24-48 saat
              </div>
            </div>

            {/* Quantity & Cart */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              {!isOut && (
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1">
                  <button
                    onClick={() => { setQty(Math.max(1, qty - 1)); playOrganicSynth('click'); }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 transition"
                    aria-label="Azalt"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-14 text-center text-lg font-black">{qty}</span>
                  <button
                    onClick={() => { setQty(Math.min(stock, qty + 1)); playOrganicSynth('click'); }}
                    className="flex h-11 w-11 items-center justify-center rounded-xl bg-white shadow-sm hover:bg-slate-50 transition"
                    aria-label="Artır"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}

              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={handleAddToCart}
                disabled={isOut}
                className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-4 text-sm font-black transition-all ${
                  isOut
                    ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    : added
                    ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                    : 'bg-[#051F0A] text-[#B5E935] hover:bg-slate-800 shadow-xl active:scale-95'
                }`}
              >
                {added ? (
                  <><Check className="h-5 w-5" /> Səbətə əlavə edildi!</>
                ) : isOut ? (
                  <><Ban className="h-5 w-5" /> Stok yoxdur</>
                ) : (
                  <><ShoppingBag className="h-5 w-5" /> Səbətə əlavə et</>
                )}
              </motion.button>
            </div>

            {/* Trust Badges */}
            <TrustBadges />

            {/* Tags */}
            {product.tags && product.tags.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">
                <span className="text-xs font-semibold text-slate-500">Teqlər:</span>
                {product.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/products?tag=${tag}`}
                    className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 hover:bg-emerald-100 hover:text-emerald-700 transition"
                  >
                    #{tag}
                  </Link>
                ))}
              </div>
            )}

            {/* WhatsApp */}
            <a
              href={`https://wa.me/994773676021?text=${encodeURIComponent(`Salam! ${product.name} sifariş etmək istəyirəm 🌿`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 rounded-2xl border-2 border-[#25D366] py-3 text-sm font-bold text-[#25D366] transition hover:bg-[#25D366] hover:text-white"
            >
              <MessageCircle className="h-5 w-5" />
              WhatsApp ilə sifariş ver
            </a>
          </motion.div>
        </div>

        {/* ─── Reviews Section ────────────────────────────────── */}
        {product.reviews && product.reviews.length > 0 && (
          <section className="mt-16">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-slate-800 flex items-center gap-2">
                <Star className="h-6 w-6 text-amber-400 fill-amber-400" />
                Rəylər ({product.reviews.length})
              </h2>
              <button
                onClick={() => setShowReviewForm(!showReviewForm)}
                className="rounded-2xl bg-emerald-600 px-5 py-2.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
              >
                {showReviewForm ? 'Ləğv et' : 'Rəy yaz'}
              </button>
            </div>

            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <div className="mb-6 rounded-3xl bg-white p-6 shadow-md">
                    <h3 className="mb-4 font-bold text-slate-800">Rəy bildirin</h3>
                    <div className="mb-4 flex items-center gap-2">
                      <span className="text-sm font-semibold text-slate-600">Reytiniz:</span>
                      {[1, 2, 3, 4, 5].map((r) => (
                        <button
                          key={r}
                          onClick={() => setReviewRating(r)}
                          className="transition hover:scale-110"
                        >
                          <Star
                            className={`h-6 w-6 ${
                              r <= reviewRating
                                ? 'fill-amber-400 text-amber-400'
                                : 'fill-slate-200 text-slate-200'
                            }`}
                          />
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={reviewText}
                      onChange={(e) => setReviewText(e.target.value)}
                      placeholder="Məhsul haqqında fikirlərinizi yazın..."
                      className="w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                      rows={3}
                    />
                    <button
                      onClick={handleSubmitReview}
                      disabled={!reviewText.trim()}
                      className="mt-3 rounded-2xl bg-emerald-600 px-6 py-2.5 text-sm font-bold text-white disabled:opacity-50"
                    >
                      Göndər
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="space-y-4">
              {product.reviews.map((review) => (
                <div key={review.id} className="rounded-2xl bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100 font-black text-emerald-700">
                        {review.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{review.name}</p>
                        <div className="flex items-center gap-1">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= review.rating
                                  ? 'fill-amber-400 text-amber-400'
                                  : 'fill-slate-200 text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                    </div>
                    <span className="text-xs text-slate-400">
                      {new Date(review.createdAt).toLocaleDateString('az-AZ')}
                    </span>
                  </div>
                  <p className="mt-2 text-sm text-slate-600">{review.text}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ─── Related Products ────────────────────────────────── */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="mb-6 text-2xl font-black text-slate-800 flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-emerald-600" />
              Oxşar məhsullar
            </h2>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {relatedProducts.map((p) => (
                <RusticProductCard key={p.id} product={p} addToCart={addToCart} />
              ))}
            </div>
          </section>
        )}

        {/* ─── Recently Viewed ────────────────────────────────── */}
        <section className="mt-16 border-t border-slate-100 pt-12">
          <h2 className="mb-6 text-2xl font-black text-slate-800 flex items-center gap-2">
            <Clock className="h-6 w-6 text-slate-600" />
            Son baxdıqlarınız
          </h2>
          <p className="text-sm text-slate-400">Bu bölmə tezliklə aktiv olacaq.</p>
        </section>
      </div>
    </main>
  );
}