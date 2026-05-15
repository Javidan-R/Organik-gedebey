import { Product } from "@/types/products"
import { getFirstImageUrl } from "@/utils/storefront_home"
import { motion, AnimatePresence } from "framer-motion"
import { Lightbulb, BarChart3, AlertCircle, BookOpen, UtensilsCrossed, Search, ChevronDown, Leaf, CheckCircle2, Clock, ChevronRight, FlameKindling } from "lucide-react"
import { useState, useMemo } from "react"

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