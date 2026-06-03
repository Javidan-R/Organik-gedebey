// ===================================================
// ORGANIK GƏDƏBƏY – ULTRA PREMIUM MOLECULES v3
// 30+ Yeni Funksionallıq | Zəngin Animasiyalar
// ===================================================

"use client"

import { Category } from "@/lib/types"
import { Product } from "@/types/products"
import {
  motion, AnimatePresence, useScroll, useTransform,
  useMotionValue, useSpring, useInView
} from "framer-motion"
import {
  Carrot, ShoppingBasket, Truck, CreditCard, UtensilsCrossed,
  FlameKindling, ChevronRight, Leaf, MapPin, Star, Sparkles,
  Package, ArrowRight, Quote, Heart, Shield, Clock, Award,
  Zap, CheckCircle2, MessageCircle, Users, Gift, Bell,
  Send, Play, Pause, Volume2, VolumeX, ChevronUp, ChevronDown,
  ChevronLeft, RefreshCw, Share2, ExternalLink, Eye, Info,
  Thermometer, Droplets, Wind, Sun, Moon, Coffee, Sunset,
  BarChart3, TrendingUp, Percent, Tag, AlertCircle, X,
  Maximize2, Minimize2, Filter, SlidersHorizontal, Search,
  BookOpen, Lightbulb, Beaker, Layers, Grid, List,
  Phone, Mail, Instagram, Youtube, Twitter, Globe,
  Timer, Scale, ArrowUpRight, Flame, Bookmark, ThumbsUp,
  ThumbsDown, RotateCcw, Camera, Image as ImageIcon,
  Wheat, Apple, Egg, Milk, Salad, Cookie, Soup, TreePine
} from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import {
  useState, useRef, useEffect, useCallback,
  useMemo, useReducer, memo
} from "react"
import { formatCurrency, getProductBasePrice, getFirstImageUrl } from "@/app/(storefront)/page"

/* ================================================================ */
/*                     SHARED UTILITIES                            */
/* ================================================================ */



