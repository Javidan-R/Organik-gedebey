/**
 * Fresh Today - Story Viewer Component
 * Full-screen story viewer with auto-advance and pause functionality
 */

'use client';

import { memo, useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, ShoppingBag, Share2, Zap, Flame, Check, Ban } from 'lucide-react';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import type { StoryViewerProps } from './FreshTodayTypes';
import { STORY_DURATION } from './FreshTodayTypes';
import {
  safeGetImageUrl,
  getProductBasePrice,
  calculateDiscount,
  getProductStock,
  isOutOfStock,
  formatProductPrice,
  formatOriginalPrice,
  getProductOrigin,
  generateShareText,
  generateWhatsAppMessage
} from './utils/productHelpers';
 
const StoryViewer = memo(({ products, startIndex, open, onClose }: StoryViewerProps) => {
  const addToCart = useApp((s) => s.addToCart);
  const [current, setCurrent] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const [paused, setPaused] = useState(false);
  const [added, setAdded] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const product = products[current];

  const clearTimer = useCallback(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

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
  }, [paused, products.length, onClose, clearTimer]);

  useEffect(() => {
    if (open) {
      setCurrent(startIndex);
      setProgress(0);
      setAdded(false);
    }
  }, [open, startIndex]);

  useEffect(() => {
    if (open) startTimer();
    return clearTimer;
  }, [open, current, paused, startTimer, clearTimer]);

  const goNext = useCallback(() => {
    if (current < products.length - 1) {
      setCurrent(c => c + 1);
      setProgress(0);
    } else {
      onClose();
    }
  }, [current, products.length, onClose]);

  const goPrev = useCallback(() => {
    if (current > 0) {
      setCurrent(c => c - 1);
      setProgress(0);
    }
  }, []);

  const handleAdd = useCallback(() => {
    const stock = getProductStock(product);
    if (stock <= 0) return;
    
    addToCart(product.id, product.variants?.[0]?.id || 'default', 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  }, [product, addToCart]);

  const handleShare = useCallback(async () => {
    const text = generateShareText(product);
    try {
      if (navigator.share) {
        await navigator.share({ title: product.name, text });
      } else {
        window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      }
    } catch (error) {
      console.error('Share failed:', error);
    }
  }, [product]);

  if (!product || !open) return null;

  const basePrice = getProductBasePrice(product);
  const price = formatProductPrice(product);
  const originalPrice = formatOriginalPrice(product);
  const discount = calculateDiscount(product);
  const stock = getProductStock(product);
  const isOut = isOutOfStock(product);
  const origin = getProductOrigin(product);

  return (
    <AnimatePresence>
      <motion.div
        key="story-viewer"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[90] bg-black"
      >
        <div className="absolute inset-0">
          <Image
            src={safeGetImageUrl(product)}
            alt={product.name}
            fill
            className="object-cover"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-transparent to-black/80" />
        </div>

        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 pt-safe-top pt-4 space-y-2">
          <div className="flex gap-1 w-full px-3">
            {Array.from({ length: Math.min(products.length, 12) }).map((_, i) => (
              <div key={i} className="flex-1 h-[2.5px] rounded-full bg-white/30 overflow-hidden">
                <motion.div
                  className="h-full bg-white rounded-full origin-left"
                  initial={{ scaleX: 0 }}
                  animate={{
                    scaleX: i < current ? 1 : i === current ? progress / 100 : 0,
                  }}
                  transition={{ ease: 'linear', duration: 0 }}
                />
              </div>
            ))}
          </div>

          <div className="flex items-center justify-between px-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-[#B5E935] flex items-center justify-center">
                <Leaf className="w-4 h-4 text-[#051F0A]" />
              </div>
              <div>
                <p className="text-white text-xs font-bold leading-none">Organik Gədəbəy</p>
                <p className="text-white/60 text-[10px]">Bu gün gəldi · {current + 1}/{Math.min(products.length, 12)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onTouchStart={() => setPaused(true)}
                onTouchEnd={() => setPaused(false)}
                onMouseDown={() => setPaused(true)}
                onMouseUp={() => setPaused(false)}
                className="p-1.5"
                aria-label={paused ? 'Davam et' : 'Fasilə ver'}
              >
                <div className={`w-4 h-4 flex gap-0.5 items-center ${paused ? 'opacity-100' : 'opacity-60'}`}>
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
              <button onClick={onClose} className="p-1" aria-label="Bağla">
                <X className="w-5 h-5 text-white/80" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Areas */}
        <button onClick={goPrev} className="absolute left-0 top-0 bottom-0 w-1/3 z-10" aria-label="Əvvəlki" />
        <button onClick={goNext} className="absolute right-0 top-0 bottom-0 w-2/3 z-10" aria-label="Növbəti" />

        {/* Product Info */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          key={product.id}
          className="absolute bottom-0 left-0 right-0 z-20 p-5 pb-safe-bottom"
        >
          <div className="bg-white/10 backdrop-blur-2xl rounded-3xl p-4 border border-white/20 space-y-3">
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
                {origin}
              </span>
            </div>

            <div className="flex items-start justify-between gap-3">
              <div>
                <h2 className="text-white font-black text-xl leading-tight">{product.name}</h2>
                {product.description && (
                  <p className="text-white/60 text-xs mt-1 line-clamp-2">{product.description}</p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="text-[#B5E935] font-black text-2xl leading-none">{price}</p>
                {discount > 0 && (
                  <p className="text-white/40 text-xs line-through mt-0.5">{originalPrice}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2.5 pt-1">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={handleAdd}
                disabled={isOut}
                className="flex-1 flex items-center justify-center gap-2 bg-[#B5E935] text-[#051F0A] font-black text-sm rounded-2xl py-3.5 shadow-xl active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                aria-label={isOut ? 'Tükənib' : added ? 'Əlavə edildi' : 'Səbətə əlavə et'}
              >
                {added ? (
                  <><Check className="w-4 h-4" /> Əlavə edildi!</>
                ) : isOut ? (
                  <><Ban className="w-4 h-4" /> Bitib</>
                ) : (
                  <><ShoppingBag className="w-4 h-4" /> Səbətə əlavə et</>
                )}
              </motion.button>

              <motion.button
                whileTap={{ scale: 0.9 }}
                onClick={handleShare}
                className="w-12 h-12 rounded-2xl bg-white/15 flex items-center justify-center border border-white/20 active:bg-white/25 transition-all"
                aria-label="Paylaş"
              >
                <Share2 className="w-5 h-5 text-white" />
              </motion.button>
            </div>

            <a
              href={`https://wa.me/994773676021?text=${generateWhatsAppMessage(product, 1)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#25D366]/90 text-white font-bold text-xs rounded-xl py-2.5 w-full active:opacity-80 transition-all"
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
});

StoryViewer.displayName = 'StoryViewer';

export default StoryViewer;
