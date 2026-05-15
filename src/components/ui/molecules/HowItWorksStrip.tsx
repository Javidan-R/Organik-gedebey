import { motion, AnimatePresence } from "framer-motion"
import { ShoppingBasket, Truck, CreditCard, CheckCircle2, Zap, ChevronDown, Shield, ArrowRight } from "lucide-react"
import { useState } from "react"

export function HowItWorksStrip() {
  const [activeStep, setActiveStep] = useState<number | null>(null)
  const [showVideo, setShowVideo] = useState(false)
  const [completed, setCompleted] = useState<Set<number>>(new Set())

  const steps = [
    {
      icon: ShoppingBasket, emoji: "🛒", step: 1,
      title: "Məhsulu seç",
      short: "Kataloqdan seçimini et",
      text: "200+ kənd məhsulu içindən süfrənə uyğun olanı seç. Filterlər, reyting və müştəri rəylərindən istifadə edərək ən yaxşı seçimi tap. Gün ərzindən istədiyin vaxt sifariş vermək mümkündür.",
      tips: ["Kateqoriya filterlərindən istifadə et", "Reytinq 4.5+ olan məhsullara üstünlük ver", "Kampaniyalı məhsulları qaçırma"],
      color: "from-emerald-100 via-teal-50 to-emerald-50",
      accent: "emerald",
      iconColor: "text-emerald-700",
      iconBg: "bg-emerald-600",
    },
    {
      icon: Truck, emoji: "🚚", step: 2,
      title: "Çatdırılmanı planla",
      short: "Vaxtı və ünvanı seç",
      text: "Bakı Metrosu ətrafına pulsuz çatdırılma, digər ərazilərə sərfəli qiymət. Çatdırılma intervalını seç: səhər (08-12), gündüz (12-17) və ya axşam (17-21). Sifarişi real vaxtda izlə.",
      tips: ["30 AZN üzəri sifarişə pulsuz çatdırılma", "Vaxtlı çatdırılma garantisi", "SMS ilə izləmə linki göndərilir"],
      color: "from-blue-100 via-indigo-50 to-blue-50",
      accent: "blue",
      iconColor: "text-blue-700",
      iconBg: "bg-blue-600",
    },
    {
      icon: CreditCard, emoji: "💳", step: 3,
      title: "Rahat ödəniş et",
      short: "4 ödəniş üsulu",
      text: "Qapıda nağd, POS terminal, öncədən bank köçürməsi və ya online ödəniş. Hər üsul təhlükəsiz və sürətlidir. Əlavə komissiya yoxdur.",
      tips: ["Qapıda nağd – əlavə xərc yoxdur", "Visa / Mastercard POS terminal", "Online köçürmə – IBAN ilə"],
      color: "from-amber-100 via-orange-50 to-amber-50",
      accent: "amber",
      iconColor: "text-amber-700",
      iconBg: "bg-amber-600",
    },
    {
      icon: CheckCircle2, emoji: "✅", step: 4,
      title: "Zövq al!",
      short: "Keyfiyyətə zəmanət",
      text: "Məhsullar təzə, sağlam və ləzzətlidir. Əgər hər hansı bir narazılıq olarsa, 24 saat ərzində geri qaytarma zəmanəti veririk. Müştəri məmnuniyyəti bizim prioritetimizdir.",
      tips: ["24 saat geri qaytarma zəmanəti", "100% keyfiyyət zəmanəti", "Növbəti sifarişə bonus xal"],
      color: "from-purple-100 via-violet-50 to-purple-50",
      accent: "purple",
      iconColor: "text-purple-700",
      iconBg: "bg-purple-600",
    },
  ]

  const handleStepClick = (stepNum: number) => {
    setActiveStep(prev => prev === stepNum ? null : stepNum)
    setCompleted(prev => new Set([...prev, stepNum]))
  }

  return (
    <section className="rounded-3xl border border-slate-100 bg-white/98 shadow-sm overflow-hidden relative">
      {/* Ambient background */}
      <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/40 via-transparent to-lime-50/30 pointer-events-none" />
      <motion.div
        animate={{ opacity: [0.03, 0.06, 0.03] }}
        transition={{ repeat: Infinity, duration: 6 }}
        className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-emerald-300/10 via-transparent to-transparent pointer-events-none"
      />

      <div className="relative p-5 md:p-7">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="h-10 w-10 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg"
            >
              <Zap className="h-5 w-5 text-white" />
            </motion.div>
            <div>
              <p className="text-sm font-black text-slate-800 uppercase tracking-wide">Necə işləyir?</p>
              <p className="text-[11px] text-slate-400">4 sadə addımda sifariş ver</p>
            </div>
          </div>

          {/* Progress indicator */}
          <div className="hidden md:flex items-center gap-2">
            {steps.map((_, i) => (
              <motion.div
                key={i}
                animate={completed.has(i + 1) ? { scale: [1, 1.3, 1] } : {}}
                transition={{ duration: 0.4 }}
                className={`h-2 rounded-full transition-all duration-500 ${
                  completed.has(i + 1) ? "w-6 bg-emerald-500" : "w-2 bg-slate-200"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Steps grid */}
        <div className="grid gap-3 md:grid-cols-4">
          {steps.map((s, i) => {
            const isActive = activeStep === s.step
            const isDone = completed.has(s.step)

            return (
              <motion.div
                key={s.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, type: "spring", stiffness: 100 }}
                onClick={() => handleStepClick(s.step)}
                className={`relative flex flex-col gap-2.5 rounded-2xl px-4 py-4 cursor-pointer border-2 transition-all duration-300 overflow-hidden ${
                  isActive
                    ? `bg-gradient-to-br ${s.color} border-${s.accent}-300 shadow-xl`
                    : `bg-gradient-to-br ${s.color} border-transparent hover:border-${s.accent}-200 shadow-inner hover:shadow-md`
                }`}
              >
                {/* Animated background blob */}
                <motion.div
                  animate={isActive ? { scale: 1.4, opacity: 0.15 } : { scale: 1, opacity: 0 }}
                  className={`absolute -right-6 -top-6 w-20 h-20 rounded-full bg-${s.accent}-400`}
                />

                {/* Step + done indicator */}
                <div className="flex items-center justify-between">
                  <motion.div
                    whileHover={{ scale: 1.08 }}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${s.iconBg} text-white shadow-md relative`}
                  >
                    {isDone ? <CheckCircle2 className="h-4 w-4" /> : <s.icon className="h-4 w-4" />}
                    {isDone && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full bg-emerald-500 flex items-center justify-center"
                      >
                        <CheckCircle2 className="w-2.5 h-2.5 text-white" />
                      </motion.div>
                    )}
                  </motion.div>
                  <span className="text-[11px] font-black text-slate-400">0{s.step}</span>
                </div>

                <span className="text-2xl">{s.emoji}</span>

                <div>
                  <p className="text-[13px] font-black text-slate-800">{s.title}</p>
                  <p className="text-[11px] text-slate-500 mt-0.5">{s.short}</p>
                </div>

                {/* Expandable content */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="space-y-2 overflow-hidden"
                    >
                      <p className="text-[11px] text-slate-600 leading-relaxed border-t border-white/60 pt-2">
                        {s.text}
                      </p>
                      <div className="space-y-1.5">
                        {s.tips.map((tip, ti) => (
                          <motion.div
                            key={ti}
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: ti * 0.08 }}
                            className="flex items-start gap-2 text-[10px] text-slate-700"
                          >
                            <CheckCircle2 className={`w-3 h-3 text-${s.accent}-600 mt-0.5 shrink-0`} />
                            {tip}
                          </motion.div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Expand indicator */}
                <motion.div
                  animate={{ rotate: isActive ? 180 : 0 }}
                  className="self-end"
                >
                  <ChevronDown className={`w-4 h-4 text-${s.accent}-400`} />
                </motion.div>
              </motion.div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-5 flex flex-col sm:flex-row items-center justify-between gap-3 rounded-2xl bg-gradient-to-r from-emerald-50 to-lime-50 border border-emerald-100 px-4 py-3"
        >
          <div className="flex items-center gap-2 text-xs text-emerald-800">
            <Shield className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold">Hər sifarişdə 100% zəmanət – məmnun olmassan, pulunu geri al.</span>
          </div>
          <motion.a
            href="/products"
            whileHover={{ scale: 1.04, x: 3 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-emerald-600 text-white text-xs font-black px-4 py-2.5 rounded-2xl shadow-lg whitespace-nowrap"
          >
            İndi sifariş ver <ArrowRight className="w-4 h-4" />
          </motion.a>
        </motion.div>
      </div>
    </section>
  )
}