// components/ui/molecules/FreshTodayStoryModal.tsx
"use client";

import {
  useMemo,
  useState,
  useCallback,
  useRef,
  useEffect,
} from "react";
import {
  motion,
  AnimatePresence,
  PanInfo,
} from "framer-motion";
import {
  Play,
  Pause,
  X,
  ShoppingBag,
  Star,
  MapPin,
  Leaf,
  Heart,
  MessageCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
} from "lucide-react";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { finalPrice } from "@/lib/calc";
import {
  getFirstImageUrl,
  getProductBasePrice,
  formatCurrency,
} from "@/utils/storefront_home";
import type { Product } from "@/types/products";

/* ================================================================
   Köməkçilər
   ================================================================ */
function getImage(product: Product, idx = 0): string {
  const images = product.images || [];
  if (images.length > idx && images[idx]?.url) return images[idx].url;
  return "/hero-basket.png";
}

function getDiscount(product: Product): number {
  const base = getProductBasePrice(product);
  const price = finalPrice(base, product.discountType, product.discountValue);
  if (base <= 0 || price >= base) return 0;
  return Math.round((1 - price / base) * 100);
}

function relativeTime(dateStr?: string): string {
  if (!dateStr) return "";
  const now = Date.now();
  const then = new Date(dateStr).getTime();
  const diffSec = Math.floor((now - then) / 1000);
  if (diffSec < 60) return "indicə";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} dəq əvvəl`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr} saat əvvəl`;
  return new Date(dateStr).toLocaleDateString("az-AZ");
}

/* ================================================================
   Progress Bar
   ================================================================ */
function ProgressBar({
  total,
  current,
  isPaused,
  onComplete,
}: {
  total: number;
  current: number;
  isPaused: boolean;
  onComplete: () => void;
}) {
  const [progress, setProgress] = useState(0);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setProgress(0);
  }, [current]);

  useEffect(() => {
    if (isPaused) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    const duration = 5000;
    const step = 100 / (duration / 50);

    intervalRef.current = setInterval(() => {
      setProgress((prev) => {
        const next = prev + step;
        if (next >= 100) {
          clearInterval(intervalRef.current!);
          onComplete();
          return 100;
        }
        return next;
      });
    }, 50);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [current, isPaused, onComplete]);

  return (
    <div className="absolute top-3 left-3 right-3 z-30 flex gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          className="flex-1 h-[3px] rounded-full bg-white/25 overflow-hidden"
        >
          <motion.div
            className="h-full rounded-full bg-white"
            initial={{ width: "0%" }}
            animate={{
              width:
                i < current ? "100%" : i === current ? `${progress}%` : "0%",
            }}
            transition={{ duration: 0.1 }}
          />
        </div>
      ))}
    </div>
  );
}

/* ================================================================
   Story Modal
   ================================================================ */
interface Props {
  open: boolean;
  initialIndex: number;
  onClose: () => void;
}

