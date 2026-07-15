// src/lib/category-helpers.ts
// Tam, qısaldılmamış, production-ready versiya

import type { Category, CategoryTree } from '@/types/category';
import { slugify } from '@/lib/utils/slug';
import {
  Sprout,
  Package,
  Droplets,
  Flame,
  FlaskConical,
  Apple,
  Grape,
  Leaf,
  Beef,
  Milk,
  Folder,
  Coffee,
  Fish,
  Egg,
  Wheat,
  Utensils,
  Salad,
  Flower2,
  Sun,
  Cloud,
  Wind,
  TreePine,
  Mountain,
  Waves,
  Carrot,
} from 'lucide-react';

export const DEFAULT_CATEGORY_IMAGE = '/images/category-default.jpg';

/**
 * Kateqoriyanın etibarlı şəkil URL-ni qaytarır.
 * Əgər şəkil yoxdursa, default şəkil qaytarılır.
 */
export function getCategoryImageUrl(category: Category | null | undefined): string {
  if (!category) return DEFAULT_CATEGORY_IMAGE;
  return category.imageUrl || DEFAULT_CATEGORY_IMAGE;
}

/**
 * Kateqoriyanın alt text-ini qaytarır (SEO üçün)
 */
export function getCategoryImageAlt(category: Category | null | undefined): string {
  if (!category) return 'Kateqoriya';
  return category.imageAlt || category.name || 'Kateqoriya';
}

/**
 * Kateqoriya slug-ını təhlükəsiz şəkildə yaradır
 */
export function generateCategorySlug(name: string, existingSlugs: string[] = []): string {
  let slug = slugify(name);
  let counter = 1;
  let uniqueSlug = slug;
  while (existingSlugs.includes(uniqueSlug)) {
    uniqueSlug = `${slug}-${counter}`;
    counter++;
  }
  return uniqueSlug;
}

/**
 * Kateqoriyaları ağac (tree) strukturuna çevirir
 */
export function buildCategoryTree(categories: Category[], parentId: string | null = null): CategoryTree[] {
  const filtered = categories.filter((cat) => cat.parentId === parentId);
  return filtered.map((cat) => ({
    ...cat,
    children: buildCategoryTree(categories, cat.id),
  }));
}

/**
 * Kateqoriyanın tam yolunu (breadcrumb) qaytarır
 */
export function getCategoryPath(category: Category, allCategories: Category[]): Category[] {
  const path: Category[] = [];
  let current: Category | undefined = category;
  while (current) {
    path.unshift(current);
    current = allCategories.find((c) => c.id === current?.parentId);
  }
  return path;
}

/**
 * Kateqoriya adını normalize edir (axtarış üçün)
 */
export function normalizeCategorySearchTerm(term: string): string {
  return term.toLowerCase().trim().replace(/\s+/g, ' ');
}

/**
 * Kateqoriya şəklini Next.js Image komponenti üçün hazırlayır
 */
export function getCategoryImageProps(category: Category | null | undefined) {
  const url = getCategoryImageUrl(category);
  const alt = getCategoryImageAlt(category);
  return {
    src: url,
    alt,
    width: 400,
    height: 400,
    className: 'object-cover',
  };
}

/**
 * Kateqoriya rəngini qaytarır (default emerald)
 */
export function getCategoryColor(category: Category | null | undefined): string {
  if (!category) return '#22C55E';
  return category.color || '#22C55E';
}

/**
 * Kateqoriya ikonasını qaytarır (default 'Folder')
 */
export function getCategoryIcon(category: Category | null | undefined): string {
  if (!category) return 'Folder';
  return category.icon || 'Folder';
}

/**
 * Kateqoriya adına görə meta məlumatları qaytarır (ikon, rəng, badge)
 * Genişləndirilmiş versiya – bütün əsas kateqoriyaları dəstəkləyir
 */
