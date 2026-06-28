/**
 * Fresh Today - Upcoming Card Component
 * Optimized, memoized component for upcoming products
 */

'use client';

import { memo, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import { Bell, BellOff, Calendar, Clock } from 'lucide-react';
import Image from 'next/image';
import type { UpcomingCardProps } from './FreshTodayTypes';
import { safeGetImageUrl, getProductBasePrice, formatCurrency } from './utils/productHelpers';

const UpcomingCard = memo(({ product, notified, onNotify, index }: UpcomingCardProps) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const inView = useInView(cardRef, { once: true, margin: '-30px' });
  const basePrice = getProductBasePrice(product);

  return (
    <motion.div
      ref={cardRef}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ delay: index * 0.07, duration: 0.45 }}
      className="relative bg-white rounded-2xl overflow-hidden border border-dashed border-slate-200 shadow-sm"
    >
      <div className="relative aspect-[3/4] overflow-hidden bg-slate-100">
        <Image
          src={safeGetImageUrl(product)}
          alt={product.name}
          fill
          className="object-cover blur-[3px] scale-105 brightness-75"
          sizes="(max-width: 640px) 50vw, 33vw"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 to-slate-600/40" />
        
        <div className="absolute top-3 left-3">
          <div className="flex items-center gap-1 bg-amber-400 text-amber-900 rounded-full px-2.5 py-1 text-[9px] font-black shadow-lg">
            <Clock className="w-2.5 h-2.5" />
            GƏLƏCƏK
          </div>
        </div>

        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
          <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center border border-white/30">
            <Calendar className="w-6 h-6 text-white" />
          </div>
          <span className="text-white/70 text-xs font-bold">Tezliklə</span>
        </div>
      </div>

      <div className="p-3 space-y-2">
        <h3 className="text-sm font-black text-slate-700 line-clamp-2 leading-tight">
          {product.name}
        </h3>
        <p className="text-xs text-slate-400">
          Gözlənilən qiymət: <span className="font-bold text-slate-600">{formatCurrency(basePrice)}</span>
        </p>

        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={onNotify}
          className={`w-full flex items-center justify-center gap-2 rounded-xl py-2.5 text-[11px] font-black transition-all duration-300 ${
            notified
              ? 'bg-amber-100 text-amber-700 border border-amber-200'
              : 'bg-slate-900 text-amber-400 hover:bg-slate-800'
          }`}
          aria-label={notified ? 'Bildirişi ləğv et' : 'Xəbər ver'}
        >
          {notified ? (
            <><BellOff className="w-3.5 h-3.5" /> Bildiriş aktiv</>
          ) : (
            <><Bell className="w-3.5 h-3.5" /> Xəbər ver</>
          )}
        </motion.button>
      </div>
    </motion.div>
  );
});

UpcomingCard.displayName = 'UpcomingCard';

export default UpcomingCard;
