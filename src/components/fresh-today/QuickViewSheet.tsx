/**
 * Fresh Today - Quick View Sheet Component
 * Bottom sheet for quick product view with add to cart functionality
 */

'use client';

import { memo, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Leaf, ShoppingBag, Share2, Zap, TimerOff, Check, Ban, Minus, Plus, ShieldCheck, Truck } from 'lucide-react';
import Image from 'next/image';
import { useApp } from '@/lib/store';
import type { QuickViewSheetProps } from './FreshTodayTypes';
import {
  safeGetImageUrl,
  getProductBasePrice,
  calculateDiscount,
  getProductStock,
  isOutOfStock,
  isLowStock,
  formatProductPrice,
  formatOriginalPrice,
  getProductOrigin
} from './utils/productHelpers';

const QuickViewSheet = memo(({ product, open, onClose }: QuickViewSheetProps) => {
  const addToCart = useApp((s) => s.addToCart);
  const [qty, setQty] = useState(1);
  const [added, setAdded] = useState(false);

  if (!product) return null;

  const basePrice = getProductBasePrice(product);
  const price = formatProductPrice(product);
  const originalPrice = formatOriginalPrice(product);
  const discount = calculateDiscount(product);
  const stock = getProductStock(product);
  const isOut = isOutOfStock(product);
  const isLow = isLowStock(product, 5);
  const origin = getProductOrigin(product);

  const handleAdd = useCallback(() => {
    if (isOut) return;
    addToCart(product.id, product.variants?.[0]?.id || 'default', qty);
    setAdded(true);
    setTimeout(() => {
      setAdded(false);
      onClose();
    }, 1500);
  }, [isOut, addToCart, product.id, product.variants, qty, onClose]);

  const handleQtyChange = useCallback((delta: number) => {
    setQty(prev => Math.max(1, Math.min(stock || 99, prev + delta)));
  }, [stock]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 350 }}
            className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-[32px] max-h-[88vh] overflow-y-auto"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-12 h-1 bg-slate-200 rounded-full" />
            </div>

            <div className="relative aspect-[4/3] mx-4 rounded-2xl overflow-hidden bg-slate-100">
              <Image
                src={safeGetImageUrl(product)}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                priority
              />
              <button
                onClick={onClose}
                className="absolute top-3 right-3 w-9 h-9 bg-black/40 backdrop-blur-sm rounded-full flex items-center justify-center"
                aria-label="Bağla"
              >
                <X className="w-4 h-4 text-white" />
              </button>
              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2.5 py-1 rounded-full">
                  -{discount}%
                </div>
              )}
            </div>

            <div className="p-5 space-y-4 pb-safe-bottom pb-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-bold text-emerald-600 mb-1">
                    {origin} · Ekoloji
                  </p>
                  <h2 className="text-xl font-black text-slate-900 leading-tight">
                    {product.name}
                  </h2>
                </div>
                <div className="text-right shrink-0">
                  <p className="text-2xl font-black text-[#051F0A]">{price}</p>
                  {discount > 0 && (
                    <p className="text-sm text-slate-400 line-through">{originalPrice}</p>
                  )}
                </div>
              </div>

              {product.description && (
                <p className="text-sm text-slate-500 leading-relaxed">{product.description}</p>
              )}

              <div className="grid grid-cols-3 gap-2">
                {[
                  { icon: <Leaf className="w-4 h-4" />, label: 'Ekoloji' },
                  { icon: <ShieldCheck className="w-4 h-4" />, label: 'Keyfiyyətli' },
                  { icon: <Truck className="w-4 h-4" />, label: 'Çatdırılma' },
                ].map((f) => (
                  <div
                    key={f.label}
                    className="flex flex-col items-center gap-1 bg-slate-50 rounded-xl py-2.5 text-center"
                  >
                    <span className="text-emerald-600">{f.icon}</span>
                    <span className="text-[10px] font-bold text-slate-600">{f.label}</span>
                  </div>
                ))}
              </div>

              {isLow && (
                <div className="flex items-center gap-2 bg-orange-50 border border-orange-100 rounded-xl px-3 py-2.5">
                  <TimerOff className="w-4 h-4 text-orange-500 shrink-0" />
                  <p className="text-xs font-bold text-orange-700">
                    Diqqət! Yalnız {stock} ədəd qalıb!
                  </p>
                </div>
              )}

              <div className="flex items-center gap-3">
                {!isOut && (
                  <div className="flex items-center gap-1 bg-slate-100 rounded-2xl p-1">
                    <button
                      onClick={() => handleQtyChange(-1)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-all"
                      aria-label="Azalt"
                    >
                      <Minus className="w-4 h-4 text-slate-600" />
                    </button>
                    <span className="w-9 text-center text-sm font-black">{qty}</span>
                    <button
                      onClick={() => handleQtyChange(1)}
                      className="w-9 h-9 rounded-xl flex items-center justify-center hover:bg-white transition-all"
                      aria-label="Artır"
                    >
                      <Plus className="w-4 h-4 text-slate-600" />
                    </button>
                  </div>
                )}

                <motion.button
                  whileTap={{ scale: 0.97 }}
                  disabled={isOut}
                  onClick={handleAdd}
                  className={`flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 text-sm font-black transition-all ${
                    isOut
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : added
                      ? 'bg-emerald-500 text-white'
                      : 'bg-[#051F0A] text-[#B5E935]'
                  }`}
                  aria-label={isOut ? 'Tükənib' : added ? 'Əlavə edildi' : 'Səbətə əlavə et'}
                >
                  {added ? (
                    <><Check className="w-4 h-4" /> Əlavə edildi!</>
                  ) : isOut ? (
                    <><Ban className="w-4 h-4" /> Tükənib</>
                  ) : (
                    <><ShoppingBag className="w-4 h-4" /> {price} - Əlavə et</>
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

QuickViewSheet.displayName = 'QuickViewSheet';

export default QuickViewSheet;
