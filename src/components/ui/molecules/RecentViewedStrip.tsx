import { Product } from "@/types/products";
import { motion } from "framer-motion";
import { RotateCcw } from "lucide-react";
import { ProductCarousel } from "./ProductCarousel";
import { SectionBlock } from "./SectionBlock";

export function RecentViewedStrip({
  products, currency, addToCart,
  onClearHistory,
}: {
  products: Product[]; currency: string
  addToCart: (id: string, variantId?: string, qty?: number) => void
  onClearHistory?: () => void
}) {
  if (!products.length) return null

  return (
    <SectionBlock
      id="recent"
      title="Son baxdıqlarınız"
      subtitle="Yenidən nəzər yetirmək istəyirsinizmi?"
      badge="👁️ Tarixçə"
    >
      <div className="space-y-2">
        {onClearHistory && (
          <div className="flex justify-end">
            <motion.button
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={onClearHistory}
              className="flex items-center gap-1.5 text-[11px] text-slate-400 hover:text-red-500 transition-colors"
            >
              <RotateCcw className="w-3 h-3" /> Tarixçəni təmizlə
            </motion.button>
          </div>
        )}
        <ProductCarousel products={products} currency={currency} addToCart={addToCart} />
      </div>
    </SectionBlock>
  )
}

/* ================================================================ */
/* 16. MOBILE BOTTOM BAR – active state + cart badge + haptics    */
/* ================================================================ */

