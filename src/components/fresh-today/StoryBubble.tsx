/**
 * Fresh Today - Story Bubble Component
 * Optimized, memoized component for story bubbles
 */

'use client';

import { memo } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Flame, Eye } from 'lucide-react';
import Image from 'next/image';
import type { StoryBubbleProps } from './FreshTodayTypes';
import { safeGetImageUrl, isHotProduct } from './utils/productHelpers';

const StoryBubble = memo(({ product, seen, onClick }: StoryBubbleProps) => {
  const isAll = product === null;
  const isHot = !isAll && isHotProduct(product, 3);

  const ringClass = seen
    ? 'bg-slate-300'
    : isHot
    ? 'bg-gradient-to-tr from-red-400 via-orange-400 to-yellow-500'
    : isAll
    ? 'bg-gradient-to-tr from-[#B5E935] via-emerald-400 to-teal-500'
    : 'bg-gradient-to-tr from-[#B5E935] via-lime-400 to-emerald-500';
 
  return (
    <motion.button
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 shrink-0 snap-start focus:outline-none focus:ring-2 focus:ring-[#B5E935] focus:ring-offset-2 rounded-full"
      aria-label={isAll ? 'Bütün məhsulları gör' : `${product.name} haqqında`}
    >
      <div className={`relative p-[2.5px] rounded-full ${ringClass} transition-all duration-300`}>
        <div className="p-[2.5px] rounded-full bg-white">
          <div className="relative w-[62px] h-[62px] rounded-full overflow-hidden bg-emerald-50">
            {isAll ? (
              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-[#B5E935] to-emerald-500">
                <Sparkles className="w-7 h-7 text-[#051F0A]" />
              </div>
            ) : (
              <Image
                src={safeGetImageUrl(product!)}
                alt={product!.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, 33vw"
                loading="lazy"
              />
            )}
          </div>
        </div>
        {isHot && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
            <Flame className="w-2.5 h-2.5 text-white" />
          </div>
        )}
        {seen && !isAll && (
          <div className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-slate-400 rounded-full flex items-center justify-center">
            <Eye className="w-2.5 h-2.5 text-white" />
          </div>
        )}
      </div>
      <span className="text-[10px] font-semibold text-slate-600 text-center max-w-[70px] line-clamp-1">
        {isAll ? 'Hamısı' : product!.name}
      </span>
    </motion.button>
  );
});

StoryBubble.displayName = 'StoryBubble';

export default StoryBubble;
