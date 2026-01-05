// ===================================================
// CATEGORY STRIP – kənd kateqoriyaları
// ===================================================

import { Category } from "@/lib/types"
import { motion } from "framer-motion"
import { Carrot } from "lucide-react"
import Image from "next/image"
export function CategoryStrip({ categories }: { categories: Category[] }) {


  const visible = categories.filter(c => !c.archived).slice(0, 16)
  if (!visible.length) return null

  return (
    <section className="mt-8 space-y-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[#375638]">
        <Carrot className="h-4 w-4 text-emerald-700" />
        <span>Kənd Kateqoriyaları</span>
      </div>

      <div className="no-scrollbar flex gap-3 overflow-x-auto pb-2 pt-1">
        {visible.map((c, i) => (
          <motion.a
            href={`/category/${c.slug}`}
            key={c.id}
            initial={{ opacity: 0, y: 8 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.05 }}
            className="group min-w-[130px] rounded-2xl bg-linear-to-br from-white to-emerald-50 border border-emerald-100 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all p-3 flex flex-col items-center text-center"
          >
            <div className="relative w-14 h-14 mb-2">
              <Image
                src={c.image || '/vegetable.png'}
                alt={c.name}
                fill
                className="rounded-xl object-cover group-hover:scale-105 transition"
              />
            </div>
            <p className="text-sm font-semibold text-emerald-900">{c.name}</p>
            <span className="text-[10px] text-gray-500">Kateqoriya</span>
          </motion.a>
        ))}
      </div>
    </section>
  )
}