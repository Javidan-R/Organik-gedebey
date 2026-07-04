import { motion } from 'framer-motion'
import { X, AlertTriangle, Zap, CheckCircle2 } from 'lucide-react'

export const StockBadge = ({ stock, unit }: { stock: number; unit: string }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
        <X className="w-3 h-3" /> Stok yoxdur
      </span>
    )
  }
  if (stock < 5) {
    return (
      <motion.span
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold"
      >
        <AlertTriangle className="w-3 h-3" /> Son {stock} {unit}!
      </motion.span>
    )
  }
  if (stock < 15) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
        <Zap className="w-3 h-3" /> Tez bitir
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
      <CheckCircle2 className="w-3 h-3" /> Stokda
    </span>
  )
}

StockBadge.displayName = 'StockBadge'
