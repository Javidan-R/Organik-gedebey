import { memo } from 'react'
import { motion } from 'framer-motion'
import { Heart, Clock, AlertTriangle, Truck } from 'lucide-react'
import type { Product } from '@/types/products'

export const PremiumBadges = memo(function PremiumBadges({
  product,
  hasDiscount,
  offPerc,
  isOutOfStock,
  stock,
  onToggleFavorite,
  isFavorite,
}: {
  product: Product
  hasDiscount: boolean
  offPerc: number
  isOutOfStock: boolean
  stock: number
  onToggleFavorite: (id: string) => void
  isFavorite: (id: string) => boolean
}) {
  const fav = isFavorite(product.id)
  const isLowStock = stock > 0 && stock < 5

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end space-y-2 z-10">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.preventDefault(); onToggleFavorite(product.id) }}
        className={`p-2 rounded-full transition bg-white/90 hover:bg-white backdrop-blur-sm shadow-md ${
          fav ? 'text-rose-600' : 'text-gray-400'
        }`}
      >
        <Heart className={`w-4 h-4 transition ${fav ? 'fill-rose-500' : ''}`} />
      </motion.button>

      {hasDiscount && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-xl animate-pulse">
          <Clock className="w-3 h-3" /> -{offPerc}% ENDİRİM!
        </span>
      )}

      {isLowStock && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-md">
          <AlertTriangle className="w-3 h-3" /> Az Qalıb
        </span>
      )}

      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-[11px] font-bold text-white shadow-md">
        <Truck className="w-3 h-3" /> Sürətli Çatdırılma
      </span>
    </div>
  )
})

PremiumBadges.displayName = 'PremiumBadges'
