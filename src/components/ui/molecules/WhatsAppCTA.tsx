import { motion, AnimatePresence } from "framer-motion"
import { MessageCircle, ArrowRight, Phone } from "lucide-react"
import { useState } from "react"

export function WhatsAppCTA() {
  const [expanded, setExpanded] = useState(false)
  const now = new Date()
  const hour = now.getHours()
  const isOpen = hour >= 8 && hour < 22
  const nextOpen = isOpen ? null : (hour < 8 ? "Bu gün saat 08:00" : "Sabah saat 08:00")

  const quickMessages = [
    "Sifariş vermək istəyirəm",
    "Məhsul haqqında sual",
    "Çatdırılma vaxtını bilmək istəyirəm",
    "Geri qaytarma proseduru",
  ]

  return (
    <motion.section
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="overflow-hidden rounded-3xl shadow-xl"
    >
      {/* Main card */}
      <div className="relative bg-[#128C7E] p-5 text-white overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.3, 1], opacity: [0.15, 0.25, 0.15] }}
          transition={{ repeat: Infinity, duration: 5 }}
          className="absolute -right-8 -top-8 w-36 h-36 rounded-full bg-white/20 pointer-events-none"
        />
        <motion.div
          animate={{ scale: [1, 1.2, 1] }}
          transition={{ repeat: Infinity, duration: 7, delay: 1 }}
          className="absolute -left-4 bottom-0 w-24 h-24 rounded-full bg-[#25D366]/30 blur-xl pointer-events-none"
        />

        <div className="relative flex items-start gap-4">
          <motion.div
            animate={{ scale: [1, 1.08, 1] }}
            transition={{ repeat: Infinity, duration: 2.5 }}
            className="h-14 w-14 rounded-2xl bg-[#25D366] flex items-center justify-center shrink-0 shadow-lg"
          >
            <MessageCircle className="w-7 h-7 text-white" />
          </motion.div>

          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <p className="font-black text-base">WhatsApp ilə sifariş ver</p>
              {/* Online indicator */}
              <div className="flex items-center gap-1">
                <motion.div
                  animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className={`w-2 h-2 rounded-full ${isOpen ? "bg-[#25D366]" : "bg-orange-400"}`}
                />
                <span className="text-[10px] font-bold text-white/80">
                  {isOpen ? "İndi aktiv" : "Qapalı"}
                </span>
              </div>
            </div>
            <p className="text-xs text-white/75">+994 77 367 60 21 · 08:00–22:00, hər gün</p>
            {!isOpen && nextOpen && (
              <p className="text-xs text-orange-300 mt-0.5">Növbəti açılış: {nextOpen}</p>
            )}
          </div>

          <motion.button
            whileHover={{ rotate: 90 }}
            onClick={() => setExpanded(p => !p)}
            className="h-8 w-8 rounded-full bg-white/15 flex items-center justify-center text-white"
          >
            <motion.div animate={{ rotate: expanded ? 45 : 0 }}>
              <Plus className="w-4 h-4" />
            </motion.div>
          </motion.button>
        </div>

        {/* Quick message buttons */}
        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <p className="text-[11px] text-white/60 mt-4 mb-2 font-semibold">Sürətli mesaj seç:</p>
              <div className="flex flex-wrap gap-2">
                {quickMessages.map(msg => (
                  <motion.a
                    key={msg}
                    href={`https://wa.me/994773676021?text=${encodeURIComponent(msg)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    whileHover={{ scale: 1.04 }}
                    whileTap={{ scale: 0.97 }}
                    className="text-[11px] font-semibold px-3 py-1.5 rounded-full bg-white/15 hover:bg-white/25 transition-colors border border-white/20"
                  >
                    {msg}
                  </motion.a>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom action row */}
      <div className="flex">
        <motion.a
          href="https://wa.me/994773676021"
          target="_blank"
          rel="noopener noreferrer"
          whileHover={{ backgroundColor: "#20a37b" }}
          className="flex-1 flex items-center justify-center gap-2 bg-[#25D366] text-white text-sm font-black py-3.5"
        >
          <MessageCircle className="w-5 h-5" />
          WhatsApp aç
          <motion.div animate={{ x: [0, 4, 0] }} transition={{ repeat: Infinity, duration: 1.5 }}>
            <ArrowRight className="w-4 h-4" />
          </motion.div>
        </motion.a>
        <a
          href="tel:+994773676021"
          className="flex items-center justify-center gap-2 bg-[#0a6b58] text-white text-sm font-bold px-6 border-l border-white/20"
        >
          <Phone className="w-4 h-4" />
          Zəng
        </a>
      </div>
    </motion.section>
  )
}

// Missing import fix
const Plus = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
  </svg>
)

/* ================================================================ */
/* 15. RECENT VIEWED STRIP – with clear history                   */
/* ================================================================ */