function useCountdown(endsAt: number) {
  const [secs, setSecs] = useState(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)))
  useEffect(() => {
    const id = setInterval(() => setSecs(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [])
  const h = Math.floor(secs / 3600)
  const m = Math.floor((secs % 3600) / 60)
  const s = secs % 60
  return { h, m, s, secs, fmt: `${String(h).padStart(2,"0")}:${String(m).padStart(2,"0")}:${String(s).padStart(2,"0")}` }
}

/* ================================================================ */
/* 1. CATEGORY STRIP – filterable + animated count badge           */
/* ================================================================ */

export function CategoryStrip({ categories }: { categories: Category[] }) {
  const [activeId, setActiveId] = useState<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)
  const [showLeft, setShowLeft] = useState(false)
  const [showRight, setShowRight] = useState(true)

  const visible = useMemo(() =>
    categories.filter(c => !c.archived).slice(0, 18),
    [categories]
  )

  const checkScroll = useCallback(() => {
    const el = scrollRef.current
    if (!el) return
    setShowLeft(el.scrollLeft > 8)
    setShowRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 8)
  }, [])

  useEffect(() => {
    const el = scrollRef.current
    if (!el) return
    el.addEventListener("scroll", checkScroll, { passive: true })
    checkScroll()
    return () => el.removeEventListener("scroll", checkScroll)
  }, [checkScroll, visible])

  const slide = (dir: "left" | "right") =>
    scrollRef.current?.scrollBy({ left: dir === "right" ? 220 : -220, behavior: "smooth" })

  if (!visible.length) return null

  const ICONS: Record<string, React.ElementType> = {
    "bal": Sparkles, "pendir": Milk, "qaymaq": Milk, "meyvə": Apple,
    "tərəvəz": Leaf, "yumurta": Egg, "taxıl": Wheat, "ağ pendir": Salad,
  }

  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 15, -10, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-600 shadow-md"
          >
            <Carrot className="h-4 w-4 text-white" />
          </motion.div>
          <div>
            <p className="text-xs font-black text-[#375638] uppercase tracking-wider">Kənd Kateqoriyaları</p>
            <p className="text-[10px] text-slate-400">{visible.length} kateqoriya mövcuddur</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Scroll controls */}
          {[{ dir: "left" as const, show: showLeft, Icon: ChevronLeft }, { dir: "right" as const, show: showRight, Icon: ChevronRight }].map(({ dir, show, Icon }) => (
            <motion.button
              key={dir}
              animate={{ opacity: show ? 1 : 0.3 }}
              whileHover={show ? { scale: 1.1 } : {}}
              whileTap={show ? { scale: 0.9 } : {}}
              onClick={() => show && slide(dir)}
              className="h-7 w-7 rounded-full bg-white border border-emerald-100 shadow-sm flex items-center justify-center text-emerald-600"
            >
              <Icon className="w-3.5 h-3.5" />
            </motion.button>
          ))}
          <motion.a href="/categories" whileHover={{ x: 2 }}
            className="text-xs font-bold text-emerald-600 hover:text-emerald-800 flex items-center gap-1 transition-colors"
          >
            Hamısı <ArrowRight className="w-3 h-3" />
          </motion.a>
        </div>
      </div>

      <div className="relative">
        {/* Edge fade gradients */}
        <AnimatePresence>
          {showLeft && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute left-0 top-0 bottom-3 w-10 bg-gradient-to-r from-[#f3f9e7] to-transparent z-10 pointer-events-none" />
          )}
        </AnimatePresence>
        <AnimatePresence>
          {showRight && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="absolute right-0 top-0 bottom-3 w-10 bg-gradient-to-l from-[#f3f9e7] to-transparent z-10 pointer-events-none" />
          )}
        </AnimatePresence>

        <div ref={scrollRef} className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pt-1 scroll-smooth">
          {visible.map((c, i) => {
            const isActive = activeId === c.id
            const CatIcon = Object.entries(ICONS).find(([k]) => c.name.toLowerCase().includes(k))?.[1]

            return (
              <motion.a
                href={`/category/${c.slug}`}
                key={c.id}
                initial={{ opacity: 0, y: 14, scale: 0.93 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: Math.min(i * 0.055, 0.5), type: "spring", stiffness: 130, damping: 15 }}
                whileHover={{ y: -6, scale: 1.04 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => setActiveId(isActive ? null : c.id)}
                className={`group relative min-w-[118px] rounded-2xl border p-3 flex flex-col items-center text-center cursor-pointer transition-all duration-300 ${
                  isActive
                    ? "border-emerald-400 bg-gradient-to-b from-emerald-50 to-lime-100 shadow-lg shadow-emerald-100"
                    : "border-emerald-100/80 bg-gradient-to-b from-white via-emerald-50/30 to-lime-50 shadow-sm hover:shadow-xl hover:border-emerald-300"
                }`}
              >
                {/* Active indicator */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      initial={{ scaleX: 0 }} animate={{ scaleX: 1 }} exit={{ scaleX: 0 }}
                      className="absolute top-0 inset-x-0 h-0.5 bg-gradient-to-r from-emerald-400 to-lime-400 rounded-t-2xl origin-left"
                    />
                  )}
                </AnimatePresence>

                {/* Image container */}
                <div className="relative w-14 h-14 mb-2.5">
                  <motion.div
                    animate={isActive ? { scale: 1.08 } : { scale: 1 }}
                    className="absolute inset-0 rounded-2xl bg-gradient-to-br from-emerald-100 to-lime-100 group-hover:from-emerald-200 group-hover:to-lime-200 transition-colors"
                  />
                  {c.image ? (
                    <Image src={c.image} alt={c.name} fill className="rounded-xl object-cover group-hover:scale-110 transition-transform duration-400 relative z-10" />
                  ) : CatIcon ? (
                    <div className="absolute inset-0 flex items-center justify-center z-10">
                      <CatIcon className="w-7 h-7 text-emerald-600" />
                    </div>
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center z-10 text-2xl">🌿</div>
                  )}

                  {/* Product count badge */}
                  {(c._count?.products ?? 0) > 0 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-emerald-600 text-white text-[9px] font-black flex items-center justify-center shadow-md z-20"
                    >
                      {c._count!.products > 99 ? "99+" : c._count!.products}
                    </motion.div>
                  )}
                </div>

                <p className="text-xs font-bold text-emerald-900 leading-tight line-clamp-1">{c.name}</p>

                {/* Hover reveal */}
                <motion.p
                  initial={{ opacity: 0, height: 0 }}
                  animate={isActive ? { opacity: 1, height: "auto" } : { opacity: 0, height: 0 }}
                  className="text-[10px] text-emerald-600 font-semibold mt-1 overflow-hidden"
                >
                  {c._count?.products ?? 0} məhsul →
                </motion.p>
              </motion.a>
            )
          })}
        </div>
      </div>

      {/* Active category highlight bar */}
      <AnimatePresence>
        {activeId && (() => {
          const cat = visible.find(c => c.id === activeId)
          if (!cat) return null
          return (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="flex items-center justify-between rounded-2xl bg-emerald-600 px-4 py-2.5 text-white"
            >
              <p className="text-xs font-bold">{cat.name} kateqoriyasına bax</p>
              <motion.a
                href={`/category/${cat.slug}`}
                whileHover={{ x: 3 }}
                className="text-xs font-black flex items-center gap-1 underline underline-offset-2"
              >
                Məhsullara keç <ArrowRight className="w-3.5 h-3.5" />
              </motion.a>
            </motion.div>
          )
        })()}
      </AnimatePresence>
    </section>
  )
}

