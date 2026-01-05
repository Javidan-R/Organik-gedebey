// ===================================================
// RECENT VIEWED STRIP
// ===================================================

import { Product } from "@/types/products"
import { Clock } from "lucide-react"
import { RusticProductCard } from "../organisms/RusticProductCard"

export  function RecentViewedStrip({
  products,
  currency,
  addToCart,
}: {
  products: Product[]
  currency: string
  addToCart: (id: string) => void
}) {
  if (!products.length) return null

  return (
    <section className="space-y-3 rounded-3xl border border-slate-100 bg-white/80 px-4 py-4 shadow-sm">
      <div className="flex items-center justify-between text-xs">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-emerald-700" />
          <p className="font-semibold text-[#234025]">Son baxdığın kənd məhsulları</p>
        </div>
        <p className="text-[11px] text-[#667666]">
          Bəyəndiklərini səbətə əlavə etməyi unutma.
        </p>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pt-1">
        {products.map((p) => (
          <div
            key={p.id}
            className="min-w-[68%] snap-start sm:min-w-[40%] md:min-w-[30%] lg:min-w-[24%]"
          >
            <RusticProductCard
              product={p}
              currency={currency}
              addToCart={addToCart}
            />
          </div>
        ))}
      </div>
    </section>
  )
}