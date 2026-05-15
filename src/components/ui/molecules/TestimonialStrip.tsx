
/* ================================================================ */
/* 11. TESTIMONIAL STRIP – filterable by rating + helpful vote    */
/* ================================================================ */

import { AnimatePresence, motion } from "framer-motion"
import { Quote, Star, MapPin, ThumbsUp } from "lucide-react"
import { useState, useMemo } from "react"
import { useLocalStorageState } from "./ReferralStrip"

const ALL_TESTIMONIALS = [
  { id: "1", name: "Aytən M.", location: "Bakı, Nərimanov", text: "Gədəbəy balı həqiqətən inanılmazdır. Ailəmiz artıq hər həftə sifariş verir! Çatdırılma da çox sürətlidir.", rating: 5, avatar: "👩‍🦱", product: "Dağ balı", date: "3 gün əvvəl", helpful: 12 },
  { id: "2", name: "Elnur K.", location: "Sumqayıt", text: "Qaymaq o qədər təbiidir ki, nənəmin bişirdiyini xatırladır. Süni heç nə yoxdur, sağlam, ləzzətli.", rating: 5, avatar: "🧔", product: "Kənd qaymağı", date: "1 həftə əvvəl", helpful: 8 },
  { id: "3", name: "Günel S.", location: "Gəncə", text: "Çatdırılma çox sürətlidir, məhsullar həmişə təzədir. WhatsApp vasitəsilə sifariş vermək çox rahatdır.", rating: 5, avatar: "👩", product: "Kənd pendiri", date: "2 həftə əvvəl", helpful: 19 },
  { id: "4", name: "Rauf N.", location: "Bakı, Xətai", text: "Yumurtalar çox təzədir. Hər həftə 2 dəstə alıram. Qiymət-keyfiyyət nisbəti mükəmməldir.", rating: 4, avatar: "👨‍💼", product: "Kənd yumurtası", date: "3 həftə əvvəl", helpful: 6 },
  { id: "5", name: "Lalə H.", location: "Bakı, Yasamal", text: "Ev yağı əla keyfiyyətlidir. Uşaqlarım çörəyin üzünə sürtüb sevinclə yeyir. Çox sağlam!", rating: 5, avatar: "👩‍🦰", product: "Kənd yağı", date: "1 ay əvvəl", helpful: 14 },
]

export function TestimonialStrip() {
  const [filterRating, setFilterRating] = useState<number | null>(null)
  const [sortBy, setSortBy] = useState<"newest" | "helpful">("newest")
  const [helpfulVotes, setHelpfulVotes] = useLocalStorageState<Record<string, boolean>>("og-helpful", {})
  const [activeIdx, setActiveIdx] = useState(0)

  const filtered = useMemo(() => {
    let list = [...ALL_TESTIMONIALS]
    if (filterRating) list = list.filter(t => t.rating === filterRating)
    if (sortBy === "helpful") list.sort((a, b) => b.helpful - a.helpful)
    return list
  }, [filterRating, sortBy])

  const handleHelpful = (id: string) => {
    setHelpfulVotes(prev => ({ ...prev, [id]: !prev[id] }))
  }

  const avgRating = ALL_TESTIMONIALS.reduce((s, t) => s + t.rating, 0) / ALL_TESTIMONIALS.length

  return (
    <section className="rounded-3xl border border-emerald-100 bg-gradient-to-br from-emerald-50/60 via-white to-lime-50/40 p-5 shadow-sm overflow-hidden relative md:p-6">
      <div className="absolute top-4 right-4 text-emerald-100 pointer-events-none">
        <Quote className="w-20 h-20" />
      </div>

      {/* Header */}
      <div className="relative flex items-start justify-between gap-3 mb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(i => (
                <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
              ))}
            </div>
            <span className="text-sm font-black text-slate-800">{avgRating.toFixed(1)}</span>
            <span className="text-xs text-slate-400">({ALL_TESTIMONIALS.length} rəy)</span>
          </div>
          <p className="text-sm font-black text-slate-800">Müştəri Rəyləri</p>
        </div>

        {/* Sort */}
        <select
          value={sortBy}
          onChange={e => setSortBy(e.target.value as typeof sortBy)}
          className="text-[11px] border border-slate-200 rounded-xl px-2 py-1.5 bg-white outline-none text-slate-600 cursor-pointer"
        >
          <option value="newest">Ən yeni</option>
          <option value="helpful">Ən faydalı</option>
        </select>
      </div>

      {/* Rating filter */}
      <div className="flex gap-2 mb-4 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setFilterRating(null)}
          className={`flex-shrink-0 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
            !filterRating ? "bg-emerald-600 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"
          }`}
        >
          Hamısı ({ALL_TESTIMONIALS.length})
        </button>
        {[5, 4, 3].map(r => {
          const count = ALL_TESTIMONIALS.filter(t => t.rating === r).length
          if (!count) return null
          return (
            <button
              key={r}
              onClick={() => setFilterRating(filterRating === r ? null : r)}
              className={`flex-shrink-0 flex items-center gap-1 px-3 py-1.5 rounded-full text-[11px] font-bold transition-all ${
                filterRating === r ? "bg-amber-500 text-white shadow-md" : "bg-white border border-slate-200 text-slate-600"
              }`}
            >
              <Star className="w-3 h-3 fill-current" /> {r} ({count})
            </button>
          )
        })}
      </div>

      {/* Testimonials */}
      <div className="space-y-3">
        <AnimatePresence>
          {filtered.slice(0, 3).map((t, i) => (
            <motion.div
              key={t.id}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ delay: i * 0.08 }}
              className="rounded-2xl bg-white border border-slate-100 p-4 shadow-sm"
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl shrink-0">{t.avatar}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <div>
                      <span className="text-xs font-bold text-slate-800">{t.name}</span>
                      <span className="text-[10px] text-slate-400 ml-2 flex items-center gap-0.5 inline-flex">
                        <MapPin className="w-2.5 h-2.5" />{t.location}
                      </span>
                    </div>
                    <div className="flex shrink-0">
                      {[...Array(t.rating)].map((_, si) => (
                        <Star key={si} className="w-3 h-3 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                  </div>
                  <p className="text-[12px] text-slate-600 leading-relaxed mb-2">`{t.text}`</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-emerald-600 font-semibold bg-emerald-50 px-2 py-0.5 rounded-full">
                        {t.product}
                      </span>
                      <span className="text-[10px] text-slate-400">{t.date}</span>
                    </div>
                    <button
                      onClick={() => handleHelpful(t.id)}
                      className={`flex items-center gap-1 text-[10px] font-semibold transition-colors px-2 py-1 rounded-full ${
                        helpfulVotes[t.id]
                          ? "bg-emerald-100 text-emerald-700"
                          : "text-slate-400 hover:text-emerald-600 hover:bg-emerald-50"
                      }`}
                    >
                      <ThumbsUp className="w-3 h-3" />
                      Faydalı ({t.helpful + (helpfulVotes[t.id] ? 1 : 0)})
                    </button>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-8 text-slate-400">
          <Star className="w-8 h-8 mx-auto mb-2 opacity-30" />
          <p className="text-sm">Bu reytinq üçün rəy yoxdur</p>
        </div>
      )}

      {/* Write review CTA */}
      <motion.a
        href="/reviews/new"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-2xl border-2 border-dashed border-emerald-300 text-emerald-600 text-xs font-bold hover:bg-emerald-50 transition-colors"
      >
        <Star className="w-4 h-4" /> Siz də rəy yazın → 10 bonus xal qazanın
      </motion.a>
    </section>
  )
}