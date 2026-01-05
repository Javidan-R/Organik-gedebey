
'use client';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { motion } from 'framer-motion';
import {
  Star,
  Heart,
  ShoppingCart,
  ChevronLeft,
  AlertTriangle,
  Tag,
  Leaf,
  Minus,
  Plus,
  Truck,
  RotateCw,
  Zap,
  Clock, 
  Users, 
  Check,
  ShieldCheck, // Trust
  MessageSquare, // Reviews
  Info,
  BookOpen,
  ClipboardList,
} from 'lucide-react';

// Fərz edilir ki, bu importlar mövcuddur
import {
  useApp,
  useHasHydrated,
  type Product,
  type Variant,
  finalPrice,
  type Review,
} from '@/lib/store';


// =========================================================================
// 1. TİPLƏR VƏ CONSTANTLAR
// =========================================================================

const formatPrice = (price: number) => price.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ',');

// Mock data (store-dan gəlməlidir, lakin müstəqil işləmək üçün daxil edilir)
const mockSpecs = [
    { label: 'Çəki/Həcm', value: '500 q' },
    { label: 'İstehsal Ölkəsi', value: 'Azərbaycan' },
    { label: 'Qidalanma Dəyəri', value: 'Protein 15g, Yağ 10g' },
    { label: 'Saxlanma Şərtləri', value: 'Sərin və quru yerdə saxlayın' },
];
const mockRelatedProducts = [
    { id: '101', name: 'Gədəbəy Balı', price: 25.00, image: '/mock/honey.jpg' },
    { id: '102', name: 'Dağ Kəklikotu', price: 8.50, image: '/mock/thyme.jpg' },
];
const mockDeliveryInfo = [
    { icon: Truck, label: 'Bakı daxili pulsuz çatdırılma', detail: '100 ₼-dan yuxarı sifarişlərə' },
    { icon: RotateCw, label: '30 gün zəmanət', detail: 'Əminliklə alış edin' },
    { icon: ShieldCheck, label: '100% Təhlükəsiz Ödəniş', detail: 'SSL sertifikatı ilə qorunur' },
];


// --- Layout Wrapper ---
const ProductDetailLayout = ({ children }: { children: ReactNode }) => (
  <motion.main
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ duration: 0.5 }}
    className="mx-auto max-w-6xl px-4 py-8 md:py-12 bg-white rounded-3xl shadow-2xl my-5"
  >
    {children}
  </motion.main>
);

// =========================================================================
// 2. MAIN COMPONENT
// =========================================================================

