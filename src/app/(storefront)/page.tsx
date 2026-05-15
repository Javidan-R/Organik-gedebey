'use client'

import { useMemo, useState, useEffect, useCallback } from 'react'
import type { FC } from 'react'
import { motion, useScroll,  AnimatePresence, useSpring,  } from 'framer-motion'
import {   Gift, ShoppingCart,  Search, Bell,  X, ChevronRight, Flame, Package,ArrowRight,SlidersHorizontal, RefreshCw, Sun, Wind, Droplets, Timer, 
} from 'lucide-react'

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
  StatsStrip 
} from '@/components/ui/molecules'
import { HeroSection, ProductGrid } from '@/components/ui/organisms'
import { DEFAULT_CURRENCY, MOCK_NOTIFICATIONS, MAX_DISPLAYED_ITEMS, GEDEBEY_REGION_VARIANTS, MAX_POPULAR_ITEMS, MINIMUM_REVIEWS_FOR_MUST_TRY } from '@/const'
import { useCountdownTimer } from '@/hooks/useCountdownTimer'
import { useIsMobile } from '@/hooks/useIsMobile'
import { useLocalStorage } from '@/hooks/useLocalStorage'
import { usePullToRefresh } from '@/hooks/usePullToRefresh'
import { useRecentViewed } from '@/hooks/useRecentViewed'
import { useScrollToTop } from '@/hooks/useScrollToTop'
import { useTimeOfDay } from '@/hooks/useTimeOfDay'
import { useWeather } from '@/hooks/useWeather'
import { useWishlist } from '@/hooks/useWishlist'
import { WeatherData, NotificationItem } from '@/types/home'
import { getFirstImageUrl, formatCurrency, getProductBasePrice, calculateProductRating, scoreProduct, filterProductsByRegion, filterBreakfastProducts } from '@/utils/storefront_home'
import { FreshTodayStoryBar } from '@/components/ui/molecules/FreshTodayStoryBar'
import { FreshTodayStoryModal } from '@/components/ui/molecules/FreshTodayStoryModal'


/* ========================================================================= */
/*                      ENHANCED COMPONENTS                                  */
/* ========================================================================= */

// NEW: Scroll Progress Bar
const ScrollProgressBar: FC = () => {
  const { scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, { stiffness: 100, damping: 30 })
  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-1 bg-linear-to-r from-emerald-400 via-lime-400 to-amber-400 origin-left z-60"
      style={{ scaleX }}
    />
  )
}





