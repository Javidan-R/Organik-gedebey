// ===================================================
// HERO SECTION (Parallax + kənd həyəti hissi)
// ===================================================

import { finalPrice } from "@/lib/store"
import { Category } from "@/lib/types"
import { Product } from "@/types/products"
import { useScroll, useTransform, motion } from "framer-motion"
import { Leaf, Link, ShieldCheck, Truck, HeartHandshake, BadgePercent } from "lucide-react"
import { useRef } from "react"
import Image from "next/image"
import { getFirstImageUrl, getProductBasePrice, shortBenefit, formatCurrency } from "@/app/(storefront)/page"
import { FloatingFruit } from "../molecules"

export  function HeroSection({
  featuredCats,
  highlighted,
}: {
  featuredCats: Category[]
  highlighted: Product | null
}) {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const fruitY = useTransform(scrollYProgress, [0, 1], [0, 80])
  const leafY = useTransform(scrollYProgress, [0, 1], [0, -60])
  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.05])

  const highlightedImg = highlighted ? getFirstImageUrl(highlighted) : '/hero-basket.png'

  const highlightedBase = highlighted ? getProductBasePrice(highlighted) : 0
  const highlightedPrice = highlighted
    ? finalPrice(highlightedBase, highlighted.discountType, highlighted.discountValue)
    : 0
  const highlightedDiscount =
    highlighted && highlightedBase > 0
      ? Math.max(0, Math.round((1 - highlightedPrice / highlightedBase) * 100))
      : null

  return (
    <section
      ref={heroRef}
      className="relative z-10 overflow-hidden rounded-4xl border border-green-100 bg-linear-to-br from-[#e3f6d5] via-[#fdfbf5] to-[#d8f0b9] shadow-[0_24px_80px_rgba(16,83,19,0.18)]"
    >
      <motion.div
        style={{ scale: bgScale }}
        className="pointer-events-none absolute inset-0 opacity-70 mix-blend-multiply"
      >
        <div className="absolute -left-20 top-10 h-40 w-40 rounded-[40%_60%_65%_35%] bg-linear-to-br from-lime-200/80 to-emerald-300/60 blur-2xl" />
        <div className="absolute -right-16 bottom-10 h-40 w-40 rounded-[60%_40%_55%_45%] bg-linear-to-tr from-amber-200/80 to-orange-300/70 blur-2xl" />
      </motion.div>

      <div className="relative grid gap-10 px-6 py-8 md:grid-cols-[1.5fr,1.1fr] md:px-10 md:py-12 lg:px-14 lg:py-16">
        {/* LEFT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="flex flex-col justify-center gap-5"
        >
          <div className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-[11px] font-semibold text-emerald-800 shadow-sm ring-1 ring-emerald-100/70 backdrop-blur">
            <Leaf className="h-3.5 w-3.5 text-emerald-700" />
            <span>Gədəbəy & Gəncə ailə təsərrüfatlarının məhsulları</span>
          </div>

          <h1 className="text-balance text-3xl font-extrabold leading-tight text-[#102a15] sm:text-4xl md:text-5xl lg:text-[3.1rem]">
            Organik Gədəbəy
            <span className="block text-[1.07em] text-[#1a4f22]">
              təbii kənd məhsulları, meyvə-tərəvəz və ev dadı
            </span>
          </h1>

          <p className="max-w-xl text-sm text-[#35543c] sm:text-base">
            Kənd həyətindən birbaşa evinizə: bal, pendir, qaymaq, qatıq, təzə tərəvəz və
            meyvələr. Qoruyucu yox, qatqı yox – yalnız nənə reseptli kənd dadı. Sifarişi
            səbətə yığ, qalanını biz həll edək.
          </p>

          <div className="flex flex-wrap gap-3 pt-1">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 rounded-2xl bg-[#1e7a34] px-5 py-2.5 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(22,101,52,0.55)] transition hover:-translate-y-0.5 hover:bg-[#16652b]"
            >
              🛒 Məhsullara bax
              <span className="transition group-hover:translate-x-0.5">→</span>
            </Link>
            <Link
              href="/category/gedebey"
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-white/85 px-4 py-2.5 text-sm font-semibold text-[#1f4f23] shadow-md ring-1 ring-emerald-100/80 backdrop-blur hover:bg-white"
            >
              ⛰️ Yalnız Gədəbəy seçimləri
            </Link>
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[#305334]">
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 shadow-sm">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Günlük təzə yığım & soyuducu zənciri</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 shadow-sm">
              <Truck className="h-3.5 w-3.5 text-emerald-700" />
              <span>Gəncə daxilində gün ərzində 2 çatdırılma</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 shadow-sm">
              <HeartHandshake className="h-3.5 w-3.5 text-emerald-700" />
              <span>Qazi & şəhid ailələri üçün xüsusi yanaşma</span>
            </span>
          </div>

          {featuredCats.length > 0 && (
            <div className="mt-4 space-y-1.5">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-[#325237]">
                Populyar kənd bölmələri
              </p>
              <div className="flex flex-wrap gap-2">
                {featuredCats.map((c) => (
                  <Link
                    key={c.id}
                    href={`/category/${c.slug}`}
                    className="inline-flex items-center gap-2 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold text-[#1c4c24] shadow-sm ring-1 ring-lime-100 backdrop-blur hover:bg-lime-50"
                  >
                    <span className="text-sm">🥬</span>
                    <span>{c.name}</span>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        {/* RIGHT SIDE – kənd həyəti vizualı + highlighted məhsul */}
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
          className="relative h-[260px] sm:h-[320px] md:h-[360px] lg:h-[380px]"
        >
          {/* Ağ taxta masa fonu */}
          <motion.div
            style={{ y: fruitY }}
            className="absolute inset-4 rounded-[28px] bg-[url('/wood-light.jpg')] bg-cover bg-center shadow-xl"
          />

          {/* Meyvə səbəti / highlight məhsul şəkli */}
          <motion.div style={{ y: leafY }} className="absolute inset-0">
            <div className="relative mx-auto flex h-full max-w-sm items-end justify-center">
              <div className="relative h-[220px] w-[270px] sm:h-[250px] sm:w-[310px]">
                <Image
                  src={highlightedImg}
                  alt={highlighted?.name || 'Təbii meyvə-tərəvəz səbəti'}
                  fill
                  className="object-contain drop-shadow-[0_18px_35px_rgba(0,0,0,0.25)] rounded-[24px]"
                  priority
                />
              </div>
            </div>
          </motion.div>

          {/* Yarpaqlar */}
          <motion.div
            style={{ y: leafY }}
            className="pointer-events-none absolute -left-4 -top-4 h-20 w-20 rotate-[-10deg]"
          >
            <Image
              src="/leaf-1.png"
              alt="Yarpaq"
              fill
              className="object-contain opacity-80"
            />
          </motion.div>

          <motion.div
            style={{ y: fruitY }}
            className="pointer-events-none absolute -right-2 top-4 h-20 w-20 rotate-[14deg]"
          >
            <Image
              src="/leaf-2.png"
              alt="Yarpaq"
              fill
              className="object-contain opacity-70"
            />
          </motion.div>

          {/* Float edən kiçik meyvələr */}
          <motion.div
            className="pointer-events-none absolute bottom-4 left-4 flex gap-2"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <FloatingFruit emoji="🍎" delay={0.1} />
            <FloatingFruit emoji="🍊" delay={0.3} />
            <FloatingFruit emoji="🥕" delay={0.5} />
          </motion.div>

          {/* Highlight edilmiş məhsul üçün mini card */}
          {highlighted && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6, duration: 0.5 }}
              className="absolute bottom-4 right-4 w-[230px] rounded-2xl bg-white/95 p-3 text-[11px] text-[#234025] shadow-[0_18px_40px_rgba(0,0,0,0.25)] backdrop-blur"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-800">
                  <BadgePercent className="h-3 w-3" />
                  Bu həftənin seçilmiş kənd məhsulu
                </span>
                {highlightedDiscount !== null && highlightedDiscount > 0 && (
                  <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[10px] font-bold text-rose-700">
                    -{highlightedDiscount}%
                  </span>
                )}
              </div>
              <p className="mt-1.5 line-clamp-1 font-semibold text-[12px]">
                {highlighted.name}
              </p>
              {shortBenefit(highlighted) && (
                <p className="mt-0.5 line-clamp-2 text-[10px] text-[#627662]">
                  {shortBenefit(highlighted)}
                </p>
              )}
              <div className="mt-2 flex items-end justify-between">
                <div>
                  <p className="text-[12px] font-extrabold text-emerald-700">
                    {formatCurrency(highlightedPrice)}
                  </p>
                  {highlightedBase > highlightedPrice && (
                    <p className="text-[10px] text-gray-400 line-through">
                      {formatCurrency(highlightedBase)}
                    </p>
                  )}
                </div>
                <Link
                  href={`/products/${highlighted.slug || highlighted.id}`}
                  className="inline-flex items-center justify-center rounded-xl bg-emerald-600 px-3 py-1 text-[10px] font-semibold text-white hover:bg-emerald-700"
                >
                  Detala bax →
                </Link>
              </div>
            </motion.div>
          )}
        </motion.div>
      </div>
    </section>
  )
}