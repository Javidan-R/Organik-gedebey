// src/components/fresh-today/SavedDrawer.tsx
'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Bookmark, BookmarkCheck } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { SavedDrawerProps, Product } from './FreshTodayTypes';
import {
  safeGetImageUrl,
  getProductBasePrice,
  formatProductPrice,
  formatOriginalPrice
} from './utils/productHelpers';
import { finalPrice } from '@/lib/calc';
import { formatCurrency } from '@/utils/formatting';
 
const SavedDrawer = memo(({ open, onClose, savedIds, products, onRemove }: SavedDrawerProps) => {
  const saved = products.filter((p: Product) => savedIds.includes(p.id));

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
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 350 }}
            className="fixed right-0 top-0 bottom-0 z-50 bg-white w-80 max-w-full shadow-2xl flex flex-col"
          >
            <div className="flex items-center justify-between p-5 border-b border-slate-100">
              <h3 className="font-black text-slate-900 flex items-center gap-2">
                <BookmarkCheck className="w-5 h-5 text-emerald-600" />
                Saxlanılanlar
              </h3>
              <button
                onClick={onClose}
                className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center"
                aria-label="Bağla"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {saved.length === 0 ? (
                <div className="text-center py-12">
                  <Bookmark className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-sm font-bold text-slate-500">Hələ saxlanılmayıb</p>
                  <p className="text-xs text-slate-400 mt-1">Məhsul kartındakı ♡ düyməsinə basın</p>
                </div>
              ) : (
                saved.map((p: Product) => {
                  const basePrice = getProductBasePrice(p);
                  const price = finalPrice(basePrice, p.discountType, p.discountValue);
                  
                  return (
                    <Link
                      key={p.id}
                      href={`/product/${p.slug || p.id}`}
                      className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 hover:bg-emerald-50 transition group"
                    >
                      <div className="relative w-14 h-14 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                        <Image
                          src={safeGetImageUrl(p)}
                          alt={p.name}
                          fill
                          className="object-cover"
                          sizes="56px"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-slate-900 truncate">{p.name}</p>
                        <p className="text-xs text-emerald-600 font-bold mt-0.5">
                          {formatCurrency(price)}
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          onRemove(p.id);
                        }}
                        className="p-1.5 rounded-lg hover:bg-red-100 transition"
                        aria-label="Siyahıdan çıxar"
                      >
                        <X className="w-3.5 h-3.5 text-slate-400 hover:text-red-500" />
                      </button>
                    </Link>
                  );
                })
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
});

SavedDrawer.displayName = 'SavedDrawer';

export default SavedDrawer;