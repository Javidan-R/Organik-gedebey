
// ===================================================
// HORIZONTAL PRODUCT CAROUSEL
// ===================================================

import { Product } from "@/types/products"
import { RusticProductCard } from "../organisms/RusticProductCard"

export  function ProductCarousel({
  products,
  currency,
  addToCart,
}: {
  products: Product[]
  currency: string
  addToCart: (id: string) => void
}) {
  if (!products.length) {
    return (
      <p className="rounded-2xl bg-white/70 px-4 py-6 text-center text-sm text-[#6b7b69]">
        Hələ kifayət qədər rəy yoxdur.
      </p>
    )
  }

  return (
    <div className="relative">
      <div className="flex items-center justify-between pb-1 text-[11px] text-[#567156]">
        <span>Sağa-sola sürüşdürərək gözdən keçirin</span>
        <span className="hidden sm:inline">Touch & drag</span>
      </div>
      <div className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 pt-1">
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
    </div>
  )
}
