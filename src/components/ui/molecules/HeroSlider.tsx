"use client";

import { finalPrice } from "@/lib/calc";
import { getProductBasePrice, getFirstImageUrl, formatCurrency } from "@/utils/storefront_home";
import {
  Flame, Timer, ChevronLeft, ChevronRight, Star,
  Zap, ArrowRight, BadgePercent, Sparkles, Play, Pause,
} from "lucide-react";
import Link from "next/link";
import { useRef, useState, useEffect, useMemo, useCallback } from "react";
import Image from "next/image";
import { Product } from "@/types/products";

function getDiscountPercent(product: Product): number {
  const base = getProductBasePrice(product);
  const final = finalPrice(base, product.discountType, product.discountValue);
  if (base <= 0 || final >= base) return 0;
  return Math.round((1 - final / base) * 100);
}

interface HeroSliderProps {
  highlighted: Product | null;
  allProducts?: Product[];
}

export default function HeroSlider({ highlighted, allProducts = [] }: HeroSliderProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [countdown, setCountdown] = useState("");
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const discountedProducts = useMemo(() => {
    if (!allProducts?.length) return [];
    return allProducts
      .filter((p) => !p.archived && getDiscountPercent(p) > 0)
      .sort((a, b) => getDiscountPercent(b) - getDiscountPercent(a))
      .slice(0, 6);
  }, [allProducts]);

  const allActiveProducts = useMemo(() => {
    if (!allProducts?.length) return [];
    return allProducts.filter((p) => !p.archived).slice(0, 6);
  }, [allProducts]);

  const productsToShow = useMemo(() => {
    if (discountedProducts.length > 0) return discountedProducts;
    if (allActiveProducts.length > 0) return allActiveProducts;
    if (highlighted) return [highlighted];
    return [];
  }, [discountedProducts, allActiveProducts, highlighted]);

  const dealOfTheDay = useMemo(() => {
    if (discountedProducts.length > 0) return discountedProducts[0];
    if (highlighted) return highlighted;
    return null;
  }, [discountedProducts, highlighted]);

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();
      if (diff <= 0) return setCountdown("00:00:00");
      const h = Math.floor(diff / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      setCountdown(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`);
    };
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (productsToShow.length <= 1) return;
    if (!isPaused) {
      intervalRef.current = setInterval(() => {
        setCurrentIndex((prev) => (prev + 1) % productsToShow.length);
      }, 4000);
    }
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [productsToShow.length, isPaused]);

  useEffect(() => {
    if (productsToShow.length > 0 && currentIndex >= productsToShow.length) {
      setCurrentIndex(0);
    }
  }, [currentIndex, productsToShow.length]);

  const goTo = useCallback((index: number) => {
    setCurrentIndex(index);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, []);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev + 1) % productsToShow.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, [productsToShow.length]);

  const goToPrev = useCallback(() => {
    setCurrentIndex((prev) => (prev - 1 + productsToShow.length) % productsToShow.length);
    setIsPaused(true);
    setTimeout(() => setIsPaused(false), 8000);
  }, [productsToShow.length]);

  const currentProduct = productsToShow[currentIndex] || null;
  const productDiscount = currentProduct ? getDiscountPercent(currentProduct) : 0;

  if (productsToShow.length === 0) {
    return (
      <div className="relative flex items-center justify-center px-4 py-6 md:px-0 md:py-0">
        <div className="relative aspect-square w-full max-w-[220px] md:max-w-sm">
          <Image
            src="/hero-basket.png"
            alt="Kənd məhsulları"
            fill
            className="object-contain drop-shadow-2xl"
            priority
          />
          <div className="absolute inset-0 flex items-end justify-center pb-4">
            <Link
              href="/products"
              className="rounded-full bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-2.5 text-xs font-bold text-white shadow-xl transition-all hover:shadow-2xl md:px-6 md:py-3 md:text-sm"
            >
              Məhsulları kəşf et →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="relative flex items-center justify-center px-2 py-3 md:px-0 md:py-0"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="relative w-full max-w-[320px] md:max-w-sm">
        {/* Günün endirimi etiketi */}
        {dealOfTheDay && (
          <div className="mb-2 flex flex-wrap items-center justify-center gap-1 rounded-full bg-gradient-to-r from-red-50 to-orange-50 px-2.5 py-1.5 text-[10px] font-bold text-red-700 shadow-sm md:mb-4 md:gap-2 md:px-4 md:py-2 md:text-xs">
            <Flame className="h-3 w-3 text-red-500 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Günün Xüsusi Endirimi</span>
            <span className="sm:hidden">Günün Endirimi</span>
            <span className="flex items-center gap-1 font-mono text-[10px] md:text-xs">
              <Timer className="h-3 w-3 md:h-4 md:w-4" />
              {countdown}
            </span>
          </div>
        )}

        {/* Slider sahəsi */}
        <div className="relative overflow-hidden rounded-2xl md:rounded-3xl">
          {/* Nav oxları – yalnız birdən çox məhsul varsa */}
          {productsToShow.length > 1 && (
            <>
              <button
                onClick={goToPrev}
                className="absolute left-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95 md:left-2 md:p-2"
              >
                <ChevronLeft className="h-3.5 w-3.5 text-emerald-700 md:h-5 md:w-5" />
              </button>
              <button
                onClick={goToNext}
                className="absolute right-1.5 top-1/2 z-20 -translate-y-1/2 rounded-full bg-white/90 p-1 shadow-lg backdrop-blur-sm transition-all hover:scale-110 active:scale-95 md:right-2 md:p-2"
              >
                <ChevronRight className="h-3.5 w-3.5 text-emerald-700 md:h-5 md:w-5" />
              </button>
            </>
          )}

          {/* Play/Pause – yalnız birdən çox məhsul varsa */}
          {productsToShow.length > 1 && (
            <button
              onClick={() => setIsPaused(!isPaused)}
              className="absolute right-1.5 top-1.5 z-20 rounded-full bg-white/80 p-1 shadow backdrop-blur-sm transition hover:bg-white md:right-3 md:top-3 md:p-1.5"
            >
              {isPaused ? (
                <Play className="h-3 w-3 text-emerald-600 md:h-4 md:w-4" />
              ) : (
                <Pause className="h-3 w-3 text-emerald-600 md:h-4 md:w-4" />
              )}
            </button>
          )}

          {/* Slaydlar */}
          <div className="relative">
            {productsToShow.map((product, index) => {
              const img = getFirstImageUrl(product);
              const base = getProductBasePrice(product);
              const price = finalPrice(base, product.discountType, product.discountValue);
              const discount = getDiscountPercent(product);
              const isActive = index === currentIndex;

              return (
                <div
                  key={product.id || `slide-${index}`}
                  className="transition-opacity duration-400 ease-in-out"
                  style={{
                    opacity: isActive ? 1 : 0,
                    position: isActive ? "relative" : "absolute",
                    inset: 0,
                    pointerEvents: isActive ? "auto" : "none",
                    zIndex: isActive ? 1 : 0,
                  }}
                >
                  {/* Endirim faizi */}
                  {discount > 0 && (
                    <div className="absolute -right-1 -top-1 z-10 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-600 shadow-xl md:-right-3 md:-top-3 md:h-20 md:w-20">
                      <div className="text-center leading-tight">
                        <span className="block text-sm font-black text-white md:text-2xl">-{discount}%</span>
                        <span className="block text-[7px] font-semibold text-white/90 md:text-xs">ENDİRİM</span>
                      </div>
                    </div>
                  )}

                  {/* Məhsul şəkli */}
                  <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm md:rounded-3xl md:p-6 md:shadow-xl">
                    <Image
                      src={img}
                      alt={product.name}
                      fill
                      className="object-contain drop-shadow-md md:drop-shadow-lg"
                      sizes="(max-width: 768px) 100vw, 400px"
                    />
                  </div>

                  {/* Məhsul kartı */}
                  <div className="mt-2 rounded-xl bg-white/90 p-2.5 shadow-lg backdrop-blur-sm md:mt-4 md:rounded-2xl md:p-5 md:shadow-xl">
                    <h3 className="line-clamp-1 text-xs font-bold text-emerald-900 md:text-lg">
                      {product.name}
                    </h3>

                    {/* Ulduzlar */}
                    <div className="mt-0.5 flex items-center gap-0.5 md:mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`h-2.5 w-2.5 md:h-3.5 md:w-3.5 ${
                            star <= 4 ? "fill-amber-400 text-amber-400" : "text-gray-200"
                          }`}
                        />
                      ))}
                      <span className="ml-1 text-[9px] text-gray-500 md:text-xs">(4.8)</span>
                    </div>

                    {/* Qiymət */}
                    <div className="mt-1 flex items-baseline gap-2 md:mt-2">
                      {discount > 0 ? (
                        <>
                          <span className="text-base font-black text-emerald-600 md:text-3xl">
                            {formatCurrency(price)}
                          </span>
                          <span className="text-[10px] text-gray-400 line-through md:text-sm">
                            {formatCurrency(base)}
                          </span>
                        </>
                      ) : (
                        <span className="text-base font-black text-emerald-600 md:text-3xl">
                          {formatCurrency(price)}
                        </span>
                      )}
                    </div>

                    {/* Ətraflı düyməsi */}
                    <Link
                      href={`/product/${product.id}`}
                      className="mt-2 inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-3 py-2 text-[11px] font-bold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98] md:mt-3 md:rounded-xl md:px-4 md:py-2.5 md:text-sm"
                    >
                      <Zap className="h-3.5 w-3.5 md:h-4 md:w-4" />
                      Ətraflı bax
                      <ArrowRight className="h-3.5 w-3.5 md:h-4 md:w-4" />
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Nöqtə indikatorlar */}
        {productsToShow.length > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1.5 md:mt-4 md:gap-2">
            {productsToShow.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className={`rounded-full transition-all duration-300 ${
                  idx === currentIndex
                    ? "h-2 w-5 bg-gradient-to-r from-emerald-500 to-teal-500 shadow-sm md:h-2.5 md:w-8"
                    : "h-2 w-2 bg-emerald-200 hover:bg-emerald-400 md:h-2.5 md:w-2.5"
                }`}
              />
            ))}
          </div>
        )}

        {/* Endirim sayı */}
        {productsToShow.length > 0 && (
          <div className="mt-2 flex items-center justify-center gap-1.5 rounded-full bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1.5 text-[10px] font-semibold text-red-700 shadow-sm md:mt-3 md:gap-2 md:px-4 md:text-xs">
            <BadgePercent className="h-3 w-3 text-red-500 md:h-4 md:w-4" />
            <span>{productsToShow.length} məhsul</span>
            <Sparkles className="h-2.5 w-2.5 text-amber-500 md:h-3.5 md:w-3.5" />
          </div>
        )}
      </div>
    </div>
  );
}