export function getCategoryMeta(categoryName: string) {
  const name = categoryName.toLowerCase().trim();

  // Kateqoriya eşleşmələri
  const mappings: Record<string, { icon: any; color: string; bg: string; badge?: string }> = {
    // Meyvələr
    'meyvə': { icon: Grape, color: 'text-purple-500', bg: 'bg-purple-50' },
    'meyvelər': { icon: Grape, color: 'text-purple-500', bg: 'bg-purple-50' },
    'alma': { icon: Apple, color: 'text-red-500', bg: 'bg-red-50' },
    'armud': { icon: Apple, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    'nar': { icon: Grape, color: 'text-red-600', bg: 'bg-red-50', badge: 'Mövsümi' },
    'üzüm': { icon: Grape, color: 'text-purple-600', bg: 'bg-purple-50' },
    'qarpız': { icon: Droplets, color: 'text-green-500', bg: 'bg-green-50', badge: 'Yay' },
    'qovun': { icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'Yay' },
    'şaftalı': { icon: Apple, color: 'text-pink-500', bg: 'bg-pink-50' },
    'gilas': { icon: Grape, color: 'text-rose-500', bg: 'bg-rose-50' },
    'tut': { icon: Grape, color: 'text-purple-700', bg: 'bg-purple-50' },
    'incir': { icon: Grape, color: 'text-emerald-600', bg: 'bg-emerald-50' },

    // Tərəvəzlər
    'tərəvəz': { icon: Carrot, color: 'text-orange-500', bg: 'bg-orange-50' },
    'tərəvəzlər': { icon: Carrot, color: 'text-orange-500', bg: 'bg-orange-50' },
    'pomidor': { icon: Carrot, color: 'text-red-500', bg: 'bg-red-50' },
    'xiyar': { icon: Carrot, color: 'text-green-500', bg: 'bg-green-50' },
    'kələm': { icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
    'badımcan': { icon: Carrot, color: 'text-purple-600', bg: 'bg-purple-50' },
    'bibər': { icon: Flame, color: 'text-red-500', bg: 'bg-red-50' },
    'yerkökü': { icon: Carrot, color: 'text-orange-500', bg: 'bg-orange-50' },
    'soğan': { icon: Carrot, color: 'text-amber-600', bg: 'bg-amber-50' },
    'sarımsaq': { icon: Carrot, color: 'text-amber-500', bg: 'bg-amber-50' },
    'kartof': { icon: Carrot, color: 'text-yellow-600', bg: 'bg-yellow-50' },

    // Göyərti
    'göyərti': { icon: Salad, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'göyərtilər': { icon: Salad, color: 'text-emerald-500', bg: 'bg-emerald-50' },
    'cəfəri': { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'şüyüd': { icon: Leaf, color: 'text-green-500', bg: 'bg-green-50' },
    'reyhan': { icon: Leaf, color: 'text-purple-500', bg: 'bg-purple-50' },
    'nanə': { icon: Leaf, color: 'text-emerald-400', bg: 'bg-emerald-50' },
    'turp': { icon: Carrot, color: 'text-pink-500', bg: 'bg-pink-50' },

    // Süd məhsulları
    'süd': { icon: Milk, color: 'text-blue-400', bg: 'bg-blue-50' },
    'süd məhsulları': { icon: Milk, color: 'text-blue-400', bg: 'bg-blue-50' },
    'pendir': { icon: Package, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    'qaymaq': { icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    'kefir': { icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-50' },
    'yaylaq': { icon: Droplets, color: 'text-amber-500', bg: 'bg-amber-50' },

    // Ət və balıq
    'ət': { icon: Beef, color: 'text-red-600', bg: 'bg-red-50' },
    'ət məhsulları': { icon: Beef, color: 'text-red-600', bg: 'bg-red-50' },
    'qırmızı ət': { icon: Beef, color: 'text-red-600', bg: 'bg-red-50' },
    'toyuq': { icon: Beef, color: 'text-amber-600', bg: 'bg-amber-50' },
    'balıq': { icon: Fish, color: 'text-cyan-500', bg: 'bg-cyan-50' },
    'yumurta': { icon: Egg, color: 'text-amber-500', bg: 'bg-amber-50' },

    // Taxıl və un məhsulları
    'taxıl': { icon: Wheat, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    'taxıllar': { icon: Wheat, color: 'text-yellow-600', bg: 'bg-yellow-50' },
    'un': { icon: Wheat, color: 'text-slate-500', bg: 'bg-slate-50' },
    'çörək': { icon: Wheat, color: 'text-amber-600', bg: 'bg-amber-50' },
    'makaron': { icon: Utensils, color: 'text-yellow-500', bg: 'bg-yellow-50' },

    // İçkilər
    'çay': { icon: Coffee, color: 'text-emerald-600', bg: 'bg-emerald-50' },
    'qəhvə': { icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50' },
    'içki': { icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50' },
    'içkilər': { icon: Coffee, color: 'text-amber-700', bg: 'bg-amber-50' },
    'şirə': { icon: Droplets, color: 'text-orange-400', bg: 'bg-orange-50' },
    'şirələr': { icon: Droplets, color: 'text-orange-400', bg: 'bg-orange-50' },

    // Quru meyvələr
    'quru meyvə': { icon: Apple, color: 'text-amber-600', bg: 'bg-amber-50' },
    'quru meyvələr': { icon: Apple, color: 'text-amber-600', bg: 'bg-amber-50' },
    'kişmiş': { icon: Grape, color: 'text-purple-600', bg: 'bg-purple-50' },
    'qoz': { icon: Apple, color: 'text-amber-700', bg: 'bg-amber-50' },
    'fındıq': { icon: Apple, color: 'text-amber-600', bg: 'bg-amber-50' },
    'püstə': { icon: Apple, color: 'text-emerald-600', bg: 'bg-emerald-50' },

    // Qəlyanaltılar
    'qəlyanaltı': { icon: Utensils, color: 'text-pink-500', bg: 'bg-pink-50' },
    'qəlyanaltılar': { icon: Utensils, color: 'text-pink-500', bg: 'bg-pink-50' },
    'çips': { icon: Utensils, color: 'text-orange-500', bg: 'bg-orange-50' },

    // Digər
    'bal': { icon: Sprout, color: 'text-amber-500', bg: 'bg-amber-50', badge: 'Təbii' },
    'bəhməz': { icon: Flame, color: 'text-orange-500', bg: 'bg-orange-50' },
    'sirkə': { icon: FlaskConical, color: 'text-purple-500', bg: 'bg-purple-50' },
    'yağ': { icon: Droplets, color: 'text-yellow-500', bg: 'bg-yellow-50' },
    'zeytun': { icon: Leaf, color: 'text-green-600', bg: 'bg-green-50' },
    'gül': { icon: Flower2, color: 'text-pink-400', bg: 'bg-pink-50' },
    'mürəbbə': { icon: Grape, color: 'text-pink-500', bg: 'bg-pink-50' },

    // Ümumi
    'organik': { icon: Leaf, color: 'text-emerald-600', bg: 'bg-emerald-50', badge: 'Organik' },
    'təzə': { icon: Leaf, color: 'text-emerald-500', bg: 'bg-emerald-50', badge: 'Təzə' },
    'mövsümi': { icon: Sun, color: 'text-yellow-500', bg: 'bg-yellow-50', badge: 'Mövsümi' },
    'yerli': { icon: TreePine, color: 'text-green-600', bg: 'bg-green-50', badge: 'Yerli' },
  };

  // Dəqiq və ya qismən eşleşmə
  for (const [key, value] of Object.entries(mappings)) {
    if (name.includes(key) || key.includes(name)) {
      return value;
    }
  }

  // Default
  return {
    icon: Folder,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50',
  };
}