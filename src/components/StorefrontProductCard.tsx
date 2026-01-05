'use client'

import { memo, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { 
  ShoppingCart, Heart, Star, Leaf, Clock, AlertTriangle, 
  Truck, Tag, Minus, Plus, Package 
} from 'lucide-react'

// Mock store and types
type Unit = 'kq' | 'ədəd' | 'balon' | 'litr' | 'qram' | 'qutu'

interface Variant {
  id: string
  name: string
  stock: number
  price: number
  costPrice?: number
  unit: Unit
  step?: number // Artım addımı: kq üçün 0.5, ədəd üçün 1
  minQty?: number // Minimum alış miqdarı
  maxQty?: number // Maksimum alış miqdarı
}

interface Product {
  id: string
  name: string
  slug: string
  categoryId: string
  description?: string
  images?: Array<{ url: string }>
  variants: Variant[]
  rating?: number
  discountType?: 'percent' | 'amount'
  discountValue?: number
}

// Mock functions
const useApp = () => ({
  addToCart: (productId: string, variantId: string, qty: number) => {
    console.log('Added to cart:', { productId, variantId, qty })
  },
  toggleFavorite: (id: string) => console.log('Toggled favorite:', id),
  isFavorite: (id: string) => false,
})

const toast = {
  success: (msg: string) => alert(msg),
  error: (msg: string) => alert(msg),
}

// Helper functions
const currency = (amount: number) => `${amount.toFixed(2)} ₼`

const getUnitDisplay = (unit: Unit): string => {
  const unitMap: Record<Unit, string> = {
    'kq': 'kq',
    'ədəd': 'ədəd',
    'balon': 'balon',
    'litr': 'L',
    'qram': 'qr',
    'qutu': 'qutu'
  }
  return unitMap[unit] || unit
}

const getUnitStep = (unit: Unit): number => {
  // Hər vahid üçün artım addımı
  const stepMap: Record<Unit, number> = {
    'kq': 0.5,        // Çəki: 0.5 kq addımla
    'litr': 0.5,      // Həcm: 0.5 L addımla
    'qram': 100,      // Qram: 100qr addımla
    'ədəd': 1,        // Ədəd: tam ədədlə
    'balon': 1,       // Balon: tam ədədlə
    'qutu': 1         // Qutu: tam ədədlə
  }
  return stepMap[unit] || 1
}

const formatQuantity = (qty: number, unit: Unit): string => {
  // Kəmiyyəti düzgün formatla göstər
  if (unit === 'kq' || unit === 'litr') {
    return qty.toFixed(1) // 1.5 kq
  }
  if (unit === 'qram') {
    return Math.round(qty).toString() // 500 qr
  }
  return Math.round(qty).toString() // 3 ədəd
}

// Premium Badges Component
const PremiumBadges = memo(({ 
  product, 
  hasDiscount, 
  offPerc, 
  isOutOfStock, 
  stock 
}: { 
  product: Product
  hasDiscount: boolean
  offPerc: number
  isOutOfStock: boolean
  stock: number
}) => {
  const { toggleFavorite, isFavorite } = useApp()
  const fav = isFavorite(product.id)
  const isLowStock = stock > 0 && stock < 5

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end space-y-2 z-10">
      <motion.button
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        onClick={(e) => { e.preventDefault(); toggleFavorite(product.id) }}
        className={`p-2 rounded-full transition bg-white/90 hover:bg-white backdrop-blur-sm shadow-md ${
          fav ? 'text-rose-600' : 'text-gray-400'
        }`}
      >
        <Heart className={`w-4 h-4 transition ${fav ? 'fill-rose-500' : ''}`} />
      </motion.button>

      {hasDiscount && (
        <span className="inline-flex items-center gap-1 rounded-full bg-rose-600 px-3 py-1 text-[11px] font-bold text-white shadow-xl animate-pulse">
          <Clock className="w-3 h-3" /> 
          -{offPerc}% ENDİRİM!
        </span>
      )}
      
      {isLowStock && (
        <span className="inline-flex items-center gap-1 rounded-full bg-amber-500 px-3 py-1 text-[11px] font-bold text-white shadow-md">
          <AlertTriangle className="w-3 h-3" /> Az Qalıb
        </span>
      )}

      <span className="inline-flex items-center gap-1 rounded-full bg-blue-500 px-3 py-1 text-[11px] font-bold text-white shadow-md">
        <Truck className="w-3 h-3" /> Sürətli Çatdırılma
      </span>
    </div>
  )
})
PremiumBadges.displayName = 'PremiumBadges'

