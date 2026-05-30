// app/cart/page.tsx
'use client'

import { useApp } from '@/lib/store'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import { CldImage } from 'next-cloudinary';
import Link from 'next/link'
import {
  Trash2, Minus, Plus, ShoppingCart, RotateCcw,
  Shield, Clock, Phone, User, BadgeInfo,
  Sparkles, ArrowLeft, Truck, CreditCard, Store, Package,
  Star, Heart, Leaf, ChevronRight, X, MessageCircle, Zap,
  Send, CheckCircle2, PenLine, Percent, AlertCircle, Info
} from 'lucide-react'
import { useState, useMemo, useCallback } from 'react'
import { HowItWorksModal } from '@/components/ui/molecules/HowItWorksModal'

// ─── Köməkçi Komponentlər ─────────────────────────────────────
const Button = ({
  children, onClick, className, variant = 'primary', disabled, loading = false,
}: {
  children: React.ReactNode; onClick?: () => void; className?: string;
  variant?: 'primary' | 'secondary' | 'danger' | 'whatsapp' | 'outline';
  disabled?: boolean; loading?: boolean;
}) => {
  const base = "inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[44px] active:scale-[0.98]"
  const variants = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200',
    secondary: 'border-2 border-gray-200 bg-white text-gray-700 hover:border-emerald-300 hover:bg-emerald-50',
    danger: 'bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-200',
    whatsapp: 'bg-[#25D366] text-white hover:bg-[#1DA851] shadow-lg shadow-green-200',
    outline: 'border border-emerald-300 text-emerald-700 hover:bg-emerald-50'
  }
  return (
    <motion.button
      whileTap={{ scale: 0.96 }}
      onClick={onClick}
      disabled={disabled || loading}
      className={`${base} ${variants[variant]} ${className}`}
    >
      {loading ? (
        <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }}
          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
      ) : children}
    </motion.button>
  )
}

const QuantityControl = ({ qty, onDecrease, onIncrease, onRemove, max }: {
  qty: number; onDecrease: () => void; onIncrease: () => void; onRemove: () => void; max?: number;
}) => (
  <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
    <button onClick={qty > 1 ? onDecrease : onRemove}
      className={`p-2.5 transition-colors ${qty > 1 ? 'hover:bg-gray-100 text-gray-600' : 'hover:bg-red-100 text-red-500'}`}
      aria-label={qty > 1 ? 'Azalt' : 'Sil'}>
      {qty > 1 ? <Minus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
    </button>
    <div className="w-10 text-center text-sm font-bold text-gray-800 select-none">{qty}</div>
    <button onClick={onIncrease} disabled={max !== undefined && qty >= max}
      className="p-2.5 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-40" aria-label="Artır">
      <Plus className="w-4 h-4" />
    </button>
  </div>
)

// ─── Çatdırılma faiz cədvəli ──────────────────────────────────
const DELIVERY_RATES = [
  { min: 0, max: 10, pct: 25 },
  { min: 10, max: 30, pct: 20 },
  { min: 30, max: 50, pct: 15 },
  { min: 50, max: 100, pct: 10 },
  { min: 100, max: Infinity, pct: 5 },
]

const getDeliveryFee = (total: number) => {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) {
      return total * (rate.pct / 100)
    }
  }
  return total * 0.05 // fallback
}

const getDeliveryPct = (total: number) => {
  for (const rate of DELIVERY_RATES) {
    if (total >= rate.min && total < rate.max) return rate.pct
  }
  return 5
}

