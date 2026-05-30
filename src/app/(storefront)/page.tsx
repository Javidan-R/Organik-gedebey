'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { ArrowRight } from 'lucide-react'
import dynamic from 'next/dynamic'

import { Product, useApp } from '@/lib/store'
import { finalPrice } from '@/lib/calc'
import { applyProductFilter } from '@/lib/filter'
import {
  OrganicBackgroundDecor,
  TopBarnBanner,
  CategoryStrip,
  SectionBlock,
  TrustAndUSPStrip,
  StoryStrip,
  RecentViewedStrip,
  TestimonialStrip,
  WhatsAppCTA,
  HowItWorksStrip,
  NutritionAndTipsStrip,
  OrganicSeparator,
  ProductCarousel,
} from '@/components/ui/molecules'
import { HeroSection, ProductGrid } from '@/components/ui/organisms'
import {
  DEFAULT_CURRENCY,
  MOCK_NOTIFICATIONS,
  MAX_DISPLAYED_ITEMS,
  GEDEBEY_REGION_VARIANTS,
  MAX_POPULAR_ITEMS,
  MINIMUM_REVIEWS_FOR_MUST_TRY,
} from '@/const'
import { useCountdownTimer } from '@/hooks/useCountdownTimer'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useRecentViewed } from '@/hooks/useRecentViewed'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useTimeOfDay } from '@/hooks/useTimeOfDay'
import { useWeather } from '@/hooks/useWeather'
import { useWishlist } from '@/hooks/useWishlist'
import { NotificationItem } from '@/types/home'
import {
  getProductBasePrice,
  calculateProductRating,
  scoreProduct,
  filterProductsByRegion,
  filterBreakfastProducts,
} from '@/utils/storefront_home'
import { FreshTodayStoryBar } from '@/components/ui/molecules/FreshTodayStoryBar'
import { FreshTodayStoryModal } from '@/components/ui/molecules/FreshTodayStoryModal'
import { ScrollProgressBar } from '@/components/shared/ScrollProgressBar'
import { SkeletonLoader } from '@/components/shared/SkeletonLoader'
import { MobileSearchDrawer } from '@/components/ui/molecules/MobileSearchDrawer'

const SeasonBanner = dynamic(
  () => import('@/components/ui/molecules/SeasonBanner').then(mod => mod.SeasonBanner),
  { ssr: false }
)
const WeatherSuggestionStrip = dynamic(
  () => import('@/components/ui/molecules/WeatherSuggestionStrip').then(mod => mod.WeatherSuggestionStrip),
  { ssr: false }
)
import { FlashDealCard } from '@/components/ui/molecules/FlashDealCard'
import { HowItWorksModal } from '@/components/ui/molecules/HowItWorksModal'