export function FreshTodayStoryModal({ open, initialIndex, onClose }: Props) {
  const products = useApp((s) => s.products);
  const addToCart = useApp((s) => s.addToCart);
  const toggleFavorite = useApp((s) => s.toggleFavorite);
  const favorites = useApp((s) => s.favorites);

  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [isPaused, setIsPaused] = useState(false);
  const [direction, setDirection] = useState(0);
  const [currentImgIdx, setCurrentImgIdx] = useState(0);

  // Eyni filter: son 48 saat / yeni işarələnmiş
  const freshProducts = useMemo(() => {
    if (!products) return [];
    const now = Date.now();
    const twoDaysAgo = now - 48 * 60 * 60 * 1000;
    return products
      .filter((p) => {
        if (p.archived) return false;
        const isNew = p.isNewArrival || p.statusTags?.includes("new");
        const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        return isNew || createdAt > twoDaysAgo;
      })
      .sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      )
      .slice(0, 10);
  }, [products]);

  const currentProduct = freshProducts[currentIndex];
  const total = freshProducts.length;

  const images = currentProduct?.images || [];
  const totalImgs = images.length || 1;

  // Şəkil indeksini məhsul dəyişəndə sıfırla
  useEffect(() => {
    setCurrentImgIdx(0);
  }, [currentIndex]);

  const handleNext = useCallback(() => {
    if (currentIndex < total - 1) {
      setDirection(1);
      setCurrentIndex((p) => p + 1);
    }
  }, [currentIndex, total]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setDirection(-1);
      setCurrentIndex((p) => p - 1);
    }
  }, [currentIndex]);

  const handleTap = (e: React.MouseEvent | React.TouchEvent) => {
    const x = "touches" in e ? e.touches?.[0]?.clientX ?? 0 : e.clientX;
    if (x < window.innerWidth * 0.3) handlePrev();
    else if (x > window.innerWidth * 0.7) handleNext();
  };

  const handleDragEnd = (_: any, info: PanInfo) => {
    if (info.offset.x < -80) handleNext();
    else if (info.offset.x > 80) handlePrev();
  };

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 300 : -300, opacity: 0 }),
    center: { x: 0, opacity: 1, transition: { duration: 0.3 } },
    exit: (dir: number) => ({ x: dir > 0 ? -300 : 300, opacity: 0, transition: { duration: 0.2 } }),
  };

  const nextImg = () => setCurrentImgIdx((p) => (p < totalImgs - 1 ? p + 1 : 0));
  const prevImg = () => setCurrentImgIdx((p) => (p > 0 ? p - 1 : totalImgs - 1));

  if (!currentProduct) return null;

  const base = getProductBasePrice(currentProduct);
  const price = finalPrice(base, currentProduct.discountType, currentProduct.discountValue);
  const discount = getDiscount(currentProduct);
  const isFav = favorites.includes(currentProduct.id);
  const stock = currentProduct.variants?.[0]?.stock ?? 0;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 bg-black"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <ProgressBar
            total={total}
            current={currentIndex}
            isPaused={isPaused}
            onComplete={handleNext}
          />

          {/* Bağla */}
          <button
            onClick={onClose}
            className="absolute top-6 right-4 z-30 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Dayandır / Oynat */}
          <button
            onClick={() => setIsPaused(!isPaused)}
            className="absolute top-6 left-4 z-30 p-2 rounded-full bg-black/30 text-white backdrop-blur-sm"
          >
            {isPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
          </button>

          <AnimatePresence initial={false} custom={direction} mode="popLayout">
            <motion.div
              key={currentIndex}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              drag="x"
              dragConstraints={{ left: 0, right: 0 }}
              dragElastic={0.05}
              onDragEnd={handleDragEnd}
              onClick={handleTap}
              className="absolute inset-0"
            >
              {/* Şəkil */}
              <Image
                src={getImage(currentProduct, currentImgIdx)}
                alt={currentProduct.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20" />

              {/* Şəkil arası keçid oxları */}
              {totalImgs > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); prevImg(); }}
                    className="absolute left-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/30 text-white"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); nextImg(); }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 z-20 p-1.5 rounded-full bg-black/30 text-white"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}

              {/* Sadə alt kart */}
              <div className="absolute bottom-0 inset-x-0 p-4 pb-8">
                <div className="flex items-end justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="bg-emerald-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                        <Leaf className="w-3 h-3 inline mr-0.5" /> TƏZƏ
                      </span>
                      {discount > 0 && (
                        <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                          -{discount}%
                        </span>
                      )}
                    </div>
                    <h3 className="text-xl font-black text-white leading-tight">
                      {currentProduct.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-2xl font-black text-emerald-400">
                        {formatCurrency(price)}
                      </span>
                      {discount > 0 && (
                        <span className="text-sm text-white/50 line-through">
                          {formatCurrency(base)}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-white/60 text-xs">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {currentProduct.originRegion || "Gədəbəy"}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {relativeTime(currentProduct.createdAt)}
                      </span>
                    </div>
                  </div>

                  {/* Sağ əməliyyatlar */}
                  <div className="flex flex-col gap-2 ml-3">
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleFavorite(currentProduct.id); }}
                      className={`p-2.5 rounded-full backdrop-blur-md ${
                        isFav ? "bg-red-500 text-white" : "bg-white/20 text-white"
                      }`}
                    >
                      <Heart className={`w-5 h-5 ${isFav ? "fill-white" : ""}`} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        const phone = "+994773676021";
                        const msg = `🌿 ${currentProduct.name}\n💰 ${formatCurrency(price)}\n🛒 Organik Gədəbəy`;
                        window.open(`https://wa.me/${phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(msg)}`, "_blank");
                      }}
                      className="p-2.5 rounded-full bg-green-500 text-white shadow-lg"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </button>
                    <button
                      onClick={(e) => { e.stopPropagation(); addToCart(currentProduct.id, currentProduct.variants?.[0]?.id, 1); }}
                      disabled={stock <= 0}
                      className={`p-2.5 rounded-full backdrop-blur-md ${
                        stock <= 0 ? "bg-white/10 text-white/40" : "bg-white text-emerald-700 shadow-lg"
                      }`}
                    >
                      <ShoppingBag className="w-5 h-5" />
                    </button>
                  </div>
                </div>

                {stock > 0 && stock <= 5 && (
                  <p className="mt-2 text-xs text-amber-400 font-bold">
                    ⚡ Son {stock} ədəd!
                  </p>
                )}
              </div>

              {/* Şəkil nöqtələri */}
              {totalImgs > 1 && (
                <div className="absolute bottom-24 left-1/2 -translate-x-1/2 z-20 flex gap-1.5">
                  {images.map((_, i) => (
                    <button
                      key={i}
                      onClick={(e) => { e.stopPropagation(); setCurrentImgIdx(i); }}
                      className={`w-1.5 h-1.5 rounded-full transition-all ${
                        i === currentImgIdx ? "w-3 bg-white" : "bg-white/50"
                      }`}
                    />
                  ))}
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Məhsul nöqtələri (aşağıda) */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-30 flex gap-2">
            {freshProducts.map((_, idx) => (
              <button
                key={idx}
                onClick={() => {
                  setDirection(idx > currentIndex ? 1 : -1);
                  setCurrentIndex(idx);
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentIndex ? "w-5 bg-white" : "w-1.5 bg-white/40"
                }`}
              />
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}