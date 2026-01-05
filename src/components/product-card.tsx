'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { finalPrice } from '@/lib/calc'
import { Product } from '@/lib/types'
import { useApp } from '@/lib/store'

export default function ProductCard({ p, onAdd }: { p: Product; onAdd?: () => void }) {
  const { addToCart } = useApp()
  const baseVariant = p.variants?.[0]
  const price = finalPrice(baseVariant?.price ?? 0, p.discountType, p.discountValue)
  const hasDiscount = !!p.discountValue && p.discountValue > 0

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25 }}
      className="relative rounded-2xl border bg-white hover:shadow-lg transition overflow-hidden"
    >
      {/* Şəkil */}
      <div className="relative aspect-square">
        <Image src={p.image || '/placeholder.png'} alt={p.name} fill className="object-cover rounded-2xl" />
        {hasDiscount && (
          <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
            -{p.discountValue}{p.discountType === 'percent' ? '%' : '₼'}
          </span>
        )}
        {p.isNew && (
          <span className="absolute top-2 right-2 bg-green-600 text-white text-xs font-semibold px-2 py-1 rounded-md">
            Yeni
          </span>
        )}
      </div>

      {/* Məlumat */}
      <div className="p-3 space-y-1">
        <div className="font-medium truncate">{p.name}</div>
        <div className="text-xs text-gray-500">{p.origin}</div>
        <div className="flex items-center justify-between mt-2">
          <div className="flex items-baseline gap-1">
            <span className="text-green-700 font-semibold text-base">{price.toFixed(2)} ₼</span>
            {hasDiscount && (
              <span className="text-xs text-gray-400 line-through">{baseVariant?.price} ₼</span>
            )}
          </div>
          <button
            onClick={() => onAdd ? onAdd() : addToCart(p.id)}
            className="h-8 rounded-lg bg-green-600 hover:bg-green-700 px-3 text-white text-xs font-medium"
          >
            Səbətə
          </button>
        </div>
      </div>
    </motion.div>
  )
}
