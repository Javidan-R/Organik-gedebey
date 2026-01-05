// src/app/cart/page.tsx
'use client'

import { useApp } from '@/lib/store'
import { whatsappLink } from '@/lib/whatsapp'
import { motion, AnimatePresence } from 'framer-motion'
import toast, { Toaster } from 'react-hot-toast'
import Image from 'next/image'
import Link from 'next/link'
import { Trash2, Minus, Plus, ShoppingCart, Send, RotateCcw } from 'lucide-react'

const Button = ({
  children,
  onClick,
  className,
  variant = 'primary',
  disabled,
}: {
  children: React.ReactNode
  onClick?: () => void
  className?: string
  variant?: 'primary' | 'secondary' | 'danger'
  disabled?: boolean
}) => (
  <motion.button
    whileTap={{ scale: 0.95 }}
    onClick={onClick}
    disabled={disabled}
    className={`
      inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold 
      transition focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed min-h-[40px]
      ${variant === 'primary' ? 'bg-emerald-600 text-white hover:bg-emerald-700 shadow-md' : ''}
      ${variant === 'secondary' ? 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50' : ''}
      ${variant === 'danger' ? 'bg-red-600 text-white hover:bg-red-700' : ''}
      ${className}
    `}
  >
    {children}
  </motion.button>
)

