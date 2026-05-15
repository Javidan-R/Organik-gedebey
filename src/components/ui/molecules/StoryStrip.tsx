import { useScroll, useTransform, motion } from "framer-motion"
import { TreePine, ArrowRight, ExternalLink } from "lucide-react"
import { useRef } from "react"



export function StoryStrip() {
  const ref = useRef<HTMLElement>(null)
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] })
  const y = useTransform(scrollYProgress, [0, 1], [30, -30])
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0])

  const milestones = [
    { year: "2019", text: "İlk çatdırılma – 3 ailə" },
    { year: "2021", text: "100+ daimi müştəri" },
    { year: "2023", text: "500+ sifariş aylıq" },
    { year: "2025", text: "Bakı + 3 şəhər" },
  ]

  return (
    <motion.section
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#162e18] via-[#1e3a21] to-[#152b17] p-6 text-white shadow-2xl md:p-8"
    >
      {/* Parallax background blobs */}
      <motion.div style={{ y }} className="absolute inset-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-72 h-72 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-56 h-56 rounded-full bg-lime-400/10 blur-2xl" />
        <div className="absolute top-1/2 left-1/3 w-32 h-32 rounded-full bg-teal-400/10 blur-xl" />
      </motion.div>

      {/* Decorative tree */}
      <div className="absolute right-6 top-6 opacity-10">
        <TreePine className="w-24 h-24 text-emerald-300" />
      </div>

      <motion.div style={{ opacity }} className="relative">
        <div className="flex items-center gap-2 mb-5">
          <motion.span
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 3 }}
            className="text-4xl"
          >
            ⛰️
          </motion.span>
          <div>
            <p className="text-[11px] text-emerald-400 uppercase tracking-widest font-bold">Bizim hekayə</p>
          </div>
        </div>

        <h2 className="text-2xl font-black mb-3 leading-tight">
          Gədəbəy dağlarından<br />
          <motion.span
            animate={{ color: ["#6ee7b7", "#a7f3d0", "#6ee7b7"] }}
            transition={{ repeat: Infinity, duration: 4 }}
          >
            süfrənizə birbaşa
          </motion.span>
        </h2>

        <p className="text-sm text-emerald-100/80 leading-relaxed mb-6 max-w-lg">
          2019-cu ildən bəri Gədəbəy & Gəncə kəndlərindən birbaşa Bakı ailələrinə çatdırılan
          100% təbii məhsullar. Heç bir kimyəvi qatqı, saxta dad yoxdur – yalnız
          dağ havasının verdiyi əsl kənd dadı.
        </p>

        {/* Milestones */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {milestones.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="rounded-2xl bg-white/8 border border-white/10 px-3 py-3 text-center"
            >
              <p className="text-lg font-black text-emerald-300">{m.year}</p>
              <p className="text-[11px] text-emerald-100/70 mt-0.5">{m.text}</p>
            </motion.div>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <motion.a
            href="/story"
            whileHover={{ scale: 1.04, x: 3 }}
            whileTap={{ scale: 0.97 }}
            className="flex items-center gap-2 bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-bold px-4 py-2.5 rounded-2xl hover:bg-emerald-500/30 transition-colors"
          >
            Tam hekayəni oxu <ArrowRight className="w-4 h-4" />
          </motion.a>
          <motion.a
            href="/about"
            whileHover={{ scale: 1.04 }}
            className="flex items-center gap-2 text-emerald-400 text-xs font-semibold"
          >
            Bizim haqqımızda <ExternalLink className="w-3 h-3" />
          </motion.a>
        </div>
      </motion.div>
    </motion.section>
  )
}
