'use client'

import { useMemo, useState, useEffect, useCallback, useRef } from 'react'
import type { FC } from 'react'

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
  ReferralStrip, 
  WhatsAppCTA, 
  HowItWorksStrip, 
  MobileBottomBar, 
  NutritionAndTipsStrip, 
  OrganicSeparator, 
  ProductCarousel, 
  StatsStrip 
} from '@/components/storefront/molecules'

import { DynamicPromoStrip, HeroSection, ProductGrid } from '@/components/storefront/organisms'

// ===================================================
// TYPE DEFINITIONS
// ===================================================

interface ProductBadge {
  label: string
  tone: 'green' | 'amber' | 'rose' | 'blue'
}

interface ProductScore {
  product: Product
  score: number
}

type TimeOfDay = 'morning' | 'day' | 'evening'

// ===================================================
// CONSTANTS
// ===================================================

const DAYS_7_IN_MS = 7 * 24 * 60 * 60 * 1000
const DEFAULT_CURRENCY = 'AZN'
const RECENT_PRODUCTS_STORAGE_KEY = 'og-recent-products'
const MAX_DISPLAYED_ITEMS = 8
const MAX_POPULAR_ITEMS = 10
const MAX_BADGES = 3
const MINIMUM_REVIEWS_FOR_MUST_TRY = 3

const PRODUCT_SCORING_WEIGHTS = {
  DISCOUNT: 0.5,
  RATING: 4,
  ORGANIC: 8,
  MUST_TRY: 12,
  NEW_PRODUCT: 3,
} as const

const GEDEBEY_REGION_VARIANTS = ['gədəbəy', 'gedebey'] as const
const BREAKFAST_TAGS = ['səhər yeməyi', 'breakfast', 'çay süfrəsi'] as const

// ===================================================
// UTILITY FUNCTIONS
// ===================================================

/**
 * Safely gets the base price of a product from variants or main price
 */
export function getProductBasePrice(product: Product): number {
  if (!product) return 0
  return product.variants?.[0]?.price ?? product.price ?? 0
}

/**
 * Safely extracts the first image URL from product images
 */
export function getFirstImageUrl(product: Product): string {
  if (!product?.images || !Array.isArray(product.images) || product.images.length === 0) {
    return '/placeholder.png'
  }

  const firstImage = product.images[0]

  if (typeof firstImage === 'string') {
    return firstImage || '/placeholder.png'
  }

  if (typeof firstImage === 'object' && firstImage?.url) {
    return firstImage.url || '/placeholder.png'
  }

  return '/placeholder.png'
}

/**
 * Determines if a product is considered "new" (created within last 7 days)
 */
export function isNewProduct(product: Product): boolean {
  if (!product?.createdAt) return false

  try {
    const createdDate = new Date(product.createdAt).getTime()
    const timeDifference = Date.now() - createdDate
    return timeDifference < DAYS_7_IN_MS
  } catch {
    return false
  }
}

/**
 * Generates marketing badges for a product based on its properties
 */
export function buildProductBadges(product: Product): ProductBadge[] {
  if (!product) return []

  const badges: ProductBadge[] = []

  // Organic badge
  if (product.organic || product.statusTags?.includes('organic')) {
    badges.push({ label: 'Organik', tone: 'green' })
  }

  // New arrival badge
  if (isNewProduct(product) || product.statusTags?.includes('newArrival')) {
    badges.push({ label: 'Yeni gələn', tone: 'amber' })
  }

  // Best value badge
  if (product.statusTags?.includes('bestValue')) {
    badges.push({ label: 'Ən sərfəli seçim', tone: 'blue' })
  }

  // Locally sourced badge
  if (product.statusTags?.includes('locallySourced')) {
    badges.push({ label: 'Yerli təsərrüfat', tone: 'green' })
  }

  // Limited edition badge
  if (product.statusTags?.includes('limitedEdition')) {
    badges.push({ label: 'Limitli sayda', tone: 'rose' })
  }

  // Breakfast ideal badge
  if (product.tags?.includes('səhər yeməyi')) {
    badges.push({ label: 'Səhər yeməyi üçün ideal', tone: 'amber' })
  }

  return badges.slice(0, MAX_BADGES)
}

/**
 * Gets the short benefit description for a product
 */
export function getShortBenefit(product: Product): string | null {
  if (!product) return null

  if (product.benefits?.length) {
    return product.benefits[0]
  }

  if (product.usageTips?.length) {
    return product.usageTips[0]
  }

  if (product.originRegion) {
    return `${product.originRegion} kəndindən təbii dad`
  }

  return null
}

