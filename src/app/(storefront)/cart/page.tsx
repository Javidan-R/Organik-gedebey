// src/app/(storefront)/cart/page.tsx
'use client';

import { useApp, useHasHydrated } from '@/lib/store';
import { useAuth } from '@/lib/auth-store';
import { motion, AnimatePresence } from 'framer-motion';
import toast, { Toaster } from 'react-hot-toast';
import { CldImage } from 'next-cloudinary';
import Link from 'next/link';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import {
  Trash2, Minus, Plus, ShoppingCart, Shield, Clock,
  Sparkles, ArrowLeft, CreditCard, MessageCircle, Percent, Gift,
} from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { calculateDeliveryFee, getDeliveryPercentage } from '@/lib/calc';
import { Button } from '@/components/atoms/button';
import { useQueryClient } from '@tanstack/react-query';
import { useBasketStore } from '@/stores/basketStore';
import Image from 'next/image';

const HowItWorksModal = dynamic(
  () =>
    import('@/components/ui/molecules/HowItWorksModal').then((mod) => ({
      default: mod.HowItWorksModal,
    })),
  {
    ssr: false,
    loading: () => (
      <div className="flex items-center justify-center p-8">Yüklənir...</div>
    ),
  }
);

const QuantityControl = ({
  qty,
  onDecrease,
  onIncrease,
  onRemove,
  max,
}: {
  qty: number;
  onDecrease: () => void;
  onIncrease: () => void;
  onRemove: () => void;
  max?: number;
}) => (
  <div className="flex items-center bg-gray-50 rounded-xl overflow-hidden border border-gray-200 shadow-sm">
    <button
      onClick={qty > 1 ? onDecrease : onRemove}
      className={`p-2.5 transition-colors ${
        qty > 1
          ? 'hover:bg-gray-100 text-gray-600'
          : 'hover:bg-red-100 text-red-500'
      }`}
      aria-label={qty > 1 ? 'Azalt' : 'Sil'}
    >
      {qty > 1 ? <Minus className="w-4 h-4" /> : <Trash2 className="w-4 h-4" />}
    </button>
    <div className="w-10 text-center text-sm font-bold text-gray-800 select-none">
      {qty}
    </div>
    <button
      onClick={onIncrease}
      disabled={max !== undefined && qty >= max}
      className="p-2.5 hover:bg-gray-100 transition-colors text-gray-600 disabled:opacity-40"
      aria-label="Artır"
    >
      <Plus className="w-4 h-4" />
    </button>
  </div>
);

const PLACEHOLDER_IMAGE =
  'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E';