// Quantity Selector Component
const QuantitySelector = memo(({ 
  qty, 
  unit, 
  step, 
  minQty, 
  maxQty, 
  stock,
  onIncrement, 
  onDecrement,
  onChange 
}: {
  qty: number
  unit: Unit
  step: number
  minQty: number
  maxQty: number
  stock: number
  onIncrement: () => void
  onDecrement: () => void
  onChange: (value: number) => void
}) => {
  const unitDisplay = getUnitDisplay(unit)
  const displayQty = formatQuantity(qty, unit)
  
  return (
    <div className="flex items-center border-2 border-emerald-500 rounded-xl overflow-hidden shadow-sm bg-white">
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onDecrement}
        disabled={qty <= minQty}
        className="p-3 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        <Minus className="w-4 h-4" />
      </motion.button>
      
      <div className="flex-1 px-2 text-center min-w-[80px]">
        <div className="text-lg font-bold text-gray-900">
          {displayQty}
        </div>
        <div className="text-xs text-gray-500 font-medium">
          {unitDisplay}
        </div>
      </div>
      
      <motion.button
        whileTap={{ scale: 0.9 }}
        onClick={onIncrement}
        disabled={qty >= Math.min(maxQty, stock)}
        className="p-3 text-emerald-700 hover:bg-emerald-50 transition disabled:opacity-30 disabled:cursor-not-allowed font-bold"
      >
        <Plus className="w-4 h-4" />
      </motion.button>
    </div>
  )
})
QuantitySelector.displayName = 'QuantitySelector'

