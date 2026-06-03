'use client'

import { useApp, useHasHydrated } from '@/lib/store'
import { useParams, notFound } from 'next/navigation'
import { RusticProductCard } from '@/components/ui/organisms/RusticProductCard'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Search, Leaf, Package, XCircle, Sparkles, Loader2, ArrowRight,
  ShieldCheck, Zap, Filter, CheckCircle2, ChevronDown, SlidersHorizontal,
  Star, TrendingUp, Calendar, Percent, Grid3X3, List, X, Minus, Plus,
  Eye, Heart, ShoppingBag, ArrowUp, Layers
} from 'lucide-react'
import { useMemo, useState, useEffect, useRef, useCallback } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// ============================================================
// Təhlükəsiz qiymət selector (variants olmadıqda)
// ============================================================
const safePrice = (p: any) => {
  if (!p) return 0
  if (p.variants && p.variants.length > 0) return p.variants[0].price || 0
  return p.price || 0
}

const safeStock = (p: any) => {
  if (!p) return 0
  if (p.variants && p.variants.length > 0) {
    return p.variants.reduce((acc: number, v: any) => acc + (v.stock || 0), 0)
  }
  return p.stock || 0
}

// ============================================================
// Köməkçi komponentlər
// ============================================================
const StatusChip = ({ icon: Icon, label, color }: any) => (
  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${color} backdrop-blur-sm border border-white/20 shadow-md`}>
    <Icon className="w-4 h-4" />
    <span className="text-xs font-black uppercase tracking-wider">{label}</span>
  </div>
)

const FilterChip = ({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) => (
  <motion.button
    whileHover={{ scale: 1.02, y: -1 }}
    whileTap={{ scale: 0.96 }}
    onClick={onClick}
    className={`px-4 py-2 rounded-full text-xs font-bold transition-all whitespace-nowrap ${
      active
        ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-500/30'
        : 'bg-white/80 text-slate-600 border border-slate-200 hover:bg-emerald-50 hover:border-emerald-300'
    }`}
  >
    {label}
  </motion.button>
)

const ActiveFilterPill = ({ label, onRemove }: { label: string; onRemove: () => void }) => (
  <motion.span
    initial={{ scale: 0.8, opacity: 0 }}
    animate={{ scale: 1, opacity: 1 }}
    exit={{ scale: 0.8, opacity: 0 }}
    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"
  >
    {label}
    <button onClick={onRemove} className="hover:bg-emerald-200 rounded-full p-0.5 transition">
      <X className="w-3 h-3" />
    </button>
  </motion.span>
)

// Skeleton loader for products
const ProductSkeleton = () => (
  <div className="rounded-3xl bg-white border border-slate-100 overflow-hidden shadow-sm animate-pulse">
    <div className="aspect-square bg-slate-100" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-slate-100 rounded-full w-3/4" />
      <div className="h-3 bg-slate-100 rounded-full w-1/2" />
      <div className="h-5 bg-slate-100 rounded-full w-1/3" />
    </div>
  </div>
)

// ============================================================
// Əsas Səhifə Komponenti
// ============================================================
export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const hasHydrated = useHasHydrated()
  const scrollRef = useRef<HTMLDivElement>(null)
  const { scrollYProgress } = useScroll({ target: scrollRef, offset: ['start start', 'end start'] })
  
  // Parallax dəyərləri
  const headerY = useTransform(scrollYProgress, [0, 1], ['0%', '25%'])
  const headerOpacity = useTransform(scrollYProgress, [0, 0.3], [1, 0])
  const headerScale = useTransform(scrollYProgress, [0, 0.3], [1, 0.95])
  
  // Store məlumatları
  const categories = useApp((state) => state.categories)
  const products = useApp((state) => state.products)
  const addToCart = useApp((state) => state.addToCart)
  const storefrontConfig = useApp((state) => state.storefrontConfig)
  const currency = storefrontConfig?.currency || 'AZN'
  
  // UI state
  const [searchTerm, setSearchTerm] = useState('')
  const [sortBy, setSortBy] = useState<'recent' | 'price_asc' | 'price_desc' | 'rating' | 'discount'>('recent')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [minPrice, setMinPrice] = useState(0)
  const [maxPrice, setMaxPrice] = useState(500)
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)
  const [onlyDiscounted, setOnlyDiscounted] = useState(false)
  const [minRating, setMinRating] = useState<0 | 3 | 4>(0)
  const [onlyNew, setOnlyNew] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false)
  const [visibleCount, setVisibleCount] = useState(12) // load more
  
  // Kateqoriya məlumatı
  const category = useMemo(() => {
    if (!hasHydrated || !categories) return null
    return categories.find((c) => c.slug === slug && !c.archived)
  }, [categories, slug, hasHydrated])
  
  // Filtrlənmiş məhsullar
  const filteredProducts = useMemo(() => {
    if (!category || !products) return []
    
    return products
      .filter((p) => {
        if (!p || p.archived || p.categoryId !== category.id) return false
        if (showOnlyInStock && safeStock(p) <= 0) return false
        if (onlyDiscounted && (!p.discountValue || p.discountValue <= 0)) return false
        if (onlyNew) {
          const createdAt = new Date(p.createdAt || '')
          const daysAgo = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60 * 24)
          if (daysAgo > 7) return false
        }
        const matchesSearch = !searchTerm || 
          p.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()))
        
        const currentPrice = safePrice(p)
        const matchesPrice = currentPrice >= minPrice && currentPrice <= maxPrice
        
        const productRating = p.reviews?.length 
          ? p.reviews.reduce((sum, r) => sum + (r.rating || 0), 0) / p.reviews.length 
          : 0
        const matchesRating = productRating >= minRating
        
        return matchesSearch && matchesPrice && matchesRating
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc': return safePrice(a) - safePrice(b)
          case 'price_desc': return safePrice(b) - safePrice(a)
          case 'rating': {
            const ra = a.reviews?.length ? a.reviews.reduce((s, r) => s + (r.rating || 0), 0) / a.reviews.length : 0
            const rb = b.reviews?.length ? b.reviews.reduce((s, r) => s + (r.rating || 0), 0) / b.reviews.length : 0
            return rb - ra
          }
          case 'discount': return (b.discountValue || 0) - (a.discountValue || 0)
          default: return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime()
        }
      })
  }, [category, products, searchTerm, sortBy, minPrice, maxPrice, showOnlyInStock, onlyDiscounted, minRating, onlyNew])
  
  const displayedProducts = filteredProducts.slice(0, visibleCount)
  const hasMore = filteredProducts.length > visibleCount
  
  // Filterlərin sayı (aktiv filter sayı)
  const activeFilterCount = [
    showOnlyInStock, onlyDiscounted, onlyNew, minRating > 0, searchTerm !== '', minPrice > 0 || maxPrice < 500
  ].filter(Boolean).length
  
  // Filterləri sıfırla
  const clearAllFilters = useCallback(() => {
    setSearchTerm('')
    setMinPrice(0)
    setMaxPrice(500)
    setShowOnlyInStock(false)
    setOnlyDiscounted(false)
    setMinRating(0)
    setOnlyNew(false)
    setSortBy('recent')
  }, [])
  
  // Load more
  const loadMore = useCallback(() => {
    setVisibleCount(prev => Math.min(prev + 12, filteredProducts.length))
  }, [filteredProducts.length])
  
  // Reset visible count when filters change
  useEffect(() => {
    setVisibleCount(12)
  }, [filteredProducts.length])
  
  // Səhifənin yuxarısına scroll
  const scrollToTop = useCallback(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])
  
  // Hydration olmayanda skeleton göstər
  if (!hasHydrated) return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white to-emerald-50">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto" />
        <p className="mt-4 text-emerald-800 font-bold">Yüklənir...</p>
      </div>
    </div>
  )
  
  if (!category) return notFound()
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F9FCF9] via-white to-[#F0F9F0]">
      {/* ==================== HEADER (Parallax) ==================== */}
      <div ref={scrollRef} className="relative h-[65vh] md:h-[75vh] overflow-hidden">
        <motion.div style={{ y: headerY }} className="absolute inset-0">
          {category.image ? (
            <Image src={category.image} alt={category.name} fill priority className="object-cover scale-105" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-emerald-700" />
          )}
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/20 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#F9FCF9] via-transparent to-transparent" />
        </motion.div>
        
        <motion.div style={{ opacity: headerOpacity, scale: headerScale }} className="relative z-10 h-full flex flex-col items-center justify-center text-center px-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <StatusChip icon={Sparkles} label="Premium Kolleksiya" color="bg-white/20 text-white" />
            <h1 className="mt-8 text-5xl md:text-7xl lg:text-8xl font-black text-white tracking-tighter leading-none drop-shadow-2xl">
              {category.name}
              <span className="text-emerald-300">.</span>
            </h1>
            <p className="mt-6 max-w-2xl mx-auto text-white/90 text-lg md:text-xl font-medium">
              {category.description || "Gədəbəyin ən saf dağ məhsulları – birbaşa təbiətdən süfrənizə."}
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <div className="backdrop-blur-md bg-white/20 rounded-full px-6 py-3 text-white font-bold flex items-center gap-2 shadow-lg">
                <Package className="w-5 h-5" /> {filteredProducts.length} Məhsul
              </div>
            </div>
          </motion.div>
        </motion.div>
        
        <motion.div
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-8 left-1/2 -translate-x-1/2 w-8 h-12 border-2 border-white/30 rounded-full flex justify-center p-2"
        >
          <div className="w-1.5 h-3 bg-white rounded-full animate-bounce" />
        </motion.div>
      </div>
      
      {/* ==================== STICKY FILTER BAR ==================== */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-2xl border-b border-emerald-100/50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-3 md:py-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            {/* Search */}
            <div className="relative flex-1 min-w-[180px] md:max-w-xs">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
              <input
                type="text"
                placeholder="Məhsul axtar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-emerald-50/50 border border-emerald-100 rounded-2xl py-2.5 pl-10 pr-4 text-sm focus:ring-2 focus:ring-emerald-300 focus:border-transparent transition"
              />
            </div>
            
            {/* View toggle + Sort + Filter */}
            <div className="flex items-center gap-2">
              {/* Grid/List toggle */}
              <div className="hidden sm:flex bg-emerald-50/50 rounded-xl p-1 border border-emerald-100">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition ${viewMode === 'grid' ? 'bg-white shadow text-emerald-700' : 'text-emerald-500'}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition ${viewMode === 'list' ? 'bg-white shadow text-emerald-700' : 'text-emerald-500'}`}
                >
                  <List className="w-4 h-4" />
                </button>
              </div>
              
              {/* Sort dropdown */}
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="appearance-none bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 pr-8 text-sm font-medium text-emerald-800 cursor-pointer focus:ring-2 focus:ring-emerald-300"
                >
                  <option value="recent">Ən yeni</option>
                  <option value="price_asc">Qiymət: artan</option>
                  <option value="price_desc">Qiymət: azalan</option>
                  <option value="rating">Reytinq</option>
                  <option value="discount">Endirim</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 pointer-events-none" />
              </div>
              
              {/* Filter drawer button (mobile) */}
              <button
                onClick={() => setIsFilterDrawerOpen(true)}
                className="md:hidden flex items-center gap-2 bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-2.5 text-emerald-700 font-semibold"
              >
                <Filter className="w-4 h-4" />
                {activeFilterCount > 0 && (
                  <span className="bg-emerald-600 text-white text-xs w-5 h-5 rounded-full flex items-center justify-center">
                    {activeFilterCount}
                  </span>
                )}
              </button>
            </div>
          </div>
          
          {/* Active filter chips (desktop) */}
          {(activeFilterCount > 0 || searchTerm) && (
            <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-wrap items-center gap-2 mt-3">
              {searchTerm && <ActiveFilterPill label={`Axtarış: ${searchTerm}`} onRemove={() => setSearchTerm('')} />}
              {showOnlyInStock && <ActiveFilterPill label="Yalnız stokda" onRemove={() => setShowOnlyInStock(false)} />}
              {onlyDiscounted && <ActiveFilterPill label="Endirimlilər" onRemove={() => setOnlyDiscounted(false)} />}
              {onlyNew && <ActiveFilterPill label="Yeni gələnlər" onRemove={() => setOnlyNew(false)} />}
              {minRating > 0 && <ActiveFilterPill label={`${minRating}+ ulduz`} onRemove={() => setMinRating(0)} />}
              {(minPrice > 0 || maxPrice < 500) && (
                <ActiveFilterPill label={`Qiymət: ${minPrice}₼ - ${maxPrice}₼`} onRemove={() => { setMinPrice(0); setMaxPrice(500) }} />
              )}
              <button onClick={clearAllFilters} className="text-xs text-emerald-600 font-semibold hover:underline">Hamısını təmizlə</button>
            </motion.div>
          )}
        </div>
      </div>
      
      {/* ==================== MAIN CONTENT ==================== */}
      <div className="max-w-7xl mx-auto px-4 py-8 md:py-12">
        <div className="flex flex-col md:flex-row gap-8">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden md:block w-72 shrink-0 space-y-8">
            <div className="bg-white/60 backdrop-blur-sm rounded-3xl p-6 border border-emerald-100 shadow-sm">
              <h3 className="font-black text-emerald-900 flex items-center gap-2 mb-5">
                <SlidersHorizontal className="w-5 h-5" /> Filtrlər
              </h3>
              
              {/* Price range double slider */}
              <div className="mb-6">
                <label className="text-sm font-bold text-slate-700 block mb-3">Qiymət aralığı</label>
                <div className="space-y-3">
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={minPrice}
                    onChange={(e) => setMinPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <input
                    type="range"
                    min={0}
                    max={500}
                    value={maxPrice}
                    onChange={(e) => setMaxPrice(Number(e.target.value))}
                    className="w-full accent-emerald-600"
                  />
                  <div className="flex justify-between text-sm font-medium text-emerald-700">
                    <span>{minPrice} ₼</span>
                    <span>{maxPrice} ₼</span>
                  </div>
                </div>
              </div>
              
              {/* Stock filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={showOnlyInStock} onChange={() => setShowOnlyInStock(!showOnlyInStock)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                  <span className="text-sm font-medium text-slate-700">Yalnız stokda olanlar</span>
                </label>
              </div>
              
              {/* Discount filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onlyDiscounted} onChange={() => setOnlyDiscounted(!onlyDiscounted)} className="rounded text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Endirimli məhsullar</span>
                </label>
              </div>
              
              {/* New arrivals filter */}
              <div className="mb-4">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={onlyNew} onChange={() => setOnlyNew(!onlyNew)} className="rounded text-emerald-600" />
                  <span className="text-sm font-medium text-slate-700">Son 7 gündə gələnlər</span>
                </label>
              </div>
              
              {/* Rating filter */}
              <div className="mb-4">
                <p className="text-sm font-bold text-slate-700 mb-2">Minimum reytinq</p>
                <div className="flex gap-2">
                  {[0, 3, 4].map((r) => (
                    <button
                      key={r}
                      onClick={() => setMinRating(r as any)}
                      className={`px-3 py-1.5 rounded-full text-xs font-bold transition ${minRating === r ? 'bg-emerald-600 text-white' : 'bg-emerald-50 text-emerald-700'}`}
                    >
                      {r === 0 ? 'Hamısı' : `${r}+ ★`}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            
            {/* Info card */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100/30 rounded-3xl p-6 border border-emerald-200">
              <ShieldCheck className="w-8 h-8 text-emerald-700 mb-2" />
              <h4 className="font-black text-emerald-800">100% Organik</h4>
              <p className="text-xs text-emerald-700/70 mt-1">Bütün məhsullarımız təbii və heç bir kimyəvi qatqısızdır.</p>
            </div>
          </aside>
          
          {/* Products grid/list */}
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <p className="text-sm text-slate-500">
                <span className="font-bold text-emerald-800">{filteredProducts.length}</span> məhsul tapıldı
              </p>
            </div>
            
            <AnimatePresence mode="wait">
              {filteredProducts.length === 0 ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="text-center py-20 bg-white/60 rounded-3xl border border-dashed border-emerald-200"
                >
                  <Package className="w-16 h-16 text-emerald-200 mx-auto mb-4" />
                  <h3 className="text-xl font-bold text-slate-700">Nəticə tapılmadı</h3>
                  <p className="text-slate-500 mt-2">Filtirləri dəyişdirin və ya axtarış sözünü yeniləyin.</p>
                  <button onClick={clearAllFilters} className="mt-6 px-6 py-2 bg-emerald-600 text-white rounded-full font-semibold">Filtrləri təmizlə</button>
                </motion.div>
              ) : (
                <motion.div
                  key="products"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3' : 'grid-cols-1'}`}
                >
                  <AnimatePresence>
                    {displayedProducts.map((product, idx) => (
                      <motion.div
                        key={product.id}
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        transition={{ delay: idx * 0.03, duration: 0.3 }}
                      >
                        <RusticProductCard
                          product={product}
                          currency={currency}
                          addToCart={addToCart}
                        />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* Load more button */}
            {filteredProducts.length > 0 && hasMore && (
              <div className="text-center mt-12">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={loadMore}
                  className="px-8 py-3 bg-white border-2 border-emerald-200 text-emerald-700 font-bold rounded-full shadow-md hover:bg-emerald-50 hover:border-emerald-400 transition-all"
                >
                  Daha çox yüklə ({visibleCount} / {filteredProducts.length})
                </motion.button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Scroll to top button */}
      <AnimatePresence>
        {scrollYProgress.get() > 0.1 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </AnimatePresence>
      
      {/* Mobile Filter Drawer */}
      <AnimatePresence>
        {isFilterDrawerOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
              onClick={() => setIsFilterDrawerOpen(false)}
            />
            <motion.aside
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="fixed top-0 right-0 bottom-0 w-80 bg-white z-50 shadow-2xl p-6 overflow-y-auto"
            >
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-black text-emerald-800">Filtrlər</h3>
                <button onClick={() => setIsFilterDrawerOpen(false)} className="p-2 rounded-full bg-gray-100">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              {/* Copy desktop filters here (simplified) */}
              <div className="space-y-6">
                <div>
                  <label className="text-sm font-bold block mb-2">Qiymət aralığı</label>
                  <input type="range" min={0} max={500} value={minPrice} onChange={(e) => setMinPrice(Number(e.target.value))} className="w-full" />
                  <input type="range" min={0} max={500} value={maxPrice} onChange={(e) => setMaxPrice(Number(e.target.value))} className="w-full mt-2" />
                  <div className="flex justify-between text-sm mt-2">{minPrice}₼ - {maxPrice}₼</div>
                </div>
                <label className="flex items-center gap-2"><input type="checkbox" checked={showOnlyInStock} onChange={() => setShowOnlyInStock(!showOnlyInStock)} /> Yalnız stokda</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={onlyDiscounted} onChange={() => setOnlyDiscounted(!onlyDiscounted)} /> Endirimlilər</label>
                <label className="flex items-center gap-2"><input type="checkbox" checked={onlyNew} onChange={() => setOnlyNew(!onlyNew)} /> Yeni gələnlər</label>
                <div>
                  <p className="text-sm font-bold mb-2">Minimum reytinq</p>
                  <div className="flex gap-2">
                    <button onClick={() => setMinRating(0)} className={`px-3 py-1 rounded-full text-xs ${minRating === 0 ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>Hamısı</button>
                    <button onClick={() => setMinRating(3)} className={`px-3 py-1 rounded-full text-xs ${minRating === 3 ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>3+ ★</button>
                    <button onClick={() => setMinRating(4)} className={`px-3 py-1 rounded-full text-xs ${minRating === 4 ? 'bg-emerald-600 text-white' : 'bg-gray-100'}`}>4+ ★</button>
                  </div>
                </div>
              </div>
              
              <button onClick={clearAllFilters} className="w-full mt-8 py-3 bg-emerald-100 text-emerald-700 rounded-xl font-bold">Filtrləri sıfırla</button>
              <button onClick={() => setIsFilterDrawerOpen(false)} className="w-full mt-3 py-3 bg-emerald-600 text-white rounded-xl font-bold">Tətbiq et</button>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
      
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}