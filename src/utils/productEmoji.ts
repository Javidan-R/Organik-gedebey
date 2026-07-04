// utils/productEmoji.ts (or inside the component, but exportable)
import type { Product } from '@/types/products';
 
// Configuration for keyword-based emoji mapping
// Order matters: more specific patterns should come first
const EMOJI_PATTERNS: Array<{
  patterns: string[];      // keywords to match (case-insensitive)
  emoji: string;
  priority?: number;       // higher = more specific, defaults to index order
}> = [
  // Bal (honey) - high priority
  { patterns: ['bal', 'honey', 'arı', 'bee'], emoji: '🍯', priority: 10 },
  // Süd (milk) and dairy
  { patterns: ['süd', 'milk', 'kefir', 'ayran'], emoji: '🥛', priority: 10 },
  { patterns: ['pendir', 'cheese', 'mozzarella'], emoji: '🧀', priority: 10 },
  { patterns: ['yağ', 'butter', 'kərə yağı'], emoji: '🧈', priority: 10 },
  { patterns: ['qatıq', 'yogurt', 'yoghurt'], emoji: '🥣', priority: 10 },
  // Yumurta (eggs)
  { patterns: ['yumurta', 'egg'], emoji: '🥚', priority: 10 },
  // Meyvələr (fruits)
  { patterns: ['alma', 'apple'], emoji: '🍎', priority: 9 },
  { patterns: ['armud', 'pear'], emoji: '🍐', priority: 9 },
  { patterns: ['nar', 'pomegranate'], emoji: '🍎', priority: 9 },
  { patterns: ['üzüm', 'grape'], emoji: '🍇', priority: 9 },
  { patterns: ['çiyələk', 'strawberry'], emoji: '🍓', priority: 9 },
  { patterns: ['moruq', 'raspberry'], emoji: '🍓', priority: 9 },
  { patterns: ['qarpız', 'watermelon'], emoji: '🍉', priority: 9 },
  { patterns: ['şaftalı', 'peach'], emoji: '🍑', priority: 9 },
  { patterns: ['albalı', 'cherry'], emoji: '🍒', priority: 9 },
  // Tərəvəzlər (vegetables)
  { patterns: ['pomidor', 'tomato'], emoji: '🍅', priority: 9 },
  { patterns: ['xiyar', 'cucumber'], emoji: '🥒', priority: 9 },
  { patterns: ['kartof', 'potato'], emoji: '🥔', priority: 9 },
  { patterns: ['soğan', 'onion'], emoji: '🧅', priority: 9 },
  { patterns: ['sarımsaq', 'garlic'], emoji: '🧄', priority: 9 },
  { patterns: ['bibər', 'pepper'], emoji: '🫑', priority: 9 },
  { patterns: ['kələm', 'cabbage'], emoji: '🥬', priority: 9 },
  { patterns: ['lobya', 'bean'], emoji: '🫘', priority: 9 },
  // Taxıl (grains)
  { patterns: ['çörək', 'bread', 'un', 'flour', 'buğda', 'wheat'], emoji: '🌾', priority: 8 },
  // Ümumi kateqoriyalar (general)
  { patterns: ['meyvə', 'fruit'], emoji: '🍎', priority: 5 },
  { patterns: ['tərəvəz', 'vegetable'], emoji: '🥬', priority: 5 },
  { patterns: ['süd', 'dairy'], emoji: '🥛', priority: 5 },
  { patterns: ['bal', 'honey'], emoji: '🍯', priority: 5 },
  { patterns: ['taxıl', 'grain'], emoji: '🌾', priority: 5 },
];

// Category fallback (when keyword matching fails)
const CATEGORY_FALLBACK: Record<string, string> = {
  meyvə: '🍎',
  tərəvəz: '🥬',
  süd: '🥛',
  bal: '🍯',
  taxıl: '🌾',
  default: '🥬',
};

/**
 * Intelligent emoji resolver for products.
 * First tries keyword matching (case-insensitive) with priority.
 * If no match, falls back to product category mapping.
 * Finally returns default leaf emoji.
 */
export function getProductEmoji(product: Product): string {
  const name = product.name.toLowerCase();
  const category = product.category?.toLowerCase() || '';

  // Collect matches with their priority
  const matches: { emoji: string; priority: number }[] = [];

  for (const rule of EMOJI_PATTERNS) {
    const priority = rule.priority ?? 10; // default priority high enough
    for (const pattern of rule.patterns) {
      if (name.includes(pattern.toLowerCase())) {
        matches.push({ emoji: rule.emoji, priority });
        break; // only first pattern per rule
      }
    }
  }

  // If we have matches, return the one with highest priority (lowest number? Actually higher priority = more specific)
  if (matches.length > 0) {
    matches.sort((a, b) => b.priority - a.priority);
    return matches[0].emoji;
  }

  // Fallback to category
  for (const [catKey, emoji] of Object.entries(CATEGORY_FALLBACK)) {
    if (category.includes(catKey)) return emoji;
  }

  // Ultimate fallback
  return '🥬';
}
