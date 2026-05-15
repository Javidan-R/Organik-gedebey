import { motion, AnimatePresence } from "framer-motion"
import { X } from "lucide-react"
import { useState, useEffect } from "react"
import { useLocalStorageState } from "./ReferralStrip"

export function TopBarnBanner() {
  const [dismissed, setDismissed] = useLocalStorageState("og-banner-dismissed", false)
  const [idx, setIdx] = useState(0)

  const offers = [
    { emoji: "🐄", text: "Bakı Metrosu ətrafı", bold: "30 AZN üzəri sifarişə pulsuz çatdırılma", badge: null },
    { emoji: "🎁", text: "İlk sifarişinizə", bold: "10% endirim – kupon: ORGANIC10", badge: "YENİ" },
    { emoji: "🚀", text: "Bu həftə ver,", bold: "növbəti həftə çatdırılma garantisi", badge: null },
    { emoji: "⭐", text: "Müştəri xalına görə", bold: "VIP üzvlər 15% əlavə endirim qazanır", badge: "VIP" },
  ]

  useEffect(() => {
    const id = setInterval(() => setIdx(prev => (prev + 1) % offers.length), 4500)
    return () => clearInterval(id)
  }, [offers.length])

  if (dismissed) return null

  const offer = offers[idx]

  return (
    <motion.section
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-[#fffbea] via-[#fffdf5] to-[#fdf6e3] shadow-[0_6px_28px_rgba(180,120,30,0.14)]"
    >
      {/* Shimmer sweep */}
      <motion.div
        animate={{ x: ["-100%", "200%"] }}
        transition={{ repeat: Infinity, duration: 3, ease: "linear", repeatDelay: 2 }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
      />

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        {/* Left: offer content */}
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <motion.span
            key={idx}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="text-2xl shrink-0"
          >
            {offer.emoji}
          </motion.span>

          <div className="flex-1 overflow-hidden h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={idx}
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -22, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="text-[11px] text-[#5b3d12] whitespace-nowrap truncate"
              >
                {offer.text}{" "}
                <span className="font-black text-[#8c5a16]">{offer.bold}</span>
                {offer.badge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black">
                    {offer.badge}
                  </span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        {/* Right: dots + controls */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="flex gap-1 items-center">
            {offers.map((_, i) => (
              <motion.button
                key={i}
                onClick={() => setIdx(i)}
                animate={{ scale: i === idx ? 1 : 0.8 }}
                className={`h-1.5 rounded-full transition-all ${i === idx ? "w-4 bg-amber-600" : "w-1.5 bg-amber-300"}`}
              />
            ))}
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-amber-400 hover:text-amber-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.section>
  )
}