export default function ProductDetailPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const hasHydrated = useHasHydrated();

  const products = useApp((s) => s.products || []);
  const addToCart = useApp((s) => s.addToCart);
  const isFavorite = useApp((s) => s.isFavorite);
  const toggleFavorite = useApp((s) => s.toggleFavorite);

  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [mainImageIndex, setMainImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [countdown, setCountdown] = useState(3600); 

  const product: Product | undefined = useMemo(
    () => products.find((p) => p.slug === slug),
    [products, slug],
  );

  useEffect(() => {
    setSelectedVariantIndex(0);
    setMainImageIndex(0);
    setQuantity(1);
    setCountdown(3600); 
  }, [product?.id]);
  
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setInterval(() => {
        setCountdown(c => (c > 0 ? c - 1 : 0));
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const hasVariants = !!product?.variants?.length;
  const selectedVariant: Variant | undefined = useMemo(() => {
    if (!product || !hasVariants) return undefined;
    const idx = Math.min(
      selectedVariantIndex,
      product.variants.length - 1,
    );
    return product.variants[idx];
  }, [product, hasVariants, selectedVariantIndex]);

  const mainImage = useMemo(() => {
    if (!product) return undefined;
    const img = product.images?.[mainImageIndex];
    return typeof img === 'string' ? img : img?.url;
  }, [product, mainImageIndex]);

  const basePrice = useMemo(() => {
    if (!product) return 0;
    return selectedVariant?.price ?? product.variants?.[0]?.price ?? product.price ?? 0;
  }, [product, selectedVariant]);

  const finalPriceValue = useMemo(() => {
    if (!product) return 0;
    return finalPrice(
      basePrice,
      product.discountType,
      product.discountValue,
    );
  }, [product, basePrice]);

  const hasDiscount =
    !!product &&
    !!product.discountType &&
    !!product.discountValue &&
    basePrice > 0 &&
    finalPriceValue < basePrice;

  const discountPercent = useMemo(() => {
    if (!hasDiscount || basePrice <= 0) return 0;
    const off = 1 - finalPriceValue / basePrice;
    return Math.round(off * 100);
  }, [hasDiscount, basePrice, finalPriceValue]);

  const rating = useMemo(() => {
    if (!product?.reviews?.length) return 0;
    const sum = product.reviews.reduce(
      (s, r) => s + (r.rating || 0),
      0,
    );
    return sum / product.reviews.length;
  }, [product]);

  const reviewCount = product?.reviews?.length || 0;

  const stockCount = useMemo(() => {
    if (!selectedVariant) return product?.stock ?? 0;
    return selectedVariant.stock ?? 0;
  }, [product, selectedVariant]);

  const totalMinStock = product?.minStock ?? 5; 
  const lowStock = stockCount > 0 && stockCount <= totalMinStock;
  const isOutOfStock = stockCount <= 0;
  
  // Handlers
  const handleAddToCart = useCallback(() => {
    if (!product || !selectedVariant || isOutOfStock || quantity < 1) return;
    addToCart(product.id, selectedVariant.id, quantity);
    alert(`${product.name} (${selectedVariant.name || 'Seçim'}) x${quantity} səbətə əlavə edildi!`);
  }, [product, selectedVariant, addToCart, quantity, isOutOfStock]);
  
  const handleBuyNow = useCallback(() => {
    if (!product || !selectedVariant || isOutOfStock || quantity < 1) return;
    handleAddToCart(); 
    router.push('/checkout'); 
  }, [handleAddToCart, router, product, selectedVariant, isOutOfStock, quantity]);


  const isFav = product ? isFavorite(product.id) : false;

  // =====================
  // LOADING / NOT FOUND Handlers
  // =====================

  if (!hasHydrated || !product) {
      // Əvvəlki cavabdakı loading/not found UI-ı nəzərə alınır
      return (
        <main className="mx-auto max-w-5xl px-4 py-10">
            {/* Mock loading state */}
            {!hasHydrated ? (
                <div className="mt-4 grid gap-6 md:grid-cols-2">
                    <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
                    <div className="space-y-3">
                        <div className="h-6 w-40 animate-pulse rounded bg-slate-200" />
                        <div className="h-4 w-24 animate-pulse rounded bg-slate-200" />
                        <div className="h-24 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                </div>
            ) : (
                <div className="mx-auto max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-sm text-center">
                    <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                    <h1 className="mt-3 text-lg font-semibold text-slate-900">Məhsul tapılmadı</h1>
                </div>
            )}
        </main>
      );
  }

  // =====================
  // RENDER MAIN UI
  // =====================

  return (
    <div className='min-h-screen bg-slate-50'>
        <MobileNavHeader router={router} isFav={isFav} toggleFavorite={() => toggleFavorite(product.id)} />
        <ProductDetailLayout>
            <button
                type="button"
                onClick={() => router.back()}
                className="mb-6 hidden md:inline-flex items-center gap-1 text-sm font-medium text-slate-600 hover:text-emerald-700"
            >
                <ChevronLeft className="h-4 w-4" />
                Bütün məhsullara qayıt
            </button>
            
            <TrendingNowBanner />

            <div className="grid gap-10 lg:grid-cols-[1.1fr,1.4fr] lg:gap-12">
                {/* LEFT: IMAGE / GALLERY */}
                <motion.section 
                    initial={{ opacity: 0, x: -20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5 }}
                    className="space-y-4"
                >
                    <div className="relative overflow-hidden rounded-3xl bg-emerald-50 shadow-xl">
                        {mainImage ? (
                            <Image
                                key={mainImage}
                                src={mainImage}
                                alt={product.name}
                                width={800}
                                height={800}
                                className="h-full w-full object-cover aspect-square transition duration-500 hover:scale-[1.03]"
                            />
                        ) : (
                            <div className="flex aspect-square items-center justify-center text-emerald-200">
                                <Leaf className="h-16 w-16" />
                            </div>
                        )}

                        {hasDiscount && (
                            <motion.span 
                                initial={{ scale: 0 }} 
                                animate={{ scale: 1 }}
                                className="absolute left-4 top-4 rounded-full bg-red-600 px-3 py-1 text-sm font-bold text-white shadow-lg"
                            >
                                −{discountPercent}% ENDİRİM
                            </motion.span>
                        )}
                        {lowStock && (
                             <span className="absolute right-4 top-4 rounded-full bg-amber-100 px-3 py-1 text-[11px] font-semibold text-amber-800 shadow">
                                Son {stockCount} ədəd
                            </span>
                        )}
                    </div>
                     {/* Thumbnails */}
                    <div className="flex gap-3 overflow-x-auto pb-1">
                        {(product.images || []).map((img, idx) => {
                            const url = typeof img === 'string' ? img : img.url;
                            return (
                                <button
                                    key={idx}
                                    type="button"
                                    onClick={() => setMainImageIndex(idx)}
                                    className={`relative h-20 w-20 shrink-0 overflow-hidden rounded-xl border-2 transition-all duration-300 ${
                                    mainImageIndex === idx
                                        ? 'border-emerald-600 ring-4 ring-emerald-100'
                                        : 'border-slate-200 opacity-70 hover:opacity-100'
                                    }`}
                                >
                                    {url ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={url}
                                        alt={`${product.name} thumbnail ${idx + 1}`}
                                        className="h-full w-full object-cover"
                                    />
                                    ) : (
                                    <div className="flex h-full w-full items-center justify-center text-slate-300">
                                        <Leaf className="h-6 w-6" />
                                    </div>
                                    )}
                                </button>
                            );
                        })}
                    </div>
                </motion.section>

                {/* RIGHT: INFO & ACTIONS */}
                <motion.section 
                    initial={{ opacity: 0, x: 20 }} 
                    animate={{ opacity: 1, x: 0 }} 
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="space-y-6"
                >
                    <header className="space-y-3">
                        <div className="flex flex-wrap items-center gap-2">
                            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-700">
                                <Leaf className="h-3 w-3" />
                                Organik Gədəbəy məhsulu
                            </span>
                            {product.tags?.length > 0 && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-600">
                                    <Tag className="h-3 w-3" />
                                    {product.tags.slice(0, 3).join(', ')}
                                </span>
                            )}
                        </div>
                        
                        <h1 className="text-3xl font-extrabold text-slate-900 md:text-4xl">
                            {product.name}
                        </h1>
                        <p className='text-sm text-slate-500 font-medium'>{product.subtitle || 'Təsvir əlavə edilməyib.'}</p>

                        <RatingAndReview
                            rating={rating}
                            reviewCount={reviewCount}
                        />
                    </header>

                    {hasDiscount && <CountdownTimer seconds={countdown} />}
                    
                    {/* YENİ: PRICE BLOCK */}
                    <PriceBlock 
                        finalPriceValue={finalPriceValue}
                        basePrice={basePrice}
                        hasDiscount={hasDiscount}
                        selectedVariant={selectedVariant}
                    />

                    <div className='space-y-4'>
                        {/* YENİ: STOCK INDICATOR */}
                        <StockIndicator 
                            stockCount={stockCount} 
                            lowStock={lowStock} 
                            isOutOfStock={isOutOfStock}
                            minStock={totalMinStock}
                        />
                        {/* YENİ: VARIANT SELECTOR */}
                        <VariantSelector 
                            product={product}
                            basePrice={basePrice}
                            selectedVariantIndex={selectedVariantIndex}
                            setSelectedVariantIndex={setSelectedVariantIndex}
                        />
                    </div>

                    {/* YENİ: QUANTITY & ACTIONS */}
                    <div className="flex flex-col gap-3 pt-3 sm:flex-row sm:items-center">
                        <QuantitySelector quantity={quantity} setQuantity={setQuantity} stockCount={stockCount} />
                        <AddToCartActions 
                            hasVariants={hasVariants}
                            isOutOfStock={isOutOfStock}
                            handleAddToCart={handleAddToCart}
                            handleBuyNow={handleBuyNow} 
                            isFav={isFav}
                            toggleFavorite={() => toggleFavorite(product.id)}
                        />
                    </div>
                    
                    {/* YENİ: TRUST/DELIVERY INFO */}
                    <TrustAndDelivery />

                </motion.section>
            </div>
            
            {/* BOTTOM SECTIONS: DESCRIPTION, SPECS, REVIEWS */}
            <div className="mt-12 grid gap-10 lg:grid-cols-3">
                {/* DESCRIPTION & SPECS */}
                <div className='lg:col-span-2 space-y-8'>
                    {/* YENİ: DESCRIPTION SECTION */}
                    <DescriptionSection description={product.description} />
                    {/* YENİ: PRODUCT SPECS TABLE */}
                    <ProductSpecsTable specs={mockSpecs} />
                </div>
                
                {/* REVIEWS & RECOMMENDATIONS */}
                <div className='lg:col-span-1 space-y-8'>
                    {/* YENİ: REVIEWS SECTION */}
                    <ReviewsSection reviews={product.reviews || []} rating={rating} reviewCount={reviewCount} />
                    {/* YENİ: RELATED PRODUCTS */}
                    <RelatedProducts relatedProducts={mockRelatedProducts} />
                </div>
            </div>
        </ProductDetailLayout>
        
        {/* YENİ: STICKY FOOTER FOR MOBILE */}
        <StickyFooter 
            finalPriceValue={finalPriceValue}
            quantity={quantity}
            setQuantity={setQuantity}
            handleAddToCart={handleAddToCart}
            handleBuyNow={handleBuyNow}
            isOutOfStock={isOutOfStock}
            stockCount={stockCount}
        />
    </div>
  );
}

