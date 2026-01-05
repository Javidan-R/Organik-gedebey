// ===================================================
// NUTRITION & TIPS STRIP – usageTips / nutritionalFacts
// ===================================================

import { Product } from "@/types/products"
import { UtensilsCrossed, FlameKindling } from "lucide-react"

export  function NutritionAndTipsStrip({ products }: { products: Product[] }) {
  const withNutrition = products.filter(
    (p) => (p.nutritionalFacts && p.nutritionalFacts.length > 0) || p.usageTips?.length,
  )

  if (!withNutrition.length) return null

  const sample = withNutrition.slice(0, 3)

  return (
    <section className="grid gap-4 rounded-3xl border border-slate-100 bg-white/90 p-5 text-xs text-[#2d3f2f] shadow-sm md:grid-cols-[1.3fr,1.1fr] md:p-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-800">
          <UtensilsCrossed className="h-3.5 w-3.5" />
          <span>Kənd məhsulları ilə sadə serving fikirləri</span>
        </div>
        <p className="text-xs text-[#4c5e4c]">
          Hər məhsul yalnız “al, qoy rəfə” deyil – onu gündəlik menyuna necə daxil etməyi də
          düşünmüşük. Aşağıda bir neçə real məhsul üzrə qısa serving fikirləri var.
        </p>

        <div className="space-y-2">
          {sample.map((p) => (
            <div
              key={p.id}
              className="flex gap-2 rounded-2xl bg-emerald-50/60 px-3 py-2 text-[11px] text-[#28402b]"
            >
              <span className="mt-0.5 text-lg">🥣</span>
              <div className="space-y-1">
                <p className="text-[11px] font-semibold">{p.name}</p>
                {p.usageTips && p.usageTips.length > 0 && (
                  <p className="text-[11px] text-[#4e654f]">
                    <b>Necə istifadə etməli?</b> {p.usageTips[0]}
                  </p>
                )}
                {p.benefits && p.benefits.length > 0 && (
                  <p className="text-[11px] text-[#4e654f]">
                    <b>Faydası:</b> {p.benefits[0]}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="space-y-2 rounded-2xl bg-linear-to-br from-[#fff7e9] via-white to-[#ffeccd] p-4 text-[11px] text-[#5b4320] shadow-inner">
        <div className="flex items-center gap-2">
          <FlameKindling className="h-4 w-4 text-amber-700" />
          <p className="text-[12px] font-semibold">Qidalanma məlumatına niyə baxmağa dəyər?</p>
        </div>
        <p>
          Qidalanma dəyərləri (kalori, zülal, yağ və s.) məhsulu sadəcə “ləzzətli” yox, həm də
          sağlamlıq baxımından balanslaşdırmaq üçün kömək edir.
        </p>
        <ul className="mt-1 space-y-1 list-disc list-inside">
          <li>Uşaqlar üçün məhsul seçərkən şəkər və duz səviyyəsinə diqqət et.</li>
          <li>Protein və lif baxımından zəngin məhsulları gündəlik rasiona daxil etmək olar.</li>
          <li>Müəyyən allergenlər varsa, allergen bölməsinə nəzər sal.</li>
        </ul>
      </div>
    </section>
  )
}