const EnhancedHomePage: FC = () => {
  const products = useApp((state) => state.products || [])
  const categories = useApp((state) => state.categories || [])
  const orders = useApp((state) => state.orders || [])
  const addToCart = useApp((state) => state.addToCart)
  const cartTotal = useApp((state) => state.cartTotal)
  const storefrontConfig = useApp((state) => state.storefrontConfig)

  const [storyOpen, setStoryOpen] = useState(false)
  const [storyStartIndex, setStoryStartIndex] = useState(0)
  const currency = storefrontConfig?.currency ?? DEFAULT_CURRENCY

  // HowItWorks modal üçün
  const [showHowItWorks, setShowHowItWorks] = useState(false)
  const [hasSeenHowItWorks] = useLocalStorage('how-it-works-seen', false)

  // İlk dəfə gələndə modalı göstər
  useEffect(() => {
    if (!hasSeenHowItWorks) {
      const timer = setTimeout(() => setShowHowItWorks(true), 2000)
      return () => clearTimeout(timer)
    }
  }, [hasSeenHowItWorks])

  const [recentViewed, addToRecent] = useRecentViewed(products)
  const [wishlist, addToWishlist, removeFromWishlist, isInWishlist] = useWishlist()
  const timeOfDay = useTimeOfDay()
  const [secondsLeft, formatTimer] = useCountdownTimer()
  const isMobile = useIsMobile()
  const weather = useWeather()
  const [scrollVisible, scrollToTop] = useScrollToTop()

  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'recommended' | 'new' | 'popular'>('recommended')

  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    await new Promise((resolve) => setTimeout(resolve, 1500))
    setIsLoading(false)
  }, [])

  const isRefreshing = usePullToRefresh(handleRefresh)
  const unreadCount = useMemo(() => notifications.filter((n) => !n.read).length, [notifications])

  const kpiMetrics = useMemo(() => {
    const active = products.filter((p) => !p.archived)
    const avgRating =
      active.length > 0
        ? active.reduce((sum, p) => sum + calculateProductRating(p), 0) / active.length
        : 0
    return { totalProducts: active.length, totalOrders: orders.length, avgRating }
  }, [products, orders])

  const productCollections = useMemo(() => {
    const active = products.filter((p) => !p.archived)
    const viewedIds = recentViewed.map((p) => p.id)

    return {
      featuredCategories: categories
        .filter((c) => c.featured && !c.archived)
        .slice(0, MAX_DISPLAYED_ITEMS),
      recommended: [...active]
        .sort((a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist))
        .slice(0, MAX_DISPLAYED_ITEMS),
      newArrivals: applyProductFilter(active, { onlyNew: true, sort: 'new' }).slice(0, MAX_DISPLAYED_ITEMS),
      discounted: applyProductFilter(active, { onlyDiscounted: true, sort: 'price-desc' }).slice(0, MAX_DISPLAYED_ITEMS),
      gedebeyProducts: filterProductsByRegion(active, GEDEBEY_REGION_VARIANTS).slice(0, MAX_DISPLAYED_ITEMS),
      popular: [...active]
        .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
        .slice(0, MAX_POPULAR_ITEMS),
      mustTry: active
        .filter(
          (p) =>
            p.statusTags?.includes('mustTry') ||
            p.statusTags?.includes('bestValue') ||
            (p.reviews?.length ?? 0) >= MINIMUM_REVIEWS_FOR_MUST_TRY,
        )
        .slice(0, MAX_DISPLAYED_ITEMS),
      breakfastPicks: filterBreakfastProducts(active).slice(0, MAX_DISPLAYED_ITEMS),
      wishlistProducts: active.filter((p) => wishlist.includes(p.id)).slice(0, MAX_DISPLAYED_ITEMS),
      seasonal: active.filter((p) => p.statusTags?.includes('seasonal')).slice(0, MAX_DISPLAYED_ITEMS),
    }
  }, [products, categories, recentViewed, wishlist])

  const heroHighlighted = useMemo((): Product | null => {
    if (!products.length) return null
    const viewedIds = recentViewed.map((p) => p.id)
    return (
      [...products.filter((p) => !p.archived)].sort(
        (a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist),
      )[0] ?? null
    )
  }, [products, recentViewed, wishlist])

  const flashDeal = useMemo(() => {
    const product = productCollections.discounted[0]
    if (!product) return null
    const base = getProductBasePrice(product)
    const deal = finalPrice(base, product.discountType, product.discountValue)
    return {
      product,
      dealPrice: deal,
      endsAt: Date.now() + 3 * 60 * 60 * 1000,
      sold: 47,
      total: 80,
    }
  }, [productCollections.discounted])

  const tabProducts = useMemo(
    () => ({
      recommended: productCollections.recommended,
      new: productCollections.newArrivals,
      popular: productCollections.popular.slice(0, MAX_DISPLAYED_ITEMS),
    }),
    [productCollections],
  )

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-[#f3f9e7] via-[#fdfaf3] to-[#eef7ea]">
      <ScrollProgressBar />
      <OrganicBackgroundDecor />

      <MobileSearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-36 pt-6 md:gap-10 md:px-6 lg:px-10">
        <TopBarnBanner />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SeasonBanner />
          <WeatherSuggestionStrip weather={weather} />
        </div>

        <HeroSection
          featuredCats={productCollections.featuredCategories}
          highlighted={heroHighlighted}
          allProducts={products}
        />
        <OrganicSeparator />

        <SectionBlock id="fresh-today" title="" subtitle="" badge="">
          <FreshTodayStoryBar onOpenStory={(idx) => { setStoryStartIndex(idx); setStoryOpen(true) }} />
        </SectionBlock>
        <FreshTodayStoryModal open={storyOpen} initialIndex={storyStartIndex} onClose={() => setStoryOpen(false)} />

        <CategoryStrip categories={categories} />

        {flashDeal && (
          <SectionBlock id="flash-deal" title="⚡ Anlıq Fırsat" subtitle="Məhdud vaxtlı premium deal" badge="🔥 HOT">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FlashDealCard {...flashDeal} />
              <div className="flex flex-col gap-3 justify-center">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gədəbəy kənd məhsullarında anlıq endirim – bu qiymət yalnız sayaç sıfırlanana qədər etibarlıdır. Stok
                  məhduddur!
                </p>
                <motion.a
                  href="/products?discounted=true"
                  whileHover={{ scale: 1.02, x: 4 }}
                  className="flex items-center gap-2 text-emerald-700 font-bold text-sm"
                >
                  Bütün endirimlərə bax <ArrowRight className="w-4 h-4" />
                </motion.a>
              </div>
            </div>
          </SectionBlock>
        )}

        <SectionBlock id="tabbed" title="Məhsul Seçimlər" subtitle="Kateqoriyaya görə gözdən keçir" badge="✨ Smart">
          <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
            {[
              { key: 'recommended', label: '🤖 Sənin üçün', count: tabProducts.recommended.length },
              { key: 'new', label: '🧺 Yeni gələnlər', count: tabProducts.new.length },
              { key: 'popular', label: '❤️ Populyar', count: tabProducts.popular.length },
            ].map(({ key, label, count }) => (
              <motion.button
                key={key}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => setActiveTab(key as typeof activeTab)}
                className={`shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-semibold transition-all ${
                  activeTab === key
                    ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                    : 'bg-white text-slate-600 border border-slate-200 hover:border-emerald-300'
                }`}
              >
                {label}
                <span
                  className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-white/20' : 'bg-slate-100'}`}
                >
                  {count}
                </span>
              </motion.button>
            ))}
          </div>
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
            >
              {isLoading ? (
                <SkeletonLoader />
              ) : (
                <ProductGrid products={tabProducts[activeTab]} currency={currency} addToCart={addToCart} variant="highlight" />
              )}
            </motion.div>
          </AnimatePresence>
        </SectionBlock>

        <AnimatePresence>
          {productCollections.wishlistProducts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionBlock id="wishlist" title="💝 Bəyəndiklərin" subtitle="Sevimli məhsulların" href="/wishlist">
                <ProductGrid products={productCollections.wishlistProducts} currency={currency} addToCart={addToCart} variant="highlight" />
              </SectionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        <SectionBlock id="must-try" title="Mütləq dadılmalı" subtitle="Müştərilərin ən çox tövsiyə etdiyi dadlar" href="/products?tag=mustTry" badge="💚 Favoritlər">
          <ProductGrid products={productCollections.mustTry} currency={currency} addToCart={addToCart} variant="highlight" />
        </SectionBlock>

        <OrganicSeparator small />

        <SectionBlock id="discounted" title="⚡ Flash Endirim" subtitle="Məhdud sayda, bu gün üçün xüsusi qiymətlər" href="/products?discounted=true" badge="🔥 Bitir">
          <ProductGrid products={productCollections.discounted} currency={currency} addToCart={addToCart} variant="discount" />
        </SectionBlock>

        <SectionBlock id="breakfast" title="Səhər süfrəsi" subtitle="Bal, qaymaq, pendir – nənə süfrəsi dadı" href="/products?tag=səhər%20yeməyi" badge="🌅 Breakfast">
          <ProductGrid products={productCollections.breakfastPicks} currency={currency} addToCart={addToCart} variant="breakfast" />
        </SectionBlock>

        <SectionBlock id="gedebey" title="Gədəbəy eksklüziv" subtitle="Dağ kəndlərindən birbaşa süfrənizə" href="/category/gedebey" badge="⛰️ Dağ kəndi">
          <ProductGrid products={productCollections.gedebeyProducts} currency={currency} addToCart={addToCart} variant="gedebey" />
        </SectionBlock>

        <TrustAndUSPStrip />
        <StoryStrip />

        <SectionBlock id="popular" title="Ən çox sevilənlər" subtitle="Hər həftə təkrar sifariş edilən dadlar" href="/products?sort=popular">
          <ProductCarousel products={productCollections.popular} currency={currency} addToCart={addToCart} />
        </SectionBlock>

        {recentViewed.length > 0 && (
          <RecentViewedStrip products={recentViewed} currency={currency} addToCart={addToCart} />
        )}

        <NutritionAndTipsStrip products={products} />

        <TestimonialStrip />
        <WhatsAppCTA />
        <HowItWorksStrip onLearnMore={() => setShowHowItWorks(true)} />
      </div>

      {/* Modallar */}
      <FreshTodayStoryModal open={storyOpen} initialIndex={storyStartIndex} onClose={() => setStoryOpen(false)} />
      <HowItWorksModal open={showHowItWorks} onClose={() => setShowHowItWorks(false)} />
    </main>
  )
}

export default EnhancedHomePage