const QuantityControl = ({
  qty,
  onDecrease,
  onIncrease,
  onRemove,
}: {
  qty: number
  onDecrease: () => void
  onIncrease: () => void
  onRemove: () => void
}) => (
  <div className="flex items-center border border-gray-300 rounded-xl overflow-hidden shadow-sm">
    <button
      onClick={qty > 1 ? onDecrease : onRemove}
      className={`p-2 transition ${
        qty > 1 ? 'hover:bg-gray-100' : 'hover:bg-red-100 text-red-600'
      }`}
    >
      {qty > 1 ? <Minus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
    </button>

    <div className="w-8 text-center text-sm font-medium border-l border-r border-gray-200">
      {qty}
    </div>

    <button onClick={onIncrease} className="p-2 hover:bg-gray-100 transition">
      <Plus className="w-4 h-4" />
    </button>
  </div>
)

export default function CartPage() {
  const {
    cart,
    products,
    clearCart,
    placeOrder,
    removeCartItem,
    updateCartItemQty,
    productPriceNow,
    cartTotal,
  } = useApp()

  const total = cartTotal()

  const toWhatsApp = () => {
    if (!cart.length) return toast.error('Səbət boşdur!')

    const text =
      cart
        .map((c) => {
          const p = products.find((x) => x.id === c.productId)
          const v = p?.variants.find((x) => x.id === c.variantId) ?? p?.variants?.[0]
          if (!p || !v) return ''

          const price = productPriceNow(p, v)
          const itemTotal = price * c.qty

          return `*${p.name}* ${
            v.name !== 'Default' ? `(${v.name})` : ''
          } x${c.qty} = ${itemTotal.toFixed(2)} AZN`
        })
        .filter(Boolean)
        .join('\n') +
      `\n\n*Yekun Məbləğ:* ${total.toFixed(2)} AZN\n\nSifarişə davam etmək istəyirəm.`

    window.open(whatsappLink('994775878588', text), '_blank')
  }

  const toSystem = () => {
    if (!cart.length) return toast.error('Səbət boşdur!')

    const items = cart.map((c) => {
      const p = products.find((x) => x.id === c.productId)
      const v = p?.variants.find((x) => x.id === c.variantId) ?? p?.variants?.[0]

      return {
        productId: c.productId,
        variantId: c.variantId || v?.id || 'default',
        qty: c.qty,
        priceAtOrder: productPriceNow(p!, v),
      }
    })

    placeOrder({
      id: crypto.randomUUID(),
      customerName: 'Anonim Müştəri',
      channel: 'system',
      items,
      status: 'pending',
      createdAt: new Date().toISOString(),
    })

    clearCart()
    toast.success('Sifariş qəbul edildi! Təşəkkür edirik.')
  }

  return (
    <main className="container mx-auto px-4 py-8 space-y-8 min-h-screen">
      <Toaster />
      <h1 className="text-4xl font-extrabold text-gray-900 border-b pb-4 flex items-center gap-3">
        <ShoppingCart className="text-emerald-600 w-8 h-8" /> Səbətim
      </h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* LEFT – Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          <motion.div
            layout
            className="rounded-2xl border bg-white shadow-xl p-4 md:p-6"
          >
            <AnimatePresence>
              {!cart.length ? (
                <motion.div
                  className="text-center py-12 text-gray-500 flex flex-col items-center"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                >
                  <Image
                    src="/basket.svg"
                    alt="Boş səbət"
                    width={96}
                    height={96}
                    className="opacity-50 mb-4"
                  />
                  <p className="text-xl font-medium">Səbətiniz boşdur 🧺</p>
                  <Link
                    href="/products"
                    className="mt-3 text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
                  >
                    <RotateCcw className="w-4 h-4" /> Məhsullara qayıt
                  </Link>
                </motion.div>
              ) : (
                <ul className="divide-y divide-gray-100">
                  {cart.map((c) => {
                    const p = products.find((x) => x.id === c.productId)
                    const v =
                      p?.variants.find((x) => x.id === c.variantId) ??
                      p?.variants?.[0]

                    if (!p || !v) return null

                    const price = productPriceNow(p, v)
                    const itemTotal = price * c.qty

                    return (
                      <motion.li
                        key={c.productId + (c.variantId || '')}
                        className="flex flex-col md:flex-row items-start md:items-center justify-between py-4 gap-4"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                      >
                        <div className="flex items-start gap-4 flex-grow">
                          <Image
                            src={p.images?.[0]?.url || p.images?.[0] || '/placeholder.png'}
                            alt={p.name}
                            width={90}
                            height={90}
                            className="rounded-xl object-cover border"
                          />

                          <div>
                            <Link
                              href={`/products/${p.slug}`}
                              className="font-bold text-gray-900 hover:text-emerald-600"
                            >
                              {p.name}
                            </Link>

                            <div className="text-sm text-gray-600">
                              {v.name !== 'Default' ? `Variant: ${v.name}` : 'Standart'}
                            </div>
                            <div className="text-sm text-gray-400">
                              Vahid qiyməti: {price.toFixed(2)} ₼
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <QuantityControl
                            qty={c.qty}
                            onDecrease={() =>
                              updateCartItemQty(c.productId, c.variantId, c.qty - 1)
                            }
                            onIncrease={() =>
                              updateCartItemQty(c.productId, c.variantId, c.qty + 1)
                            }
                            onRemove={() =>
                              removeCartItem(c.productId, c.variantId)
                            }
                          />
                          <div className="font-extrabold text-xl text-emerald-700 w-20 text-right">
                            {itemTotal.toFixed(2)} ₼
                          </div>
                        </div>
                      </motion.li>
                    )
                  })}
                </ul>
              )}
            </AnimatePresence>
          </motion.div>
        </div>

        {/* RIGHT – Order Summary */}
        <div className="lg:col-span-1 space-y-4 lg:sticky lg:top-8">
          <motion.div
            className="rounded-2xl border bg-white shadow-xl p-6 space-y-6"
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="text-2xl font-bold text-gray-800 border-b pb-3">
              Sifarişin Xülasəsi
            </h2>

            <div className="flex items-center justify-between text-lg">
              <span className="text-gray-600">Səbət dəyəri:</span>
              <span className="font-medium">{total.toFixed(2)} ₼</span>
            </div>

            <div className="flex items-center justify-between text-lg border-t pt-4">
              <span className="text-xl font-extrabold text-gray-900">
                Yekun Cəmi:
              </span>
              <span className="text-3xl font-extrabold text-emerald-700">
                {total.toFixed(2)} ₼
              </span>
            </div>

            <div className="flex flex-col gap-3 pt-4 border-t">
              <Button
                variant="primary"
                disabled={!cart.length}
                onClick={toSystem}
                className="py-3 text-base"
              >
                <ShoppingCart className="w-5 h-5" /> Sifarişi Tamamla
              </Button>

              <Button
                variant="secondary"
                disabled={!cart.length}
                onClick={toWhatsApp}
                className="py-3 text-base bg-[#25D366] text-white hover:bg-[#1DA851] border-none"
              >
                <Send className="w-5 h-5" /> WhatsApp ilə Sifariş Et
              </Button>

              <button
                onClick={clearCart}
                disabled={!cart.length}
                className="text-center text-sm text-red-500 hover:text-red-700 flex items-center justify-center gap-1"
              >
                <Trash2 className="w-4 h-4" /> Bütün Səbəti Təmizlə
              </button>
            </div>
          </motion.div>
        </div>
      </div>
    </main>
  )
}