/**
 * Formats currency value with proper formatting
 */
export function formatCurrency(value: number, currency: string = DEFAULT_CURRENCY): string {
  if (typeof value !== 'number' || isNaN(value)) {
    return `0.00 ${currency}`
  }
  return `${value.toFixed(2)} ${currency}`
}

/**
 * Builds trust and quality copy points for a product
 */
export function buildTrustCopy(product: Product): string[] {
  if (!product) return []

  const copyPoints: string[] = []

  if (product.organic) {
    copyPoints.push('Kimyəvi gübrə və pestisidsiz')
  }

  if (product.seasonal) {
    copyPoints.push('Mövsümündə yığılmış təzə məhsul')
  }

  if (product.shelfLifeDays && product.shelfLifeDays <= 7) {
    copyPoints.push('Qısa saxlama müddəti – əlavə qoruyucu yoxdur')
  }

  if (product.allergens?.length) {
    copyPoints.push('Allergen məlumatı əlavə olunub')
  }

  return copyPoints
}

/**
 * Calculates product rating from reviews
 */
function calculateProductRating(product: Product): number {
  if (!product.reviews?.length) return 0

  const totalRating = product.reviews.reduce(
    (sum, review) => sum + (review.rating ?? 0), 
    0
  )

  return totalRating / product.reviews.length
}

/**
 * Calculates discount percentage for a product
 */
function calculateDiscountPercentage(product: Product): number {
  const basePrice = getProductBasePrice(product)
  if (basePrice <= 0) return 0

  const discountedPrice = finalPrice(basePrice, product.discountType, product.discountValue)
  return Math.max(0, ((basePrice - discountedPrice) / basePrice) * 100)
}

/**
 * Scores a product for recommendation algorithm
 */
function scoreProduct(product: Product): number {
  if (!product || product.archived) return 0

  let score = 0
  const discount = calculateDiscountPercentage(product)
  const rating = calculateProductRating(product)

  // Apply scoring weights
  score += discount * PRODUCT_SCORING_WEIGHTS.DISCOUNT
  score += rating * PRODUCT_SCORING_WEIGHTS.RATING

  // Bonus points for special attributes
  if (product.organic) score += PRODUCT_SCORING_WEIGHTS.ORGANIC
  if (product.statusTags?.includes('mustTry')) score += PRODUCT_SCORING_WEIGHTS.MUST_TRY
  if (isNewProduct(product)) score += PRODUCT_SCORING_WEIGHTS.NEW_PRODUCT

  return score
}

/**
 * Safely parses JSON from localStorage
 */
function safeJsonParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback

  try {
    return JSON.parse(value) as T
  } catch {
    return fallback
  }
}

/**
 * Filters products by region (case-insensitive)
 */
function filterProductsByRegion(products: Product[], regionKeywords: readonly string[]): Product[] {
  return products.filter(product => {
    if (product.archived) return false

    const originRegion = product.originRegion?.toLowerCase() || ''
    const origin = product.origin?.toLowerCase() || ''

    return regionKeywords.some(keyword => 
      originRegion.includes(keyword) || origin.includes(keyword)
    )
  })
}

/**
 * Filters products by breakfast tags
 */
function filterBreakfastProducts(products: Product[]): Product[] {
  return products.filter(product => {
    if (product.archived) return false

    return BREAKFAST_TAGS.some(tag => product.tags?.includes(tag))
  })
}

// ===================================================
// CUSTOM HOOKS
// ===================================================

/**
 * Hook for managing recent viewed products from localStorage
 */
function useRecentViewed(products: Product[]): Product[] {
  const [recentViewed, setRecentViewed] = useState<Product[]>([])

  useEffect(() => {
    if (typeof window === 'undefined') return

    const rawIds = localStorage.getItem(RECENT_PRODUCTS_STORAGE_KEY)
    const productIds = safeJsonParse<string[]>(rawIds, [])

    const recentProducts = productIds
      .map(id => products.find(p => p.id === id))
      .filter((product): product is Product => Boolean(product))
      .slice(0, MAX_DISPLAYED_ITEMS)

    setRecentViewed(recentProducts)
  }, [products])

  return recentViewed
}

/**
 * Hook for managing time of day state
 */
