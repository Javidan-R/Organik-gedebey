import { motion } from "framer-motion";
import { CheckCircle2, Share2, ChevronRight } from "lucide-react";
import { useState } from "react";

export function SectionBlock({
  id, title, subtitle, href, badge, children, accent = "emerald",
}: {
  id: string; title: string; subtitle?: string; href?: string
  badge?: string; children: React.ReactNode; accent?: string
}) {
  const [shared, setShared] = useState(false)

  const handleShare = async () => {
    if (typeof window === "undefined") return
    const url = `${window.location.origin}${href ?? ""}#${id}`
    if (navigator.share) {
      await navigator.share({ title, url }).catch(() => {})
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {})
    }
    setShared(true)
    setTimeout(() => setShared(false), 2000)
  }
 
  return (
    <motion.section
      id={id}
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{ duration: 0.45 }}
      className="space-y-4"
    >
      <div className="flex items-end justify-between gap-3">
        <div className="space-y-1.5">
          {badge && (
            <motion.span
              initial={{ scale: 0, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ type: "spring", stiffness: 200 }}
              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-${accent}-100 text-${accent}-700 text-[10px] font-black uppercase tracking-wide`}
            >
              {badge}
            </motion.span>
          )}
          <h2 className="text-lg font-black text-slate-800 leading-tight">{title}</h2>
          {subtitle && (
            <p className="text-xs text-slate-500 leading-relaxed max-w-sm">{subtitle}</p>
          )}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Share section */}
          <motion.button
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.92 }}
            onClick={handleShare}
            className="h-8 w-8 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-emerald-600 hover:border-emerald-300 transition-colors shadow-sm"
          >
            {shared ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <Share2 className="w-3.5 h-3.5" />}
          </motion.button>

          {href && (
            <motion.a
              href={href}
              whileHover={{ x: 3 }}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-600 hover:text-emerald-800 transition-colors whitespace-nowrap"
            >
              Hamısı <ChevronRight className="w-4 h-4" />
            </motion.a>
          )}
        </div>
      </div>

      {children}
    </motion.section>
  )
}