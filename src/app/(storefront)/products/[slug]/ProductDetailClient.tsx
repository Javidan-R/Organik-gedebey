// src/app/(storefront)/products/[slug]/ProductDetailClient.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef, useCallback } from 'react';
import { useApp } from '@/lib/store';
import {
  getProductBasePrice,
  getFirstImageUrl,
  formatCurrency,
} from '@/utils/product';
import { finalPrice } from '@/lib/calc';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Leaf,
  Minus,
  Share2,
  MapPin,
  Clock,
  Star,
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
  Zap,
  Headphones,
  BadgePercent,
  Heart,
  ShoppingBag,
  MessageCircle,
  Mail,
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
  Tag,
  Layers,
  Image as ImageIcon,
  Percent,
  Lightbulb,
  BookOpen,
} from 'lucide-react';
import Link from 'next/link';
import type { Variant } from '@/types/products';
import { RusticProductCard } from '@/components/ui/organisms/RusticProductCard';
import { Button } from '@/components/atoms/button';
import { MediaGallery, type MediaItem } from '@/components/ui/MediaGallery';

// ─── Helper: ümumi stok hesabla ──────────────────────────────────
function getTotalStock(product: any): number {
  if (product.stock !== undefined && product.stock !== null) {
    return product.stock;
  }
  if (product.variants && Array.isArray(product.variants)) {
    return product.variants.reduce((sum: number, v: any) => sum + (v.stock ?? 0), 0);
  }
  return 0;
}

// ─── Helper: məhsulu stock ilə zənginləşdir ──────────────────────
function enrichProductWithStock(product: any) {
  return {
    ...product,
    stock: getTotalStock(product),
  };
}

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