// =========================================================================
// 3. SUB-COMPONENTS (Gücləndirilmiş UI və Marketing)
// =========================================================================

// --- MobileNavHeader ---
function MobileNavHeader({ router, isFav, toggleFavorite }: { router: any, isFav: boolean, toggleFavorite: () => void }) {
    return (
        <div className="sticky top-0 z-50 flex justify-between items-center p-4 bg-white/95 backdrop-blur-sm border-b border-slate-100 md:hidden">
            <button
                type="button"
                onClick={() => router.back()}
                className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
            >
                <ChevronLeft className="h-5 w-5" />
            </button>
            <div className='flex items-center gap-2'>
                 <motion.button
                    type="button"
                    onClick={toggleFavorite}
                    className={`p-2 rounded-full transition-all ${
                        isFav ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                    whileTap={{ scale: 0.9 }}
                >
                    <Heart
                        className={`h-5 w-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`}
                    />
                </motion.button>
                <button
                    type="button"
                    onClick={() => router.push('/cart')}
                    className="p-2 rounded-full bg-slate-100 text-slate-700 hover:bg-slate-200"
                >
                    <ShoppingCart className="h-5 w-5" />
                </button>
            </div>
        </div>
    );
}

// --- TrendingNowBanner (FOMO) ---
function TrendingNowBanner() {
    const viewers = useMemo(() => Math.floor(Math.random() * 10) + 5, []);
    
    return (
        <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="flex items-center justify-center gap-2 mb-6 p-2 rounded-xl bg-orange-50 border border-orange-200 text-sm font-semibold text-orange-800 shadow-md"
        >
            <Users className="h-4 w-4 fill-orange-400 text-orange-400 animate-pulse" />
            Hal-hazırda **{viewers} nəfər** bu məhsula baxır! Sürətli olun.
        </motion.div>
    );
}

// --- CountdownTimer (Scarcity) ---
function CountdownTimer({ seconds }: { seconds: number }) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    
    if (seconds <= 0) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center justify-center gap-3 p-3 rounded-xl bg-red-600 text-white font-bold shadow-lg shadow-red-500/50"
        >
            <Clock className="h-5 w-5" />
            <span className='text-sm uppercase'>Endirim Bitməsinə Qaldı:</span>
            <div className='flex items-center gap-1 text-xl'>
                <span className='bg-red-800 p-1 rounded-md min-w-[30px] text-center'>{String(h).padStart(2, '0')}</span>:
                <span className='bg-red-800 p-1 rounded-md min-w-[30px] text-center'>{String(m).padStart(2, '0')}</span>:
                <span className='bg-red-800 p-1 rounded-md min-w-[30px] text-center'>{String(s).padStart(2, '0')}</span>
            </div>
        </motion.div>
    );
}

// --- RatingAndReview ---
function RatingAndReview({ rating, reviewCount }: { rating: number, reviewCount: number }) {
    if (reviewCount === 0) {
        return <p className='text-xs text-slate-500'>Hələ rəy yoxdur. Birinci rəyi siz yazın!</p>
    }
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 !== 0;

    return (
        <div className="flex items-center gap-3 text-xs text-slate-600">
            <span className="inline-flex items-center gap-0.5">
                {[...Array(5)].map((_, i) => (
                    <Star 
                        key={i} 
                        className={`h-4 w-4 ${
                            i < fullStars ? 'fill-yellow-500 text-yellow-500' : 
                            (i === fullStars && hasHalfStar) ? 'fill-yellow-500/50 text-yellow-500' : 
                            'text-slate-300'
                        }`}
                    />
                ))}
            </span>
            <span className="font-semibold text-slate-900">{rating.toFixed(1)} Rey</span>
            <span className="text-slate-500">· {reviewCount} rəyə əsasən</span>
        </div>
    );
}


// 4. ƏSAS KOMPONENTLƏRİN DAHİL EDİLMƏSİ

// --- PriceBlock (Qiymət Vurğusu) ---
function PriceBlock({ finalPriceValue, basePrice, hasDiscount, selectedVariant }: {
    finalPriceValue: number;
    basePrice: number;
    hasDiscount: boolean;
    selectedVariant?: Variant;
}) {
    return (
        <div className="flex items-baseline gap-3 border-y border-slate-100 py-4">
            <span className="text-4xl font-extrabold text-emerald-700">
                {formatPrice(finalPriceValue)} ₼
            </span>
            {hasDiscount && (
                <span className="text-xl font-medium text-slate-400 line-through">
                    {formatPrice(basePrice)} ₼
                </span>
            )}
            {selectedVariant?.name && (
                <span className='text-sm text-slate-500 font-medium ml-2'>
                    ({selectedVariant.name})
                </span>
            )}
        </div>
    );
}


// --- StockIndicator (Təcili Stok Məlumatı) ---
function StockIndicator({ stockCount, lowStock, isOutOfStock, minStock }: {
    stockCount: number;
    lowStock: boolean;
    isOutOfStock: boolean;
    minStock: number;
}) {
    let text;
    let color;
    let Icon = Check;

    if (isOutOfStock) {
        text = 'Stokda yoxdur';
        color = 'text-red-600 bg-red-100';
        Icon = AlertTriangle;
    } else if (lowStock) {
        text = `Tələsin! Stokda cəmi ${stockCount} ədəd qalıb.`;
        color = 'text-orange-700 bg-orange-100';
        Icon = Zap;
    } else {
        text = 'Hazırda stokda mövcuddur.';
        color = 'text-emerald-700 bg-emerald-100';
        Icon = Check;
    }

    return (
        <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex items-center gap-2 rounded-xl p-3 text-sm font-semibold ${color}`}
        >
            <Icon className="h-4 w-4 shrink-0" />
            {text}
        </motion.div>
    );
}

