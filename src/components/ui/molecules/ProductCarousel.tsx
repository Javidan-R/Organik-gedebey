import { Product } from "@/types/products"
import { motion } from "framer-motion"
import { Package, ChevronRight, ChevronLeft } from "lucide-react"
import { useRef, useState, useCallback, useEffect } from "react"
import { RusticProductCard } from "../organisms"

export function ProductCarousel({
  products,
  currency,
  addToCart,
}: {
  products: Product[]
  currency: string
  addToCart: (id: string, variantId?: string, qty?: number) => void
}) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [canLeft, setCanLeft] = useState(false)
  const [canRight, setCanRight] = useState(true)
  const [activeIdx, setActiveIdx] = useState(0)
  const [isDragging, setIsDragging] = useState(false)
  const dragStart = useRef(0)
 
  const CARD_W = 280

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setCanLeft(el.scrollLeft > 8)
    setCanRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
    setActiveIdx(Math.round(el.scrollLeft / CARD_W))
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    checkScroll()
    return () => el.removeEventListener("scroll", checkScroll)
  }, [checkScroll, products])

  const slide = useCallback((dir: "left" | "right") => {
    scrollRef.current?.scrollBy({ left: dir === "right" ? CARD_W : -CARD_W, behavior: "smooth" })
  }, [])

  const goTo = useCallback((idx: number) => {
    scrollRef.current?.scrollTo({ left: idx * CARD_W, behavior: "smooth" })
  }, [])

  // Keyboard navigation
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") slide("right")
      if (e.key === "ArrowLeft") slide("left")
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [slide])

  if (!products.length) {
    return (
      <div className="text-center py-10 text-slate-400">
        <Package className="w-10 h-10 mx-auto mb-2 opacity-30" />
        <p className="text-sm">Hələ məhsul yoxdur</p>
      </div>
    )
  }

  const totalDots = Math.ceil(products.length / 2)

  return (
    <div className="relative group">
      {/* Scroll hint */}
      <div className="flex items-center justify-between pb-2">
        <motion.p
          animate={{ x: [0, 6, 0] }}
          transition={{ repeat: Infinity, duration: 2.5 }}
          className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium"
        >
          <ChevronRight className="w-3 h-3" /> Sürüşdürərək gözdən keçirin
        </motion.p>

        {/* Arrow controls */}
        <div className="flex items-center gap-2">
          {[
            { dir: "left" as const, can: canLeft, Icon: ChevronLeft },
            { dir: "right" as const, can: canRight, Icon: ChevronRight },
          ].map(({ dir, can, Icon }) => (
            <motion.button
              key={dir}
              whileHover={can ? { scale: 1.1 } : {}}
              whileTap={can ? { scale: 0.9 } : {}}
              onClick={() => can && slide(dir)}
              className={`h-8 w-8 rounded-full border flex items-center justify-center transition-all ${
                can
                  ? "border-emerald-300 text-emerald-600 bg-white hover:bg-emerald-50 shadow-sm"
                  : "border-slate-100 text-slate-300 cursor-not-allowed"
              }`}
            >
              <Icon className="w-4 h-4" />
            </motion.button>
          ))}
        </div>
      </div>

      

      {/* Scrollable container */}
      <div
        ref={scrollRef}
        className="no-scrollbar flex snap-x snap-mandatory gap-3 overflow-x-auto pb-3 pt-1 scroll-smooth cursor-grab active:cursor-grabbing select-none"
        onMouseDown={e => { setIsDragging(false); dragStart.current = e.clientX }}
        onMouseMove={e => {
          if (e.buttons === 1) {
            setIsDragging(true)
            scrollRef.current!.scrollLeft -= e.movementX
          }
        }}
      >
      {products.map((p, i) => (
        <motion.div
          key={`${p.id ?? "product"}-${i}`}
          initial={{ opacity: 0, x: 24 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          transition={{ delay: Math.min(i * 0.05, 0.4) }}
          className="min-w-[66%] snap-start sm:min-w-[42%] md:min-w-[31%] lg:min-w-[23%]"
        >
          <RusticProductCard
            product={p}
            currency={currency}
            addToCart={addToCart}
          />
        </motion.div>
      ))}
      </div>

      {/* Dot indicators */}
      <div className="flex justify-center gap-1.5 mt-1">
        {Array.from({ length: Math.min(totalDots, 8) }).map((_, i) => (
          <motion.button
            key={i}
            onClick={() => goTo(i * 2)}
            animate={{ scale: activeIdx === i * 2 || activeIdx === i * 2 + 1 ? 1 : 0.8 }}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              activeIdx === i * 2 || activeIdx === i * 2 + 1
                ? "w-5 bg-emerald-500"
                : "w-1.5 bg-slate-300"
            }`}
          />
        ))}
      </div>
    </div>
  )
}