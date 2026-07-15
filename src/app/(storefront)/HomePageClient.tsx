// src/app/(storefront)/HomePageClient.tsx
'use client';

import { useMemo, useState, useEffect, useCallback, useRef } from 'react';
import type { FC } from 'react';
import { motion, AnimatePresence, useScroll, useTransform } from 'framer-motion';
import { ArrowRight, ArrowUp } from 'lucide-react';
import dynamic from 'next/dynamic';
import { useApp, Product, Category, Order } from '@/lib/store';
import { finalPrice } from '@/lib/calc';
import { applyProductFilter } from '@/lib/filter';
import {
  OrganicBackgroundDecor,
  TopBarnBanner,
  CategoryStrip,
  SectionBlock,
  TrustAndUSPStrip,
  RecentViewedStrip,
  WhatsAppCTA,
  HowItWorksStrip,
  NutritionAndTipsStrip,
  OrganicSeparator,
  ProductCarousel,
} from '@/components/ui/molecules';
import {
  DEFAULT_CURRENCY,
  MAX_DISPLAYED_ITEMS,
  GEDEBEY_REGION_VARIANTS,
  MAX_POPULAR_ITEMS,
  MINIMUM_REVIEWS_FOR_MUST_TRY,
} from '@/const';
import { useCountdownTimer } from '@/hooks/useCountdownTimer';
import { useIsMobile } from '@/hooks/useIsMobile';
import { useLocalStorage } from '@/hooks/useLocalStorage';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useRecentViewed } from '@/hooks/useRecentViewed';
import { useScrollToTop } from '@/hooks/useScrollToTop';
import { useTimeOfDay } from '@/hooks/useTimeOfDay';
import { useWeather } from '@/hooks/useWeather';
import { useWishlist } from '@/hooks/useWishlist';
import {
  getProductBasePrice,
  scoreProduct,
  filterProductsByRegion,
  filterBreakfastProducts,
} from '@/utils';
import { FreshTodayStoryBar } from '@/components/ui/molecules/FreshTodayStoryBar';
import type { FreshStoryItem } from '@/components/ui/molecules/FreshTodayStoryBar';
import { FreshTodayStoryModal } from '@/components/ui/molecules/FreshTodayStoryModal';
import { ScrollProgressBar } from '@/components/common/ScrollProgressBar';
import { SkeletonLoader } from '@/components/common/SkeletonLoader';
import { MobileSearchDrawer } from '@/components/ui/molecules/MobileSearchDrawer';
import { ProductGrid } from '@/components/ui/organisms/ProductGrid';
import { HeroSection } from '@/components/ui/organisms/HeroSection';

// Lazy-load ağır komponentlər
const SeasonBanner = dynamic(
  () => import('@/components/ui/molecules/SeasonBanner').then(mod => mod.SeasonBanner),
  { ssr: false, loading: () => <div className="h-32 animate-pulse bg-gray-100 rounded-2xl" /> }
);
const WeatherSuggestionStrip = dynamic(
  () => import('@/components/ui/molecules/WeatherSuggestionStrip').then(mod => mod.WeatherSuggestionStrip),
  { ssr: false, loading: () => <div className="h-24 animate-pulse bg-gray-100 rounded-2xl" /> }
);
const FlashDealCard = dynamic(
  () => import('@/components/ui/molecules/FlashDealCard').then(mod => mod.FlashDealCard),
  { ssr: false }
);

const HowItWorksInfoModal = dynamic(
  () => import('@/components/ui/molecules/HowItWorksModal').then(mod => mod.HowItWorksModal),
  {
    ssr: false,
    loading: () => <div className="hidden" />
  }
);

interface HomePageClientProps {
  initialData: {
    products: Product[];
    categories: Category[];
    orders?: Order[];
  };
}

// ─── Köməkçi: regiona görə fermer rəngi ──────────────────
const REGION_COLORS: Record<string, string> = {
  'Gədəbəy': 'bg-emerald-500',
  'Tovuz': 'bg-amber-500',
  'Gəncə': 'bg-blue-500',
  'Şəmkir': 'bg-purple-500',
  'Daşkəsən': 'bg-rose-500',
  'Qax': 'bg-teal-500',
  'Zaqatala': 'bg-indigo-500',
};

function getFarmerColor(region: string): string {
  return REGION_COLORS[region] ?? 'bg-emerald-500';
}