// --- VariantSelector (Qiymət fərqi vurğusu gücləndirildi) ---
function VariantSelector({ product, basePrice, selectedVariantIndex, setSelectedVariantIndex }: {
    product: Product;
    basePrice: number; 
    selectedVariantIndex: number;
    setSelectedVariantIndex: (i: number) => void;
}) {
    const hasVariants = !!product.variants?.length;
    if (!hasVariants) return null;
    
    // Fərz edilir ki, variantFinalPrice store.ts-dən gəlir.
    const variantFinalPrice = (p: Product, v: Variant) => finalPrice(v.price ?? p.price ?? 0, p.discountType, p.discountValue);
    
    return (
        <div className="space-y-2">
            <h2 className="text-sm font-semibold text-slate-900">
                Variant Seçimi: <span className='text-emerald-600 font-bold'>{product.variants![selectedVariantIndex].name}</span>
            </h2>
            <div className="flex flex-wrap gap-3">
                {product.variants!.map((v, idx) => {
                    const finalVarPrice = variantFinalPrice(product, v);
                    const currentFinalPrice = finalPrice(basePrice, product.discountType, product.discountValue);
                    
                    const priceDiff = finalVarPrice - currentFinalPrice;
                    const isSelected = selectedVariantIndex === idx;

                    return (
                        <motion.button
                            key={v.id}
                            type="button"
                            onClick={() => setSelectedVariantIndex(idx)}
                            className={`inline-flex flex-col items-start rounded-xl border-2 px-4 py-2 text-sm transition-all duration-200 ${
                                isSelected
                                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 shadow-lg ring-4 ring-emerald-100'
                                    : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:shadow-sm'
                            }`}
                            whileHover={{ scale: isSelected ? 1 : 1.03 }}
                        >
                            <span className='font-bold'>{v.name}</span>
                            <div className='flex items-center text-xs mt-0.5'>
                                {priceDiff !== 0 && (
                                    <span className={`font-bold ${priceDiff > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
                                        {priceDiff > 0 ? '+' : ''}{formatPrice(priceDiff)} ₼
                                    </span>
                                )}
                                {priceDiff === 0 && <span className='text-slate-500'>Eyni Qiymət</span>}
                                {v.stock !== null && v.stock !== undefined && (
                                    <span className={`ml-2 text-[10px] font-medium ${v.stock <= 0 ? 'text-red-500' : 'text-slate-400'}`}>
                                        ({v.stock > 0 ? `${v.stock} ədəd` : 'Stok Yoxdur'})
                                    </span>
                                )}
                            </div>
                        </motion.button>
                    );
                })}
            </div>
        </div>
    );
}

// --- QuantitySelector ---
function QuantitySelector({ quantity, setQuantity, stockCount }: {
    quantity: number;
    setQuantity: (q: number) => void;
    stockCount: number;
}) {
    const handleDecrement = () => setQuantity(Math.max(1, quantity - 1));
    const handleIncrement = () => setQuantity(Math.min(stockCount, quantity + 1));
    
    return (
        <div className="flex items-center rounded-xl border border-slate-200 bg-white shadow-sm p-1">
            <button
                type="button"
                onClick={handleDecrement}
                disabled={quantity <= 1}
                className="p-2 disabled:opacity-50 transition-colors hover:bg-slate-100 rounded-lg text-slate-700"
            >
                <Minus className="h-4 w-4" />
            </button>
            <span className="w-10 text-center text-sm font-bold text-slate-900">{quantity}</span>
            <button
                type="button"
                onClick={handleIncrement}
                disabled={quantity >= stockCount}
                className="p-2 disabled:opacity-50 transition-colors hover:bg-slate-100 rounded-lg text-slate-700"
            >
                <Plus className="h-4 w-4" />
            </button>
        </div>
    );
}

// --- AddToCartActions ---
function AddToCartActions({ hasVariants, isOutOfStock, handleAddToCart, handleBuyNow, isFav, toggleFavorite }: {
    hasVariants: boolean;
    isOutOfStock: boolean;
    handleAddToCart: () => void;
    handleBuyNow: () => void;
    isFav: boolean;
    toggleFavorite: () => void;
}) {
    const disabled = isOutOfStock || !hasVariants;
    
    return (
        <div className="flex flex-col gap-3 flex-1">
            <div className='flex gap-2'>
                {/* Add to Cart */}
                <motion.button
                    type="button"
                    disabled={disabled}
                    onClick={handleAddToCart}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all transform active:scale-[0.99] ${
                        disabled
                            ? 'bg-slate-400 cursor-not-allowed shadow-slate-300/50'
                            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-500/50'
                    }`}
                    whileHover={{ y: disabled ? 0 : -2 }}
                >
                    <ShoppingCart className="h-4 w-4" />
                    {isOutOfStock ? 'Stokda Yoxdur' : 'Səbətə Əlavə Et'}
                </motion.button>
                
                {/* Favorite */}
                <motion.button
                    type="button"
                    onClick={toggleFavorite}
                    className={`flex-shrink-0 inline-flex items-center justify-center rounded-xl border px-3 py-3 text-sm font-semibold transition-all duration-300 ${
                        isFav
                            ? 'border-rose-300 bg-rose-50 text-rose-700 hover:bg-rose-100'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-emerald-300 hover:bg-slate-50'
                    }`}
                    whileHover={{ scale: 1.05 }}
                >
                    <Heart
                        className={`h-5 w-5 ${isFav ? 'fill-rose-500 text-rose-500' : 'text-slate-500'}`}
                    />
                </motion.button>
            </div>
            
            {/* Buy Now Button (Fokuslanmış Satış) */}
            <motion.button
                type="button"
                disabled={disabled}
                onClick={handleBuyNow}
                className={`w-full inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all transform active:scale-[0.99] ${
                    disabled
                        ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                        : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500 shadow-md shadow-yellow-300/50'
                }`}
                whileHover={{ y: disabled ? 0 : -2 }}
            >
                <Zap className="h-4 w-4" />
                İndi Al (Təcili Kassa)
            </motion.button>
        </div>
    );
}

// --- TrustAndDelivery (Etibar və Çatdırılma Vurğusu) ---
function TrustAndDelivery() {
    return (
        <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200 space-y-3">
            <h3 className='text-sm font-bold text-slate-800 flex items-center gap-2'><Truck className='h-4 w-4 text-emerald-600' /> Çatdırılma və Zəmanət</h3>
            <ul className="space-y-3">
                {mockDeliveryInfo.map((item, index) => (
                    <motion.li 
                        key={index} 
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-3"
                    >
                        <item.icon className="h-5 w-5 mt-0.5 text-emerald-500 shrink-0" />
                        <div className='text-sm'>
                            <p className="font-semibold text-slate-700">{item.label}</p>
                            <p className="text-xs text-slate-500">{item.detail}</p>
                        </div>
                    </motion.li>
                ))}
            </ul>
        </div>
    );
}

// --- DescriptionSection ---
function DescriptionSection({ description }: { description?: string }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-md border border-slate-100"
        >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2 border-emerald-100">
                <BookOpen className="h-5 w-5 text-emerald-600" /> Məhsul Haqqında Ətraflı
            </h2>
            <div className='text-slate-600 leading-relaxed space-y-4'>
                <p>{description || 'Məhsulun ətraflı təsviri hələ əlavə edilməyib.'}</p>
            </div>
        </motion.div>
    );
}

// --- ProductSpecsTable ---
function ProductSpecsTable({ specs }: { specs: { label: string; value: string }[] }) {
    if (!specs.length) return null;
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-md border border-slate-100"
        >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2 border-emerald-100">
                <ClipboardList className="h-5 w-5 text-emerald-600" /> Texniki Xüsusiyyətlər
            </h2>
            <dl className="space-y-3">
                {specs.map((spec, index) => (
                    <div key={index} className="flex justify-between items-center pb-2 border-b border-slate-100 last:border-b-0">
                        <dt className="text-sm font-medium text-slate-500 flex items-center gap-2">
                           <Info className='h-4 w-4 text-emerald-400'/> {spec.label}
                        </dt>
                        <dd className="text-sm font-semibold text-slate-800">{spec.value}</dd>
                    </div>
                ))}
            </dl>
        </motion.div>
    );
}

// --- ReviewsSection ---
function ReviewsSection({ reviews, rating, reviewCount }: { reviews: Review[], rating: number, reviewCount: number }) {
    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4 rounded-2xl bg-white p-6 shadow-md border border-slate-100"
        >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2 border-emerald-100">
                <MessageSquare className="h-5 w-5 text-emerald-600" /> Müştəri Rəyləri ({reviewCount})
            </h2>
            
            <div className='flex items-center gap-4 py-2 border-b border-slate-100'>
                <span className='text-5xl font-extrabold text-emerald-700'>{rating.toFixed(1)}</span>
                <div className='flex flex-col'>
                    <RatingAndReview rating={rating} reviewCount={reviewCount} />
                    <p className='text-sm text-slate-500 mt-1'>Müştərilərimizin 98%-i tövsiyə edir</p>
                </div>
            </div>

            {reviews.slice(0, 3).map((review, index) => (
                <div key={index} className="border-b border-slate-100 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between">
                        <p className="font-semibold text-slate-800 text-sm">{review.author}</p>
                        <div className='flex items-center text-xs text-yellow-500'>
                             {[...Array(review.rating)].map((_, i) => <Star key={i} className="h-3 w-3 fill-yellow-500" />)}
                        </div>
                    </div>
                    <p className="text-xs text-slate-500 mt-1">{review.comment}</p>
                </div>
            ))}
            
            {reviewCount > 3 && (
                <button className='w-full text-center text-sm font-medium text-emerald-600 hover:text-emerald-800 transition py-2'>
                    Bütün rəyləri oxu ({reviewCount - 3} əlavə rəy)
                </button>
            )}
            
            {reviewCount === 0 && (
                 <p className='text-sm text-slate-500 italic'>Hələ rəy yoxdur. İlk rəyi siz yazın və endirim qazanın!</p>
            )}
        </motion.div>
    );
}

// --- RelatedProducts ---
function RelatedProducts({ relatedProducts }: { relatedProducts: { id: string; name: string; price: number; image: string }[] }) {
    const router = useRouter();
    if (!relatedProducts.length) return null;

    return (
        <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            viewport={{ once: true, amount: 0.2 }}
            className="space-y-4 rounded-2xl bg-slate-50 p-6 shadow-inner border border-slate-200"
        >
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2 border-b pb-2 border-emerald-100">
                <Zap className="h-5 w-5 text-red-500 fill-red-500/30" /> Əlaqəli Məhsullar
            </h2>
            <div className="space-y-4">
                {relatedProducts.map((p) => (
                    <motion.div
                        key={p.id}
                        className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm hover:shadow-md transition cursor-pointer"
                        whileHover={{ scale: 1.02 }}
                        onClick={() => router.push(`/products/${p.id}`)}
                    >
                        {/* Image */}
                        <div className='relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-emerald-100'>
                            <Image 
                                src={p.image} 
                                alt={p.name} 
                                fill 
                                style={{ objectFit: 'cover' }}
                                className='opacity-80'
                            />
                        </div>
                        
                        <div className='flex-1'>
                            <p className='text-sm font-semibold text-slate-700 leading-tight'>{p.name}</p>
                            <p className='text-xs font-bold text-emerald-600 mt-0.5'>{formatPrice(p.price)} ₼</p>
                        </div>
                    </motion.div>
                ))}
            </div>
            
            <button className='w-full text-center text-xs font-medium text-slate-500 hover:text-slate-700 transition pt-2'>
                Daha çox oxşar məhsul gör
            </button>
        </motion.div>
    );
}


// --- StickyFooter (Genişləndirilmiş Mobile) ---
function StickyFooter({ finalPriceValue, quantity, setQuantity, handleAddToCart, handleBuyNow, isOutOfStock, stockCount }: {
    finalPriceValue: number;
    quantity: number;
    setQuantity: (q: number) => void;
    handleAddToCart: () => void;
    handleBuyNow: () => void;
    isOutOfStock: boolean;
    stockCount: number;
}) {
    const disabled = isOutOfStock;

    return (
        <motion.div 
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 120, damping: 20 }}
            className="fixed inset-x-0 bottom-0 z-40 bg-white p-4 shadow-2xl lg:hidden border-t-2 border-emerald-100"
        >
            <div className='flex justify-between items-center mb-3'>
                <div className='flex flex-col'>
                    <span className='text-xs text-slate-500'>Cəmi Qiymət</span>
                    <span className='text-3xl font-extrabold text-emerald-700'>
                        {formatPrice(finalPriceValue * quantity)} ₼
                    </span>
                </div>
                {/* Miqdar Seçimi */}
                <QuantitySelector quantity={quantity} setQuantity={setQuantity} stockCount={stockCount} /> 
            </div>
            
            <div className='flex gap-2'>
                 <motion.button
                    type="button"
                    disabled={disabled}
                    onClick={handleAddToCart}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold text-white shadow-lg transition-all ${
                        disabled
                            ? 'bg-slate-400 cursor-not-allowed'
                            : 'bg-emerald-600 hover:bg-emerald-700'
                    }`}
                    whileTap={{ scale: 0.98 }}
                >
                    <ShoppingCart className="h-4 w-4" />
                    Səbət
                </motion.button>
                <motion.button
                    type="button"
                    disabled={disabled}
                    onClick={handleBuyNow}
                    className={`inline-flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
                        disabled
                            ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                            : 'bg-yellow-400 text-slate-900 hover:bg-yellow-500'
                    }`}
                    whileTap={{ scale: 0.98 }}
                >
                    <Check className="h-4 w-4" />
                    İndi Al
                </motion.button>
            </div>
        </motion.div>
    );
}

// =========================================================================
// 5. Next Step
// =========================================================================

// Yuxarıdakı kod bütün tələb olunan komponentləri əlavə edir və gücləndirilmiş marketing/UI fokusunu saxlayır.
// Əlavə olaraq, Next.js 'Image' komponentinin düzgün işləməsi üçün domainlərin `next.config.js` faylında konfiqurasiya edilməsi vacibdir.
