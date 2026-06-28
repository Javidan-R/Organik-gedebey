/**
 * Fresh Today - Grid Card Component
 * Optimized, memoized product card for grid view
 */

'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, Heart, Share2, Zap, TimerOff, Ban, Check, Leaf, Star } from 'lucide-react';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import type { GridCardProps } from './FreshTodayTypes';
import {
  safeGetImageUrl,
  calculateDiscount,
  getProductStock,
  isLowStock,
  isOutOfStock,
  formatProductPrice,
  formatOriginalPrice,
  getProductOrigin,
  generateShareText
} from './utils/productHelpers';

const GridCard = memo(({ product, saved, onSave, onQuickView, index }: GridCardProps) => {
  const addToCart = useApp((s) => s.addToCart);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: '-30px' });
  const [added, setAdded] = useState(false);

  const price = formatProductPrice(product);
  const originalPrice = formatOriginalPrice(product);
  const discount = calculateDiscount(product);
  const stock = getProductStock(product);
  const isOut = isOutOfStock(product);
  const isLow = isLowStock(product, 5);
  const origin = getProductOrigin(product);

  const handleAdd = useCallback(() => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id || 'default', 1);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  }, [isOut, addToCart, product.id, product.variants]);

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

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 30, scale: 0.96 }}
      animate={inView ? { opacity: 1, y: 0, scale: 1 } : {}}
      transition={{
        delay: (index % 6) * 0.06,
        duration: 0.45,
        ease: [0.22, 1, 0.36, 1],
      }}
      className="group bg-white rounded-2xl overflow-hidden shadow-[0_2px_16px_rgba(0,0,0,0.06)] hover:shadow-[0_8px_32px_rgba(0,0,0,0.12)] transition-shadow duration-500 border border-slate-100/80"
    >
      {/* Image */}
      <div
        className="relative aspect-[3/4] overflow-hidden bg-slate-100 cursor-pointer"
        onClick={onQuickView}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onQuickView()}
      >
        <Image
          src={safeGetImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-[1.04] transition-transform duration-700 ease-out"
          sizes="(max-width: 640px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/30 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
        
        <div className="absolute top-2.5 left-2.5 flex flex-col gap-1.5">
          <div className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full px-2 py-[3px] text-[9px] font-black text-emerald-700 shadow-sm">
            <Leaf className="w-2.5 h-2.5 text-emerald-500" />
            TƏZƏ
          </div>
          {discount > 0 && (
            <div className="flex items-center gap-1 bg-red-500 rounded-full px-2 py-[3px] text-[9px] font-black text-white shadow-sm">
              <Zap className="w-2.5 h-2.5" />
              -{discount}%
            </div>
          )}
        </div>

        <motion.button
          whileTap={{ scale: 0.85 }}
          onClick={(e) => { e.stopPropagation(); onSave(); }}
          className={`absolute top-2.5 right-2.5 w-8 h-8 rounded-full shadow-md flex items-center justify-center transition-all duration-200 ${
            saved ? 'bg-red-500 text-white' : 'bg-white/90 text-slate-500 hover:bg-white'
          }`}
          aria-label={saved ? 'Saxlanılmışdan çıxar' : 'Saxla'}
        >
          <Heart className={`w-3.5 h-3.5 ${saved ? 'fill-white' : ''}`} />
        </motion.button>

        {isLow && (
          <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-red-500/90 to-transparent px-3 py-2 flex items-center gap-1">
            <TimerOff className="w-3 h-3 text-white" />
            <span className="text-[10px] font-black text-white">Son {stock} ədəd!</span>
          </div>
        )}

        {isOut && (
          <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] flex items-center justify-center">
            <span className="bg-black/70 text-white text-[11px] font-black px-3 py-1.5 rounded-full">Tükənib</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <span className="text-[9px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            {origin}
          </span>
          <div className="flex gap-0.5">
            {[1, 2, 3, 4, 5].map((s) => (
              <Star key={s} className={`w-2.5 h-2.5 ${s <= 4 ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} />
            ))}
          </div>
        </div>

        <h3 className="text-sm font-black text-slate-900 line-clamp-2 leading-tight">
          {product.name}
        </h3>

        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-[#051F0A]">{price}</span>
          {discount > 0 && (
            <span className="text-[11px] text-slate-400 line-through">{originalPrice}</span>
          )}
        </div>

        <div className="flex gap-1.5 pt-0.5">
          <motion.button
            whileTap={{ scale: 0.94 }}
            disabled={isOut}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-[11px] font-black transition-all ${
              isOut
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white'
                : 'bg-[#051F0A] text-[#B5E935] hover:bg-[#0A2714] active:scale-95'
            }`}
            aria-label={isOut ? 'Tükənib' : added ? 'Əlavə edildi' : 'Səbətə əlavə et'}
          >
            {added ? (
              <><Check className="w-3.5 h-3.5" /> Əlavə edildi</>
            ) : isOut ? (
              <><Ban className="w-3 h-3" /> Bitib</>
            ) : (
              <><ShoppingBag className="w-3.5 h-3.5" /> Səbətə</>
            )}
          </motion.button>

          <motion.button
            whileTap={{ scale: 0.9 }}
            onClick={handleShare}
            className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center hover:bg-slate-200 active:scale-95 transition-all"
            aria-label="Paylaş"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
});

GridCard.displayName = 'GridCard';

export default GridCard;
