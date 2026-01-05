
// ===================================================
// PRODUCT GRID (Rustik card ilə – bir neçə variant)
// ===================================================

import { Product } from "@/types/products"
import { motion } from "framer-motion"
import { RusticProductCard } from "./RusticProductCard"

export type ProductGridVariant = 'default' | 'discount' | 'breakfast' | 'gedebey' | 'highlight'

export  function ProductGrid({
  products,
  currency,
}: {
  products: Product[]
  currency: string
  addToCart: (id: string) => void
  variant: ProductGridVariant
}) {
  if (!products.length) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 rounded-3xl border border-dashed border-lime-200 bg-white/70 px-4 py-12 text-center text-sm text-[#697c69]">
        <span className="text-3xl">🍃</span>
        <p className="font-semibold">Bu bölmədə hələ məhsul yoxdur.</p>
        <p className="text-xs text-[#859785]">
          Tezliklə bura yeni kənd məhsulları əlavə olunacaq.
        </p>
      </div>
    )
  }

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.22 }}
      variants={{
        hidden: { opacity: 0, y: 16 },
        visible: {
          opacity: 1,
          y: 0,
          transition: { staggerChildren: 0.05 },
        },
      }}
      className="grid grid-cols-1 gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4 lg:gap-6"
    >
      {products.map((p) => (
        <RusticProductCard
          key={p.id}
          product={p}
          currency={currency}
        />
      ))}
    </motion.div>
  )
}
