// lib/category-metadata.ts
import {
  Droplets, Flower2, Beef, Fish, Milk, Egg, Carrot,
  Apple, Grape, Citrus, Banana, Cherry, Wheat, Cookie,
  Coffee, Leaf, Sprout, Sun, Flame, ScrollText, Mountain,
  Gem, Crown, ShoppingBag,
} from "lucide-react";

export type BadgeType = 'premium' | 'seasonal' | 'halal' | 'fresh' | 'select' | 'best' | 'local' | 'import' | 'natural' | 'organic' | 'handmade' | 'special' | 'mountain' | 'gedebey';
export type SeasonType = 'spring' | 'summer' | 'autumn' | 'winter';

export interface CategoryMeta {
  icon: React.ElementType;
  color: string;
  bg: string;
  gradient: string;
  seasonalEmoji?: string;
  badge?: BadgeType;
}

const SEASONAL_EMOJIS: Record<SeasonType, string[]> = {
  spring: ['🌸', '🌺', '🌷'],
  summer: ['☀️', '🌻', '🍉'],
  autumn: ['🍂', '🍁', '🌰'],
  winter: ['❄️', '⛄', '🎄'],
};

const CATEGORY_RULES: Array<{
  keywords: string[];
  meta: Omit<CategoryMeta, 'seasonalEmoji'> & { seasonal?: SeasonType[] };
}> = [
  // Yüksək prioritet – dəqiq eşləşmə
  { keywords: ['bal', 'arı'], meta: { icon: Droplets, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-400 via-yellow-500 to-amber-600', badge: 'premium' } },
  { keywords: ['çiçək', 'gül'], meta: { icon: Flower2, color: 'text-pink-600', bg: 'bg-pink-50', gradient: 'from-pink-400 via-rose-500 to-fuchsia-500', badge: 'seasonal', seasonal: ['spring', 'summer'] } },
  { keywords: ['ət', 'kolbasa'], meta: { icon: Beef, color: 'text-rose-600', bg: 'bg-rose-50', gradient: 'from-rose-500 via-red-500 to-rose-700', badge: 'halal' } },
  { keywords: ['balıq'], meta: { icon: Fish, color: 'text-sky-600', bg: 'bg-sky-50', gradient: 'from-sky-400 via-cyan-500 to-blue-600', seasonal: ['summer', 'autumn'] } },
  { keywords: ['süd', 'qaymaq', 'kəsmik', 'qatıq'], meta: { icon: Milk, color: 'text-blue-500', bg: 'bg-blue-50', gradient: 'from-blue-400 via-sky-500 to-indigo-600', badge: 'fresh' } },
  { keywords: ['pendir', 'motal'], meta: { icon: Gem, color: 'text-yellow-600', bg: 'bg-yellow-50', gradient: 'from-yellow-400 via-amber-500 to-orange-600', badge: 'select' } },
  { keywords: ['yumurta'], meta: { icon: Egg, color: 'text-orange-500', bg: 'bg-orange-50', gradient: 'from-orange-400 via-amber-500 to-yellow-600', badge: 'local' } },
  { keywords: ['tərəvəz', 'sebzə'], meta: { icon: Carrot, color: 'text-orange-600', bg: 'bg-orange-50', gradient: 'from-orange-500 via-amber-600 to-yellow-700', seasonal: ['spring', 'summer', 'autumn'] } },
  { keywords: ['meyvə'], meta: { icon: Apple, color: 'text-red-500', bg: 'bg-red-50', gradient: 'from-red-400 via-rose-500 to-pink-600', seasonal: ['summer', 'autumn'] } },
  { keywords: ['alma'], meta: { icon: Apple, color: 'text-red-500', bg: 'bg-red-50', gradient: 'from-red-400 via-rose-500 to-rose-600', badge: 'local', seasonal: ['autumn'] } },
  { keywords: ['üzüm'], meta: { icon: Grape, color: 'text-purple-600', bg: 'bg-purple-50', gradient: 'from-purple-400 via-violet-500 to-fuchsia-600', seasonal: ['autumn'] } },
  { keywords: ['portağal', 'sitrus'], meta: { icon: Citrus, color: 'text-orange-500', bg: 'bg-orange-50', gradient: 'from-orange-400 via-amber-500 to-yellow-600', badge: 'import', seasonal: ['winter'] } },
  { keywords: ['banan'], meta: { icon: Banana, color: 'text-yellow-500', bg: 'bg-yellow-50', gradient: 'from-yellow-400 via-lime-500 to-green-600' } },
  { keywords: ['gilas', 'albalı'], meta: { icon: Cherry, color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-500 via-rose-600 to-pink-700', badge: 'seasonal', seasonal: ['summer'] } },
  { keywords: ['göyərti'], meta: { icon: Sprout, color: 'text-green-600', bg: 'bg-green-50', gradient: 'from-green-400 via-emerald-500 to-teal-600', badge: 'fresh' } },
  { keywords: ['quru meyvə', 'qaxac'], meta: { icon: Sun, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-400 via-orange-500 to-amber-700', badge: 'natural', seasonal: ['autumn', 'winter'] } },
  { keywords: ['taxıl', 'un', 'dən'], meta: { icon: Wheat, color: 'text-amber-600', bg: 'bg-amber-50', gradient: 'from-amber-300 via-yellow-500 to-amber-600', badge: 'organic' } },
  { keywords: ['şirniyyat', 'tort', 'keks'], meta: { icon: Cookie, color: 'text-amber-700', bg: 'bg-amber-50', gradient: 'from-amber-500 via-orange-600 to-rose-700', badge: 'special' } },
  { keywords: ['içki', 'içmə'], meta: { icon: Coffee, color: 'text-amber-800', bg: 'bg-amber-50', gradient: 'from-amber-600 via-yellow-700 to-amber-900', badge: 'natural' } },
  { keywords: ['çay', 'dəmləmə'], meta: { icon: Coffee, color: 'text-emerald-700', bg: 'bg-emerald-50', gradient: 'from-emerald-500 via-green-600 to-teal-700', badge: 'mountain', seasonal: ['winter'] } },
  { keywords: ['ədviyyat', 'ədv'], meta: { icon: Flame, color: 'text-red-600', bg: 'bg-red-50', gradient: 'from-red-500 via-orange-600 to-amber-700', badge: 'special' } },
  { keywords: ['konserv', 'turşu'], meta: { icon: ScrollText, color: 'text-slate-600', bg: 'bg-slate-50', gradient: 'from-slate-400 via-gray-500 to-slate-600', badge: 'handmade' } },
  { keywords: ['dağ', 'gedebey', 'gədəbəy'], meta: { icon: Mountain, color: 'text-emerald-700', bg: 'bg-emerald-50', gradient: 'from-emerald-500 via-green-600 to-teal-700', badge: 'gedebey' } },
  // Ümumi fallback-lar
  { keywords: ['orqanik', 'təbii', 'üzvi', 'organik'], meta: { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', gradient: 'from-emerald-400 via-green-500 to-teal-600', badge: 'organic' } },
];

// Son çarə fallback
const DEFAULT_META: CategoryMeta = {
  icon: ShoppingBag,
  color: 'text-emerald-600',
  bg: 'bg-emerald-50',
  gradient: 'from-emerald-400 via-green-500 to-teal-600',
};

function getCurrentSeason(): SeasonType {
  const month = new Date().getMonth();
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  if (month >= 8 && month <= 10) return 'autumn';
  return 'winter';
}

const cache = new Map<string, CategoryMeta>();

export function getCategoryMeta(name: string): CategoryMeta {
  const key = name.toLowerCase().trim();
  if (cache.has(key)) return cache.get(key)!;

  let bestMatch: CategoryMeta | null = null;
  let bestLength = 0;

  for (const rule of CATEGORY_RULES) {
    for (const keyword of rule.keywords) {
      if (key.includes(keyword) && keyword.length > bestLength) {
        bestLength = keyword.length;
        const seasonalEmoji = rule.meta.seasonal?.includes(getCurrentSeason())
          ? SEASONAL_EMOJIS[getCurrentSeason()][0]
          : undefined;
        bestMatch = { ...rule.meta, seasonalEmoji };
      }
    }
  }

  const result = bestMatch || DEFAULT_META;
  cache.set(key, result);
  return result;
}