export default function CartPage() {
  const hasHydrated = useHasHydrated();
  const {
    cart,
    products,
    removeCartItem,
    updateCartItemQty,
    productPriceNow,
    clearCart,
  } = useApp();
  const { isAuthenticated } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const queryClient = useQueryClient();

  // Basket store-dan basket məhsulları
  const basketItems = useBasketStore((state) => state.items);
  const removeBasketItem = useBasketStore((state) => state.removeItem);
  const updateBasketQty = useBasketStore((state) => state.updateQuantity);
  const clearBasketItems = useBasketStore((state) => state.clearItems);

  const [showCheckoutModal, setShowCheckoutModal] = useState(false);

  // ─── Məhsul səbəti hesablamaları ────────────────────────
  const productCartTotal = useMemo(
    () =>
      cart.reduce((sum, c) => {
        const p = products.find((x) => x.id === c.productId);
        const v =
          p?.variants?.find((x) => x.id === c.variantId) ?? p?.variants?.[0];
        if (!p || !v) return sum;
        return sum + productPriceNow(p, v) * c.qty;
      }, 0),
    [cart, products, productPriceNow]
  );

  // ─── Basket səbəti cəmi ────────────────────────────────
  const basketTotal = useMemo(
    () => basketItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [basketItems]
  );

  const total = productCartTotal + basketTotal;
  const discountPercent = 0;
  const discountAmount = (total * discountPercent) / 100;
  const afterDiscount = total - discountAmount;
  const deliveryFee = calculateDeliveryFee(afterDiscount);
  const currentPct = getDeliveryPercentage(afterDiscount);

  useEffect(() => {
    const openCheckout = searchParams.get('openCheckout');
    if (openCheckout !== '1') return;

    const newParams = new URLSearchParams(searchParams.toString());
    newParams.delete('openCheckout');
    const cleanUrl = newParams.toString()
      ? `${pathname}?${newParams}`
      : pathname;
    router.replace(cleanUrl, { scroll: false });

    if (isAuthenticated) {
      setShowCheckoutModal(true);
    } else {
      router.push(
        `/signup?callbackUrl=${encodeURIComponent('/cart?openCheckout=1')}`
      );
    }
  }, [searchParams, isAuthenticated, pathname, router]);

  // ─── Məhsul səbəti elementləri (göstərmək üçün) ──────────
  const productCartItems = useMemo(() => {
    if (!hasHydrated || !products.length) return [];
    return cart
      .map((c) => {
        const p = products.find((x) => x.id === c.productId);
        const v =
          p?.variants?.find((x) => x.id === c.variantId) ?? p?.variants?.[0];
        if (!p || !v) return null;
        const price = productPriceNow(p, v);
        return {
          id: `${c.productId}_${c.variantId || 'default'}`,
          type: 'product' as const,
          name: p.name,
          qty: c.qty,
          price,
          variant: v.isDefault ? undefined : v.name,
          image: p.images?.[0]?.url || PLACEHOLDER_IMAGE,
          stock: v.stock ?? 0,
          productId: c.productId,
          variantId: v.id ?? 'default',
          product: p,
          variantObj: v,
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  }, [hasHydrated, cart, products, productPriceNow]);

  // Basket məhsullarını da göstərmək üçün formatla
  const basketCartItems = useMemo(
    () =>
      basketItems.map((item) => ({
        id: `basket_${item.basketId}_${item.variantId}`,
        type: 'basket' as const,
        name: item.basketName,
        variant: item.variantName,
        qty: item.quantity,
        price: item.price,
        image: item.image,
        stock: item.stock,
        basketId: item.basketId,
        variantId: item.variantId,
        contents: item.contents,
        extras: item.extras,
        originalPrice: item.originalPrice,
      })),
    [basketItems]
  );

  const allItems = [...productCartItems, ...basketCartItems];
  const itemCount = allItems.reduce((sum, i) => sum + i.qty, 0);

  const handleOpenCheckout = useCallback(() => {
    if (!isAuthenticated) {
      router.push(
        `/signup?callbackUrl=${encodeURIComponent('/cart?openCheckout=1')}`
      );
    } else {
      setShowCheckoutModal(true);
    }
  }, [isAuthenticated, router]);

  const handlePlaceOrder = useCallback(
    async (customerInfo: {
      firstName?: string;
      lastName?: string;
      phone?: string;
      deliveryMethod: 'pickup' | 'delivery';
      address?: string;
      note?: string;
    }): Promise<void> => {
      if (!cart.length && !basketItems.length) {
        toast.error('Səbət boşdur!');
        return;
      }

      const fee = customerInfo.deliveryMethod === 'delivery' ? deliveryFee : 0;
      const finalTotal = afterDiscount + fee;
      const orderNumber = `ORG-${Date.now().toString(36).toUpperCase().slice(-6)}`;
      const createdAt = new Date();
      const customerFullName =
        `${customerInfo.firstName || ''} ${customerInfo.lastName || ''}`.trim();

      const customerPhone = customerInfo.phone?.trim();
      if (!customerPhone || customerPhone.length < 9) {
        toast.error('Düzgün telefon nömrəsi daxil edin (ən azı 9 rəqəm)');
        throw new Error('Telefon nömrəsi etibarsızdır');
      }

      if (
        customerInfo.deliveryMethod === 'delivery' &&
        !customerInfo.address?.trim()
      ) {
        toast.error('Çatdırılma ünvanı tələb olunur');
        throw new Error('Çatdırılma ünvanı qeyd edilməyib');
      }

      // Məhsul səbətini order items-ə çevir
      const productOrderItems = cart.map((c) => {
        const p = products.find((x) => x.id === c.productId);
        if (!p) throw new Error(`Məhsul tapılmadı: ${c.productId}`);
        const v =
          p?.variants?.find((x) => x.id === c.variantId) ?? p?.variants?.[0];
        if (!v) throw new Error(`Variant tapılmadı: ${p.name}`);
        const variantId: string = v?.id ?? 'default';
        return {
          productId: c.productId,
          variantId,
          productName: p.name,
          variantName: v.name,
          qty: c.qty,
          unit: null,
          priceAtOrder: productPriceNow(p!, v!).toFixed(2),
          costAtOrder: (v.costPrice || 0).toFixed(2),
          subtotal: (productPriceNow(p!, v!) * c.qty).toFixed(2),
        };
      });

      // Basket məhsullarını order items-ə çevir (hamısını bir sətir kimi)
      const basketOrderItems = basketItems.map((bi) => ({
        productId: `basket-${bi.basketId}`,
        variantId: `basket-${bi.variantId}`,
        productName: `${bi.basketName} (${bi.variantName})`,
        variantName: bi.variantName,
        qty: bi.quantity,
        unit: 'səbət',
        priceAtOrder: bi.price.toFixed(2),
        costAtOrder: '0',
        subtotal: (bi.price * bi.quantity).toFixed(2),
      }));

      const orderData = {
        orderNumber,
        customerName: customerFullName || 'Anonim Müştəri',
        customerPhone: customerPhone,
        deliveryAddressText:
          customerInfo.deliveryMethod === 'delivery'
            ? customerInfo.address || 'Ünvan qeyd edilməyib'
            : 'Özü götürmə',
        address:
          customerInfo.deliveryMethod === 'delivery'
            ? customerInfo.address || 'Ünvan qeyd edilməyib'
            : 'Özü götürmə',
        subtotal: total.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        deliveryFee: fee.toFixed(2),
        total: finalTotal.toFixed(2),
        couponDiscount: '0',
        status: 'PENDING',
        paymentStatus: 'UNPAID',
        paymentMethod: 'CASH_ON_DELIVERY',
        customerNotes: customerInfo.note || null,
        adminNotes: null,
        items: [...productOrderItems, ...basketOrderItems],
        note: customerInfo.note || null,
      };

      let createdOrder: any = null;
      let retryCount = 0;
      const maxRetries = 2;

      while (retryCount <= maxRetries) {
        try {
          const response = await fetch('/api/orders', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(orderData),
            credentials: 'include',
          });
          const responseData = await response.json();
          if (!response.ok) {
            if (response.status === 409) {
              toast.error(responseData.error || 'Stok problemi');
              throw new Error(responseData.error || 'Stok problemi');
            }
            if (response.status === 400 && responseData.details) {
              const validationErrors = responseData.details
                .map((d: any) => d.message)
                .join(', ');
              toast.error(`Validasiya xətası: ${validationErrors}`);
              throw new Error(validationErrors);
            }
            if (retryCount < maxRetries) {
              retryCount++;
              await new Promise((resolve) =>
                setTimeout(resolve, 1000 * retryCount)
              );
              continue;
            }
            throw new Error(responseData.error || 'Sifariş yaradıla bilmədi');
          }
          createdOrder = responseData.order;
          break;
        } catch (error) {
          if (retryCount === maxRetries) {
            toast.error(
              error instanceof Error
                ? error.message
                : 'Sifariş yaradılarkən xəta baş verdi'
            );
            throw error;
          }
          retryCount++;
        }
      }

      if (!createdOrder) {
        toast.error('Sifariş yaradıla bilmədi.');
        throw new Error('Order creation failed');
      }

      queryClient.invalidateQueries({ queryKey: ['orders'] });
      window.dispatchEvent(new Event('orders-updated'));

      const dateStr = createdAt.toLocaleDateString('az-AZ', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      const itemsText = allItems
        .map(
          (item) =>
            `🛒 *${item.name}*${item.variant ? ` (${item.variant})` : ''}  ×${item.qty} — ${(item.price * item.qty).toFixed(2)} AZN`
        )
        .join('\n');

      const message = `
🌿 *ORGANİK GƏDƏBƏY* 🌿
━━━━━━━━━━━━━━━━━━━━━━━
📦 *YENİ SİFARİŞ* #${orderNumber}
📅 ${dateStr}
━━━━━━━━━━━━━━━━━━━━━━━

👤 *Müştəri məlumatları*
${customerFullName ? `👤 Ad: ${customerFullName}` : ''}
📞 Telefon: ${customerPhone}
${customerInfo.deliveryMethod === 'delivery' ? `🚚 Çatdırılma ünvanı: ${customerInfo.address}` : '🏪 Özü götürmə'}
${customerInfo.note ? `📝 Qeyd: ${customerInfo.note}` : ''}

━━━━━━━━━━━━━━━━━━━━━━━
🛍️ *SİFARİŞ MƏHSULLARI*
${itemsText}
━━━━━━━━━━━━━━━━━━━━━━━

💰 *ÖDƏNİŞ MƏLUMATLARI*
Məhsul cəmi: ${total.toFixed(2)} AZN
${discountAmount > 0 ? `🎁 Endirim (-${discountPercent}%): -${discountAmount.toFixed(2)} AZN` : ''}
${fee > 0 ? `🚚 Çatdırılma haqqı (%${currentPct}): ${fee.toFixed(2)} AZN` : ''}
─────────────────────
✨ *Cəmi:* ${finalTotal.toFixed(2)} AZN

━━━━━━━━━━━━━━━━━━━━━━━
✅ *Sifarişiniz qəbul edildi!*
🙏 Təşəkkür edirik! Sağlamlıqla istifadə edin.
      `.trim();

      const whatsappUrl = `https://wa.me/994773676021?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');

      clearCart();
      clearBasketItems();
      toast.success('Sifariş uğurla yaradıldı!');
    },
    [
      cart,
      products,
      basketItems,
      clearCart,
      clearBasketItems,
      productPriceNow,
      total,
      afterDiscount,
      deliveryFee,
      currentPct,
      discountAmount,
      discountPercent,
      queryClient,
    ]
  );

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-emerald-50/30 to-white">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
          className="w-12 h-12 border-4 border-emerald-500 border-t-transparent rounded-full"
        />
      </div>
    );
  }

  if (!cart.length && !basketItems.length) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center bg-gradient-to-b from-emerald-50/50 to-white p-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ y: [0, -8, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
          >
            <ShoppingCart className="w-24 h-24 mx-auto text-emerald-200 mb-6" />
          </motion.div>
          <h1 className="text-3xl font-black text-gray-800 mb-2">
            Səbətiniz boşdur
          </h1>
          <p className="text-gray-500 mb-8">
            Məhsulları kəşf edin və səbətə əlavə edin
          </p>
          <Link href="/products">
            <Button variant="primary" className="px-8 py-3">
              <ShoppingCart className="w-5 h-5" /> Məhsullara bax
            </Button>
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gradient-to-b from-emerald-50/30 to-white py-8 px-4">
      <Toaster position="top-center" />
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <Link
              href="/products"
              className="text-sm text-gray-500 hover:text-emerald-600 flex items-center gap-1 mb-2"
            >
              <ArrowLeft className="w-4 h-4" /> Alış-verişə davam et
            </Link>
            <h1 className="text-3xl font-black text-gray-900 flex items-center gap-3">
              Səbətim{' '}
              <span className="text-lg font-medium text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full">
                {itemCount} məhsul
              </span>
            </h1>
          </div>
          <Button
            onClick={() => {
              clearCart();
              clearBasketItems();
            }}
            variant="ghost"
            className="text-xs"
          >
            <Trash2 className="w-4 h-4" /> Səbəti təmizlə
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-3">
          <AnimatePresence>
            {allItems.map((item, idx) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ delay: idx * 0.05 }}
                className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow p-4"
              >
                <div className="flex items-center gap-4">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0">
                    {item.type === 'product' ? (
                      <CldImage
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        width="500"
                        height="500"
                        crop={{ type: 'auto', source: true }}
                      />
                    ) : (
                      <Image
                        src={item.image || PLACEHOLDER_IMAGE}
                        alt={item.name}
                        width={500}
                        height={500}
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-gray-900 truncate flex items-center gap-2">
                      {item.name}
                      {item.type === 'basket' && (
                        <span className="inline-flex items-center gap-1 text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-semibold">
                          <Gift className="w-3 h-3" /> Səbət
                        </span>
                      )}
                    </h3>
                    {item.variant && (
                      <p className="text-xs text-gray-500">{item.variant}</p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-emerald-600 font-bold">
                        {item.price.toFixed(2)} ₼
                      </span>
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <QuantityControl
                        qty={item.qty}
                        onDecrease={() => {
                          if (item.type === 'product') {
                            updateCartItemQty(
                              item.productId,
                              item.variantId,
                              item.qty - 1
                            );
                          } else {
                            updateBasketQty(
                              item.basketId,
                              item.variantId,
                              item.qty - 1
                            );
                          }
                        }}
                        onIncrease={() => {
                          if (item.type === 'product') {
                            updateCartItemQty(
                              item.productId,
                              item.variantId,
                              item.qty + 1
                            );
                          } else {
                            updateBasketQty(
                              item.basketId,
                              item.variantId,
                              item.qty + 1
                            );
                          }
                        }}
                        onRemove={() => {
                          if (item.type === 'product') {
                            removeCartItem(item.productId, item.variantId);
                          } else {
                            removeBasketItem(item.basketId, item.variantId);
                          }
                        }}
                        max={item.stock || 999}
                      />
                      <span className="font-black text-lg text-gray-800">
                        {(item.price * item.qty).toFixed(2)} ₼
                      </span>
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
          <div className="bg-emerald-50 rounded-2xl p-4 flex items-center gap-3 border border-emerald-100">
            <Shield className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <p className="text-sm text-emerald-800">
              Bütün məhsullarımız 100% təzədir. Keyfiyyətə zəmanət veririk.
            </p>
          </div>
        </div>

        <div className="lg:col-span-1">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 p-6 sticky top-24"
          >
            <h2 className="text-xl font-black text-gray-800 mb-4">
              Sifariş Xülasəsi
            </h2>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-500">Məhsul cəmi</span>
                <span className="font-semibold">{total.toFixed(2)} ₼</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600">
                  <span>Endirim ({discountPercent}%)</span>
                  <span>-{discountAmount.toFixed(2)} ₼</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-500">Çatdırılma</span>
                <span className="text-emerald-600 font-semibold">
                  {currentPct}% — {deliveryFee.toFixed(2)} ₼
                </span>
              </div>
              <div className="border-t pt-2 flex justify-between items-center">
                <span className="text-gray-900 font-bold text-lg">Cəmi</span>
                <span className="text-2xl font-black text-emerald-600">
                  {(afterDiscount + deliveryFee).toFixed(2)} ₼
                </span>
              </div>
              <div className="bg-blue-50 border border-blue-200 rounded-2xl p-3 mt-3">
                <div className="flex items-center gap-1 text-xs font-bold text-blue-800 mb-2">
                  <Percent className="w-3.5 h-3.5" /> Çatdırılma haqqı
                </div>
                <p className="text-xs text-blue-700">
                  Səbət məbləğinizə görə çatdırılma faizi:{' '}
                  <strong>%{currentPct}</strong>
                </p>
              </div>
            </div>
            <div className="mt-6 space-y-3">
              <Button
                className="w-full py-3.5"
                onClick={handleOpenCheckout}
              >
                <MessageCircle className="w-5 h-5" /> WhatsApp ilə sifariş et
              </Button>
              {!isAuthenticated && (
                <p className="text-xs text-center text-amber-600 bg-amber-50 p-2 rounded-lg">
                  Sifarişi tamamlamaq üçün{' '}
                  <Link
                    href="/login?callbackUrl=/cart"
                    className="font-bold underline"
                  >
                    daxil olun
                  </Link>{' '}
                  və ya{' '}
                  <Link
                    href={`/signup?callbackUrl=${encodeURIComponent('/cart?openCheckout=1')}`}
                    className="font-bold underline"
                  >
                    qeydiyyatdan keçin
                  </Link>
                  .
                </p>
              )}
              <div className="text-center text-xs text-gray-400">
                <Clock className="w-3.5 h-3.5 inline mr-1" /> Hazırlanma
                müddəti: ~30 dəq
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
              <span>
                Tezliklə kart ilə ödəniş (Visa/Mastercard) aktivləşəcək!
              </span>
            </div>
          </motion.div>
        </div>
      </div>

      {isAuthenticated && (
        <HowItWorksModal
          open={showCheckoutModal}
          onClose={() => setShowCheckoutModal(false)}
          cartItems={allItems.map((item) => ({
            name: item.name,
            qty: item.qty,
            price: item.price,
            variant: item.variant,
            image: item.image,
            stock: item.stock,
          }))}
          cartTotal={afterDiscount}
          onPlaceOrder={handlePlaceOrder}
        />
      )}
    </main>
  );
}