// NEW: Weather & Suggestion Strip  
const WeatherSuggestionStrip: FC<{ weather: WeatherData }> = ({ weather }) => {
  const icons = { sunny: Sun, cloudy: Wind, rainy: Droplets, windy: Wind }
  const Icon = icons[weather.condition]
  const colors = {
    sunny: 'from-amber-50 to-orange-50 border-amber-200',
    cloudy: 'from-slate-50 to-blue-50 border-slate-200',
    rainy: 'from-blue-50 to-indigo-50 border-blue-200',
    windy: 'from-cyan-50 to-teal-50 border-cyan-200',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex items-center gap-3 rounded-2xl border bg-linear-to-r ${colors[weather.condition]} px-4 py-3 text-xs`}
    >
      <div className="flex items-center gap-2 shrink-0">
        <Icon className="w-5 h-5 text-amber-600" />
        <span className="font-bold text-slate-700">{weather.temp}°C</span>
        <span className="text-slate-500">Bakı</span>
      </div>
      <span className="text-slate-600 text-[11px] leading-relaxed">{weather.suggestion}</span>
    </motion.div>
  )
}

// NEW: Skeleton Loader
const SkeletonLoader: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="rounded-2xl bg-white/60 p-4"
      >
        <div className="aspect-square w-full animate-pulse rounded-xl bg-linear-to-r from-slate-200 via-slate-100 to-slate-200 bg-size-[200%_100%] mb-3" 
          style={{ animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }}
        />
        <div className="h-4 animate-pulse rounded bg-slate-200 mb-2" />
        <div className="h-3 animate-pulse rounded bg-slate-200 w-2/3" />
      </motion.div>
    ))}
  </div>
)

// NEW: Floating Quick Actions
// const FloatingQuickActions: FC<{
//   onSearch: () => void
//   onNotifications: () => void
//   notificationCount: number
// }> = ({ onSearch, onNotifications, notificationCount }) => {
//   const isMobile = useIsMobile()
//   if (!isMobile) return null

//   return (
//     <motion.div
//       initial={{ opacity: 0, x: 40 }}
//       animate={{ opacity: 1, x: 0 }}
//       transition={{ delay: 0.5 }}
//       className="fixed bottom-24 right-4 z-40 flex flex-col gap-3"
//     >
//       {[
//         { icon: Bell, action: onNotifications, badge: notificationCount, color: 'bg-emerald-600 text-white', label: 'Bildirişlər' },
//         { icon: Search, action: onSearch, badge: 0, color: 'bg-white text-emerald-600 border-2 border-emerald-100', label: 'Axtar' },
//       ].map(({ icon: Icon, action, badge, color, label }) => (
//         <motion.button
//           key={label}
//           whileHover={{ scale: 1.1, x: -4 }}
//           whileTap={{ scale: 0.9 }}
//           onClick={action}
//           className={`relative h-14 w-14 rounded-full ${color} shadow-2xl flex items-center justify-center`}
//           aria-label={label}
//         >
//           <Icon className="w-6 h-6" />
//           {badge > 0 && (
//             <motion.span
//               initial={{ scale: 0 }}
//               animate={{ scale: 1 }}
//               className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 text-xs font-bold flex items-center justify-center text-white"
//             >
//               {badge}
//             </motion.span>
//           )}
//         </motion.button>
//       ))}
//     </motion.div>
//   )
// }

// NEW: Mobile Search Drawer
const MobileSearchDrawer: FC<{
  isOpen: boolean
  onClose: () => void
  products: Product[]
}> = ({ isOpen, onClose, products }) => {
  const [searchTerm, setSearchTerm] = useState('')
  const [recentSearches, setRecentSearches] = useLocalStorage<string[]>('og-recent-searches', [])

  const filteredProducts = useMemo(() => {
    if (!searchTerm) return []
    return products
      .filter(p => !p.archived && (
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description?.toLowerCase().includes(searchTerm.toLowerCase())
      ))
      .slice(0, 6)
  }, [searchTerm, products])

  const handleSearch = (term: string) => {
    if (term && !recentSearches.includes(term)) {
      setRecentSearches([term, ...recentSearches].slice(0, 5))
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
          />
          <motion.div
            initial={{ y: -120, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -120, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 right-0 z-50 bg-white/98 backdrop-blur-xl rounded-b-3xl shadow-2xl p-6"
          >
            <div className="flex items-center gap-3 mb-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSearch(searchTerm)}
                  placeholder="Məhsul axtar..."
                  className="w-full pl-12 pr-4 py-3 rounded-2xl border-2 border-slate-200 focus:border-emerald-500 outline-none text-sm"
                  autoFocus
                />
              </div>
              <button onClick={onClose} className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center">
                <X className="w-6 h-6" />
              </button>
            </div>

            {!searchTerm && recentSearches.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold text-slate-500 mb-2 uppercase tracking-wider">Son axtarışlar</p>
                <div className="flex flex-wrap gap-2">
                  {recentSearches.map(s => (
                    <button
                      key={s}
                      onClick={() => setSearchTerm(s)}
                      className="px-3 py-1.5 rounded-full bg-slate-100 text-xs text-slate-700 font-medium hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {filteredProducts.length > 0 && (
              <div className="space-y-2 max-h-[60vh] overflow-y-auto">
                {filteredProducts.map((product, i) => (
                  <motion.a
                    key={product.id}
                    href={`/products/${product.id}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="flex items-center gap-3 p-3 rounded-xl hover:bg-emerald-50 transition-colors group"
                  >
                    <div className="w-14 h-14 rounded-lg overflow-hidden bg-slate-100 shrink-0">
                      <img src={getFirstImageUrl(product)} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-slate-900 truncate">{product.name}</p>
                      <p className="text-xs text-emerald-600 font-bold">{formatCurrency(getProductBasePrice(product))}</p>
                      {product.originRegion && <p className="text-[10px] text-slate-400">📍 {product.originRegion}</p>}
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                  </motion.a>
                ))}
              </div>
            )}

            {searchTerm && filteredProducts.length === 0 && (
              <div className="text-center py-8">
                <span className="text-4xl">🔍</span>
                <p className="text-slate-500 text-sm mt-2">`{searchTerm}` üçün nəticə tapılmadı</p>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

// NEW: Notification Drawer
const NotificationDrawer: FC<{
  isOpen: boolean
  onClose: () => void
  notifications: NotificationItem[]
}> = ({ isOpen, onClose, notifications }) => (
  <AnimatePresence>
    {isOpen && (
      <>
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-black/50 z-50 backdrop-blur-sm"
        />
        <motion.div
          initial={{ x: '100%' }}
          animate={{ x: 0 }}
          exit={{ x: '100%' }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed top-0 right-0 bottom-0 w-full max-w-sm bg-white z-50 shadow-2xl overflow-y-auto"
        >
          <div className="sticky top-0 bg-white/90 backdrop-blur-md border-b border-slate-100 p-5 flex items-center justify-between">
            <h2 className="text-lg font-black text-slate-900">Bildirişlər</h2>
            <button onClick={onClose} className="h-10 w-10 rounded-full bg-slate-100 flex items-center justify-center">
              <X className="w-5 h-5" />
            </button>
          </div>
          <div className="p-5 space-y-3">
            {notifications.map((n, i) => (
              <motion.div
                key={n.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className={`p-4 rounded-2xl border-2 ${n.read ? 'bg-white border-slate-100' : 'bg-emerald-50 border-emerald-200'}`}
              >
                <div className="flex items-start gap-3">
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 ${
                    n.type === 'sale' ? 'bg-red-100' : n.type === 'order' ? 'bg-blue-100' : n.type === 'stock' ? 'bg-green-100' : 'bg-purple-100'
                  }`}>
                    {n.type === 'sale' && <Flame className="w-5 h-5 text-red-600" />}
                    {n.type === 'order' && <Package className="w-5 h-5 text-blue-600" />}
                    {n.type === 'stock' && <ShoppingCart className="w-5 h-5 text-green-600" />}
                    {n.type === 'promo' && <Gift className="w-5 h-5 text-purple-600" />}
                  </div>
                  <div className="flex-1">
                    <p className="font-semibold text-sm text-slate-900">{n.message}</p>
                    <p className="text-xs text-slate-400 mt-1">{n.time}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </>
    )}
  </AnimatePresence>
)


// NEW: Season Banner
const SeasonBanner: FC = () => {
  const month = new Date().getMonth()
  const season = month >= 2 && month <= 4 ? 'spring' : month >= 5 && month <= 7 ? 'summer' : month >= 8 && month <= 10 ? 'autumn' : 'winter'
  const config = {
    spring: { emoji: '🌸', label: 'Bahar məhsulları gəldi!', text: 'Təzə yığılmış bahar sebzə və meyvələr sifariş et', linear: 'from-pink-50 to-rose-50 border-rose-200' },
    summer: { emoji: '☀️', label: 'Yay məhsulları', text: 'İsti yayda serinlədici təbii içkilər & meyvələr', linear: 'from-amber-50 to-orange-50 border-orange-200' },
    autumn: { emoji: '🍂', label: 'Payız bolluğu', text: 'Sonbahar dadları – bal, alma, heyva & qaymaq', linear: 'from-orange-50 to-amber-50 border-amber-200' },
    winter: { emoji: '❄️', label: 'Qış ləzzətləri', text: 'Soyuq qışda isti tutan ev məhsulları', linear: 'from-blue-50 to-indigo-50 border-blue-200' },
  }
  const { emoji, label, text, linear } = config[season]

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      className={`flex items-center gap-3 rounded-2xl border bg-linear-to-r ${linear} px-4 py-3`}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3 }}
        className="text-2xl shrink-0"
      >
        {emoji}
      </motion.span>
      <div>
        <p className="text-xs font-black text-slate-800">{label}</p>
        <p className="text-[11px] text-slate-500">{text}</p>
      </div>
    </motion.div>
  )
}


// NEW: Flash Deal Timer Card
const FlashDealCard: FC<{ product: Product; dealPrice: number; endsAt: number; sold: number; total: number }> = ({
  product, dealPrice, endsAt, sold, total
}) => {
  const [secsLeft, setSecsLeft] = useState(Math.max(0, Math.floor((endsAt - Date.now()) / 1000)))

  useEffect(() => {
    const id = setInterval(() => setSecsLeft(prev => Math.max(0, prev - 1)), 1000)
    return () => clearInterval(id)
  }, [])

  const pct = (sold / total) * 100
  const h = Math.floor(secsLeft / 3600)
  const m = Math.floor((secsLeft % 3600) / 60)
  const s = secsLeft % 60
  const timer = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -4 }}
      className="rounded-3xl overflow-hidden border border-red-100 bg-white shadow-xl"
    >
      <div className="bg-linear-to-r from-red-500 to-rose-600 px-4 py-2 flex items-center justify-between">
        <div className="flex items-center gap-2 text-white">
          <Flame className="w-4 h-4" />
          <span className="text-xs font-black">FLASH DEAL</span>
        </div>
        <div className="flex items-center gap-1 bg-black/20 rounded-lg px-2 py-1">
          <Timer className="w-3 h-3 text-white" />
          <span className="text-xs font-mono font-bold text-white">{timer}</span>
        </div>
      </div>

      <div className="p-4">
        <div className="flex gap-3">
          <div className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100 shrink-0">
            <img src={getFirstImageUrl(product)} alt={product.name} className="w-full h-full object-cover" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-sm text-slate-800 line-clamp-2">{product.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-lg font-black text-red-600">{formatCurrency(dealPrice)}</span>
              <span className="text-xs line-through text-slate-400">{formatCurrency(getProductBasePrice(product))}</span>
            </div>
          </div>
        </div>

        <div className="mt-3">
          <div className="flex justify-between text-[11px] text-slate-500 mb-1">
            <span>{sold} satıldı</span>
            <span className="font-bold text-red-500">{Math.round(pct)}% bitdi!</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${pct}%` }}
              transition={{ duration: 1, ease: 'easeOut' }}
              className="h-full rounded-full bg-linear-to-r from-red-400 to-rose-600"
            />
          </div>
        </div>
      </div>
    </motion.div>
  )
}

/* ========================================================================= */
/*                          MAIN HOMEPAGE                                    */
/* ========================================================================= */

const EnhancedHomePage: FC = () => {
  // Store selectors
  const products = useApp(state => state.products || [])
  const categories = useApp(state => state.categories || [])
  const orders = useApp(state => state.orders || [])
  const addToCart = useApp(state => state.addToCart)
  const cartTotal = useApp(state => state.cartTotal)
  const storefrontConfig = useApp(state => state.storefrontConfig)

const [storyOpen, setStoryOpen] = useState(false);
const [storyStartIndex, setStoryStartIndex] = useState(0);
  const currency = storefrontConfig?.currency ?? DEFAULT_CURRENCY

  // Custom hooks
  const [recentViewed, addToRecent] = useRecentViewed(products)
  const [wishlist, addToWishlist, removeFromWishlist, isInWishlist] = useWishlist()
  const timeOfDay = useTimeOfDay()
  const [secondsLeft, formatTimer] = useCountdownTimer()
  const isMobile = useIsMobile()
  const weather = useWeather()
  const [scrollVisible, scrollToTop] = useScrollToTop()

  // UI State
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [isFilterOpen, setIsFilterOpen] = useState(false)
  const [isNotificationOpen, setIsNotificationOpen] = useState(false)
  const [notifications] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS)
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'recommended' | 'new' | 'popular'>('recommended')

  // Pull to refresh
  const handleRefresh = useCallback(async () => {
    setIsLoading(true)
    await new Promise(resolve => setTimeout(resolve, 1500))
    setIsLoading(false)
  }, [])

  const isRefreshing = usePullToRefresh(handleRefresh)
  const unreadCount = useMemo(() => notifications.filter(n => !n.read).length, [notifications])

  // KPI metrics
  const kpiMetrics = useMemo(() => {
    const active = products.filter(p => !p.archived)
    const avgRating = active.length > 0
      ? active.reduce((sum, p) => sum + calculateProductRating(p), 0) / active.length
      : 0
    return { totalProducts: active.length, totalOrders: orders.length, avgRating }
  }, [products, orders])

  // Product collections
  const productCollections = useMemo(() => {
    const active = products.filter(p => !p.archived)
    const viewedIds = recentViewed.map(p => p.id)

    return {
      featuredCategories: categories.filter(c => c.featured && !c.archived).slice(0, MAX_DISPLAYED_ITEMS),
      recommended: [...active].sort((a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist)).slice(0, MAX_DISPLAYED_ITEMS),
      newArrivals: applyProductFilter(active, { onlyNew: true, sort: 'new' }).slice(0, MAX_DISPLAYED_ITEMS),
      discounted: applyProductFilter(active, { onlyDiscounted: true, sort: 'price-desc' }).slice(0, MAX_DISPLAYED_ITEMS),
      gedebeyProducts: filterProductsByRegion(active, GEDEBEY_REGION_VARIANTS).slice(0, MAX_DISPLAYED_ITEMS),
      popular: [...active].sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, MAX_POPULAR_ITEMS),
      mustTry: active.filter(p => p.statusTags?.includes('mustTry') || p.statusTags?.includes('bestValue') || (p.reviews?.length ?? 0) >= MINIMUM_REVIEWS_FOR_MUST_TRY).slice(0, MAX_DISPLAYED_ITEMS),
      breakfastPicks: filterBreakfastProducts(active).slice(0, MAX_DISPLAYED_ITEMS),
      wishlistProducts: active.filter(p => wishlist.includes(p.id)).slice(0, MAX_DISPLAYED_ITEMS),
      seasonal: active.filter(p => p.statusTags?.includes('seasonal')).slice(0, MAX_DISPLAYED_ITEMS),
    }
  }, [products, categories, recentViewed, wishlist])

  // Hero highlighted product
  const heroHighlighted = useMemo((): Product | null => {
    if (!products.length) return null
    const viewedIds = recentViewed.map(p => p.id)
    return [...products.filter(p => !p.archived)]
      .sort((a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist))[0] ?? null
  }, [products, recentViewed, wishlist])

  // Flash deal (first discounted product)
  const flashDeal = useMemo(() => {
    const product = productCollections.discounted[0]
    if (!product) return null
    const base = getProductBasePrice(product)
    const deal = finalPrice(base, product.discountType, product.discountValue)
    return { product, dealPrice: deal, endsAt: Date.now() + 3 * 60 * 60 * 1000, sold: 47, total: 80 }
  }, [productCollections.discounted])

  // Tab products
  const tabProducts = useMemo(() => ({
    recommended: productCollections.recommended,
    new: productCollections.newArrivals,
    popular: productCollections.popular.slice(0, MAX_DISPLAYED_ITEMS),
  }), [productCollections])

  // Track page view reward

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-[#f3f9e7] via-[#fdfaf3] to-[#eef7ea]">
      <ScrollProgressBar />
      <OrganicBackgroundDecor />

      {/* <FloatingQuickActions
        onSearch={() => setIsSearchOpen(true)}
        onNotifications={() => setIsNotificationOpen(true)}
        notificationCount={unreadCount}
      /> */}

      {/* Drawers */}
      <MobileSearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} />
      {/* <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} notifications={notifications} /> */}
    
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-36 pt-6 md:gap-10 md:px-6 lg:px-10">

        <TopBarnBanner />

      

        {/* Season + Weather row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <SeasonBanner />
          <WeatherSuggestionStrip weather={weather} />
        </div>

       

                

          <HeroSection 
            featuredCats={productCollections.featuredCategories} 
            highlighted={heroHighlighted} 
            allProducts={products}  // ← BUNU ƏLAVƏ ET
          />
                  <OrganicSeparator />

          <SectionBlock
            id="fresh-today"
            title=""
            subtitle=""
            badge=""
          >
            <FreshTodayStoryBar onOpenStory={(idx) => { setStoryStartIndex(idx); setStoryOpen(true); }} />
          </SectionBlock>

          <FreshTodayStoryModal
            open={storyOpen}
            initialIndex={storyStartIndex}
            onClose={() => setStoryOpen(false)}
          />
        {/* <StatsStrip totalProducts={kpiMetrics.totalProducts} totalOrders={kpiMetrics.totalOrders} avgRating={kpiMetrics.avgRating} /> */}


        <CategoryStrip categories={categories} />

        {/* Lucky Wheel - Daily Spin Feature */}
        {/* <SectionBlock id="lucky-wheel" title="🎰 UĞUR ÇARXI" subtitle="Hər gün bir pulsuz fırlatma! Random məhsul qazan!" badge="🎁 HƏDİYYƏ">
          <LuckyWheel cartValue={cartTotal()} onWin={(discount, code) => console.log('Endirim kodu:', code)} />
        </SectionBlock> */}

        {/* Flash Deal */}
        {flashDeal && (
          <SectionBlock id="flash-deal" title="⚡ Anlıq Fırsat" subtitle="Məhdud vaxtlı premium deal" badge="🔥 HOT">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FlashDealCard {...flashDeal} />
              <div className="flex flex-col gap-3 justify-center">
                <p className="text-sm text-slate-600 leading-relaxed">
                  Gədəbəy kənd məhsullarında anlıq endirim – bu qiymət yalnız sayaç sıfırlanana qədər etibarlıdır. 
                  Stok məhduddur!
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

        {/* Tabbed Product Section - NEW FUNCTIONALITY */}
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
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${activeTab === key ? 'bg-white/20' : 'bg-slate-100'}`}>
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
                <ProductGrid
                  products={tabProducts[activeTab]}
                  currency={currency}
                  addToCart={addToCart}
                  variant="highlight"
                />
              )}
            </motion.div>
          </AnimatePresence>
        </SectionBlock>

        {/* Wishlist */}
        <AnimatePresence>
          {productCollections.wishlistProducts.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <SectionBlock id="wishlist" title="💝 Bəyəndiklərin" subtitle="Sevimli məhsulların" href="/wishlist">
                <ProductGrid products={productCollections.wishlistProducts} currency={currency} addToCart={addToCart} variant="highlight" />
              </SectionBlock>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Must Try */}
        <SectionBlock id="must-try" title="Mütləq dadılmalı" subtitle="Müştərilərin ən çox tövsiyə etdiyi dadlar" href="/products?tag=mustTry" badge="💚 Favoritlər">
          <ProductGrid products={productCollections.mustTry} currency={currency} addToCart={addToCart} variant="highlight" />
        </SectionBlock>

        <OrganicSeparator small />

        {/* Flash Deals */}
        <SectionBlock id="discounted" title="⚡ Flash Endirim" subtitle="Məhdud sayda, bu gün üçün xüsusi qiymətlər" href="/products?discounted=true" badge="🔥 Bitir">
          <ProductGrid products={productCollections.discounted} currency={currency} addToCart={addToCart} variant="discount" />
        </SectionBlock>

        {/* Breakfast */}
        <SectionBlock id="breakfast" title="Səhər süfrəsi" subtitle="Bal, qaymaq, pendir – nənə süfrəsi dadı" href="/products?tag=səhər%20yeməyi" badge="🌅 Breakfast">
          <ProductGrid products={productCollections.breakfastPicks} currency={currency} addToCart={addToCart} variant="breakfast" />
        </SectionBlock>

        {/* Gedebey Exclusive */}
        <SectionBlock id="gedebey" title="Gədəbəy eksklüziv" subtitle="Dağ kəndlərindən birbaşa süfrənizə" href="/category/gedebey" badge="⛰️ Dağ kəndi">
          <ProductGrid products={productCollections.gedebeyProducts} currency={currency} addToCart={addToCart} variant="gedebey" />
        </SectionBlock>

        <TrustAndUSPStrip />
        <StoryStrip />

        {/* Popular Carousel */}
        <SectionBlock id="popular" title="Ən çox sevilənlər" subtitle="Hər həftə təkrar sifariş edilən dadlar" href="/products?sort=popular">
          <ProductCarousel products={productCollections.popular} currency={currency} addToCart={addToCart} />
        </SectionBlock>

        {/* Recently Viewed */}
        {recentViewed.length > 0 && (
          <RecentViewedStrip products={recentViewed} currency={currency} addToCart={addToCart} />
        )}

        <NutritionAndTipsStrip products={products} />

        <TestimonialStrip />
        <WhatsAppCTA />
        <HowItWorksStrip />
        {/* <MobileBottomBar /> */}
      </div>
    </main>
  )
}

export default EnhancedHomePage