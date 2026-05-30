import { motion } from "framer-motion"
import { FC } from "react"

// NEW: Season Banner
export const SeasonBanner: FC = () => {
  const month = new Date().getMonth()
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter'
  const config = {
    spring: { emoji: '🌸', label: 'Bahar məhsulları gəldi!', text: 'Təzə yığılmış bahar sebzə və meyvələr sifariş et', linear: 'from-pink-50 to-rose-50 border-rose-200' },
    summer: { emoji: '☀️', label: 'Yay məhsulları', text: 'İsti yayda serinlədici təbii içkilər & meyvələr', linear: 'from-amber-50 to-orange-50 border-orange-200' },
    autumn: { emoji: '🍂', label: 'Payız bolluğu', text: 'Sonbahar dadları – bal, alma, heyva & qaymaq', linear: 'from-orange-50 to-amber-50 border-amber-200' },
    winter: { emoji: '❄️', label: 'Qış ləzzətləri', text: 'Soyuq qışda isti tutan ev məhsulları', linear: 'from-blue-50 to-indigo-50 border-blue-200' },
  }
  const { emoji, label, text, linear } = config[season]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 rounded-2xl border bg-linear-to-r ${linear} px-4 py-3`}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-2xl shrink-0"
      >
        {emoji}
      </motion.span>
      <div>
        <p className="text-xs font-black text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">{text}</p>
      </div>
    </motion.div>
  )
}