// ─── Toast ────────────────────────────────────────────────────────
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
      {[
        { icon: Truck, label: 'Sürətli çatdırılma', desc: '24-48 saat ərzində' },
        { icon: ShieldCheck, label: 'Keyfiyyət zəmanəti', desc: '100% təbii məhsul' },
        { icon: Award, label: 'Sertifikatlı', desc: 'Laboratoriya təsdiqli' },
        { icon: Gift, label: 'Hədiyyə qutusu', desc: 'Zərif qablaşdırma' },
      ].map((item, i) => (
        <div key={i} className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-sm">
          <div className="rounded-xl bg-emerald-50 p-2.5 text-emerald-600">
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-xs font-bold text-slate-800">{item.label}</p>
            <p className="text-[10px] text-slate-400">{item.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Recently Viewed ──────────────────────────────────────────
function useRecentlyViewed() {
  const [recent, setRecent] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('recently_viewed');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  });

  const add = useCallback((id: string) => {
    setRecent((prev) => {
      const filtered = prev.filter((p) => p !== id);
      const updated = [id, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('recently_viewed', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  return { recent, add };
}

// ─── Helper: extract image URLs ──────────────────────────────
function extractImageUrls(images: any[] | undefined): string[] {
  if (!images || !Array.isArray(images)) return [];
  return images
    .map((img) => {
      if (typeof img === 'string') return img;
      if (img && typeof img === 'object' && 'url' in img) {
        return img.url;
      }
      return null;
    })
    .filter((url): url is string => typeof url === 'string' && url.length > 0);
}

// ─── Marketing Badges ─────────────────────────────────────────
function MarketingBadges() {
  return (
    <div className="flex flex-wrap items-center gap-2 mt-2">
      {[
        { icon: Zap, label: 'Limited Offer', color: 'bg-amber-100 text-amber-700' },
        { icon: Truck, label: 'Free Delivery', color: 'bg-emerald-100 text-emerald-700' },
        { icon: Headphones, label: '24/7 Support', color: 'bg-blue-100 text-blue-700' },
        { icon: BadgePercent, label: 'Endirimli', color: 'bg-rose-100 text-rose-700' },
      ].map((item, i) => (
        <motion.span
          key={item.label}
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.2 + i * 0.2, type: 'spring' }}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold ${item.color}`}
        >
          <item.icon className="h-3.5 w-3.5" />
          {item.label}
        </motion.span>
      ))}
    </div>
  );
}

// ─── Tab Definitions ──────────────────────────────────────────
type DetailTab = 'main' | 'stock' | 'media' | 'tags' | 'discount' | 'benefits' | 'tips' | 'reviews';

const TAB_DEFS: { key: DetailTab; label: string; icon: React.ElementType }[] = [
  { key: 'main', label: 'Əsas', icon: Info },
  { key: 'stock', label: 'Stok / Variant', icon: Layers },
  { key: 'media', label: 'Media', icon: ImageIcon },
  { key: 'tags', label: 'Etiketlər', icon: Tag },
  { key: 'discount', label: 'Endirim', icon: Percent },
  { key: 'benefits', label: 'Faydalar', icon: Award },
  { key: 'tips', label: 'Məsləhətlər', icon: Lightbulb },
  { key: 'reviews', label: 'Rəylər', icon: Star },
];

// ─── Main Component ────────────────────────────────────────────────
export function ProductDetailClient({ initialProduct }: { initialProduct: any }) {
  const { products, addToCart, toggleFavorite, isFavorite, setProducts } = useApp();
  const [qty, setQty] = useState(1);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [added, setAdded] = useState(false);
  const [liked, setLiked] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('main');

  const shareRef = useRef<HTMLDivElement>(null);
  const { add: addRecent } = useRecentlyViewed();

  // ── Use server data immediately, hydrate store in background ──────────────
  const product = useMemo(() => {
    if (initialProduct) {
      return enrichProductWithStock(initialProduct);
    }
    return products.find((p) => p.slug === initialProduct?.slug || p.id === initialProduct?.id);
  }, [initialProduct, products]);

  useEffect(() => {
    if (initialProduct) {
      const enrichedProduct = enrichProductWithStock(initialProduct);
      setProducts([enrichedProduct]);
    }
  }, [initialProduct, setProducts]);

  useEffect(() => {
    if (product?.id) addRecent(product.id);
  }, [product, addRecent]);

  useEffect(() => {
    if (product?.id) {
      setLiked(isFavorite(product.id));
    }
  }, [product, isFavorite]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Media Items ──
  const mediaItems = useMemo<MediaItem[]>(() => {
    if (!product) return [];

    const imageUrl = getFirstImageUrl(product);
    const items: MediaItem[] = [];

    const imageUrls = extractImageUrls(product.images);
    if (imageUrls.length > 0) {
      imageUrls.forEach((url, idx) => {
        items.push({
          id: `img-${idx}`,
          type: 'image',
          url,
          alt: product.name,
        });
      });
    } else if (imageUrl) {
      items.push({
        id: 'img-0',
        type: 'image',
        url: imageUrl,
        alt: product.name,
      });
    }

    if (product.video) {
      const videoUrl = product.video;
      const youtubeMatch = videoUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s]+)/);
      const vimeoMatch = videoUrl.match(/vimeo\.com\/(\d+)/);
      const videoItem: MediaItem = {
        id: 'video-0',
        type: 'video',
        url: videoUrl,
        alt: `${product.name} - video`,
        thumbnail: items[0]?.url,
        provider: youtubeMatch ? 'youtube' : vimeoMatch ? 'vimeo' : 'local',
        videoId: youtubeMatch?.[1] || vimeoMatch?.[1] || undefined,
      };
      items.push(videoItem);
    }

    return items;
  }, [product]);

  // ── Early return ────────────────
  if (!product) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-amber-50/30 px-4">
        <div className="text-center max-w-md">
          <Package className="mx-auto h-20 w-20 text-slate-300" />
          <h2 className="mt-4 text-2xl font-black text-slate-700">Məhsul tapılmadı</h2>
          <p className="mt-2 text-sm text-slate-500">Axtardığınız məhsul hazırda mövcud deyil.</p>
          <Button variant="primary" className="mt-6 w-full sm:w-auto" asChild>
            <Link href="/products">
              <ArrowLeft className="h-5 w-5" /> Bütün məhsullar
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  // ── Computed values ──
  const selectedVariant = product.variants?.[selectedVariantIdx];
  const basePrice = getProductBasePrice(product);
  const price = finalPrice(basePrice, product.discountType, product.discountValue);
  const stock = selectedVariant?.stock ?? product.stock ?? 0;
  const isOut = stock <= 0;
  const discount = basePrice > 0 ? Math.round((1 - price / basePrice) * 100) : 0;
  const avgRating = product.reviews?.length
    ? product.reviews.reduce((sum: number, r: any) => sum + (r.rating || 0), 0) / product.reviews.length
    : 0;

  // ── Callbacks ──
  const handleAddToCart = useCallback(() => {
    if (isOut) return;
    addToCart(product.id, selectedVariant?.id, qty);
    setAdded(true);
    playOrganicSynth('success');
    setToast({ message: 'Məhsul səbətə əlavə edildi! 🎉', type: 'success' });
    setTimeout(() => setAdded(false), 2000);
  }, [addToCart, product.id, selectedVariant?.id, qty, isOut]);

  const handleToggleLike = useCallback(() => {
    toggleFavorite(product.id);
    setLiked(!liked);
    playOrganicSynth('click');
    setToast({
      message: liked ? 'Siyahıdan çıxarıldı' : 'Favorilərə əlavə edildi! ❤️',
      type: 'success',
    });
  }, [toggleFavorite, product.id, liked]);

  const handleShare = async (platform: string) => {
    const url = window.location.href;
    const text = `🌿 *${product.name}*\n💰 ${formatCurrency(price)}\n\n📍 Yaylaq — Təzə kənd məhsulları\n\n🛒 ${url}`;

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

  const handleSubmitReview = useCallback(() => {
    if (!reviewText.trim()) return;
    setReviewSubmitted(true);
    setToast({ message: 'Rəyiniz üçün təşəkkürlər! ⭐', type: 'success' });
    setReviewText('');
    setReviewRating(5);
    setShowReviewForm(false);
    playOrganicSynth('success');
    setTimeout(() => setReviewSubmitted(false), 2000);
  }, [reviewText]);

  // ── Related products ──
  const relatedProducts = useMemo(
    () =>
      products
        .filter((p) => p.id !== product.id && !p.archived && p.categoryId === product.categoryId)
        .slice(0, 4),
    [products, product.id, product.categoryId]
  );

  // ── Recently viewed products (from localStorage) ──
  const recentlyViewedProducts = useMemo(() => {
    try {
      const recentIds: string[] = JSON.parse(localStorage.getItem('recently_viewed') || '[]');
      return products
        .filter((p) => recentIds.includes(p.id) && p.id !== product.id)
        .slice(0, 4);
    } catch {
      return [];
    }
  }, [products, product.id]);

  // ── Render Tab Content ────────────────────────────────────────
  const renderTabContent = () => {
    switch (activeTab) {
      case 'main':
        return (
          <div className="space-y-4">
            {product.description && (
              <div className="prose prose-sm max-w-none text-slate-600">
                <p className="text-sm whitespace-pre-wrap">{product.description}</p>
              </div>
            )}
            {product.shortDescription && (
              <div className="bg-slate-50 rounded-xl p-4">
                <h4 className="text-sm font-bold text-slate-800 mb-1">Qısa məlumat</h4>
                <p className="text-sm text-slate-600">{product.shortDescription}</p>
              </div>
            )}
          </div>
        );
      case 'stock':
        return (
          <div className="space-y-4">
            <StockStatus stock={stock} />
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
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-500">Ümumi stok</p>
                <p className="text-2xl font-black text-emerald-700">{getTotalStock(product)}</p>
              </div>
              <div className="bg-white rounded-xl p-4 shadow-sm">
                <p className="text-xs text-slate-500">Min. stok səviyyəsi</p>
                <p className="text-2xl font-black text-slate-700">{product.minStock ?? 10}</p>
              </div>
              {product.shelfLifeDays && (
                <div className="bg-white rounded-xl p-4 shadow-sm col-span-2">
                  <p className="text-xs text-slate-500">Raf ömrü</p>
                  <p className="text-lg font-bold text-slate-700">{product.shelfLifeDays} gün</p>
                </div>
              )}
            </div>
          </div>
        );
      case 'media':
        return (
          <div className="space-y-4">
            <MediaGallery
              items={mediaItems}
              aspectRatio="video"
              showThumbnails={mediaItems.length > 1}
              hideThumbnailsOnMobile={mediaItems.length > 3}
              autoPlay={false}
              loop={false}
              allowZoom={true}
              allowFullscreen={true}
              className="w-full"
              containerClassName="rounded-2xl sm:rounded-3xl"
            />
            {mediaItems.length === 0 && (
              <p className="text-sm text-slate-500">Media yoxdur.</p>
            )}
          </div>
        );
      case 'tags':
        return (
          <div className="space-y-4">
            <h4 className="text-sm font-bold text-slate-800">Məhsul etiketləri</h4>
            <div className="flex flex-wrap gap-2">
              {product.tags?.length > 0 ? (
                product.tags.map((tag: string, i: number) => (
                  <span key={i} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
                    #{tag}
                  </span>
                ))
              ) : (
                <p className="text-sm text-slate-500">Heç bir etiket əlavə olunmayıb.</p>
              )}
            </div>
            <div className="mt-4">
              <h4 className="text-sm font-bold text-slate-800 mb-2">Status etiketləri</h4>
              <div className="flex flex-wrap gap-2">
                {product.isOrganic && <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">Organik</span>}
                {product.isFeatured && <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold text-amber-700">Seçilmiş</span>}
                {product.isNewArrival && <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">Yeni</span>}
                {product.isSeasonal && <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">Mövsümi</span>}
              </div>
            </div>
          </div>
        );
      case 'discount':
        return (
          <div className="space-y-4">
            {discount > 0 ? (
              <div className="rounded-2xl bg-red-50 p-6">
                <div className="flex items-center gap-3">
                  <BadgePercent className="h-8 w-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-black text-red-700">-{discount}% endirim</p>
                    <p className="text-sm text-slate-600">
                      {formatCurrency(basePrice)} → {formatCurrency(price)} ₼
                    </p>
                  </div>
                </div>
                {product.discountStart && (
                  <p className="mt-2 text-xs text-slate-500">
                    Başlanğıc: {new Date(product.discountStart).toLocaleDateString('az-AZ')}
                  </p>
                )}
                {product.discountEnd && (
                  <p className="text-xs text-slate-500">
                    Son: {new Date(product.discountEnd).toLocaleDateString('az-AZ')}
                  </p>
                )}
              </div>
            ) : (
              <p className="text-sm text-slate-500">Hazırda heç bir endirim tətbiq edilməyib.</p>
            )}
          </div>
        );
      case 'benefits':
        return (
          <div className="space-y-3">
            {product.benefits?.length > 0 ? (
              product.benefits.map((b: string, i: number) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-emerald-50 p-3">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{b}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Faydaları qeyd olunmayıb.</p>
            )}
          </div>
        );
      case 'tips':
        return (
          <div className="space-y-3">
            {product.usageTips?.length > 0 ? (
              product.usageTips.map((tip: string, i: number) => (
                <div key={i} className="flex items-start gap-2 rounded-xl bg-amber-50 p-3">
                  <Lightbulb className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
                  <p className="text-sm text-slate-700">{tip}</p>
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">İstifadə məsləhətləri yoxdur.</p>
            )}
            {product.storageConditions && (
              <div className="mt-4 rounded-xl bg-blue-50 p-4">
                <h4 className="text-sm font-bold text-slate-800 flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-blue-600" /> Saxlama şəraiti
                </h4>
                <p className="mt-1 text-sm text-slate-600">{product.storageConditions}</p>
              </div>
            )}
          </div>
        );
      case 'reviews':
        return (
          <div className="space-y-4">
            {product.reviews?.length > 0 ? (
              product.reviews.map((r: any, i: number) => (
                <div key={i} className="rounded-xl bg-white p-4 shadow-sm">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="flex">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          className={`h-4 w-4 ${
                            s <= r.rating ? 'fill-amber-400 text-amber-400' : 'fill-slate-200 text-slate-200'
                          }`}
                        />
                      ))}
                    </div>
                    <span className="text-xs font-semibold text-slate-500">{r.name}</span>
                  </div>
                  {r.comment && <p className="text-sm text-slate-700">{r.comment}</p>}
                </div>
              ))
            ) : (
              <p className="text-sm text-slate-500">Hələ rəy yoxdur.</p>
            )}
            {!showReviewForm && (
              <Button variant="secondary" onClick={() => setShowReviewForm(true)} className="mt-4">
                Rəy yaz
              </Button>
            )}
            <AnimatePresence>
              {showReviewForm && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="mt-3 space-y-3 overflow-hidden"
                >
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setReviewRating(s)}
                        className="p-1"
                      >
                        <Star
                          className={`h-5 w-5 ${
                            s <= reviewRating
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
                    placeholder="Rəyinizi yazın..."
                    rows={3}
                    className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm"
                  />
                  <div className="flex gap-2">
                    <Button variant="primary" size="sm" onClick={handleSubmitReview} disabled={!reviewText.trim()}>
                      Göndər
                    </Button>
                    <Button variant="secondary" size="sm" onClick={() => { setShowReviewForm(false); setReviewText(''); setReviewRating(5); }}>
                      Ləğv et
                    </Button>
                  </div>
                  {reviewSubmitted && (
                    <p className="text-xs text-emerald-600 font-medium">Rəyiniz qeydə alındı!</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        );
      default:
        return null;
    }
  };

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

      {/* Sticky Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-slate-100">
        <div className="mx-auto max-w-7xl px-4 py-3">
          <div className="flex items-center justify-between gap-2">
            <Link
              href="/products"
              className="flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-slate-600 hover:text-emerald-600 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
              <span className="hidden xs:inline">Bütün məhsullar</span>
            </Link>
            <div className="flex items-center gap-1 sm:gap-2">
              <button
                onClick={handleToggleLike}
                className="flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-emerald-300 transition-all"
                aria-label="Favorilərə əlavə et"
              >
                <Heart className={`h-4 w-4 sm:h-5 sm:w-5 ${liked ? 'fill-red-500 text-red-500' : 'text-slate-400'}`} />
                <span className="hidden sm:inline">{liked ? 'Saxlanıldı' : 'Saxla'}</span>
              </button>
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="flex items-center gap-1 rounded-xl border border-slate-200 px-2 py-1.5 sm:px-3 sm:py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:border-emerald-300 transition-all"
                  aria-label="Paylaş"
                >
                  <Share2 className="h-4 w-4 sm:h-5 sm:w-5 text-slate-400" />
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
                      {[
                        { label: 'Paylaş', icon: Share2, platform: 'native', color: 'text-emerald-600' },
                        { label: 'WhatsApp', icon: MessageCircle, platform: 'whatsapp', color: 'text-[#25D366]' },
                        { label: 'Telegram', icon: Send, platform: 'telegram', color: 'text-[#0088cc]' },
                        { label: 'Facebook', icon: Facebook, platform: 'facebook', color: 'text-[#1877f2]' },
                        { label: 'X', icon: Twitter, platform: 'twitter', color: 'text-black' },
                        { label: 'Email', icon: Mail, platform: 'email', color: 'text-slate-600' },
                        { label: 'Linki kopyala', icon: Copy, platform: 'copy', color: 'text-slate-600' },
                      ].map((item) => (
                        <button
                          key={item.platform}
                          onClick={() => handleShare(item.platform)}
                          className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition ${item.color}`}
                        >
                          <item.icon className="h-4 w-4" /> {item.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-4 sm:py-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:gap-12">
          {/* Left: Media Gallery */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5 }}
          >
            <MediaGallery
              items={mediaItems}
              aspectRatio="video"
              showThumbnails={mediaItems.length > 1}
              hideThumbnailsOnMobile={mediaItems.length > 3}
              autoPlay={false}
              loop={false}
              allowZoom={true}
              allowFullscreen={true}
              className="w-full"
              containerClassName="rounded-2xl sm:rounded-3xl"
            />
          </motion.div>

          {/* Right: Product Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="space-y-4 sm:space-y-6"
          >
            {/* Breadcrumbs */}
            <div className="hidden sm:flex items-center gap-1 text-xs text-slate-400">
              <Link href="/" className="hover:text-emerald-600">Ana səhifə</Link>
              <ChevronRight className="h-3 w-3" />
              <Link href="/products" className="hover:text-emerald-600">Məhsullar</Link>
              <ChevronRight className="h-3 w-3" />
              <span className="text-slate-600 font-medium truncate max-w-xs">{product.name}</span>
            </div>

            {/* Title & Badges */}
            <div>
              <div className="flex flex-wrap items-center gap-1.5 text-[10px] sm:text-xs font-bold text-emerald-600">
                <MapPin className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                {product.originRegion || 'Gədəbəy'}
                {product.isOrganic && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Leaf className="h-3 w-3 sm:h-3.5 sm:w-3.5" /> 100% Təbii
                  </>
                )}
                {product.isFeatured && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Crown className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-amber-500" /> Xüsusi
                  </>
                )}
                {product.isSeasonal && (
                  <>
                    <span className="text-slate-300">•</span>
                    <Calendar className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-orange-500" /> Mövsümi
                  </>
                )}
              </div>
              <h1 className="mt-1 text-2xl sm:text-3xl lg:text-4xl font-black text-slate-900 leading-tight">
                {product.name}
              </h1>
              {product.shortDescription && (
                <p className="mt-1 text-xs sm:text-sm text-slate-500">{product.shortDescription}</p>
              )}
              <MarketingBadges />
            </div>

            {/* Rating */}
            {product.reviews && product.reviews.length > 0 && (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-0.5">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      className={`h-3.5 w-3.5 sm:h-4 sm:w-4 ${
                        s <= Math.round(avgRating)
                          ? 'fill-amber-400 text-amber-400'
                          : 'fill-slate-200 text-slate-200'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs sm:text-sm font-bold text-slate-700">{avgRating.toFixed(1)}</span>
                <span className="text-xs sm:text-sm text-slate-400">({product.reviews.length} rəy)</span>
              </div>
            )}

            {/* Price */}
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="flex items-baseline gap-3 rounded-2xl bg-emerald-50/50 px-4 py-3 sm:px-6 sm:py-4 flex-wrap"
            >
              <span className="text-2xl sm:text-3xl lg:text-4xl font-black text-emerald-700">
                {formatCurrency(price)}
              </span>
              {discount > 0 && (
                <>
                  <span className="text-sm sm:text-base text-slate-400 line-through">
                    {formatCurrency(basePrice)}
                  </span>
                  <span className="rounded-full bg-red-500 px-2 py-0.5 sm:px-3 sm:py-1 text-[10px] sm:text-xs font-black text-white shadow-lg shadow-red-200">
                    -{discount}%
                  </span>
                </>
              )}
            </motion.div>

            {/* Stock & Delivery */}
            <div className="flex flex-wrap items-center gap-3">
              <StockStatus stock={stock} />
              <div className="flex items-center gap-1.5 text-xs sm:text-sm text-slate-500">
                <Clock className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                Çatdırılma: 24-48 saat
              </div>
            </div>

            {/* Quantity & Cart */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-1">
              {!isOut && (
                <div className="flex items-center gap-1 rounded-2xl bg-slate-100 p-1 self-start">
                  <button
                    onClick={() => { setQty(Math.max(1, qty - 1)); playOrganicSynth('click'); }}
                    className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                  >
                    <Minus className="h-4 w-4" />
                  </button>
                  <span className="w-12 text-center font-bold text-slate-900">{qty}</span>
                  <button
                    onClick={() => { setQty(qty + 1); playOrganicSynth('click'); }}
                    className="w-10 h-10 rounded-xl bg-white text-slate-700 hover:bg-emerald-50 transition-colors flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4" />
                  </button>
                </div>
              )}
              <Button
                variant={isOut ? "secondary" : "primary"}
                onClick={handleAddToCart}
                disabled={isOut}
                className="flex-1 h-12 text-base font-bold"
              >
                {isOut ? (
                  <>
                    <Ban className="h-5 w-5 mr-2" /> Stokda yoxdur
                  </>
                ) : added ? (
                  <>
                    <Check className="h-5 w-5 mr-2" /> Əlavə edildi
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-5 w-5 mr-2" /> Səbətə at
                  </>
                )}
              </Button>
            </div>

            {/* Trust Badges */}
            <TrustBadges />
          </motion.div>
        </div>

        {/* Tab System */}
        <div className="mt-12">
          <div className="flex overflow-x-auto gap-1 border-b border-slate-200 pb-2 scrollbar-hide">
            {TAB_DEFS.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-t-xl text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeTab === tab.key
                    ? 'bg-white text-emerald-700 border-b-2 border-emerald-600 -mb-[2px]'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
          <div className="mt-6 bg-white rounded-2xl p-6 shadow-sm">
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                {renderTabContent()}
              </motion.div>
            </AnimatePresence>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Oxşar məhsullar</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {relatedProducts.map((p) => (
                <RusticProductCard
                  key={p.id}
                  product={p}
                  currency="AZN"
                  addToCart={() => addToCart(p.id)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Recently Viewed */}
        {recentlyViewedProducts.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-black text-slate-900 mb-6">Son baxdıqlarınız</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {recentlyViewedProducts.map((p) => (
                <RusticProductCard
                  key={p.id}
                  product={p}
                  currency="AZN"
                  addToCart={() => addToCart(p.id)}
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}