function useTimeOfDay(): TimeOfDay {
  const [timeOfDay, setTimeOfDay] = useState<TimeOfDay>('day')

  useEffect(() => {
    const updateTimeOfDay = () => {
      const hour = new Date().getHours()

      if (hour < 12) {
        setTimeOfDay('morning')
      } else if (hour < 18) {
        setTimeOfDay('day')
      } else {
        setTimeOfDay('evening')
      }
    }

    updateTimeOfDay()

    // Update every hour
    const interval = setInterval(updateTimeOfDay, 60 * 60 * 1000)

    return () => clearInterval(interval)
  }, [])

  return timeOfDay
}

/**
 * Hook for managing countdown timer
 */
function useCountdownTimer(): [number | null, (sec: number | null) => string] {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const calculateSecondsLeft = useCallback((): number => {
    const now = new Date()
    const endOfDay = new Date()
    endOfDay.setHours(23, 59, 59, 999)

    return Math.max(0, Math.floor((endOfDay.getTime() - now.getTime()) / 1000))
  }, [])

  const formatTimer = useCallback((sec: number | null): string => {
    if (sec === null || sec < 0) return '—'

    const hours = Math.floor(sec / 3600)
    const minutes = Math.floor((sec % 3600) / 60)
    const seconds = sec % 60

    return [hours, minutes, seconds]
      .map(unit => String(unit).padStart(2, '0'))
      .join(':')
  }, [])

  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Calculate initial seconds left
    const initialSeconds = calculateSecondsLeft()

    // Use setTimeout to avoid React warning about synchronous setState
    setTimeout(() => {
      setSecondsLeft(initialSeconds)
    }, 0)

    // Set up interval
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev === null || prev <= 0) return 0
        return prev - 1
      })
    }, 1000)

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [calculateSecondsLeft])

  return [secondsLeft, formatTimer]
}

// ===================================================
// MAIN COMPONENT
// ===================================================

