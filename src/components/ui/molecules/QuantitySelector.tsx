import { memo } from 'react'
import { motion } from 'framer-motion'
import { Minus, Plus } from 'lucide-react'

type Unit = 'kq' | 'ədəd' | 'balon' | 'litr' | 'qram' | 'qutu' | string

const getUnitDisplay = (unit: Unit): string => {
  const unitMap: Record<string, string> = {
    kq: 'kq',
    ədəd: 'ədəd',
    balon: 'balon',
    litr: 'L',
    qram: 'qr',
    qutu: 'qutu',
    ml: 'ml',
    meşov: 'meşov',
    paket: 'paket',
  }
  return unitMap[unit] || unit
}

const formatQuantity = (qty: number, unit: Unit): string => {
  if (unit === 'kq' || unit === 'litr') return qty.toFixed(1)
  if (unit === 'qram' || unit === 'ml') return Math.round(qty).toString()
  return Math.round(qty).toString()
}

export const QuantitySelector = memo(function QuantitySelector({
  qty,
  unit,
  step,
  minQty,
  maxQty,
  stock,
  onIncrement,
  onDecrement,
  onChange,
}: {
  qty: number
  unit: Unit
  step: number
  minQty: number
  maxQty: number
  stock: number
  onIncrement: () => void
  onDecrement: () => void
  onChange: (value: number) => void
}) {
  const unitDisplay = getUnitDisplay(unit)
  const displayQty = formatQuantity(qty, unit)

  return (
    <div className="flex items-center border-2 border-emerald-500 rounded-xl overflow-hidden shadow-sm bg-white">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDecrement}
        disabled={qty <= minQty}
        className="p-3 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        <Minus className="w-4 h-4" />
      </motion.button>

      <div className="flex-1 px-2 text-center min-w-[80px]">
        <div className="text-lg font-bold text-gray-900">{displayQty}</div>
        <div className="text-xs text-gray-500 font-medium">{unitDisplay}</div>
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onIncrement}
        disabled={qty >= Math.min(maxQty, stock)}
        className="p-3 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  )
})

QuantitySelector.displayName = 'QuantitySelector'
