// src/app/page.tsx
'use client'

import { useMemo,useState, useEffect, useCallback } from 'react'

import {  Product, useApp } from '@/lib/store'
import { finalPrice } from '@/lib/calc'
import { applyProductFilter } from '@/lib/filter'
import { OrganicBackgroundDecor, TopBarnBanner, CategoryStrip, SectionBlock, TrustAndUSPStrip, StoryStrip, RecentViewedStrip, TestimonialStrip, ReferralStrip, WhatsAppCTA, HowItWorksStrip, MobileBottomBar, NutritionAndTipsStrip, OrganicSeparator, ProductCarousel, StatsStrip } from '@/components/storefront/molecules'

import { DynamicPromoStrip, HeroSection, ProductGrid } from '@/components/storefront/organisms'

// ===================================================
// UTIL FUNKSIYALAR
// ===================================================

export function getProductBasePrice(p: Product): number {
  return p.variants?.[0]?.price ?? p.price ?? 0
}

export function getFirstImageUrl(p: Product): string {
  const imgs = (p.images ?? []) as any[]
  if (!Array.isArray(imgs) || imgs.length === 0) return '/placeholder.png'

  const first = imgs[0]
  if (typeof first === 'string') return first || '/placeholder.png'
  if (typeof first === 'object' && first?.url) return first.url || '/placeholder.png'

  return '/placeholder.png'
}

export function isNewProduct(p: Product): boolean {
  if (!p.createdAt) return false
  const created = new Date(p.createdAt).getTime()
  const diff = Date.now() - created
  const DAYS_7 = 7 * 24 * 60 * 60 * 1000
  return diff < DAYS_7
}

// Product status / marketing tag hazırlayan helper
function buildProductBadges(p: Product): { label: string; tone: 'green' | 'amber' | 'rose' | 'blue' }[] {
  const badges: { label: string; tone: 'green' | 'amber' | 'rose' | 'blue' }[] = []

  if (p.organic || p.statusTags?.includes('organic')) {
    badges.push({ label: 'Organik', tone: 'green' })
  }
  if (isNewProduct(p) || p.statusTags?.includes('newArrival')) {
    badges.push({ label: 'Yeni gələn', tone: 'amber' })
  }
  if (p.statusTags?.includes('bestValue')) {
    badges.push({ label: 'Ən sərfəli seçim', tone: 'blue' })
  }
  if (p.statusTags?.includes('locallySourced')) {
    badges.push({ label: 'Yerli təsərrüfat', tone: 'green' })
  }
  if (p.statusTags?.includes('limitedEdition')) {
    badges.push({ label: 'Limitli sayda', tone: 'rose' })
  }
  if (p.tags?.includes('səhər yeməyi')) {
    badges.push({ label: 'Səhər yeməyi üçün ideal', tone: 'amber' })
  }

  return badges.slice(0, 3)
}

export function shortBenefit(p: Product): string | null {
  if (p.benefits && p.benefits.length > 0) return p.benefits[0]
  if (p.usageTips && p.usageTips.length > 0) return p.usageTips[0]
  if (p.originRegion) return `${p.originRegion} kəndindən təbii dad`
  return null
}

export  function formatCurrency(value: number, currency: string = 'AZN') {
  return `${value.toFixed(2)} ${currency}`
}

// Sadə "zəmanət / trust" copy-ləri üçün util
 function buildTrustCopy(p: Product) {
  const copy: string[] = []
  if (p.organic) copy.push('Kimyəvi gübrə və pestisidsiz')
  if (p.seasonal) copy.push('Mövsümündə yığılmış təzə məhsul')
  if (p.shelfLifeDays && p.shelfLifeDays <= 7) copy.push('Qısa saxlama müddəti – əlavə qoruyucu yoxdur')
  if (p.allergens?.length) copy.push('Allergen məlumatı əlavə olunub')
  return copy
}

// ===================================================
// MAIN PAGE
// ===================================================

