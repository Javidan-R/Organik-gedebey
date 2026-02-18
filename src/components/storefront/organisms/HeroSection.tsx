// ===================================================
// HERO SECTION - Professional Auto Slider
// ===================================================

import { finalPrice } from "@/lib/store"
import { Category } from "@/lib/types"
import { Product } from "@/types/products"
import { useScroll, useTransform, motion, AnimatePresence } from "framer-motion"
import { Leaf, ShieldCheck, Truck, HeartHandshake, BadgePercent, ChevronLeft, ChevronRight } from "lucide-react"
import Link from "next/link"
import { useRef, useState, useEffect } from "react"
import Image from "next/image"
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/app/(storefront)/page"

interface HeroSectionProps {
  featuredCats: Category[]
  highlighted: Product | null
  allProducts?: Product[] // Bütün məhsullar buradan gəlir
}

export function HeroSection({
  featuredCats,
  highlighted,
  allProducts = [],
}: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ['start start', 'end start'],
  })

  const bgScale = useTransform(scrollYProgress, [0, 1], [1, 1.03])
  const [currentTime, setCurrentTime] = useState<'morning' | 'day' | 'evening'>('day')
  const [currentIndex, setCurrentIndex] = useState(0)
  const [direction, setDirection] = useState(0)

  // Endirimli məhsulları filter et (maksimum 5 məhsul)
  const discountedProducts = allProducts
    .filter(product => {
      const basePrice = getProductBasePrice(product)
      const price = finalPrice(basePrice, product.discountType, product.discountValue)
      return basePrice > price && basePrice > 0
    })
    .slice(0, 5)

  // Göstəriləcək məhsullar: endirimli varsa onlar, yoxsa highlighted
  const productsToShow = discountedProducts.length > 0 
    ? discountedProducts 
    : (highlighted ? [highlighted] : [])

  useEffect(() => {
    const hour = new Date().getHours()
    if (hour >= 5 && hour < 10) setCurrentTime('morning')
    else if (hour >= 10 && hour < 17) setCurrentTime('day')
    else setCurrentTime('evening')
  }, [])

  // Auto-rotate (4 saniyə interval)
  useEffect(() => {
    if (productsToShow.length <= 1) return

    const timer = setInterval(() => {
      setDirection(1)
      setCurrentIndex((prev) => (prev + 1) % productsToShow.length)
    }, 4000)

    return () => clearInterval(timer)
  }, [productsToShow.length])

  const timeBasedGradient = {
    morning: 'from-orange-50 via-yellow-50 to-green-50',
    day: 'from-green-50 via-emerald-50 to-lime-50',
    evening: 'from-amber-50 via-yellow-50 to-green-50',
  }

  // Current product data
  const currentProduct = productsToShow[currentIndex]
  const productImg = currentProduct ? getFirstImageUrl(currentProduct) : '/hero-basket.png'
  const productBase = currentProduct ? getProductBasePrice(currentProduct) : 0
  const productPrice = currentProduct
    ? finalPrice(productBase, currentProduct.discountType, currentProduct.discountValue)
    : 0
  const productDiscount =
    currentProduct && productBase > 0
      ? Math.max(0, Math.round((1 - productPrice / productBase) * 100))
      : null

  // Navigation handlers
  const goToNext = () => {
    setDirection(1)
    setCurrentIndex((prev) => (prev + 1) % productsToShow.length)
  }

  const goToPrev = () => {
    setDirection(-1)
    setCurrentIndex((prev) => (prev - 1 + productsToShow.length) % productsToShow.length)
  }

  const goToIndex = (index: number) => {
    setDirection(index > currentIndex ? 1 : -1)
    setCurrentIndex(index)
  }

  // Animation variants
  const slideVariants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.85,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.85,
    }),
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
        delayChildren: 0.15,
      },
    },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: 'easeOut' },
    },
  }

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${timeBasedGradient[currentTime]} shadow-lg md:rounded-3xl md:shadow-xl lg:rounded-4xl`}
    >
      {/* Background decoration */}
      <motion.div
        style={{ scale: bgScale }}
        className="pointer-events-none absolute inset-0 opacity-30"
      >
        <div className="absolute -left-20 top-10 hidden h-64 w-64 rounded-full bg-gradient-to-br from-emerald-200/50 to-green-300/30 blur-3xl md:block" />
        <div className="absolute -right-20 bottom-10 hidden h-64 w-64 rounded-full bg-gradient-to-tr from-lime-200/50 to-amber-300/30 blur-3xl md:block" />
      </motion.div>

      <div className="relative grid gap-6 px-4 py-8 md:grid-cols-2 md:gap-8 md:px-8 md:py-10 lg:grid-cols-[1.3fr,1fr] lg:gap-12 lg:px-12 lg:py-14">
        {/* LEFT SIDE - Content */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col justify-center gap-4 md:gap-5"
        >
          {/* Badge */}
          <motion.div
            variants={itemVariants}
            className="inline-flex w-fit items-center gap-2 rounded-full bg-white/95 px-3 py-1.5 text-[10px] font-semibold text-emerald-800 shadow-md backdrop-blur-sm md:px-4 md:text-xs"
          >
            <Leaf className="h-3.5 w-3.5 text-emerald-600 md:h-4 md:w-4" />
            <span className="hidden sm:inline">Gədəbəy & Gəncə ailə təsərrüfatlarının məhsulları</span>
            <span className="sm:hidden">Gədəbəy təbii məhsulları</span>
          </motion.div>

          {/* Title */}
          <motion.h1
            variants={itemVariants}
            className="text-2xl font-bold leading-tight text-emerald-900 sm:text-3xl md:text-4xl lg:text-5xl"
          >
            <span className="block">Organik Gədəbəy</span>
            <span className="mt-1 block text-[0.85em] font-semibold text-emerald-700 sm:mt-2">
              təbii kənd məhsulları və ev dadı
            </span>
          </motion.h1>

          {/* Description */}
          <motion.p
            variants={itemVariants}
            className="text-sm leading-relaxed text-emerald-800/90 sm:text-base md:max-w-lg"
          >
            Kənd həyətindən birbaşa evinizə: 🍯 bal, 🧀 pendir, qaymaq, 🥬 təzə tərəvəz və 🍎 meyvələr. 
            <span className="mt-1 block font-medium text-emerald-700">
              Qoruyucu yox, qatqı yox – yalnız təbii kənd dadı 🌿
            </span>
          </motion.p>

          {/* Buttons */}
          <motion.div variants={itemVariants} className="flex flex-col gap-3 pt-2 sm:flex-row">
            <Link
              href="/products"
              className="group inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-5 py-3 text-sm font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 md:px-6 md:text-base"
            >
              🛒 Məhsullara bax
              <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/category/gedebey"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-white/95 px-5 py-3 text-sm font-semibold text-emerald-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:shadow-lg md:text-base"
            >
              ⛰️ Gədəbəy məhsulları
            </Link>
          </motion.div>

          {/* Features - Desktop */}
          <motion.div
            variants={containerVariants}
            className="mt-2 hidden flex-wrap gap-2 md:flex"
          >
            {[
              { icon: ShieldCheck, text: 'Təzə yığım' },
              { icon: Truck, text: 'Sürətli çatdırılma' },
              { icon: HeartHandshake, text: 'Qazi ailələri endirimi' },
            ].map((item, i) => (
              <motion.span
                key={i}
                variants={itemVariants}
                className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
              >
                <item.icon className="h-3.5 w-3.5 text-emerald-600" />
                <span>{item.text}</span>
              </motion.span>
            ))}
          </motion.div>

          {/* Features - Mobile */}
          <motion.div
            variants={itemVariants}
            className="mt-1 flex items-center gap-4 text-xs text-emerald-700 md:hidden"
          >
            <span className="flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5" />
              Təzə
            </span>
            <span className="flex items-center gap-1">
              <Truck className="h-3.5 w-3.5" />
              Sürətli
            </span>
            <span className="flex items-center gap-1">
              <HeartHandshake className="h-3.5 w-3.5" />
              Endirimlər
            </span>
          </motion.div>
        </motion.div>

        {/* RIGHT SIDE - Product Slider */}
        <div className="relative flex items-center justify-center">
          {productsToShow.length > 0 ? (
            <div className="relative w-full max-w-sm">
              {/* Navigation Arrows - Desktop */}
              {productsToShow.length > 1 && (
                <>
                  <button
                    onClick={goToPrev}
                    className="absolute -left-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 md:flex lg:-left-5"
                    aria-label="Əvvəlki məhsul"
                  >
                    <ChevronLeft className="h-5 w-5 text-emerald-700" />
                  </button>
                  <button
                    onClick={goToNext}
                    className="absolute -right-3 top-1/2 z-20 hidden -translate-y-1/2 rounded-full bg-white/95 p-2 shadow-lg backdrop-blur-sm transition-all hover:scale-110 hover:bg-white active:scale-95 md:flex lg:-right-5"
                    aria-label="Növbəti məhsul"
                  >
                    <ChevronRight className="h-5 w-5 text-emerald-700" />
                  </button>
                </>
              )}

              {/* Slider Container */}
              <div className="relative overflow-hidden">
                <AnimatePresence initial={false} custom={direction} mode="wait">
                  <motion.div
                    key={currentIndex}
                    custom={direction}
                    variants={slideVariants}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{
                      x: { type: 'spring', stiffness: 300, damping: 30 },
                      opacity: { duration: 0.2 },
                      scale: { duration: 0.2 },
                    }}
                    className="relative"
                  >
                    {/* Discount Badge */}
                    {productDiscount && productDiscount > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: 'spring', stiffness: 200, delay: 0.1 }}
                        className="absolute -right-2 -top-2 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-red-500 to-orange-500 shadow-lg md:-right-3 md:-top-3 md:h-16 md:w-16"
                      >
                        <span className="text-xl font-bold text-white md:text-2xl">
                          -{productDiscount}%
                        </span>
                      </motion.div>
                    )}

                    {/* Product Image */}
                    <div className="relative aspect-square w-full overflow-hidden rounded-2xl bg-white/90 p-4 shadow-xl backdrop-blur-sm md:rounded-3xl md:p-6">
                      <Image
                        src={productImg}
                        alt={currentProduct?.name || 'Məhsul'}
                        fill
                        className="object-contain"
                        priority
                      />
                    </div>

                    {/* Product Info Card */}
                    {currentProduct && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.15 }}
                        className="mt-4 rounded-xl bg-white/95 p-4 shadow-lg backdrop-blur-sm"
                      >
                        <h3 className="line-clamp-1 text-base font-bold text-emerald-900 md:text-lg">
                          {currentProduct.name}
                        </h3>
                        <div className="mt-2 flex items-baseline gap-2">
                          {productDiscount && productDiscount > 0 ? (
                            <>
                              <span className="text-xl font-bold text-emerald-600 md:text-2xl">
                                {formatCurrency(productPrice)}
                              </span>
                              <span className="text-sm text-gray-400 line-through">
                                {formatCurrency(productBase)}
                              </span>
                            </>
                          ) : (
                            <span className="text-xl font-bold text-emerald-600 md:text-2xl">
                              {formatCurrency(productPrice)}
                            </span>
                          )}
                        </div>
                        <Link
                          href={`/product/${currentProduct.id}`}
                          className="mt-3 inline-flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-emerald-500 to-teal-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg active:scale-[0.98]"
                        >
                          Ətraflı bax →
                        </Link>
                      </motion.div>
                    )}
                  </motion.div>
                </AnimatePresence>
              </div>

              {/* Dots Navigation */}
              {productsToShow.length > 1 && (
                <div className="mt-5 flex items-center justify-center gap-2">
                  {productsToShow.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => goToIndex(index)}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        index === currentIndex
                          ? 'w-8 bg-emerald-600'
                          : 'w-2 bg-emerald-300 hover:bg-emerald-400 hover:w-3'
                      }`}
                      aria-label={`${index + 1}-ci məhsula keç`}
                    />
                  ))}
                </div>
              )}

              {/* Discount Count Badge */}
              {discountedProducts.length > 1 && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 }}
                  className="mt-3 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-red-50 to-orange-50 px-3 py-1.5 text-xs font-semibold text-red-700 shadow-sm backdrop-blur-sm"
                >
                  <BadgePercent className="h-4 w-4" />
                  <span>{discountedProducts.length} endirimli məhsul</span>
                </motion.div>
              )}
            </div>
          ) : (
            // Default basket - məhsul yoxdursa
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ 
                opacity: 1, 
                scale: 1, 
                y: [0, -8, 0] 
              }}
              transition={{ 
                opacity: { duration: 0.5 },
                scale: { duration: 0.5 },
                y: { duration: 3, repeat: Infinity, ease: "easeInOut" }
              }}
              className="relative aspect-square w-full max-w-xs md:max-w-sm"
            >
              <Image
                src="/hero-basket.png"
                alt="Kənd məhsulları"
                fill
                className="object-contain drop-shadow-2xl"
                priority
              />
            </motion.div>
          )}
        </div>
      </div>
    </section>
  )
}