// components/ui/molecules/CategoryCard.tsx
"use client";

import { motion } from "framer-motion";
import { Sparkles, Star } from "lucide-react";
import Image from "next/image";
import { memo } from "react";
import type { Category } from "@/lib/types";
import type { CategoryMeta, BadgeType } from "@/lib/category-metadata";

/* ================================================================
   Alt komponentlər
   ================================================================ */
const Badge = memo(({ type }: { type: BadgeType }) => {
  const labels: Record<BadgeType, string> = {
    premium: 'Premium', seasonal: 'Mövsümi', halal: 'Halal',
    fresh: 'Təzə', select: 'Seçmə', best: 'Ən yaxşı',
    local: 'Yerli', import: 'İdxal', natural: 'Təbii',
    organic: 'Üzvi', handmade: 'Əl işi', special: 'Xüsusi',
    mountain: 'Dağ', gedebey: 'Gədəbəy',
  };
  return (
    <span className="absolute -top-1.5 -right-1.5 z-10 rounded-full bg-gradient-to-r from-emerald-500 to-green-600 px-2 py-0.5 text-[9px] font-bold text-white shadow-md whitespace-nowrap">
      {labels[type]}
    </span>
  );
});
Badge.displayName = 'Badge';

const Emoji = memo(({ emoji }: { emoji?: string }) => {
  if (!emoji) return null;
  return (
    <motion.span
      animate={{ y: [0, -3, 0] }}
      transition={{ repeat: Infinity, duration: 2 }}
      className="absolute -bottom-1 -left-1 text-base"
    >
      {emoji}
    </motion.span>
  );
});
Emoji.displayName = 'Emoji';

const Count = memo(({ count }: { count: number }) => {
  if (count <= 0) return null;
  return (
    <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 inline-flex items-center gap-0.5 rounded-full bg-white border-2 border-emerald-200 px-2 py-0.5 text-[10px] font-bold text-emerald-700 shadow-md">
      <Sparkles className="w-2.5 h-2.5 text-emerald-500" />
      {count > 99 ? "99+" : count}
    </span>
  );
});
Count.displayName = 'Count';

const FeaturedStar = memo(() => (
  <span className="absolute top-1 left-1">
    <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
  </span>
));
FeaturedStar.displayName = 'FeaturedStar';

/* ================================================================
   Əsas Card
   ================================================================ */
interface CategoryCardProps {
  category: Category;
  meta: CategoryMeta;
  index: number;
  variant?: 'scroll' | 'grid';
  isFeatured?: boolean;
  className?: string;
}

export const CategoryCard = memo(({ 
  category, meta, index, variant = 'scroll', isFeatured, className = '' 
}: CategoryCardProps) => {
  const Icon = meta.icon;
  const count = category._count?.products ?? 0;
  const isScroll = variant === 'scroll';

  const cardVariants = {
    hidden: { opacity: 0, y: 30, scale: 0.95 },
    visible: {
      opacity: 1, y: 0, scale: 1,
      transition: { delay: Math.min(index * 0.04, 0.4), type: "spring", stiffness: 120, damping: 16 },
    },
  };

  const iconSize = isScroll ? 'w-16 h-16 sm:w-[72px] sm:h-[72px] md:w-20 md:h-20' : 'w-14 h-14';
  const iconInner = isScroll ? 'w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9' : 'w-6 h-6';

  return (
    <motion.a
      href={`/category/${category.slug}`}
      variants={cardVariants}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, margin: "-20px" }}
      whileHover={{ y: -4, scale: 1.03 }}
      whileTap={{ scale: 0.96 }}
      className={`group relative flex flex-col items-center text-center cursor-pointer snap-start shrink-0 ${
        isScroll ? 'w-[100px] sm:w-[120px] md:w-[140px]' : ''
      } ${className}`}
    >
      {/* İkon dairəsi */}
      <div className={`relative ${iconSize} rounded-full ${meta.bg} border-2 border-emerald-100/60 flex items-center justify-center transition-all duration-300 group-hover:border-emerald-300 group-hover:shadow-xl mb-2 sm:mb-3`}>
        {/* Hover gradient */}
        <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${meta.gradient} opacity-0 group-hover:opacity-15 transition-opacity duration-500`} />
        
        {category.image ? (
          <div className="relative w-full h-full rounded-full overflow-hidden">
            <Image src={category.image} alt={category.name} fill className="object-cover p-1 rounded-full group-hover:scale-110 transition-transform duration-500" />
          </div>
        ) : (
          <motion.div whileHover={{ rotate: [0, -8, 8, 0] }} transition={{ duration: 0.5 }}>
            <Icon className={`${iconInner} ${meta.color} transition-transform duration-300 group-hover:scale-110`} strokeWidth={1.8} />
          </motion.div>
        )}

        {/* Üst elementlər */}
        {meta.badge && <Badge type={meta.badge} />}
        {meta.seasonalEmoji && <Emoji emoji={meta.seasonalEmoji} />}
        <Count count={count} />
        {isFeatured && !meta.badge && <FeaturedStar />}
      </div>

      {/* Mətn */}
      <span className="text-[11px] sm:text-xs md:text-[13px] font-bold text-stone-800 leading-tight line-clamp-1 max-w-[90px] sm:max-w-[110px] md:max-w-[130px] group-hover:text-emerald-800 transition-colors">
        {category.name}
      </span>
      {count > 0 && (
        <span className="text-[10px] sm:text-[11px] text-stone-400 mt-0.5">{count} məhsul</span>
      )}
    </motion.a>
  );
});
CategoryCard.displayName = 'CategoryCard';