export default function HomePage() {
  const products = useApp((s) => s.products || [])
  const categories = useApp((s) => s.categories || [])
  const orders = useApp((s) => s.orders || [])
  const addToCart = useApp((s) => s.addToCart)
  const storefrontConfig = useApp((s) => s.storefrontConfig)

  const currency = storefrontConfig?.currency ?? 'AZN'

  // Marketing üçün bəzi ümumi KPI-lar
  const totalProducts = products.filter((p) => !p.archived).length
  const totalOrders = orders.length
  const avgRating =
    products.length > 0
      ? products.reduce((s, p) => {
          const pr =
            p.reviews?.length && p.reviews.length > 0
              ? p.reviews.reduce((ss, r) => ss + (r.rating ?? 0), 0) /
                p.reviews.length
              : 0
          return s + pr
        }, 0) / products.length
      : 0

  const featuredCats = useMemo(
    () => categories.filter((c) => c.featured && !c.archived).slice(0, 8),
    [categories],
  )

  const newArrivals = useMemo(
    () => applyProductFilter(products, { onlyNew: true, sort: 'new' }).slice(0, 8),
    [products],
  )

  const discounted = useMemo(
    () =>
      applyProductFilter(products, {
        onlyDiscounted: true,
        sort: 'discount',
      }).slice(0, 8),
    [products],
  )

  const gedebeyProducts = useMemo(
    () =>
      products
        .filter(
          (p) =>
            !p.archived &&
            (p.originRegion?.toLowerCase().includes('gədəbəy') ||
              p.origin?.toLowerCase().includes('gədəbəy')),
        )
        .slice(0, 8),
    [products],
  )

  const popular = useMemo(
    () =>
      [...products]
        .filter((p) => !p.archived)
        .sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0))
        .slice(0, 10),
    [products],
  )

  const mustTry = useMemo(
    () =>
      products
        .filter(
          (p) =>
            !p.archived &&
            (p.statusTags?.includes('mustTry') ||
              p.statusTags?.includes('bestValue') ||
              (p.reviews?.length ?? 0) >= 3),
        )
        .slice(0, 8),
    [products],
  )

  const breakfastPicks = useMemo(
    () =>
      products
        .filter(
          (p) =>
            !p.archived &&
            (p.tags?.includes('səhər yeməyi') ||
              p.tags?.includes('breakfast') ||
              p.tags?.includes('çay süfrəsi')),
        )
        .slice(0, 8),
    [products],
  )

  // Sadə “son baxılanlar” – localStorage əsasında (yalnız front)
  const [recentViewed, setRecentViewed] = useState<Product[]>([])
  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      const raw = window.localStorage.getItem('og-recent-products')
      if (!raw) return
      const ids: string[] = JSON.parse(raw)
      const list = ids
        .map((id) => products.find((p) => p.id === id))
        .filter(Boolean) as Product[]
      setRecentViewed(list.slice(0, 8))
    } catch {
      // ignore
    }
  }, [products])

  // Sadə “dynamic hook” – günün saatına görə hero copy
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'day' | 'evening'>('day')
  useEffect(() => {
    const h = new Date().getHours()
    if (h < 12) setTimeOfDay('morning')
    else if (h < 18) setTimeOfDay('day')
    else setTimeOfDay('evening')
  }, [])

  // Sadə “kampaniya timeri” – günün sonuna qədər
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null)
  useEffect(() => {
    const now = new Date()
    const end = new Date()
    end.setHours(23, 59, 59, 999)
    const diff = Math.max(0, Math.floor((end.getTime() - now.getTime()) / 1000))
    setSecondsLeft(diff)

    const i = setInterval(() => {
      setSecondsLeft((prev) => (prev == null || prev <= 0 ? 0 : prev - 1))
    }, 1000)
    return () => clearInterval(i)
  }, [])

  const formatTimer = useCallback((sec: number | null) => {
    if (sec == null) return '—'
    const h = Math.floor(sec / 3600)
    const m = Math.floor((sec % 3600) / 60)
    const s = sec % 60
    return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(
      s,
    ).padStart(2, '0')}`
  }, [])

  // “AI-Like” sadə rekomendasiya – endirim + rəy + organik
  const heroHighlighted = useMemo(() => {
    if (!products.length) return null
    const scored = products
      .filter((p) => !p.archived)
      .map((p) => {
        const base = getProductBasePrice(p)
        const price = finalPrice(base, p.discountType, p.discountValue)
        const discount =
          base > 0 ? Math.max(0, (1 - price / base) * 100) : 0

        const rating =
          p.reviews?.length && p.reviews.length > 0
            ? p.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) /
              p.reviews.length
            : 0

        let score = 0
        score += discount * 0.5
        score += rating * 4
        if (p.organic) score += 8
        if (p.statusTags?.includes('mustTry')) score += 12
        if (isNewProduct(p)) score += 3

        return { p, score }
      })
    scored.sort((a, b) => b.score - a.score)
    return scored[0]?.p ?? null
  }, [products])

  return (
    <main className="relative min-h-screen overflow-hidden bg-linear-to-b from-[#f7fbe9] via-[#fdfaf3] to-[#f3f7ea]">
      <OrganicBackgroundDecor />

      <div className="mx-auto flex w-full max-w-7xl flex-col gap-16 px-4 pb-28 pt-6 md:px-6 lg:px-10">
        <TopBarnBanner />
        <DynamicPromoStrip
          timeOfDay={timeOfDay}
          secondsLeft={secondsLeft}
          formatTimer={formatTimer}
          totalOrders={totalOrders}
          avgRating={avgRating}
        />

        <HeroSection featuredCats={featuredCats} highlighted={heroHighlighted} />

        <OrganicSeparator />

        <StatsStrip totalProducts={totalProducts} totalOrders={totalOrders} avgRating={avgRating} />

        <OrganicSeparator small />

        <CategoryStrip categories={categories} />

        {/* Yeni gələnlər */}
        <SectionBlock
          id="new-arrivals"
          title="Yeni gələnlər"
          subtitle="Bu həftənin ən təzə Gədəbəy & Gəncə kənd məhsulları"
          href="/products?sort=new"
          badge="🧺 Təzə yığım"
        >
          <ProductGrid
            products={newArrivals}
            currency={currency}
            addToCart={addToCart}
            variant="default"
          />
        </SectionBlock>

        {/* Must-Try blok – marketing fokuslu */}
        <SectionBlock
          id="must-try"
          title="Mütləq dadılmalı məhsullar"
          subtitle="Müştərilərin təkrar-təkrar sifariş etdiyi və ən çox tövsiyə etdiyi dadlar"
          href="/products?tag=mustTry"
          badge="💚 Favoritlər"
        >
          <ProductGrid
            products={mustTry}
            currency={currency}
            addToCart={addToCart}
            variant="highlight"
          />
        </SectionBlock>

        <OrganicSeparator small />

        {/* Endirimlilər */}
        <SectionBlock
          id="discounted"
          title="Endirimli məhsullar"
          subtitle="Məhdud sayda, sərfəli kənd qiymətləri"
          href="/products?discounted=true"
          badge="🔥 Fırsat"
        >
          <ProductGrid
            products={discounted}
            currency={currency}
            addToCart={addToCart}
            variant="discount"
          />
        </SectionBlock>

        {/* Səhər yeməyi seçimi */}
        <SectionBlock
          id="breakfast"
          title="Səhər süfrəsi üçün seçimlər"
          subtitle="Bal, qaymaq, pendir, təzə çörəkliklər – nənə süfrəsi ab-havası"
          href="/products?tag=səhər%20yeməyi"
          badge="🌅 Breakfast mood"
        >
          <ProductGrid
            products={breakfastPicks}
            currency={currency}
            addToCart={addToCart}
            variant="breakfast"
          />
        </SectionBlock>

        {/* Gədəbəy xüsusi */}
        <SectionBlock
          id="gedebey"
          title="Gədəbəy məhsulları"
          subtitle="Dağ kəndlərindən birbaşa süfrənizə"
          href="/category/gedebey"
          badge="⛰️ Yerli təsərrüfat"
        >
          <ProductGrid
            products={gedebeyProducts}
            currency={currency}
            addToCart={addToCart}
            variant="gedebey"
          />
        </SectionBlock>

        {/* “Niyə biz?” – Trust + USP grid */}
        <TrustAndUSPStrip />

        <StoryStrip />

        {/* Ən sevilənlər karuseli */}
        <SectionBlock
          id="popular"
          title="Ən çox sevilənlər"
          subtitle="Müştərilərimizin təkrar-təkrar sifariş etdiyi dadlar"
          href="/products?sort=popular"
        >
          <ProductCarousel products={popular} currency={currency} addToCart={addToCart} />
        </SectionBlock>

        {/* Son baxılanlar – müştəriyə “geri dön” hissi */}
        <RecentViewedStrip
          products={recentViewed}
          currency={currency}
          addToCart={addToCart}
        />

        {/* Qidalanma + istifadə tövsiyələri – marketing copy */}
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

