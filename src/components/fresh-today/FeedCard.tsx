/**
 * Fresh Today - Feed Card Component
 * Optimized, memoized product card for feed view
 */

'use client';

import { memo, useState, useCallback, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { ShoppingBag, Heart, Share2, Flame, Leaf, MapPin, Minus, Plus, Ban, Check } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import type { FeedCardProps } from './FreshTodayTypes';
import {
  safeGetImageUrl,
  getProductBasePrice,
  calculateDiscount,
  getProductStock,
  isOutOfStock,
  formatProductPrice,
  formatOriginalPrice,
  getProductOrigin,
  generateWhatsAppMessage
} from './utils/productHelpers';

const FeedCard = memo(({ product, saved, onSave, onShare, index }: FeedCardProps) => {
  const addToCart = useApp((s) => s.addToCart);
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: '-40px' });
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  const basePrice = getProductBasePrice(product);
  const price = formatProductPrice(product);
  const originalPrice = formatOriginalPrice(product);
  const discount = calculateDiscount(product);
  const stock = getProductStock(product);
  const isOut = isOutOfStock(product);
  const origin = getProductOrigin(product);

  const handleAdd = useCallback(() => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id || 'default', qty);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }, [isOut, addToCart, product.id, product.variants, qty]);

  const handleShare = useCallback(async () => {
    onShare();
  }, [onShare]);

  const handleQtyChange = useCallback((delta: number) => {
    setQty(prev => Math.max(1, Math.min(stock || 99, prev + delta)));
  }, [stock]);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className="bg-white rounded-3xl overflow-hidden shadow-[0_4px_24px_rgba(0,0,0,0.08)] border border-slate-100"
    >
      {/* Image */}
      <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
        <Image
          src={safeGetImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover"
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="flex items-center gap-1.5 bg-[#B5E935] text-[#051F0A] rounded-full px-3 py-1 text-[10px] font-black shadow-lg">
            <Leaf className="w-3 h-3" />
            BU GÜN GƏLDİ
          </div>
          {discount > 0 && (
            <div className="flex items-center gap-1 bg-red-500 text-white rounded-full px-2.5 py-1 text-[10px] font-black shadow-lg">
              <Flame className="w-2.5 h-2.5" />
              -{discount}%
            </div>
          )}
        </div>

        <div className="absolute top-4 right-4 flex flex-col gap-2">
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={onSave}
            className={`w-9 h-9 rounded-full shadow-lg flex items-center justify-center ${
              saved ? 'bg-red-500' : 'bg-white/90 backdrop-blur-sm'
            }`}
            aria-label={saved ? 'Saxlanılmışdan çıxar' : 'Saxla'}
          >
            <Heart className={`w-4 h-4 ${saved ? 'fill-white text-white' : 'text-slate-600'}`} />
          </motion.button>
          <motion.button
            whileTap={{ scale: 0.85 }}
            onClick={handleShare}
            className="w-9 h-9 rounded-full bg-white/90 backdrop-blur-sm shadow-lg flex items-center justify-center"
            aria-label="Paylaş"
          >
            <Share2 className="w-4 h-4 text-slate-600" />
          </motion.button>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <h3 className="text-white font-black text-xl leading-tight drop-shadow-lg">
            {product.name}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <MapPin className="w-3 h-3 text-[#B5E935]" />
            <span className="text-[#B5E935] text-xs font-bold">{origin}</span>
          </div>
        </div>
      </div>

      <div className="p-4 space-y-3.5">
        {product.description && (
          <p className="text-sm text-slate-500 line-clamp-2">{product.description}</p>
        )}

        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-black text-[#051F0A]">{price}</span>
            {discount > 0 && (
              <span className="text-sm text-slate-400 line-through">{originalPrice}</span>
            )}
          </div>
          {stock > 0 && stock <= 5 && (
            <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full">
              Son {stock} ədəd
            </span>
          )}
        </div>

        <div className="flex items-center gap-3">
          {!isOut && (
            <div className="flex items-center gap-1 bg-slate-100 rounded-xl p-1">
              <button
                onClick={() => handleQtyChange(-1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-all active:scale-95"
                aria-label="Azalt"
              >
                <Minus className="w-3.5 h-3.5 text-slate-600" />
              </button>
              <span className="w-8 text-center text-sm font-black text-slate-700">{qty}</span>
              <button
                onClick={() => handleQtyChange(1)}
                className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white transition-all active:scale-95"
                aria-label="Artır"
              >
                <Plus className="w-3.5 h-3.5 text-slate-600" />
              </button>
            </div>
          )}

          <motion.button
            whileTap={{ scale: 0.96 }}
            disabled={isOut}
            onClick={handleAdd}
            className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3 text-sm font-black transition-all duration-300 ${
              isOut
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : added
                ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200'
                : 'bg-[#051F0A] text-[#B5E935] shadow-xl hover:shadow-2xl active:scale-95'
            }`}
            aria-label={isOut ? 'Tükənib' : added ? 'Əlavə edildi' : 'Səbətə əlavə et'}
          >
            {added ? (
              <><Check className="w-4 h-4" /> Səbətə əlavə edildi!</>
            ) : isOut ? (
              <><Ban className="w-4 h-4" /> Tükənib</>
            ) : (
              <><ShoppingBag className="w-4 h-4" /> {price} - Əlavə et</>
            )}
          </motion.button>
        </div>

        <Link
          href={`https://wa.me/994773676021?text=${generateWhatsAppMessage(product, qty)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 border-2 border-[#25D366] text-[#25D366] font-bold text-xs rounded-2xl py-2.5 w-full active:bg-[#25D366] active:text-white transition-all"
        >
          <svg viewBox="0 0 24 24" className="w-4 h-4 fill-current">
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" />
          </svg>
          WhatsApp ilə sifariş ver
        </Link>
      </div>
    </motion.div>
  );
});

FeedCard.displayName = 'FeedCard';

export default FeedCard;
