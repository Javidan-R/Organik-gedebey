// components/ui/organisms/ProductGrid.tsx
// ===================================================
// PRODUCT GRID – Ultra Premium Version
// ===================================================

"use client"

import { Product } from "@/types/products"
import { motion, AnimatePresence } from "framer-motion"
import { RusticProductCard } from "./RusticProductCard"
import { useState, useCallback } from "react"
import { Grid, List, SlidersHorizontal, ArrowUpDown, Sparkles } from "lucide-react"

export type ProductGridVariant = 'default' | 'discount' | 'breakfast' | 'gedebey' | 'highlight'

type SortKey = 'default' | 'price-asc' | 'price-desc' | 'rating' | 'name'

function sortProducts(products: Product[], sort: SortKey): Product[] {
  const arr = [...products]
  switch (sort) {
    case 'price-asc':
      return arr.sort((a, b) => (a.variants?.[0]?.price ?? a.price ?? 0) - (b.variants?.[0]?.price ?? b.price ?? 0))
    case 'price-desc':
      return arr.sort((a, b) => (b.variants?.[0]?.price ?? b.price ?? 0) - (a.variants?.[0]?.price ?? a.price ?? 0))
    case 'rating':
      return arr.sort((a, b) => {
        const ra = a.reviews?.length ? a.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / a.reviews.length : 0
        const rb = b.reviews?.length ? b.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / b.reviews.length : 0
        return rb - ra
      })
    case 'name':
      return arr.sort((a, b) => a.name.localeCompare(b.name, 'az'))
    default:
      return arr
  }
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.06 },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: 'spring' as const, stiffness: 120, damping: 16 },
  },
}

const SORT_OPTIONS: { key: SortKey; label: string }[] = [
  { key: 'default', label: 'Tövsiyə olunan' },
  { key: 'price-asc', label: '↑ Ucuz → Baha' },
  { key: 'price-desc', label: '↓ Baha → Ucuz' },
  { key: 'rating', label: '⭐ Reytinq' },
  { key: 'name', label: 'A → Z (ad)' },
]

export function ProductGrid({
  products,
  currency,
  addToCart,
  variant = 'default',
  showControls = false,
  compareList = [],
  onWishlistToggle,
  onCompareToggle,
}: {
  products: Product[]
  currency: string
  addToCart: (id: string, variantId?: string, qty?: number) => void
  variant?: ProductGridVariant
  showControls?: boolean
  compareList?: string[]
  onWishlistToggle?: (id: string) => void
  onCompareToggle?: (id: string) => void
}) {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortKey, setSortKey] = useState<SortKey>('default')
  const [sortOpen, setSortOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(8)

  const sorted = sortProducts(products, sortKey)
  const visible = sorted.slice(0, visibleCount)
  const hasMore = visibleCount < sorted.length

  const handleLoadMore = useCallback(() => {
    setVisibleCount(prev => prev + 4)
  }, [])

  /* ── Empty state ── */
  if (!products.length) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center justify-center gap-3 rounded-3xl border border-dashed border-lime-300 bg-white/70 px-6 py-16 text-center"
      >
        <motion.span
          animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
          transition={{ repeat: Infinity, duration: 3 }}
          className="text-5xl"
        >
          🍃
        </motion.span>
        <p className="font-black text-slate-700">Bu bölmədə hələ məhsul yoxdur.</p>
        <p className="text-xs text-slate-500 max-w-xs">
          Tezliklə bura yeni kənd məhsulları əlavə olunacaq. Bildiriş almaq üçün qeydiyyatdan keç!
        </p>
        <motion.a
          href="/products"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.97 }}
          className="mt-2 px-5 py-2.5 rounded-2xl bg-emerald-600 text-white text-sm font-bold shadow-lg"
        >
          Bütün məhsullara bax →
        </motion.a>
      </motion.div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Controls bar */}
      {showControls && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-3"
        >
          <p className="text-xs text-slate-500 font-semibold">
            {sorted.length} məhsul tapıldı
          </p>

          <div className="flex items-center gap-2">
            {/* Sort dropdown */}
            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setSortOpen(prev => !prev)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl bg-white border border-slate-200 text-xs font-semibold text-slate-700 shadow-sm hover:border-emerald-300 transition-colors"
              >
                <ArrowUpDown className="w-3.5 h-3.5" />
                {SORT_OPTIONS.find(s => s.key === sortKey)?.label ?? 'Sırala'}
              </motion.button>

              <AnimatePresence>
                {sortOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 6, scale: 0.97 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 6, scale: 0.97 }}
                    className="absolute right-0 top-full mt-1.5 z-30 w-44 bg-white rounded-2xl shadow-2xl border border-slate-100 overflow-hidden"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <button
                        key={opt.key}
                        onClick={() => { setSortKey(opt.key); setSortOpen(false) }}
                        className={`w-full px-4 py-2.5 text-left text-xs font-semibold transition-colors ${
                          sortKey === opt.key
                            ? 'bg-emerald-50 text-emerald-700'
                            : 'text-slate-700 hover:bg-slate-50'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* View mode toggle */}
            <div className="flex items-center bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
              {([
                { mode: 'grid' as const, icon: Grid },
                { mode: 'list' as const, icon: List },
              ]).map(({ mode, icon: Icon }) => (
                <motion.button
                  key={mode}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setViewMode(mode)}
                  className={`p-2 transition-colors ${viewMode === mode ? 'bg-emerald-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
                >
                  <Icon className="w-4 h-4" />
                </motion.button>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Product grid */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${viewMode}-${sortKey}`}
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          className={viewMode === 'grid'
            ? "grid grid-cols-2 gap-2.5 sm:grid-cols-2 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4"
            : "flex flex-col gap-3"
          }
        >
          {visible.map(product => (
            <motion.div key={product.id} variants={itemVariants}>
              <RusticProductCard
                product={product}
                currency={currency}
                addToCart={addToCart}
                isInCompare={compareList.includes(product.id)}
                onWishlistToggle={onWishlistToggle}
                onCompareToggle={onCompareToggle}
              />
            </motion.div>
          ))}
        </motion.div>
      </AnimatePresence>

      {/* Load more */}
      <AnimatePresence>
        {hasMore && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center pt-2"
          >
            <motion.button
              whileHover={{ scale: 1.04, y: -2 }}
              whileTap={{ scale: 0.97 }}
              onClick={handleLoadMore}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl border-2 border-emerald-200 bg-white text-emerald-700 text-sm font-bold hover:bg-emerald-50 hover:border-emerald-400 transition-all shadow-sm"
            >
              <Sparkles className="w-4 h-4" />
              Daha çox göstər ({sorted.length - visibleCount} qalıb)
            </motion.button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}