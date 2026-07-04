import { Product } from "@/types/products";
import { getFirstImageUrl, formatCurrency, getProductBasePrice } from "@/utils/product";
import { motion } from "framer-motion";
import { Flame, Timer } from "lucide-react";
import { FC, useState, useEffect } from "react";

// NEW: Flash Deal Timer Card
export const FlashDealCard: FC<{ product: Product; dealPrice: number; endsAt: number; sold: number; total: number }> = ({
  product, dealPrice, endsAt, sold, total
}) => {
  const [secsLeft, setSecsLeft] = useState(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)))

  useEffect(() => {
    const id = setInterval(() => setSecsLeft(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const pct = (sold / total) * 100
  const h = Math.floor(secsLeft / 3600)
  const m = Math.floor((secsLeft % 3600) / 60)
  const s = secsLeft % 60
  const timer = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
 
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="rounded-3xl overflow-hidden border border-red-100 bg-white shadow-xl"
    >
      <div className="bg-linear-to-r from-red-500 to-rose-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Flame className="w-4 h-4" />
          <span className="text-xs font-black">FLASH DEAL</span>
        </div>
        <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
          <Timer className="w-3 h-3 text-white" />
          <span className="text-xs font-mono font-bold text-white">{timer}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            <img src={getFirstImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-800 line-clamp-2">{product.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-black text-red-600">{formatCurrency(dealPrice)}</span>
              <span className="text-xs line-through text-slate-400">{formatCurrency(getProductBasePrice(product))}</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{sold} satıldı</span>
            <span className="font-bold text-red-500">{Math.round(pct)}% bitdi!</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-linear-to-r from-red-400 to-rose-600"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}