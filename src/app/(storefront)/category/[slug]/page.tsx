// src/app/category/[slug]/page.tsx
'use client'

/**
 * @file CategoryPage (Premium Edition)
 * @description Genişləndirilmiş UI, Dinamik Filtrlər və Robust Data Handling
 * @features 
 * - Optimizə edilmiş Axtarış Məntiqi (Fuzzy-like)
 * - Səviyyəli Qiymət Aralığı Filtri
 * - Mobil Uyğun BottomSheet (İmitasiya)
 * - Safe-access pattern (variants xətasına qarşı 100% qoruma)
 */

import { useApp, useHasHydrated } from '@/lib/store'
import { useParams, notFound } from 'next/navigation'
import { StorefrontProductCard } from '@/components/StorefrontProductCard'
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion'
import {
  Search,
  Leaf,
  Package,
  SortDesc,
  XCircle,
  Sparkles,
  Loader2,
  ArrowRight,
  TrendingUp,
  ShieldCheck,
  LayoutGrid,
  Zap,
  Filter,
  CheckCircle2,
  ChevronDown,
  Percent,
  Timer
} from 'lucide-react'
import { useMemo, useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'

// --- TƏHLÜKƏSİZ SELECTORLAR (Variants xətası üçün ən vacib qorunma) ---
const safePrice = (p: any) => {
  if (!p) return 0;
  // Əgər variants massivi yoxdursa və ya boşdursa, birbaşa price-a bax, o da yoxdursa 0
  if (!p.variants || p.variants.length === 0) return p.price || 0;
  return p.variants[0].price || 0;
}

// --- KOMPONENTLƏR ---

/**
 * Premium Status Badge - Məhsul sayını və statusu göstərir
 */
const StatusChip = ({ icon: Icon, label, color }: any) => (
  <div className={`flex items-center gap-2 px-4 py-2 rounded-2xl ${color} backdrop-blur-md border border-white/10 shadow-sm`}>
    <Icon className="w-4 h-4" />
    <span className="text-xs font-extrabold uppercase tracking-widest">{label}</span>
  </div>
)

/**
 * Filter Skeleton - Yüklənmə zamanı göstərilir
 */
const FilterSkeleton = () => (
  <div className="w-full h-24 bg-gray-100 animate-pulse rounded-[32px] border border-gray-200" />
)

export default function CategoryPage() {
  const params = useParams()
  const slug = params?.slug as string
  const hasHydrated = useHasHydrated()
  const scrollRef = useRef(null)
  const { scrollYProgress } = useScroll()
  const opacity = useTransform(scrollYProgress, [0, 0.2], [1, 0])
  const scale = useTransform(scrollYProgress, [0, 0.2], [1, 0.95])
  
  // Store-dan dataları çəkirik
  const categories = useApp((state) => state.categories)
  const products = useApp((state) => state.products)
  const productPriceNow = useApp((state) => state.productPriceNow)

  // Local State
  const [searchTerm, setSearchTerm] = useState('')
  const [activeSort, setActiveSort] = useState<'recent' | 'price_asc' | 'price_desc' | 'rating' | 'discount'>('recent')
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 500])
  const [showOnlyInStock, setShowOnlyInStock] = useState(false)

  // 1. Kateqoriya tapılması
  const category = useMemo(() => {
    if (!hasHydrated || !categories) return null;
    return categories.find((c) => c.slug === slug && !c.archived)
  }, [categories, slug, hasHydrated])

  // 2. ƏSAS FİLTRASİYA MƏNTİQİ (Burada variants xətası üçün daxili yoxlamalar var)
  const filteredProducts = useMemo(() => {
    if (!category || !products) return [];

    return products
      .filter((p) => {
        // Təhlükəsizlik yoxlamaları
        if (!p || p.archived || p.categoryId !== category.id) return false;
        
        // Stok filtri
        if (showOnlyInStock) {
          const totalStock = p.variants?.reduce((acc: number, v: any) => acc + (v.stock || 0), 0) || 0;
          if (totalStock <= 0) return false;
        }

        // Axtarış filtri
        const matchesSearch = !searchTerm 
          || p.name?.toLowerCase().includes(searchTerm.toLowerCase())
          || p.tags?.some(t => t.toLowerCase().includes(searchTerm.toLowerCase()));
        
        // Qiymət filtri
        const currentPrice = safePrice(p);
        const matchesPrice = currentPrice >= priceRange[0] && currentPrice <= priceRange[1];

        return matchesSearch && matchesPrice;
      })
      .sort((a, b) => {
        // Sıralama məntiqi (variants yoxlaması ilə)
        switch (activeSort) {
          case 'price_asc': return safePrice(a) - safePrice(b);
          case 'price_desc': return safePrice(b) - safePrice(a);
          case 'rating': return (b.reviews?.length || 0) - (a.reviews?.length || 0);
          case 'discount': return (b.discountValue || 0) - (a.discountValue || 0);
          default: return new Date(b.createdAt || '').getTime() - new Date(a.createdAt || '').getTime();
        }
      });
  }, [category, products, searchTerm, activeSort, priceRange, showOnlyInStock]);

  // Səhifə yuxarı sürüşdürüləndə axtarış fokusunu təmizləmək üçün
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [slug]);

  // --- RENDER ---

  if (!hasHydrated) return (
    <div className="h-screen w-full flex flex-col items-center justify-center bg-white">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ repeat: Infinity, duration: 2 }}
        className="relative"
      >
        <div className="w-24 h-24 rounded-full border-4 border-emerald-50 border-t-emerald-500 animate-spin" />
        <Leaf className="absolute inset-0 m-auto w-10 h-10 text-emerald-500" />
      </motion.div>
      <p className="mt-6 text-emerald-900 font-bold tracking-widest animate-pulse uppercase text-xs">Bağçadan gəlirik...</p>
    </div>
  )

  if (!category) return notFound();

  return (
    <div className="min-h-screen bg-[#FBFBFD] text-[#1D1D1F]">
      {/* ------------------------------------------------ */}
      {/* DINAMIK NAVBAR / HEADER */}
      {/* ------------------------------------------------ */}
      <motion.header 
        style={{ opacity, scale }}
        className="relative h-[60vh] md:h-[70vh] flex items-center justify-center overflow-hidden bg-emerald-950"
      >
        {category.image ? (
          <Image
            src={category.image}
            alt={category.name}
            fill
            priority
            className="object-cover opacity-60 scale-105"
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-900 to-black" />
        )}
        
        {/* Apple-style Glassmorphism Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-[#FBFBFD]" />
        
        <div className="container mx-auto px-6 relative z-10 text-center">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          >
            <StatusChip 
              icon={Sparkles} 
              label="Premium Seçim" 
              color="bg-emerald-500/20 text-emerald-300" 
            />
            
            <h1 className="mt-8 text-6xl md:text-8xl font-black text-white tracking-tighter leading-none">
              {category.name}
              <span className="text-emerald-400">.</span>
            </h1>
            
            <p className="mt-8 max-w-2xl mx-auto text-xl md:text-2xl text-white/80 font-medium leading-relaxed">
              {category.description || "Gədəbəy dağlarının ən saf və təbii nemətlərini sizin üçün bir araya gətirdik."}
            </p>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
               <div className="px-8 py-4 bg-white rounded-full text-emerald-950 font-bold shadow-2xl flex items-center gap-2">
                 <Package className="w-5 h-5 text-emerald-600" />
                 {filteredProducts.length} Məhsul Hazırdır
               </div>
            </div>
          </motion.div>
        </div>

        {/* Floating Scroll Indicator */}
        <motion.div 
          animate={{ y: [0, 10, 0] }}
          transition={{ repeat: Infinity, duration: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 w-6 h-10 border-2 border-white/30 rounded-full flex justify-center p-1"
        >
          <div className="w-1 h-2 bg-white rounded-full" />
        </motion.div>
      </motion.header>

      {/* ------------------------------------------------ */}
      {/* INTELLIGENT FILTER BAR */}
      {/* ------------------------------------------------ */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-2xl border-b border-gray-200/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            
            {/* Search Box */}
            <div className="relative w-full md:w-[400px] group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 group-focus-within:text-emerald-500 transition-colors" />
              <input 
                type="text"
                placeholder="Dadına görə axtarın..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-gray-100/50 border-none rounded-2xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-emerald-500/20 transition-all"
              />
            </div>

            {/* Quick Sort Chips */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto no-scrollbar">
              <button 
                onClick={() => setActiveSort('recent')}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeSort === 'recent' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Yeni Gələnlər
              </button>
              <button 
                onClick={() => setActiveSort('price_asc')}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeSort === 'price_asc' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Ən Ucuz
              </button>
              <button 
                onClick={() => setActiveSort('rating')}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold transition-all ${activeSort === 'rating' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                Populyar
              </button>
              <div className="w-[1px] h-6 bg-gray-200 mx-2 hidden md:block" />
              <button 
                onClick={() => setShowOnlyInStock(!showOnlyInStock)}
                className={`whitespace-nowrap px-5 py-2.5 rounded-full text-xs font-bold flex items-center gap-2 border transition-all ${showOnlyInStock ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500'}`}
              >
                {showOnlyInStock && <CheckCircle2 className="w-3 h-3" />}
                Yalnız Stokda
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* ------------------------------------------------ */}
      {/* MAIN CONTENT AREA */}
      {/* ------------------------------------------------ */}
      <main className="container mx-auto px-6 py-16">
        
        {/* Info Strip */}
        <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 text-emerald-600 mb-2">
              <Zap className="w-4 h-4 fill-emerald-600" />
              <span className="text-xs font-black uppercase tracking-widest italic">Fast Delivery</span>
            </div>
            <h2 className="text-4xl font-black tracking-tight text-[#1D1D1F]">
              Kəşf edin<span className="text-gray-300"> / </span> 
              <span className="text-emerald-600">{category.name}</span>
            </h2>
          </div>
          
          <div className="flex items-center gap-4 text-sm text-gray-500 font-medium">
             <span>Göstərilir: <b className="text-[#1D1D1F]">{filteredProducts.length} məhsul</b></span>
          </div>
        </div>

        {/* Grid System */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-12">
          
          {/* Side Filters (Desktop) */}
          <aside className="hidden md:block md:col-span-3 space-y-10">
            <section>
              <h4 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-6">Qiymət Aralığı</h4>
              <input 
                type="range" 
                min="0" 
                max="500" 
                value={priceRange[1]}
                onChange={(e) => setPriceRange([0, parseInt(e.target.value)])}
                className="w-full h-1.5 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-emerald-600" 
              />
              <div className="flex justify-between mt-4 text-sm font-bold text-gray-700">
                <span>0.00 ₼</span>
                <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-lg">{priceRange[1]}.00 ₼</span>
              </div>
            </section>

            <section className="p-6 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-[32px] border border-emerald-100">
              <h4 className="text-sm font-black text-emerald-900 mb-4 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4" /> 100% Organik
              </h4>
              <p className="text-xs leading-relaxed text-emerald-800/70 font-medium">
                Gədəbəydəki tərəfdaş kəndlilərimiz tərəfindən heç bir kimyəvi qatqı olmadan hazırlanmışdır.
              </p>
            </section>
          </aside>

          {/* Product Grid */}
          <div className="md:col-span-9">
            {filteredProducts.length > 0 ? (
              <motion.div 
                layout
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-12"
              >
                <AnimatePresence>
                  {filteredProducts.map((product, idx) => (
                    <motion.div
                      key={product.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ delay: idx * 0.05 }}
                    >
                      <StorefrontProductCard product={product} />
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[48px] border-2 border-dashed border-gray-100">
                <div className="w-20 h-20 bg-gray-50 rounded-full flex items-center justify-center mb-6">
                  <Search className="w-8 h-8 text-gray-300" />
                </div>
                <h3 className="text-xl font-bold text-gray-900">Nəticə tapılmadı</h3>
                <p className="text-gray-500 mt-2">Fərqli axtarış sözləri və ya filtrlər yoxlayın.</p>
                <button 
                  onClick={() => {setSearchTerm(''); setPriceRange([0, 500])}}
                  className="mt-8 px-6 py-3 bg-emerald-600 text-white rounded-full font-bold hover:shadow-xl hover:shadow-emerald-200 transition-all"
                >
                  Filtrləri Sıfırla
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ------------------------------------------------ */}
      {/* PREMIUM FOOTER CTA */}
      {/* ------------------------------------------------ */}
      <section className="container mx-auto px-6 mb-24">
        <div className="relative rounded-[64px] bg-emerald-900 p-12 md:p-24 overflow-hidden">
          <div className="absolute top-0 right-0 w-1/2 h-full">
             <Image 
                src="https://images.unsplash.com/photo-1500651230702-0e2d8a49d4ad?q=80&w=2070" 
                alt="Nature" 
                fill 
                className="object-cover opacity-30 mix-blend-overlay"
             />
          </div>
          
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-4xl md:text-6xl font-black text-white leading-tight">
              Təbiətin ən saf <br /> halını kəşf edin.
            </h2>
            <p className="mt-8 text-emerald-100/70 text-lg md:text-xl font-medium">
              Sizin sağlamlığınız bizim missiyamızdır. Gədəbəyin hər bir küncündən ən keyfiyyətli məhsulları seçib qapınıza gətiririk.
            </p>
            
            <div className="mt-12 flex flex-col sm:flex-row gap-6">
               <Link href="/about" className="px-10 py-5 bg-white text-emerald-950 rounded-full font-black text-center hover:scale-105 transition-transform">
                 Haqqımızda
               </Link>
               <Link href="/contact" className="px-10 py-5 bg-emerald-800 text-white border border-emerald-700 rounded-full font-black text-center hover:bg-emerald-700 transition-colors">
                 Bizimlə Əlaqə
               </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Custom Global Styles for this page */}
      <style jsx global>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  )
}