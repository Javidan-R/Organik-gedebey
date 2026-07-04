'use client';
 
import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  ShoppingCart, Heart, Share2, Check, Truck,
  Shield, Leaf, Gift, ChevronLeft, Plus, Minus,
  Info, Award, Clock, Sparkles, TrendingUp,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useApp } from '@/lib/store';
import { Basket, BasketVariant } from '@/types/basket';
import { Button } from '@/components/atoms/button';
import { toast } from 'react-hot-toast';

interface BasketDetailClientProps {
  basket: Basket;
}

export default function BasketDetailClient({ basket }: BasketDetailClientProps) {
  const [selectedVariant, setSelectedVariant] = useState<BasketVariant | null>(
    basket.variants?.[0] || null
  );
  const [quantity, setQuantity] = useState(1);
  const [isLiked, setIsLiked] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const addToCart = useApp((state) => state.addToCart);

  const handleAddToCart = () => {
    if (!selectedVariant) return;

    addToCart(basket.id, selectedVariant.id, quantity);

    toast.success(`${basket.name} səbəti səbətə əlavə edildi!`);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    toast.success(isLiked ? 'Sevimlilərdən çıxarıldı' : 'Sevimlilərə əlavə edildi');
  };

  const handleShare = async () => {
    if (navigator.share) {
      await navigator.share({
        title: basket.name,
        text: basket.tagline || basket.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success('Link kopyalandı!');
    }
  };

  const finalPrice = selectedVariant 
    ? parseFloat(selectedVariant.price)
    : parseFloat(basket.variants?.[0]?.price || '0');

  const originalPrice = selectedVariant?.originalPrice
    ? parseFloat(selectedVariant.originalPrice)
    : null;

  const discount = originalPrice 
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : basket.discount || 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-slate-50">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-lg border-b border-emerald-100">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link
            href="/baskets"
            className="flex items-center gap-2 text-gray-600 hover:text-emerald-600 transition-colors"
          >
            <ChevronLeft className="w-5 h-5" />
            <span className="font-medium">Səbətlər</span>
          </Link>
          <div className="flex items-center gap-2">
            <button
              onClick={handleLike}
              className={`p-2 rounded-full transition-colors ${
                isLiked ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-600'
              }`}
            >
              <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} />
            </button>
            <button
              onClick={handleShare}
              className="p-2 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-colors"
            >
              <Share2 className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Images */}
          <div className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative aspect-square rounded-2xl overflow-hidden bg-gray-100"
            >
              <Image
                src={basket.media?.[currentImageIndex]?.url || '/placeholder.jpg'}
                alt={basket.name}
                fill
                className="object-cover"
                priority
              />
              {discount > 0 && (
                <div className="absolute top-4 left-4 bg-red-500 text-white px-3 py-1 rounded-full text-sm font-bold">
                  -{discount}%
                </div>
              )}
              {basket.bestseller && (
                <div className="absolute top-4 right-4 bg-amber-500 text-white px-3 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                  <Award className="w-4 h-4" />
                  Bestseller
                </div>
              )}
            </motion.div>
            
            {basket.media && basket.media.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {basket.media.map((media, index) => (
                  <button
                    key={media.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 transition-all ${
                      currentImageIndex === index ? 'ring-2 ring-emerald-500' : 'opacity-70'
                    }`}
                  >
                    <Image
                      src={media.url}
                      alt={`${basket.name} ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="space-y-6"
          >
            <div>
              <div className="flex items-center gap-2 mb-2">
                {basket.new && (
                  <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    YENİ
                  </span>
                )}
                {basket.trending && (
                  <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-xs font-semibold flex items-center gap-1">
                    <TrendingUp className="w-3 h-3" />
                    Trending
                  </span>
                )}
                {basket.lowStock && (
                  <span className="bg-orange-100 text-orange-700 px-2 py-0.5 rounded-full text-xs font-semibold">
                    Az Qalıb
                  </span>
                )}
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{basket.name}</h1>
              {basket.tagline && (
                <p className="text-lg text-emerald-600 font-medium">{basket.tagline}</p>
              )}
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-gray-900">
                {finalPrice.toFixed(2)} AZN
              </span>
              {originalPrice && (
                <span className="text-xl text-gray-400 line-through">
                  {originalPrice.toFixed(2)} AZN
                </span>
              )}
            </div>

            {/* Description */}
            <p className="text-gray-600 leading-relaxed">{basket.description}</p>

            {/* Variants */}
            {basket.variants && basket.variants.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Variant seçin</h3>
                <div className="grid grid-cols-3 gap-3">
                  {basket.variants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant)}
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

            {/* Quantity */}
            <div>
              <h3 className="font-semibold text-gray-900 mb-3">Miqdar</h3>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="text-xl font-semibold w-12 text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity(quantity + 1)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Add to Cart */}
            <Button
              onClick={handleAddToCart}
              disabled={!selectedVariant || selectedVariant.stock === 0}
              className="w-full py-4 text-lg font-semibold"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {!selectedVariant
                ? 'Variant seçin'
                : selectedVariant.stock === 0
                ? 'Tükənib'
                : 'Səbətə Əlavə Et'}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-2 gap-4 pt-4">
              <div className="flex items-center gap-2 text-gray-600">
                <Truck className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">Pulsuz çatdırılma</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">100% təbii</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Leaf className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">Organik məhsul</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Gift className="w-5 h-5 text-emerald-600" />
                <span className="text-sm">Hədiyyə paketi</span>
              </div>
            </div>

            {/* Contents */}
            {selectedVariant?.contents && selectedVariant.contents.length > 0 && (
              <div className="bg-emerald-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Info className="w-5 h-5" />
                  Səbətin məzmunu
                </h3>
                <ul className="space-y-2">
                  {selectedVariant.contents.map((content, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{content.content}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Extras */}
            {selectedVariant?.extras && selectedVariant.extras.length > 0 && (
              <div className="bg-amber-50 rounded-xl p-4">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Bonuslar
                </h3>
                <ul className="space-y-2">
                  {selectedVariant.extras.map((extra, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <Gift className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                      <span>{extra.extra}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Origin & Freshness */}
            {(basket.origin || basket.freshness) && (
              <div className="flex items-center gap-4 text-sm text-gray-600">
                {basket.origin && (
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>Mənşə: {basket.origin}</span>
                  </div>
                )}
                {basket.freshness && (
                  <div className="flex items-center gap-1">
                    <Leaf className="w-4 h-4" />
                    <span>Təzəlik: {basket.freshness}</span>
                  </div>
                )}
              </div>
            )}

            {/* Nutrition */}
            {basket.nutrition && basket.nutrition.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Qidalılıq məlumatları</h3>
                <div className="flex flex-wrap gap-2">
                  {basket.nutrition.map((item, index) => (
                    <span
                      key={index}
                      className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                    >
                      {item}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Highlights */}
            {basket.highlights && basket.highlights.length > 0 && (
              <div>
                <h3 className="font-semibold text-gray-900 mb-3">Xüsusiyyətlər</h3>
                <ul className="space-y-2">
                  {basket.highlights.map((highlight, index) => (
                    <li key={index} className="flex items-start gap-2 text-gray-700">
                      <Check className="w-4 h-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                      <span>{highlight}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
