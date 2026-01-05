// ===================================================
// DİNAMİK PROMO STRIP – saat / rating / social proof
// ===================================================

import { motion } from "framer-motion"
import { Sparkles, Clock, Star, ShoppingBasket } from "lucide-react"

export  function DynamicPromoStrip({
  timeOfDay,
  secondsLeft,
  formatTimer,
  totalOrders,
  avgRating,
}: {
  timeOfDay: 'morning' | 'day' | 'evening'
  secondsLeft: number | null
  formatTimer: (sec: number | null) => string
  totalOrders: number
  avgRating: number
}) {
  const greeting =
    timeOfDay === 'morning'
      ? 'Sabahın xeyir! Səhər süfrəni kənd məhsulları ilə doldur.'
      : timeOfDay === 'evening'
      ? 'Axşamın xeyir! Çay süfrəsi üçün təbii ləzzətlər seç.'
      : 'Bugün kənd dadlarını sınamaq üçün ideal gündür.'

  return (
    <motion.section
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45 }}
      className="flex flex-col gap-3 rounded-3xl border border-emerald-100 bg-[#f9fff6]/90 px-4 py-3 text-[11px] text-[#234025] shadow-[0_12px_28px_rgba(16,83,19,0.12)] md:flex-row md:items-center md:justify-between"
    >
      <div className="flex items-center gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-2xl bg-emerald-600 text-white shadow-md">
          <Sparkles className="h-4 w-4" />
        </div>
        <div>
          <p className="text-xs font-semibold text-[#184021]">{greeting}</p>
          <p className="mt-0.5 text-[11px] text-[#476047]">
            Bugün verilən sifarişlər <b>eyni gün</b> çatdırılmağa çalışılır. Ən çox sevilən
            məhsullar tez tükənir.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 md:justify-end">
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-1 shadow-sm">
          <Clock className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-[10px] text-[#385438]">
            Bugünkü kampaniya bitməsinə:
            <span className="ml-1 font-semibold text-[#135827]">
              {formatTimer(secondsLeft)}
            </span>
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-1 shadow-sm">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] text-[#3c563c]">
            Ortalama məmnuniyyət:
            <span className="ml-1 font-semibold">
              {avgRating ? avgRating.toFixed(1) : '5.0'} ⭐
            </span>
          </span>
        </div>
        <div className="inline-flex items-center gap-2 rounded-2xl bg-white px-3 py-1 shadow-sm">
          <ShoppingBasket className="h-3.5 w-3.5 text-emerald-700" />
          <span className="text-[10px] text-[#3c563c]">
            Bu günə qədər{' '}
            <span className="font-semibold">{totalOrders || '100+'}</span> kənd səbəti
            çatdırılıb
          </span>
        </div>
      </div>
    </motion.section>
  )
}
