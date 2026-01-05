// ===================================================
// TOP BARN / BANNER – pulsuz çatdırılma / 1-ci sifariş
// ===================================================

import { motion } from "framer-motion";

export  function TopBarnBanner() {
  return (
    <motion.section
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-2 rounded-3xl border border-amber-100 bg-linear-to-r from-[#fff2cf] via-[#fffaf0] to-[#f9f0da] px-4 py-2.5 text-xs text-[#5b3d12] shadow-[0_10px_26px_rgba(120,72,15,0.12)]"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/80 text-lg shadow-sm">
            🐄
          </span>
          <p className="text-[11px] sm:text-xs">
            <span className="font-semibold">Kənddən şəhərə birbaşa:</span> Bakı Merto ətrafı{' '}
            <span className="font-semibold text-[#8c5a16]">
              30 AZN üzəri sifarişə pulsuz çatdırılma
            </span>
            .
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-white/80 px-3 py-1 text-[11px] font-semibold shadow-sm">
            🎁 20 azn keçən 1-ci sifarişə -10% kampaniyası aktivdir
          </span>
        </div>
      </div>
    </motion.section>
  )
}