// Main Product Card Component
export const StorefrontProductCard = memo(({ product }: { product: Product }) => {
  const { addToCart } = useApp()
  
  // Default variant (ilk variant)
  const variant = product.variants?.[0]
  if (!variant) return null

  const unit = variant.unit || 'ədəd'
  const step = variant.step || getUnitStep(unit)
  const minQty = variant.minQty || step
  const maxQty = variant.maxQty || 100
  
  // Kəmiyyət state-i - minimum dəyərlə başlayır
  const [qty, setQty] = useState(minQty)
  
  // Qiymət hesablamaları
  const regularPrice = variant.price || 0
  const hasDiscount = !!(product.discountValue && product.discountValue > 0)
  const discountedPrice = hasDiscount 
    ? product.discountType === 'percent'
      ? regularPrice * (1 - (product.discountValue || 0) / 100)
      : regularPrice - (product.discountValue || 0)
    : regularPrice
  const price = Math.max(0, discountedPrice)
  const offPerc = hasDiscount ? Math.round((1 - price / regularPrice) * 100) : 0
  
  const rating = product.rating || 0
  const stock = variant.stock || 0
  const isOutOfStock = stock <= 0
  const imageUrl = product.images?.[0]?.url || 'https://images.unsplash.com/photo-1587049352846-4a222e784f4c?w=400'

  // Kəmiyyət artırma/azaltma
  const incrementQty = useCallback(() => {
    setQty(prev => {
      const next = prev + step
      return Math.min(next, Math.min(maxQty, stock))
    })
  }, [step, maxQty, stock])

  const decrementQty = useCallback(() => {
    setQty(prev => {
      const next = prev - step
      return Math.max(next, minQty)
    })
  }, [step, minQty])

  const handleQtyChange = useCallback((value: number) => {
    const clamped = Math.max(minQty, Math.min(value, Math.min(maxQty, stock)))
    setQty(clamped)
  }, [minQty, maxQty, stock])

  // Səbətə əlavə et
  const handleAddToCart = useCallback(() => {
    if (isOutOfStock) {
      toast.error('Bu məhsul hazırda stokda yoxdur!')
      return
    }

    if (qty < minQty) {
      toast.error(`Minimum alış miqdarı: ${formatQuantity(minQty, unit)} ${getUnitDisplay(unit)}`)
      return
    }

    if (qty > stock) {
      toast.error(`Stokda yalnız ${formatQuantity(stock, unit)} ${getUnitDisplay(unit)} var`)
      return
    }

    addToCart(product.id, variant.id, qty)
    const displayQty = formatQuantity(qty, unit)
    const unitDisplay = getUnitDisplay(unit)
    toast.success(`✅ ${displayQty} ${unitDisplay} ${product.name} səbətə əlavə edildi`)
    
    // Səbətə əlavə edildikdən sonra minimum kəmiyyətə qaytar
    setQty(minQty)
  }, [isOutOfStock, qty, minQty, stock, unit, addToCart, product, variant])

  // Variant adı və vahid məlumatı
  const variantDisplay = variant.name !== 'Standart' 
    ? `${variant.name} (${getUnitDisplay(unit)})` 
    : getUnitDisplay(unit)

  return (
    <motion.div
      whileHover={{ y: -6, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative rounded-2xl border-2 border-slate-200 bg-white shadow-lg hover:shadow-2xl hover:border-emerald-300 transition-all overflow-hidden flex flex-col h-full"
    >
      {/* Şəkil Bloku */}
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-green-50 to-emerald-50">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        <PremiumBadges 
          product={product}
          hasDiscount={hasDiscount}
          offPerc={offPerc}
          isOutOfStock={isOutOfStock}
          stock={stock}
        />

        {/* Reytinq və Orqanik Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-2">
          {rating > 0 && (
            <span className="flex items-center gap-1 bg-white/95 text-yellow-600 text-xs px-3 py-1.5 rounded-xl font-bold shadow-lg backdrop-blur-sm">
              <Star className="w-3.5 h-3.5 fill-yellow-500" /> {rating.toFixed(1)}
            </span>
          )}
          <span className="flex items-center gap-1 bg-emerald-600/95 text-white text-xs px-3 py-1.5 rounded-xl font-bold shadow-lg backdrop-blur-sm">
            <Leaf className="w-3.5 h-3.5" /> Orqanik
          </span>
        </div>
      </div>

      {/* Məlumat Bloku */}
      <div className="p-4 space-y-3 flex flex-col flex-grow">
        <h3 className="text-lg font-bold text-gray-900 line-clamp-2 hover:text-emerald-700 transition leading-tight">
          {product.name}
        </h3>
        
        {/* Variant və Stok Məlumatı */}
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="flex items-center gap-1.5 text-blue-600 font-semibold bg-blue-50 px-2 py-1 rounded-lg">
            <Tag className="w-3.5 h-3.5" /> {variantDisplay}
          </span>
          <span className={`font-bold flex items-center gap-1 ${
            isOutOfStock ? 'text-red-600 bg-red-50' : 
            stock < 5 ? 'text-amber-600 bg-amber-50' : 
            'text-emerald-600 bg-emerald-50'
          } px-2 py-1 rounded-lg`}>
            <Package className="w-3.5 h-3.5" />
            {isOutOfStock 
              ? 'Stokda yox' 
              : `${formatQuantity(stock, unit)} ${getUnitDisplay(unit)}`
            }
          </span>
        </div>
        
        {/* Qiymət Bloku */}
        <div className="flex items-baseline justify-between pt-2 border-t border-gray-100">
          <div className="flex items-baseline gap-2">
            <span className="text-2xl text-emerald-700 font-extrabold">
              {currency(price)}
            </span>
            {hasDiscount && (
              <span className="text-sm text-gray-400 line-through font-medium">
                {currency(regularPrice)}
              </span>
            )}
          </div>
          <span className="text-xs text-gray-500 font-medium">
            /{getUnitDisplay(unit)}
          </span>
        </div>

        {/* Minimum/Maximum alış məlumatı */}
        {(minQty > step || maxQty < 100) && (
          <div className="text-xs text-gray-600 bg-gray-50 px-2 py-1 rounded">
            {minQty > step && <span>Min: {formatQuantity(minQty, unit)} {getUnitDisplay(unit)}</span>}
            {minQty > step && maxQty < 100 && <span className="mx-1">•</span>}
            {maxQty < 100 && <span>Max: {formatQuantity(maxQty, unit)} {getUnitDisplay(unit)}</span>}
          </div>
        )}
      </div>

      {/* Kəmiyyət Seçici və Səbət Düymələri */}
      <div className="p-4 pt-0 space-y-3">
        {/* Kəmiyyət Seçici */}
        <QuantitySelector
          qty={qty}
          unit={unit}
          step={step}
          minQty={minQty}
          maxQty={maxQty}
          stock={stock}
          onIncrement={incrementQty}
          onDecrement={decrementQty}
          onChange={handleQtyChange}
        />

        {/* Səbətə Əlavə Et */}
        <motion.button
          whileHover={{ scale: isOutOfStock ? 1 : 1.02 }}
          whileTap={{ scale: isOutOfStock ? 1 : 0.98 }}
          onClick={handleAddToCart}
          disabled={isOutOfStock}
          className={`w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 transition-all shadow-lg ${
            isOutOfStock
              ? 'bg-gray-300 text-gray-600 cursor-not-allowed'
              : 'bg-gradient-to-r from-emerald-600 to-green-600 text-white hover:from-emerald-700 hover:to-green-700 hover:shadow-xl'
          }`}
        >
          <ShoppingCart className="w-5 h-5" />
          {isOutOfStock ? 'Stokda Yoxdur' : 'Səbətə Əlavə Et'}
        </motion.button>

        {/* Ümumi Qiymət Göstəricisi */}
        {!isOutOfStock && qty > minQty && (
          <div className="text-center text-sm bg-emerald-50 text-emerald-800 font-semibold py-2 rounded-lg border border-emerald-200">
            Ümumi: {currency(price * qty)}
          </div>
        )}
      </div>
    </motion.div>
  )
})

StorefrontProductCard.displayName = 'StorefrontProductCard'

// Demo Component
export default function ProductCardDemo() {
  const demoProducts: Product[] = [
    {
      id: '1',
      name: 'Təbii Çiçək Balı',
      slug: 'bal',
      categoryId: 'bal',
      description: 'Gədəbəy dağlarından təbii bal',
      images: [{ url: 'https://images.unsplash.com/photo-1587049352846-4a222e784f4c?w=400' }],
      rating: 4.8,
      discountType: 'percent',
      discountValue: 15,
      variants: [{
        id: 'v1',
        name: '500qr Balon',
        stock: 25,
        price: 12,
        unit: 'balon',
        step: 1,
        minQty: 1,
        maxQty: 10
      }]
    },
    {
      id: '2',
      name: 'Təzə Mandarin',
      slug: 'mandarin',
      categoryId: 'meyveler',
      images: [{ url: 'https://images.unsplash.com/photo-1611080626919-7cf5a9dbab5b?w=400' }],
      rating: 4.5,
      variants: [{
        id: 'v2',
        name: 'Premium',
        stock: 45.5,
        price: 3.5,
        unit: 'kq',
        step: 0.5,
        minQty: 1,
        maxQty: 20
      }]
    },
    {
      id: '3',
      name: 'Kənd Qatığı',
      slug: 'qatiq',
      categoryId: 'sut',
      images: [{ url: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?w=400' }],
      rating: 5.0,
      discountType: 'amount',
      discountValue: 1,
      variants: [{
        id: 'v3',
        name: '1L Balon',
        stock: 3,
        price: 5,
        unit: 'balon',
        step: 1,
        minQty: 1,
        maxQty: 5
      }]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
            🌿 Premium Məhsul Kartları
          </h1>
          <p className="text-gray-600">
            Ağıllı kəmiyyət seçimi ilə professional e-ticarət təcrübəsi
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {demoProducts.map(product => (
            <StorefrontProductCard key={product.id} product={product} />
          ))}
        </div>

        {/* Feature List */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mt-12">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">✨ Xüsusiyyətlər:</h2>
          <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-700">
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Ağıllı Vahid Sistemi:</strong> kq, ədəd, balon, litr - hər vahid üçün xüsusi addım
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Avtomatik Stok Yoxlaması:</strong> Real-time stok limitləri
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Min/Max Limitlər:</strong> Hər məhsul üçün fərqli alış limitləri
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Responsive Dizayn:</strong> Mobil və desktop üçün optimizasiya
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Premium Animasiyalar:</strong> Framer Motion ilə smooth keçidlər
              </div>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
              <div>
                <strong>Ümumi Qiymət:</strong> Real-time hesablama və göstəriş
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const CheckCircle = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
)