"use client";

import { useState } from "react";

export default function BasketModal({ item, onClose }: any) {
  if (!item) return null;

  const [selectedVariant, setSelectedVariant] = useState(item.variants?.[0] || null);
  const [quantity, setQuantity] = useState(1);

  const variantData = selectedVariant || item.variants?.[0];
  const price = variantData ? parseFloat(variantData.price) : 0;
  const originalPrice = variantData?.originalPrice ? parseFloat(variantData.originalPrice) : null;
  const discount = originalPrice ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
  const totalPrice = price * quantity;

  const whatsappUrl = `https://wa.me/994773676021?text=${encodeURIComponent(
    `Salam, ${item.name} (${variantData?.variant || 'standart'}) səbətindən ${quantity} ədəd sifariş etmək istəyirəm. Qiymət: ${totalPrice} AZN`
  )}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center px-4">
      <div className="bg-white rounded-3xl max-w-3xl w-full overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="relative h-72">
          <img src={item.media?.[0]?.url || item.media?.[0]?.src} className="w-full h-full object-cover" />
          <button onClick={onClose} className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full">✕</button>
          {discount > 0 && (
            <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
              -{discount}%
            </div>
          )}
        </div>

        <div className="p-8 space-y-6">
          <h2 className="text-3xl font-extrabold">{item.name}</h2>
          {item.tagline && (
            <p className="text-emerald-600 font-medium">{item.tagline}</p>
          )}

          {/* Variant Selection */}
          {item.variants && item.variants.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Variant seçin</h3>
              <div className="grid grid-cols-3 gap-3">
                {item.variants.map((variant: any) => (
                  <button
                    key={variant.id}
                    onClick={() => { setSelectedVariant(variant); setQuantity(1); }}
                    className={`p-3 rounded-xl border-2 transition-all ${
                      selectedVariant?.id === variant.id
                        ? 'border-emerald-500 bg-emerald-50'
                        : 'border-gray-200 hover:border-emerald-300'
                    }`}
                  >
                    <div className="font-medium text-sm capitalize">{variant.variant}</div>
                    <div className="text-emerald-600 font-bold">
                      {parseFloat(variant.price).toFixed(2)} AZN
                    </div>
                    {variant.stock === 0 && (
                      <div className="text-red-500 text-xs mt-1">Tükənib</div>
                    )}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Contents */}
          {variantData?.contents && variantData.contents.length > 0 && (
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Tərkib məhsulları</h3>
              <div className="grid sm:grid-cols-2 gap-2 text-sm">
                {variantData.contents.map((c: any, i: number) => (
                  <span key={i} className="flex items-center gap-2">
                    <span className="text-emerald-500">✔</span>
                    <span>{typeof c === 'string' ? c : c.content}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Extras */}
          {variantData?.extras && variantData.extras.length > 0 && (
            <div className="bg-emerald-50 p-4 rounded-xl">
              <h3 className="font-semibold text-gray-900 mb-2">🎁 Bonuslar</h3>
              <ul className="space-y-1">
                {variantData.extras.map((e: any, i: number) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <span className="text-emerald-500">✔</span>
                    <span>{typeof e === 'string' ? e : e.extra}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Quantity */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Miqdar</h3>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                −
              </button>
              <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
              >
                +
              </button>
            </div>
          </div>

          {/* Price & CTA */}
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4 pt-4 border-t">
            <div className="text-center sm:text-left">
              <div className="flex items-baseline gap-3 justify-center sm:justify-start">
                <span className="text-3xl font-extrabold text-emerald-700">
                  {totalPrice.toFixed(2)} AZN
                </span>
                {originalPrice && (
                  <span className="text-lg text-gray-400 line-through">
                    {(originalPrice * quantity).toFixed(2)} AZN
                  </span>
                )}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {price.toFixed(2)} AZN × {quantity} ədəd
              </div>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              className="bg-emerald-700 text-white px-6 py-3 rounded-xl font-bold hover:bg-emerald-800 transition-colors"
            >
              WhatsApp ilə sifariş et
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