/* ================================================================ */
/* 2. HOW IT WORKS – interactive step-by-step + video modal        */
/* ================================================================ */

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

/* ================================================================ */
/* 3. NUTRITION & TIPS – tabbed, searchable, visual macros         */
/* ================================================================ */

type NutrTab = "tips" | "nutrition" | "allergens" | "recipes"

export function NutritionAndTipsStrip({ products }: { products: Product[] }) {
  const [activeTab, setActiveTab] = useState<NutrTab>("tips")
  const [search, setSearch] = useState("")
  const [expandedId, setExpandedId] = useState<string | null>(null)

  const enriched = useMemo(() =>
    products.filter(p => !p.archived && (
      p.nutritionalFacts?.length || p.usageTips?.length || p.benefits?.length || p.allergens?.length
    )),
    [products]
  )

  const filtered = useMemo(() => {
    if (!search) return enriched.slice(0, 6)
    return enriched
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .slice(0, 6)
  }, [enriched, search])

  if (!enriched.length) return null

  const tabs: { key: NutrTab; label: string; icon: React.ElementType; color: string }[] = [
    { key: "tips", label: "İstifadə", icon: Lightbulb, color: "amber" },
    { key: "nutrition", label: "Qidalanma", icon: BarChart3, color: "emerald" },
    { key: "allergens", label: "Allergenlər", icon: AlertCircle, color: "rose" },
    { key: "recipes", label: "Reseptlər", icon: BookOpen, color: "blue" },
  ]

  const MacroBar = ({ label, value, color, unit = "g" }: { label: string; value: number; color: string; unit?: string }) => (
    <div className="space-y-1">
      <div className="flex justify-between text-[10px] font-semibold">
        <span className="text-slate-600">{label}</span>
        <span className={`text-${color}-700`}>{value}{unit}</span>
      </div>
      <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          whileInView={{ width: `${Math.min(100, (value / 50) * 100)}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: "easeOut" }}
          className={`h-full rounded-full bg-${color}-400`}
        />
      </div>
    </div>
  )

  return (
    <section className="rounded-3xl border border-slate-100 bg-white/98 shadow-sm overflow-hidden">
      <div className="p-5 md:p-6 space-y-4">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center shadow-lg">
              <UtensilsCrossed className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">Qidalanma & Məsləhətlər</p>
              <p className="text-[11px] text-slate-400">{enriched.length} məhsul üzrə məlumat</p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Məhsul axtar..."
              className="w-full pl-8 pr-3 py-2 rounded-xl border border-slate-200 text-[11px] outline-none focus:border-emerald-400 bg-slate-50 focus:bg-white transition-colors"
            />
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 overflow-x-auto no-scrollbar">
          {tabs.map(tab => (
            <motion.button
              key={tab.key}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                activeTab === tab.key
                  ? `bg-${tab.color}-600 text-white border-${tab.color}-600 shadow-md`
                  : `border-slate-200 text-slate-600 hover:border-${tab.color}-300 bg-white`
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              {tab.label}
            </motion.button>
          ))}
        </div>

        {/* Tab content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeTab === "tips" && (
              <div className="space-y-2.5">
                {filtered.map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -12 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.06 }}
                    onClick={() => setExpandedId(expandedId === p.id ? null : p.id)}
                    className="rounded-2xl border border-emerald-100 bg-gradient-to-r from-emerald-50/60 to-lime-50/40 p-3 cursor-pointer hover:border-emerald-300 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                        <img src={getFirstImageUrl(p)} alt={p.name} className="w-full h-full object-cover" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[12px] font-black text-slate-800 truncate">{p.name}</p>
                        {p.usageTips?.[0] && (
                          <p className="text-[11px] text-slate-500 truncate">{p.usageTips[0]}</p>
                        )}
                      </div>
                      <motion.div animate={{ rotate: expandedId === p.id ? 180 : 0 }}>
                        <ChevronDown className="w-4 h-4 text-slate-400" />
                      </motion.div>
                    </div>

                    <AnimatePresence>
                      {expandedId === p.id && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3 space-y-2 border-t border-emerald-100 pt-3 overflow-hidden"
                        >
                          {p.usageTips?.map((tip, ti) => (
                            <div key={ti} className="flex items-start gap-2 text-[11px] text-slate-600">
                              <Lightbulb className="w-3.5 h-3.5 text-amber-500 mt-0.5 shrink-0" />
                              {tip}
                            </div>
                          ))}
                          {p.benefits?.map((b, bi) => (
                            <div key={bi} className="flex items-start gap-2 text-[11px] text-slate-600">
                              <Leaf className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                              {b}
                            </div>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                ))}
              </div>
            )}

            {activeTab === "nutrition" && (
              <div className="grid gap-3 md:grid-cols-2">
                {filtered.filter(p => p.nutritionalFacts?.length).slice(0, 4).map((p, i) => {
                  const facts = p.nutritionalFacts ?? []
                  return (
                    <motion.div
                      key={p.id}
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: i * 0.08 }}
                      className="rounded-2xl border border-slate-100 bg-white p-4 space-y-3 shadow-sm"
                    >
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-100">
                          <img src={getFirstImageUrl(p)} alt={p.name} className="w-full h-full object-cover" />
                        </div>
                        <p className="text-[12px] font-black text-slate-800 truncate">{p.name}</p>
                      </div>
                      <div className="space-y-2">
                        {facts.slice(0, 4).map((f: any, fi: number) => {
                          const colors = ["emerald", "blue", "amber", "rose"]
                          return (
                            <MacroBar
                              key={fi}
                              label={f.label ?? f.name}
                              value={parseFloat(f.value ?? f.amount ?? "0")}
                              unit={f.unit ?? "g"}
                              color={colors[fi % colors.length]}
                            />
                          )
                        })}
                      </div>
                    </motion.div>
                  )
                })}
                {filtered.filter(p => p.nutritionalFacts?.length).length === 0 && (
                  <div className="col-span-2 text-center py-8 text-slate-400 text-sm">
                    <BarChart3 className="w-10 h-10 mx-auto mb-2 opacity-30" />
                    Bu məhsullar üçün qidalanma məlumatı yoxdur
                  </div>
                )}
              </div>
            )}

            {activeTab === "allergens" && (
              <div className="space-y-2.5">
                <div className="rounded-2xl bg-rose-50 border border-rose-200 p-3 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-rose-700">
                    Allergenləriniz varsa, hər məhsulun tərkibini diqqətlə yoxlayın.
                    Suallar üçün bizimlə əlaqə saxlayın.
                  </p>
                </div>
                {filtered.filter(p => p.allergens?.length).map((p, i) => (
                  <motion.div
                    key={p.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.07 }}
                    className="flex items-start gap-3 rounded-2xl border border-slate-100 bg-white p-3"
                  >
                    <div className="w-10 h-10 rounded-xl overflow-hidden bg-slate-100 shrink-0">
                      <img src={getFirstImageUrl(p)} alt={p.name} className="w-full h-full object-cover" />
                    </div>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-slate-800">{p.name}</p>
                      <div className="flex flex-wrap gap-1.5 mt-1.5">
                        {p.allergens?.map((a: string, ai: number) => (
                          <span key={ai} className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[10px] font-semibold">
                            {a}
                          </span>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
                {filtered.filter(p => p.allergens?.length).length === 0 && (
                  <div className="text-center py-8 text-slate-400 text-sm">
                    <CheckCircle2 className="w-10 h-10 mx-auto mb-2 opacity-30 text-emerald-500" />
                    <p>Bu məhsullar üçün allergen məlumatı qeyd edilməyib</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "recipes" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-blue-50 border border-blue-200 p-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-600 shrink-0" />
                  <p className="text-[11px] text-blue-700 font-semibold">
                    Kənd məhsullarımızla hazırlanmış sadə ev reseptləri
                  </p>
                </div>
                {[
                  { name: "Ev balı ilə çay", time: "5 dəq", difficulty: "Asan", emoji: "🍵", ingredients: ["Gədəbəy balı", "Yaşıl çay", "Limon"] },
                  { name: "Qaymaqla qoğal", time: "30 dəq", difficulty: "Orta", emoji: "🥐", ingredients: ["Kənd qaymağı", "Un", "Yumurta", "Duz"] },
                  { name: "Pendir salatı", time: "10 dəq", difficulty: "Asan", emoji: "🥗", ingredients: ["Kənd pendiri", "Pomidor", "Xiyar", "Zeytun yağı"] },
                ].map((recipe, i) => (
                  <motion.div
                    key={recipe.name}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-3 hover:border-blue-200 transition-colors cursor-pointer"
                  >
                    <span className="text-3xl shrink-0">{recipe.emoji}</span>
                    <div className="flex-1">
                      <p className="text-[12px] font-bold text-slate-800">{recipe.name}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[10px] text-slate-500">
                          <Clock className="w-3 h-3" /> {recipe.time}
                        </span>
                        <span className={`text-[10px] font-semibold ${recipe.difficulty === "Asan" ? "text-emerald-600" : "text-amber-600"}`}>
                          {recipe.difficulty}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1 mt-1.5">
                        {recipe.ingredients.map(ing => (
                          <span key={ing} className="px-1.5 py-0.5 rounded-md bg-slate-100 text-[9px] text-slate-600 font-medium">{ing}</span>
                        ))}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-300" />
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* General tip callout */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="flex items-start gap-3 rounded-2xl bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 p-4"
        >
          <FlameKindling className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div>
            <p className="text-xs font-black text-amber-800 mb-1">Sağlam qidalanma tövsiyəsi</p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Kənd məhsullarını həftəlik rasionunuza daxil etmək üçün kiçik addımlarla başlayın –
              səhər balı, günorta ev pendiri, axşam qaymaq. Böyük fərq hiss edəcəksiniz!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  )
}


/* ================================================================ */
/* 4. ORGANIC BACKGROUND DECOR – richer multi-layer               */
/* ================================================================ */

export function OrganicBackgroundDecor() {
  return (
    <>
      {/* Main blobs */}
      <motion.div
        animate={{ scale: [1, 1.2, 1], opacity: [0.45, 0.65, 0.45], x: [0, 20, 0] }}
        transition={{ repeat: Infinity, duration: 9, ease: "easeInOut" }}
        className="pointer-events-none fixed -left-32 -top-32 z-0 h-80 w-80 rounded-full bg-lime-200/50 blur-3xl"
      />
      <motion.div
        animate={{ scale: [1, 1.25, 1], opacity: [0.35, 0.55, 0.35], y: [0, 15, 0] }}
        transition={{ repeat: Infinity, duration: 11, ease: "easeInOut", delay: 1 }}
        className="pointer-events-none fixed -right-16 top-48 z-0 h-60 w-60 rounded-full bg-amber-200/50 blur-3xl"
      />
      <motion.div
        animate={{ y: [0, -25, 0], opacity: [0.4, 0.6, 0.4] }}
        transition={{ repeat: Infinity, duration: 13, ease: "easeInOut", delay: 2 }}
        className="pointer-events-none fixed bottom-[-80px] left-1/2 z-0 h-72 w-[520px] -translate-x-1/2 rounded-[260px] bg-gradient-to-r from-lime-200/45 via-amber-100/55 to-emerald-200/45 blur-3xl"
      />
      {/* Secondary small blobs */}
      <motion.div
        animate={{ x: [0, 30, 0], opacity: [0.2, 0.35, 0.2] }}
        transition={{ repeat: Infinity, duration: 15, ease: "easeInOut" }}
        className="pointer-events-none fixed top-1/3 left-1/4 z-0 h-32 w-32 rounded-full bg-emerald-300/30 blur-2xl"
      />
      <motion.div
        animate={{ y: [0, -20, 0], opacity: [0.15, 0.3, 0.15] }}
        transition={{ repeat: Infinity, duration: 10, ease: "easeInOut", delay: 3 }}
        className="pointer-events-none fixed top-2/3 right-1/4 z-0 h-24 w-24 rounded-full bg-teal-300/25 blur-xl"
      />
      {/* Paper texture overlay */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[url('/textures/paper-grain.png')] opacity-[0.055] mix-blend-soft-light" />
      {/* Subtle vignette */}
      <div className="pointer-events-none fixed inset-0 z-0 bg-[radial-gradient(ellipse_at_center,_transparent_60%,_rgba(0,30,0,0.04)_100%)]" />
    </>
  )
}

/* ================================================================ */
/* 5. ORGANIC SEPARATOR – seasonal variants                        */
/* ================================================================ */

type SeparatorVariant = "default" | "spring" | "autumn" | "winter"

export function OrganicSeparator({ small, variant = "default" }: { small?: boolean; variant?: SeparatorVariant }) {
  const emojis: Record<SeparatorVariant, string> = {
    default: "🌱", spring: "🌸", autumn: "🍂", winter: "❄️"
  }
  const emoji = emojis[variant]

  return (
    <div className="flex justify-center">
      <div className={`flex items-center gap-2 ${small ? "my-2" : "my-3"}`}>
        <motion.div
          animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
          className={`h-px ${small ? "w-24" : "w-32"} bg-gradient-to-r from-transparent via-lime-300 to-transparent`}
        />
        <motion.span
          animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 0.95, 1] }}
          transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
          className={`inline-flex items-center justify-center rounded-full bg-white shadow-md ring-1 ring-lime-100 ${
            small ? "h-6 w-6 text-sm" : "h-9 w-9 text-xl"
          }`}
        >
          {emoji}
        </motion.span>
        <motion.div
          animate={{ scaleX: [0.6, 1, 0.6], opacity: [0.4, 0.8, 0.4] }}
          transition={{ repeat: Infinity, duration: 4, ease: "easeInOut", delay: 2 }}
          className={`h-px ${small ? "w-24" : "w-32"} bg-gradient-to-r from-transparent via-lime-300 to-transparent`}
        />
      </div>
    </div>
  )
}

/* ================================================================ */
/* 6. PRODUCT CAROUSEL – keyboard nav + drag + dots               */
/* ================================================================ */



/* ================================================================ */
/* 7. TOP BARN BANNER – multi-offer rotating + dismissable         */
/* ================================================================ */


/* ================================================================ */
/* 8. STATS STRIP – animated counters + micro charts              */
/* ================================================================ */


/* ================================================================ */
/* 9. SECTION BLOCK – rich header with progress + share           */
/* ================================================================ */


/* ================================================================ */
/* 10. TRUST & USP STRIP – expandable + animated icons            */
/* ================================================================ */




/* ================================================================ */
/* 12. STORY STRIP – parallax + video + milestones               */
/* ================================================================ */



/* ================================================================ */
/* 13. REFERRAL STRIP – gamified with progress bar + share link   */
/* ================================================================ */


/* ================================================================ */
/* 14. WHATSAPP CTA – rich card with business hours + quick msgs  */
/* ================================================================ */

