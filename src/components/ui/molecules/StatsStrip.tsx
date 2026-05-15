import { motion } from "framer-motion";
import { Package, CheckCircle2, Star, Users } from "lucide-react";
import { AnimatedCounter } from "./AnimatedCounter";

export function StatsStrip({ totalProducts, totalOrders, avgRating }: {
  totalProducts: number; totalOrders: number; avgRating: number
}) {
  const stats = [
    {
      label: "Kənd məhsulu",
      value: totalProducts,
      suffix: "+",
      icon: Package,
      color: "emerald",
      bg: "from-emerald-50 to-teal-50",
      border: "border-emerald-100",
      emoji: "📦",
      trend: "+12 bu həftə",
    },
    {
      label: "Sifariş tamamlandı",
      value: totalOrders,
      suffix: "+",
      icon: CheckCircle2,
      color: "blue",
      bg: "from-blue-50 to-indigo-50",
      border: "border-blue-100",
      emoji: "✅",
      trend: "+28 bu həftə",
    },
    {
      label: "Ortalama reytinq",
      value: Math.round((avgRating || 5) * 10),
      suffix: "",
      display: `${(avgRating || 5).toFixed(1)} ⭐`,
      icon: Star,
      color: "amber",
      bg: "from-amber-50 to-orange-50",
      border: "border-amber-100",
      emoji: "⭐",
      trend: "98% məmnuniyyət",
    },
    {
      label: "Aktiv müştəri",
      value: 247,
      suffix: "+",
      icon: Users,
      color: "purple",
      bg: "from-purple-50 to-violet-50",
      border: "border-purple-100",
      emoji: "👥",
      trend: "+18 bu ay",
    },
  ]

  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
      {stats.map((s, i) => (
        <motion.div
          key={s.label}
          initial={{ opacity: 0, y: 20, scale: 0.93 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{ delay: i * 0.1, type: "spring", stiffness: 110 }}
          whileHover={{ y: -5, scale: 1.02 }}
          className={`flex flex-col items-center gap-2 rounded-2xl bg-gradient-to-br ${s.bg} border ${s.border} px-3 py-5 shadow-sm text-center relative overflow-hidden`}
        >
          {/* Ambient circle */}
          <div className={`absolute -right-4 -top-4 w-16 h-16 rounded-full bg-${s.color}-200/30 blur-xl`} />

          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5, delay: i * 0.5 }}
            className="text-2xl"
          >
            {s.emoji}
          </motion.div>

          <motion.span className={`text-2xl font-black text-${s.color}-700`}>
            {s.display ? (
              <span>{s.display}</span>
            ) : (
              <><AnimatedCounter target={s.value} />{s.suffix}</>
            )}
          </motion.span>

          <span className="text-[11px] text-slate-500 font-semibold leading-tight">{s.label}</span>

          <motion.span
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 + 0.5 }}
            className={`text-[10px] font-bold text-${s.color}-600 bg-${s.color}-100 px-2 py-0.5 rounded-full`}
          >
            {s.trend}
          </motion.span>
        </motion.div>
      ))}
    </div>
  )
}