// ─── Ana Səbət Səhifəsi ───────────────────────────────────────
export default function CartPage() {
  const {
    cart, products, removeCartItem, updateCartItemQty,
    productPriceNow, cartTotal, clearCart, placeOrder
  } = useApp()

  const total = cartTotal()
  const [showCheckoutModal, setShowCheckoutModal] = useState(false)

  const cartItems = useMemo(() => cart.map(c => {
    const p = products.find(x => x.id === c.productId)
    const v = p?.variants?.find(x => x.id === c.variantId) ?? p?.variants?.[0]
    const price = p ? productPriceNow(p, v) : 0
    return {
      name: p?.name || 'Məhsul',
      qty: c.qty,
      price,
      variant: v?.name !== 'Default' ? v?.name : undefined,
      image: p?.images?.[0]?.url || '/placeholder.png',
      stock: v?.stock ?? 0,
      productId: c.productId,
      variantId: v?.id || 'default',
      product: p,
      variantObj: v
    }
  }), [cart, products, productPriceNow])

  const itemCount = cart.reduce((sum, c) => sum + c.qty, 0)
  const deliveryFee = getDeliveryFee(total)
  const currentPct = getDeliveryPct(total)

const handlePlaceOrder = useCallback(async (customerInfo: {
  firstName?: string; lastName?: string; phone?: string;
  deliveryMethod: 'pickup' | 'delivery';
  address?: string;
  note?: string;
}) => {
  if (!cart.length) return toast.error('Səbət boşdur!')
  
  const fee = customerInfo.deliveryMethod === 'delivery' ? deliveryFee : 0
  const finalTotal = total + fee

  try {
    const items = cart.map(c => {
      const p = products.find(x => x.id === c.productId)
      const v = p?.variants?.find(x => x.id === c.variantId) ?? p?.variants?.[0]
      return {
        productId: c.productId,
        variantId: v?.id || 'default',
        qty: c.qty,
        priceAtOrder: productPriceNow(p!, v),
        productName: p?.name || 'Məhsul',
        variantName: v?.name || 'Default',
        costAtOrder: v?.costPrice || 0,
        unit: v?.unit || 'ədəd'
      }
    })
    
    const orderNumber = `ORG-${Date.now().toString(36).toUpperCase().slice(-6)}`
    const createdAt = new Date().toISOString()
    const customerFullName = `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim()

    // ✅ Zod tələblərinə uyğun sifariş obyekti
    const orderPayload = {
      items: items.map(i => ({
        productId: i.productId,
        variantId: i.variantId,
        qty: i.qty,
      })),
      customerName: customerFullName || 'Anonim Müştəri',
      customerEmail: null as string | null,
      customerPhone: customerInfo.phone || '+994000000000', // minimum 9 simvol
      deliveryAddressText: customerInfo.deliveryMethod === 'delivery'
        ? customerInfo.address || 'Ünvan qeyd edilməyib'
        : 'Özü götürmə',
      paymentMethod: 'CASH_ON_DELIVERY' as const, // Zod enum-u
      note: customerInfo.note || null,
    }
    
    await placeOrder(orderPayload)

    // WhatsApp mesajı (əvvəlki kimi)
    const dateStr = new Date(createdAt).toLocaleDateString('az-AZ', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    const itemsText = cartItems.map(item =>
      `🛒 *${item.name}*${item.variant ? ` (${item.variant})` : ''}  ×${item.qty} — ${(item.price * item.qty).toFixed(2)} AZN`
    ).join('\n')
    
    const message = [
      `🌿 *Organik Gədəbəy*`,
      `📦 *Sifariş #${orderNumber}*`,
      `📅 ${dateStr}`,
      `━━━━━━━━━━━━━━━━━━`,
      customerFullName ? `👤 *Müştəri:* ${customerFullName}` : '',
      customerInfo.phone ? `📞 *Telefon:* ${customerInfo.phone}` : '',
      customerInfo.deliveryMethod === 'delivery' ? `🚚 *Çatdırılma ünvanı:* ${customerInfo.address}` : `🏪 *Özü götürmə*`,
      customerInfo.note ? `📝 *Qeyd:* ${customerInfo.note}` : '',
      `━━━━━━━━━━━━━━━━━━`,
      `📋 *Məhsullar:*`,
      itemsText,
      `━━━━━━━━━━━━━━━━━━`,
      fee > 0 ? `🚚 *Çatdırılma haqqı (%${currentPct}):* ${fee.toFixed(2)} AZN` : '',
      `💰 *Cəmi:* ${finalTotal.toFixed(2)} AZN`,
      ``,
      `🙏 Təşəkkür edirik! Sifarişiniz qəbul olundu.`
    ].filter(Boolean).join('\n')
    
    const phone = '994773676021'
    const waUrl = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    
    clearCart()
    window.open(waUrl, '_blank')
    toast.success('Sifariş qəbul edildi! WhatsApp pəncərəsi açılır...')
  } catch (err: any) {
    toast.error('Sifariş yaradılarkən xəta baş verdi')
  }
}, [cart, products, total, cartItems, clearCart, productPriceNow, deliveryFee, currentPct, placeOrder])
  if (!cart.length) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-emerald-50/50 to-white p-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 3, repeat: Infinity }}>
            <ShoppingCart className="w-24 h-24 mx-auto text-emerald-200 mb-6" />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">Səbətiniz boşdur</h1>
          <p className="text-gray-500 mb-8">Məhsulları kəşf edin və səbətə əlavə edin</p>
          <Link href="/products">
            <Button variant="primary" className="px-8 py-3"><Package className="w-5 h-5" /> Məhsullara bax</Button>
          </Link>
          <div className="mt-8 flex items-center justify-center gap-3 text-xs text-gray-400">
            <Shield className="w-4 h-4" /> Təhlükəsiz alış-veriş
            <span>•</span>
            <Store className="w-4 h-4" /> Özü götürmə
          </div>
        </motion.div>
      </div>
    )
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white py-8 px-4">
      <Toaster position="top-center" />
      
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link href="/products" className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1 mb-2">
              <ArrowLeft className="w-4 h-4" /> Alış-verişə davam et
            </Link>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Səbətim
              <span className="text-lg font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">{itemCount} məhsul</span>
            </h1>
          </div>
          <Button variant="outline" onClick={clearCart} className="text-xs">
            <Trash2 className="w-4 h-4" /> Səbəti təmizlə
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
        {/* Sol — Məhsullar */}
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {cart.map((c, idx) => {
              const p = products.find(x => x.id === c.productId)
              const v = p?.variants?.find(x => x.id === c.variantId) ?? p?.variants?.[0]
              if (!p || !v) return null
              const price = productPriceNow(p, v)
              const itemTotal = price * c.qty

              return (
                <motion.div
                  key={c.productId + (c.variantId || '')}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ delay: idx * 0.05 }}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
      <CldImage
        src={p.images?.[0]?.url || '/placeholder.png'}
        alt={p.name}
        width="500"
        height="500"
        crop={{
          type: 'auto',
          source: true
        }}
      />
                      {p.discountType && (
                        <div className="absolute top-0 left-0 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-br-lg">Endirim</div>
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-gray-900 truncate">{p.name}</h3>
                      {v.name !== 'Default' && <p className="text-xs text-gray-500">{v.name}</p>}
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-emerald-600 font-bold">{price.toFixed(2)} ₼</span>
                        {p.basePrice && p.basePrice > price && (
                          <span className="text-xs text-gray-400 line-through">{Number(p.basePrice).toFixed(2)} ₼</span>
                        )}
                      </div>
                      <div className="mt-2 flex items-center justify-between">
                        <QuantityControl
                          qty={c.qty}
                          onDecrease={() => updateCartItemQty(c.productId, c.variantId, c.qty - 1)}
                          onIncrease={() => updateCartItemQty(c.productId, c.variantId, c.qty + 1)}
                          onRemove={() => removeCartItem(c.productId, c.variantId)}
                          max={v.stock || 999}
                        />
                        <span className="font-black text-lg text-gray-800">{itemTotal.toFixed(2)} ₼</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </AnimatePresence>

          {/* Keyfiyyət zəmanəti */}
          <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-100">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">Bütün məhsullarımız 100% təzədir. Keyfiyyətə zəmanət veririk.</p>
          </div>
        </div>

        {/* Sağ — Sifariş Xülasəsi */}
        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 sticky top-24"
          >
            <h2 className="text-xl font-black text-gray-800 mb-4">Sifariş Xülasəsi</h2>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Məhsul cəmi</span>
                <span className="font-semibold">{total.toFixed(2)} ₼</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Çatdırılma</span>
                <span className="text-emerald-600 font-semibold">
                  {currentPct}% — {deliveryFee.toFixed(2)} ₼
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-gray-900 font-bold text-lg">Cəmi</span>
                <span className="text-2xl font-black text-emerald-600">{(total + deliveryFee).toFixed(2)} ₼</span>
              </div>
              
              {/* Faiz cədvəli kartı */}
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-3">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-800 mb-2">
                  <Percent className="w-3.5 h-3.5" /> Çatdırılma faizləri:
                </div>
                <div className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs text-blue-700">
                  {DELIVERY_RATES.map((rate, idx) => (
                    <div key={idx} className={`flex justify-between ${currentPct === rate.pct ? 'font-black text-blue-900 bg-blue-100/50 rounded px-1 -mx-1' : ''}`}>
                      <span>{rate.min}{rate.max === Infinity ? '+' : `-${rate.max}`} AZN</span>
                      <span className="font-bold">{rate.pct}%</span>
                    </div>
                  ))}
                </div>
                {deliveryFee > 0 && (
                  <p className="text-[10px] text-blue-600 mt-2 flex items-center gap-1">
                    <Info className="w-3 h-3" />
                    Sizin səbətiniz üçün: {currentPct}%
                  </p>
                )}
              </div>

              <div className="bg-green-50 text-green-700 text-xs p-2 rounded-lg flex items-start gap-1">
                <Store className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                <span>Özü götürmə pulsuzdur. Çatdırılma faizlidir.</span>
              </div>
            </div>

            <div className="mt-6 space-y-3">
              <Button
                variant="whatsapp"
                className="w-full py-3.5"
                onClick={() => setShowCheckoutModal(true)}
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp ilə sifariş et
              </Button>

              <div className="text-center text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5 inline mr-1" />
                Hazırlanma müddəti: ~30 dəq
              </div>
            </div>

            <div className="mt-6 p-4 bg-gradient-to-br from-emerald-50 to-lime-50 rounded-2xl border border-emerald-100">
              <div className="flex items-center gap-2 text-sm font-bold text-emerald-800 mb-2">
                <Sparkles className="w-4 h-4" /> Necə işləyir?
              </div>
              <div className="text-xs text-emerald-700 space-y-1">
                <p>1. Məhsulları səbətə atın</p>
                <p>2. WhatsApp düyməsinə basın</p>
                <p>3. Məlumatlarınızı doldurun</p>
                <p>4. Hazır olanda gəlib götürün!</p>
              </div>
            </div>

            <div className="mt-4 p-3 bg-blue-50 border border-blue-100 rounded-xl text-xs text-blue-700 flex items-start gap-2">
              <CreditCard className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>Tezliklə kart ilə ödəniş (Visa/Mastercard) aktivləşəcək!</span>
            </div>
          </motion.div>
        </div>
      </div>

      <HowItWorksModal
        open={showCheckoutModal}
        onClose={() => setShowCheckoutModal(false)}
        cartItems={cartItems}
        cartTotal={total}
        onPlaceOrder={handlePlaceOrder}
      />
    </main>
  )
}