const HomePage: FC = () => {
  // Store selectors
  const products = useApp(state => state.products || [])
  const categories = useApp(state => state.categories || [])
  const orders = useApp(state => state.orders || [])
  const addToCart = useApp(state => state.addToCart)
  const storefrontConfig = useApp(state => state.storefrontConfig)

  // Configuration
  const currency = storefrontConfig?.currency ?? DEFAULT_CURRENCY

  // Custom hooks
  const recentViewed = useRecentViewed(products)
  const timeOfDay = useTimeOfDay()
  const [secondsLeft, formatTimer] = useCountdownTimer()

  // KPI calculations
  const kpiMetrics = useMemo(() => {
    const activeProducts = products.filter(p => !p.archived)
    const totalProducts = activeProducts.length
    const totalOrders = orders.length

    const avgRating = activeProducts.length > 0
      ? activeProducts.reduce((sum, product) => {
          return sum + calculateProductRating(product)
        }, 0) / activeProducts.length
      : 0

    return { totalProducts, totalOrders, avgRating }
  }, [products, orders])

  // Product collections
  const productCollections = useMemo(() => {
    const activeProducts = products.filter(p => !p.archived)

    return {
      featuredCategories: categories
        .filter(c => c.featured && !c.archived)
        .slice(0, MAX_DISPLAYED_ITEMS),

      newArrivals: applyProductFilter(activeProducts, { 
        onlyNew: true, 
        sort: 'new' 
      }).slice(0, MAX_DISPLAYED_ITEMS),

      discounted: applyProductFilter(activeProducts, {
        onlyDiscounted: true,
        sort: 'price-desc'
      }).slice(0, MAX_DISPLAYED_ITEMS),

      gedebeyProducts: filterProductsByRegion(
        activeProducts, 
        GEDEBEY_REGION_VARIANTS
      ).slice(0, MAX_DISPLAYED_ITEMS),

      popular: [...activeProducts]
        .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
        .slice(0, MAX_POPULAR_ITEMS),

      mustTry: activeProducts
        .filter(p => 
          p.statusTags?.includes('mustTry') ||
          p.statusTags?.includes('bestValue') ||
          (p.reviews?.length ?? 0) >= MINIMUM_REVIEWS_FOR_MUST_TRY
        )
        .slice(0, MAX_DISPLAYED_ITEMS),

      breakfastPicks: filterBreakfastProducts(activeProducts)
        .slice(0, MAX_DISPLAYED_ITEMS),
    }
  }, [products, categories])

  // Hero highlighted product (AI-like recommendation)
  const heroHighlighted = useMemo((): Product | null => {
    if (!products.length) return null

    const scoredProducts: ProductScore[] = products
      .filter(p => !p.archived)
      .map(product => ({
        product,
        score: scoreProduct(product)
      }))
      .sort((a, b) => b.score - a.score)

    return scoredProducts[0]?.product ?? null
  }, [products])

  return (
    <main className="relative min-h-screen overflow-hidden bg-gradient-to-b from-[#f7fbe9] via-[#fdfaf3] to-[#f3f7ea]">
      <OrganicBackgroundDecor />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-28 pt-6 md:px-6 lg:px-10">
        <TopBarnBanner />

        <DynamicPromoStrip
          timeOfDay={timeOfDay}
          secondsLeft={secondsLeft}
          formatTimer={formatTimer}
          totalOrders={kpiMetrics.totalOrders}
          avgRating={kpiMetrics.avgRating}
        />

        <HeroSection 
          featuredCats={productCollections.featuredCategories} 
          highlighted={heroHighlighted} 
        />

        <OrganicSeparator />

        <StatsStrip 
          totalProducts={kpiMetrics.totalProducts} 
          totalOrders={kpiMetrics.totalOrders} 
          avgRating={kpiMetrics.avgRating} 
        />

        <OrganicSeparator small />

        <CategoryStrip categories={categories} />

        {/* New Arrivals Section */}
        <SectionBlock
          id="new-arrivals"
          title="Yeni gələnlər"
          subtitle="Bu həftənin ən təzə Gədəbəy & Gəncə kənd məhsulları"
          href="/products?sort=new"
          badge="🧺 Təzə yığım"
        >
          <ProductGrid
            products={productCollections.newArrivals}
            currency={currency}
            addToCart={addToCart}
            variant="default"
          />
        </SectionBlock>

        {/* Must-Try Section */}
        <SectionBlock
          id="must-try"
          title="Mütləq dadılmalı məhsullar"
          subtitle="Müştərilərin təkrar-təkrar sifariş etdiyi və ən çox tövsiyə etdiyi dadlar"
          href="/products?tag=mustTry"
          badge="💚 Favoritlər"
        >
          <ProductGrid
            products={productCollections.mustTry}
            currency={currency}
            addToCart={addToCart}
            variant="highlight"
          />
        </SectionBlock>

        <OrganicSeparator small />

        {/* Discounted Products Section */}
        <SectionBlock
          id="discounted"
          title="Endirimli məhsullar"
          subtitle="Məhdud sayda, sərfəli kənd qiymətləri"
          href="/products?discounted=true"
          badge="🔥 Fırsat"
        >
          <ProductGrid
            products={productCollections.discounted}
            currency={currency}
            addToCart={addToCart}
            variant="discount"
          />
        </SectionBlock>

        {/* Breakfast Selection Section */}
        <SectionBlock
          id="breakfast"
          title="Səhər süfrəsi üçün seçimlər"
          subtitle="Bal, qaymaq, pendir, təzə çörəkliklər – nənə süfrəsi ab-havası"
          href="/products?tag=səhər%20yeməyi"
          badge="🌅 Breakfast mood"
        >
          <ProductGrid
            products={productCollections.breakfastPicks}
            currency={currency}
            addToCart={addToCart}
            variant="breakfast"
          />
        </SectionBlock>

        {/* Gedebey Products Section */}
        <SectionBlock
          id="gedebey"
          title="Gədəbəy məhsulları"
          subtitle="Dağ kəndlərindən birbaşa süfrənizə"
          href="/category/gedebey"
          badge="⛰️ Yerli təsərrüfat"
        >
          <ProductGrid
            products={productCollections.gedebeyProducts}
            currency={currency}
            addToCart={addToCart}
            variant="gedebey"
          />
        </SectionBlock>

        {/* Trust and USP Section */}
        <TrustAndUSPStrip />

        <StoryStrip />

        {/* Popular Products Carousel */}
        <SectionBlock
          id="popular"
          title="Ən çox sevilənlər"
          subtitle="Müştərilərimizin təkrar-təkrar sifariş etdiyi dadlar"
          href="/products?sort=popular"
        >
          <ProductCarousel 
            products={productCollections.popular} 
            currency={currency} 
            addToCart={addToCart} 
          />
        </SectionBlock>

        {/* Recently Viewed Section */}
        <RecentViewedStrip
          products={recentViewed}
          currency={currency}
          addToCart={addToCart}
        />

        {/* Nutrition and Tips Section */}
        <NutritionAndTipsStrip products={products} />

        <TestimonialStrip />

        <ReferralStrip />

        <WhatsAppCTA />

        <HowItWorksStrip />

        <MobileBottomBar />
      </div>
    </main>
  )
}

export default HomePage