// ─── Köməkçi: kateqoriya emojisi ─────────────────────────
const CATEGORY_EMOJI: Record<string, string> = {
  'meyvə': '🍎',
  'tərəvəz': '🥬',
  'süd': '🥛',
  'bal': '🍯',
  'taxıl': '🌾',
  'pendir': '🧀',
  'göyərti': '🌿',
  'yumurta': '🥚',
  'quru meyvələr': '🥜',
  'ədviyyatlar': '🌶️',
  'çaylar': '🍵',
  'şirniyyatlar': '🍪',
  'ət': '🥩',
  'digər': '🌿',
};

function getCategoryEmoji(categoryName?: string): string {
  if (!categoryName) return '🌿';
  const lower = categoryName.toLowerCase();
  for (const [key, emoji] of Object.entries(CATEGORY_EMOJI)) {
    if (lower.includes(key)) return emoji;
  }
  return '🌿';
}

export const HomePageClient: FC<HomePageClientProps> = ({ initialData }) => {
  const setProducts = useApp((state) => state.setProducts);
  const setCategories = useApp((state) => state.setCategories);
  const setOrders = useApp((state) => state.setOrders);
  const products = useApp((state) => state.products);
  const categories = useApp((state) => state.categories);
  const orders = useApp((state) => state.orders);
  const addToCart = useApp((state) => state.addToCart);
  const storefrontConfig = useApp((state) => state.storefrontConfig);

  // Store-a server məlumatlarını yüklə
  useEffect(() => {
    if (products.length === 0) setProducts(initialData.products);
    if (categories.length === 0) setCategories(initialData.categories);
    if (orders.length === 0 && initialData.orders) setOrders(initialData.orders);
  }, [products.length, categories.length, orders.length, setProducts, setCategories, setOrders]);

  // Scroll animasiyaları
  const mainRef = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: mainRef, offset: ['start start', 'end end'] });
  const mountainY = useTransform(scrollYProgress, [0, 1], ['0%', '15%']);
  const sunOpacity = useTransform(scrollYProgress, [0, 0.5, 1], [1, 0.5, 0]);
  const cloudX = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

  // State-lər
  const [storyOpen, setStoryOpen] = useState(false);
  const [storyStartIndex, setStoryStartIndex] = useState(0);
  const currency = storefrontConfig?.currency ?? DEFAULT_CURRENCY;
  const [showHowItWorks, setShowHowItWorks] = useState(false);
  const [hasSeenHowItWorks] = useLocalStorage('how-it-works-seen', false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'recommended' | 'new' | 'popular'>('recommended');

  // Hooks
  const [recentViewed, addToRecent] = useRecentViewed(products);
  const [wishlist] = useWishlist();
  const timeOfDay = useTimeOfDay();
  const [secondsLeft, formatTimer] = useCountdownTimer();
  const isMobile = useIsMobile();
  const weather = useWeather();
  const [scrollVisible, scrollToTop] = useScrollToTop();

  const handleProductView = useCallback((productId: string) => {
    addToRecent(productId);
  }, [addToRecent]);

  const greeting = useMemo(() => {
    switch (timeOfDay) {
      case 'morning': return 'Xeyirin sabahlar! ☀️';
      case 'day': return 'Xeyirli gün! 🌤️';
      case 'evening': return 'Xeyirli axşam! 🌅';
      case 'night': return 'Gecən xeyir! 🌙';
      default: return 'Salam! 👋';
    }
  }, [timeOfDay]);

  const flashDealTimer = formatTimer(secondsLeft);

  const handleRefresh = useCallback(async () => {
    setIsLoading(true);
    await new Promise((resolve) => setTimeout(resolve, 1500));
    setIsLoading(false);
  }, []);

  const isRefreshing = usePullToRefresh(handleRefresh);

  // ─── REAL DATA ilə zənginləşdirilmiş Hekayə Məhsulları ───
  const storyProducts: FreshStoryItem[] = useMemo(() => {
    if (!products.length) return [];

    // Bu günün tarix aralığı
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Bu gün satılmış məhsulların sayını hesabla (orders varsa)
    const soldTodayMap = new Map<string, number>();
    if (orders && orders.length > 0) {
      orders.forEach((order) => {
        const orderDate = new Date(order.createdAt);
        if (orderDate >= todayStart && orderDate <= todayEnd) {
          order.items?.forEach((item: any) => {
            const pid = item.productId;
            soldTodayMap.set(pid, (soldTodayMap.get(pid) || 0) + item.qty);
          });
        }
      });
    }

    // Hekayəyə uyğun məhsulları süz
    const storyCandidates = products.filter(
      (p) =>
        !p.archived &&
        (p.isNewArrival ||
         p.statusTags?.includes('newArrival') ||
         p.statusTags?.includes('seasonal') ||
         p.statusTags?.includes('fresh') ||
         p.isSeasonal)
    );

    // Sıralama: təzəlik + satış həcmi
    const sorted = storyCandidates.sort((a, b) => {
      const aTime = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const bTime = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      if (aTime !== bTime) return bTime - aTime;
      const aSold = soldTodayMap.get(a.id) || 0;
      const bSold = soldTodayMap.get(b.id) || 0;
      return bSold - aSold;
    });

    const topItems = sorted.slice(0, 12);

    return topItems.map((p): FreshStoryItem => {
      const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
      const hoursAgo = createdAt ? Math.floor((Date.now() - createdAt) / (1000 * 60 * 60)) : 0;
      const stock = p.variants?.[0]?.stock ?? p.stock ?? 0;
      const region = p.originRegion || 'Gədəbəy';

      // Fermer adı: originRegion + "Ferması"
      const farmName = region ? `${region} Ferması` : 'Gədəbəy Ferması';

      // Baş hərflər
      const initials = region
        ? region.slice(0, 2).toUpperCase()
        : 'GF';

      const soldToday = soldTodayMap.get(p.id) || 0;

      // Qiymət formatı
      const price = p.variants?.[0]?.price ?? p.basePrice;
      const pricePerUnit = `₼${Number(price).toFixed(2)}/${p.unit || 'ədəd'}`;

      // Məhsulun ilk şəkli
      const imageSrc = p.images?.[0]?.url || p.image;

      // Kateqoriya tipini təyin et
      const catName = p.category?.name?.toLowerCase() || '';
      let category: FreshStoryItem['category'] = 'digər';
      if (catName.includes('meyvə')) category = 'meyvə';
      else if (catName.includes('tərəvəz')) category = 'tərəvəz';
      else if (catName.includes('süd') || catName.includes('pendir') || catName.includes('qaymaq')) category = 'süd';
      else if (catName.includes('bal')) category = 'bal';
      else if (catName.includes('taxıl') || catName.includes('un')) category = 'taxıl';

      return {
        id: p.id,
        productName: p.name,
        farmName,
        farmerInitials: initials,
        farmerColor: getFarmerColor(region),
        region,
        category,
        hoursAgo,
        availableToday: stock > 0,
        stockLeft: stock,
        imageEmoji: getCategoryEmoji(p.category?.name),
        imageSrc,
        isNew: p.isNewArrival,
        isBestSeller: p.isFeatured,
        preOrderAvailable: false,
        pricePerUnit,
        soldToday,
        rating: (p as any).rating || (4.0 + Math.random() * 1.0),
      };
    });
  }, [products, orders]);

  // Kolleksiyalar
  const productCollections = useMemo(() => {
    const active = products.filter((p) => !p.archived);
    const viewedIds = recentViewed.map((p) => p.id);
    return {
      featuredCategories: categories.filter((c) => c.featured && !c.archived).slice(0, MAX_DISPLAYED_ITEMS),
      recommended: [...active]
        .sort((a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist))
        .slice(0, MAX_DISPLAYED_ITEMS),
      newArrivals: applyProductFilter(active, { onlyNew: true, sort: 'new' }).slice(0, MAX_DISPLAYED_ITEMS),
      discounted: applyProductFilter(active, { onlyDiscounted: true, sort: 'price-desc' }).slice(0, MAX_DISPLAYED_ITEMS),
      gedebeyProducts: filterProductsByRegion(active, GEDEBEY_REGION_VARIANTS).slice(0, MAX_DISPLAYED_ITEMS),
      popular: [...active].sort((a, b) => (b.reviews?.length || 0) - (a.reviews?.length || 0)).slice(0, MAX_POPULAR_ITEMS),
      mustTry: active.filter(
        (p) =>
          p.statusTags?.includes('mustTry') ||
          p.statusTags?.includes('bestValue') ||
          (p.reviews?.length ?? 0) >= MINIMUM_REVIEWS_FOR_MUST_TRY
      ).slice(0, MAX_DISPLAYED_ITEMS),
      breakfastPicks: filterBreakfastProducts(active).slice(0, MAX_DISPLAYED_ITEMS),
      wishlistProducts: active.filter((p) => wishlist.includes(p.id)).slice(0, MAX_DISPLAYED_ITEMS),
      seasonal: active.filter((p) => p.statusTags?.includes('seasonal')).slice(0, MAX_DISPLAYED_ITEMS),
    };
  }, [products, categories, recentViewed, wishlist]);

  const heroHighlighted = useMemo((): Product | null => {
    if (!products.length) return null;
    const viewedIds = recentViewed.map((p) => p.id);
    const hero = [...products.filter((p) => !p.archived)].sort(
      (a, b) => scoreProduct(b, viewedIds, wishlist) - scoreProduct(a, viewedIds, wishlist)
    )[0] ?? null;
    return hero;
  }, [products, recentViewed, wishlist]);

  useEffect(() => {
    if (heroHighlighted) {
      handleProductView(heroHighlighted.id);
    }
  }, [heroHighlighted, handleProductView]);

  const flashDeal = useMemo(() => {
    const product = productCollections.discounted[0];
    if (!product) return null;
    const base = getProductBasePrice(product);
    const deal = finalPrice(base, product.discountType, product.discountValue);
    return { product, dealPrice: deal, endsAt: Date.now() + 3 * 60 * 60 * 1000, sold: 47, total: 80 };
  }, [productCollections.discounted]);

  const tabProducts = useMemo(
    () => ({
      recommended: productCollections.recommended,
      new: productCollections.newArrivals,
      popular: productCollections.popular.slice(0, MAX_DISPLAYED_ITEMS),
    }),
    [productCollections]
  );

  useEffect(() => {
    if (!hasSeenHowItWorks) {
      const timer = setTimeout(() => setShowHowItWorks(true), 2000);
      return () => clearTimeout(timer);
    }
  }, [hasSeenHowItWorks]);

  // Hekayə modalı üçün real məhsullar (filtrsiz)
  const storyModalProducts = useMemo(
    () =>
      products.filter(
        (p) =>
          !p.archived &&
          (p.isNewArrival ||
            p.statusTags?.includes('newArrival') ||
            p.statusTags?.includes('seasonal') ||
            p.statusTags?.includes('fresh'))
      ).slice(0, 12),
    [products]
  );

  // ─── RENDER ──────────────────────────────────────────────────
  return (
    <main ref={mainRef} className="relative min-h-screen overflow-x-hidden bg-linear-to-b from-[#f3f9e7] via-[#fdfaf3] to-[#eef7ea]">
      {isRefreshing && (
        <div className="fixed top-0 left-0 right-0 h-1 bg-emerald-500 z-50 animate-pulse" />
      )}

      <motion.div style={{ y: mountainY }} className="fixed inset-x-0 bottom-0 pointer-events-none z-0">
        <svg viewBox="0 0 1440 320" preserveAspectRatio="none" className="w-full h-auto opacity-30">
          <path fill="#0f5c3c" fillOpacity="0.15" d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,176C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z" />
        </svg>
      </motion.div>
      <motion.div style={{ opacity: sunOpacity }} className="fixed top-10 right-10 w-64 h-64 rounded-full bg-amber-200/20 blur-3xl pointer-events-none z-0" />
      <motion.div style={{ x: cloudX }} transition={{ repeat: Infinity, duration: 40, ease: 'linear' }} className="fixed left-0 top-20 w-96 h-32 bg-white/10 blur-3xl rounded-full pointer-events-none z-0" />
      <motion.div style={{ x: useTransform(scrollYProgress, [0, 1], ['0%', '-30%']) }} transition={{ repeat: Infinity, duration: 50, ease: 'linear' }} className="fixed right-0 bottom-40 w-72 h-28 bg-white/10 blur-3xl rounded-full pointer-events-none z-0" />
      <motion.div animate={{ scale: [1, 1.1, 1], opacity: [0.2, 0.3, 0.2] }} transition={{ repeat: Infinity, duration: 8 }} className="fixed bottom-20 left-10 w-80 h-80 rounded-full bg-emerald-200/15 blur-3xl pointer-events-none z-0" />
      <motion.div animate={{ scale: [1.1, 1, 1.1], opacity: [0.15, 0.25, 0.15] }} transition={{ repeat: Infinity, duration: 12 }} className="fixed top-1/3 right-5 w-96 h-96 rounded-full bg-amber-100/15 blur-3xl pointer-events-none z-0" />

      <div className="relative z-10">
        <ScrollProgressBar />
        <OrganicBackgroundDecor />
        <MobileSearchDrawer isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} products={products} />

        <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 pb-36 pt-6 md:gap-10 md:px-6 lg:px-10">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="flex-1"
            >
              <TopBarnBanner />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-sm font-semibold text-emerald-700"
            >
              {greeting}
            </motion.p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
            >
              <SeasonBanner />
            </motion.div>
            <motion.div
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <WeatherSuggestionStrip weather={weather} />
            </motion.div>
          </div>

          <motion.div
            initial={{ scale: 0.98, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <HeroSection />
          </motion.div>
          <OrganicSeparator />

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="fresh-today" title="" subtitle="" badge="">
              <FreshTodayStoryBar
                onOpenStory={(idx) => { setStoryStartIndex(idx); setStoryOpen(true); }}
              />
            </SectionBlock>
          </motion.div>
          <FreshTodayStoryModal
            open={storyOpen}
            initialIndex={storyStartIndex}
            onClose={() => setStoryOpen(false)}
            items={storyModalProducts}
          />

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true, margin: '-100px' }}
            transition={{ duration: 0.5 }}
          >
            <CategoryStrip categories={categories} />
          </motion.div>

          {flashDeal && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              whileInView={{ scale: 1, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4 }}
            >
              <SectionBlock id="flash-deal" title="⚡ Anlıq Fırsat" subtitle={`Qalan vaxt: ${flashDealTimer}`} badge="🔥 HOT">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FlashDealCard {...flashDeal} />
                  <div className="flex flex-col gap-3 justify-center">
                    <p className="text-sm text-slate-600 leading-relaxed">
                      Gədəbəy kənd məhsullarında anlıq endirim – bu qiymət yalnız sayaç sıfırlanana qədər etibarlıdır.
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
            </motion.div>
          )}

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
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
                  ) : isMobile ? (
                    <ProductCarousel products={tabProducts[activeTab]} currency={currency} addToCart={addToCart} />
                  ) : (
                    <motion.div
                      variants={{
                        hidden: { opacity: 0 },
                        visible: { opacity: 1, transition: { staggerChildren: 0.05 } }
                      }}
                      initial="hidden"
                      animate="visible"
                    >
                      <ProductGrid products={tabProducts[activeTab]} currency={currency} addToCart={addToCart} variant="highlight" />
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </SectionBlock>
          </motion.div>

          <AnimatePresence>
            {productCollections.wishlistProducts.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4 }}
              >
                <SectionBlock id="wishlist" title="💝 Bəyəndiklərin" subtitle="Sevimli məhsulların" href="/wishlist">
                  <ProductGrid products={productCollections.wishlistProducts} currency={currency} addToCart={addToCart} variant="highlight" />
                </SectionBlock>
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="must-try" title="Mütləq dadılmalı" subtitle="Müştərilərin ən çox tövsiyə etdiyi dadlar" href="/products?tag=mustTry" badge="💚 Favoritlər">
              <ProductGrid products={productCollections.mustTry} currency={currency} addToCart={addToCart} variant="highlight" />
            </SectionBlock>
          </motion.div>

          <OrganicSeparator small />

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="discounted" title="⚡ Flash Endirim" subtitle="Məhdud sayda, bu gün üçün xüsusi qiymətlər" href="/products?discounted=true" badge="🔥 Bitir">
              <ProductGrid products={productCollections.discounted} currency={currency} addToCart={addToCart} variant="discount" />
            </SectionBlock>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="breakfast" title="Səhər süfrəsi" subtitle="Bal, qaymaq, pendir – nənə süfrəsi dadı" href="/products?tag=səhər%20yeməyi" badge="🌅 Breakfast">
              <ProductGrid products={productCollections.breakfastPicks} currency={currency} addToCart={addToCart} variant="breakfast" />
            </SectionBlock>
          </motion.div>

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="gedebey" title="Gədəbəy eksklüziv" subtitle="Dağ kəndlərindən birbaşa süfrənizə" href="/category/gedebey" badge="⛰️ Dağ kəndi">
              <ProductGrid products={productCollections.gedebeyProducts} currency={currency} addToCart={addToCart} variant="gedebey" />
            </SectionBlock>
          </motion.div>

          <TrustAndUSPStrip />

          <motion.div
            initial={{ y: 30, opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <SectionBlock id="popular" title="Ən çox sevilənlər" subtitle="Hər həftə təkrar sifariş edilən dadlar" href="/products?sort=popular">
              <ProductCarousel products={productCollections.popular} currency={currency} addToCart={addToCart} />
            </SectionBlock>
          </motion.div>

          {recentViewed.length > 0 && (
            <motion.div
              initial={{ y: 30, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <RecentViewedStrip products={recentViewed} currency={currency} addToCart={addToCart} />
            </motion.div>
          )}

          <NutritionAndTipsStrip products={products} />
          <WhatsAppCTA />
          <HowItWorksStrip onLearnMore={() => setShowHowItWorks(true)} />
        </div>

        <HowItWorksInfoModal
          open={showHowItWorks}
          onClose={() => setShowHowItWorks(false)}
        />

        {scrollVisible && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToTop}
            className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-emerald-600 text-white shadow-lg hover:bg-emerald-700 transition-all flex items-center justify-center"
            aria-label="Yuxarı çıx"
          >
            <ArrowUp className="w-5 h-5" />
          </motion.button>
        )}
      </div>
    </main>
  );
};
