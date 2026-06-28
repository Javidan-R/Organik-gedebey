import { motion, AnimatePresence } from "framer-motion"
import { Leaf, Truck, Shield, Heart, Award, Zap, Sparkles, ChevronDown } from "lucide-react"
import { useState } from "react"

export function TrustAndUSPStrip() {
  const [expanded, setExpanded] = useState<number | null>(null)

  const items = [
    {
      icon: Leaf, label: "100% Təbii", text: "Heç bir kimyəvi qatqı yoxdur",
      detail: "Bütün məhsullarımız sertifikatlı üzvi fermerlərdən gəlir. Heç bir süni rəng, ləzzət artırıcı və ya konservant istifadə edilmir.",
      color: "emerald", emoji: "🌿",
    },
    {
      icon: Truck, label: "Sürətli Çatdırılma", text: "Bakı içi 24 saatda",
      detail: "Səhər verilən sifarişlər eyni gün, axşam verilənlər sabah çatdırılır. Real vaxt izlənmə SMS ilə göndərilir.",
      color: "blue", emoji: "🚚",
    },
    {
      icon: Shield, label: "Keyfiyyət Zəmanəti", text: "100% geri qaytarma",
      detail: "Məhsuldan narazısınızsa, çatdırılmadan sonra 24 saat ərzində bildirin. Tam geri ödəmə və ya dəyişmə zəmanəti.",
      color: "purple", emoji: "🛡️",
    },
    {
      icon: Heart, label: "Ailə üçün güvənli", text: "Uşaqlar da sıyaya bilər",
      detail: "Bütün məhsullar sağlamlıq standartlarına uyğun yoxlanılır. Uşaqlar, hamilələr və yaşlılar üçün tamamilə güvənlidir.",
      color: "rose", emoji: "❤️",
    },
    {
      icon: Award, label: "Sertifikatlı Kənd", text: "Gədəbəy orjinallığı",
      detail: "Məhsullarımız Gədəbəy rayonunun dağ kəndlərindən gəlir. Hər məhsulun mənşəyi izlənilir və sənədləşdirilir.",
      color: "amber", emoji: "🏅",
    },
    {
      icon: Zap, label: "Ekspress Sifariş", text: "60 saniyədə tamamla",
      detail: "Sadələşdirilmiş ödəniş axını ilə sifariş vermək çox asandır. Yaddaşda saxlanılan ünvan və ödəniş üsulu.",
      color: "teal", emoji: "⚡",
    },
  ]

  return (
    <section className="space-y-3">
      <div className="flex items-center gap-2 mb-2">
        <Sparkles className="w-4 h-4 text-emerald-600" />
        <p className="text-xs font-black text-slate-700 uppercase tracking-wider">Niyə bizi seçirlər?</p>
      </div>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {items.map((item, i) => {
          const isOpen = expanded === i
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, y: 14 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setExpanded(isOpen ? null : i)}
              className={`relative rounded-2xl border-2 p-4 cursor-pointer transition-all duration-300 overflow-hidden ${
                isOpen
                  ? `border-${item.color}-300 bg-${item.color}-50 shadow-lg`
                  : `border-slate-100 bg-white hover:border-${item.color}-200 hover:shadow-md`
              }`}
            >
              {/* Glow on active */}
              <AnimatePresence>
                {isOpen && (
                  <motion.div
                    initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                    className={`absolute inset-0 bg-${item.color}-100/30 pointer-events-none`}
                  />
                )}
              </AnimatePresence>

              <div className="relative flex flex-col gap-2.5">
                <div className="flex items-start justify-between">
                  <motion.div
                    animate={isOpen ? { scale: 1.1, rotate: 5 } : { scale: 1, rotate: 0 }}
                    className={`h-10 w-10 rounded-xl bg-${item.color}-100 flex items-center justify-center`}
                  >
                    <item.icon className={`w-5 h-5 text-${item.color}-600`} />
                  </motion.div>
                  <span className="text-xl">{item.emoji}</span>
                </div>

                <div>
                  <p className="text-xs font-black text-slate-800">{item.label}</p>
                  <p className="text-[10px] text-slate-500 mt-0.5">{item.text}</p>
                </div>

                <AnimatePresence>
                  {isOpen && (
                    <motion.p
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className={`text-[11px] text-${item.color}-700 leading-relaxed border-t border-${item.color}-200 pt-2 overflow-hidden`}
                    >
                      {item.detail}
                    </motion.p>
                  )}
                </AnimatePresence>

                <motion.div animate={{ rotate: isOpen ? 180 : 0 }} className="self-end">
                  <ChevronDown className={`w-3.5 h-3.5 text-${item.color}-400`} />
                </motion.div>
              </div>
            </motion.div>
          )
        })}
      </div>
    </section>
  )
}