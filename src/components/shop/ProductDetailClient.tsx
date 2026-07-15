"use client";

import { useState, useCallback, useMemo, useRef, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Minus,
  Plus,
  ShoppingCart,
  Heart,
  Share2,
  Star,
  MapPin,
  Truck,
  ShieldCheck,
  Leaf,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  Send,
  Facebook,
  Twitter,
  Linkedin,
  Mail,
  Copy,
  CheckCircle2,
  AlertCircle,
  X,
  ZoomIn,
} from "lucide-react";
import { toast } from "react-hot-toast";
import { Button } from "@/components/atoms/button";
import { Product } from "@/types/products";
import { formatCurrency } from "@/utils/product";

interface Props {
  product: Product;
}

export default function ProductDetailClient({ product }: Props) {
  // ── State ─────────────────────────────────────────────────────
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [selectedVariantId, setSelectedVariantId] = useState<string>(
    product.variants?.[0]?.id ?? ""
  );
  const [qty, setQty] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showShareMenu, setShowShareMenu] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [imageModalOpen, setImageModalOpen] = useState(false);

  const shareRef = useRef<HTMLDivElement>(null);
  const galleryRef = useRef<HTMLDivElement>(null);

  // ── Derived ───────────────────────────────────────────────────
  const activeVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId),
    [product.variants, selectedVariantId]
  );

  const displayPrice = useMemo(() => {
    if (!activeVariant) return product.price ?? 0;
    const base = activeVariant.price ?? product.price ?? 0;
    return base; // Endirim hesablaması sonra əlavə edilə bilər
  }, [activeVariant, product.price]);

  const discountPercent = useMemo(() => {
    if (!product.discountType || !product.discountValue) return 0;
    const base = activeVariant?.price ?? product.price ?? 0;
    if (product.discountType === "PERCENTAGE") {
      return Math.min(product.discountValue, 100);
    } else if (product.discountType === "FIXED") {
      return base > 0 ? Math.round((product.discountValue / base) * 100) : 0;
    }
    return 0;
  }, [activeVariant, product.discountType, product.discountValue, product.price]);

  const finalPrice = useMemo(() => {
    if (discountPercent === 0) return displayPrice;
    return displayPrice - (displayPrice * discountPercent) / 100;
  }, [displayPrice, discountPercent]);

  const isOutOfStock = useMemo(
    () => !activeVariant || (activeVariant.stock ?? 0) === 0,
    [activeVariant]
  );

  const images = useMemo(
    () => (product.images && product.images.length > 0 ? product.images : [{ url: "/placeholder.jpg", alt: product.name }]),
    [product.images, product.name]
  );

  const currentImage = images[selectedImageIndex];

  // ── Handlers ──────────────────────────────────────────────────
  const handleVariantChange = useCallback((variantId: string) => {
    setSelectedVariantId(variantId);
    setQty(1);
  }, []);

  const handleQtyChange = useCallback((delta: number) => {
    const maxStock = activeVariant?.stock ?? 0;
    setQty((prev) => Math.max(1, Math.min(prev + delta, maxStock || 99)));
  }, [activeVariant?.stock]);

  const handleAddToCart = useCallback(async () => {
    if (isOutOfStock || addingToCart) return;
    setAddingToCart(true);
    try {
      // fetch API or store action
      await fetch("/api/cart", {
        method: "POST",
        body: JSON.stringify({
          productId: product.id,
          variantId: selectedVariantId,
          qty,
        }),
      });
      setAddedToCart(true);
      setTimeout(() => setAddedToCart(false), 2000);
      toast.success("Məhsul səbətə əlavə edildi!");
    } catch {
      toast.error("Xəta baş verdi, yenidən cəhd edin.");
    } finally {
      setAddingToCart(false);
    }
  }, [isOutOfStock, addingToCart, product.id, selectedVariantId, qty]);

  const handleShare = useCallback(
    async (platform: string) => {
      const url = `${window.location.origin}/products/${product.slug}`;
      const text = `🌿 ${product.name}\n💰 ${formatCurrency(finalPrice, "AZN")}\n📍 Organik Gədəbəy`;
      try {
        if (platform === "native") await navigator.share({ title: product.name, text, url });
        else if (platform === "whatsapp") window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
        else if (platform === "telegram") window.open(`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`, "_blank");
        else if (platform === "facebook") window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, "_blank");
        else if (platform === "twitter") window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, "_blank");
        else if (platform === "email") window.location.href = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text)}`;
        else if (platform === "copy") {
          await navigator.clipboard.writeText(`${text}\n${url}`);
          toast.success("Link kopyalandı! 📋");
        }
      } catch {}
      setShowShareMenu(false);
    },
    [product, finalPrice]
  );

  const galleryScroll = useCallback(
    (direction: "left" | "right") => {
      const newIndex =
        direction === "left"
          ? Math.max(0, selectedImageIndex - 1)
          : Math.min(images.length - 1, selectedImageIndex + 1);
      setSelectedImageIndex(newIndex);
    },
    [selectedImageIndex, images.length]
  );

  // Xarici kliklə paylaş menyusunu bağla
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Render ────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-emerald-50/30">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Breadcrumb */}
        <nav className="mb-6 text-sm text-slate-500">
          <a href="/" className="hover:text-emerald-700">Ana səhifə</a>
          <span className="mx-2">/</span>
          <a href="/products" className="hover:text-emerald-700">Məhsullar</a>
          <span className="mx-2">/</span>
          <span className="text-slate-900 font-semibold">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* ── Sol: Şəkil Qalereyası ── */}
          <div className="space-y-4">
            <div
              className="relative aspect-square overflow-hidden rounded-3xl bg-slate-100 shadow-lg cursor-zoom-in"
              onClick={() => setImageModalOpen(true)}
            >
              <Image
                src={currentImage?.url ?? "/placeholder.jpg"}
                alt={currentImage?.alt ?? product.name}
                fill
                className="object-cover transition-transform duration-500 hover:scale-110"
                priority
              />
              {images.length > 1 && (
                <>
                  <button
                    onClick={(e) => { e.stopPropagation(); galleryScroll("left"); }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow hover:bg-white transition"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={(e) => { e.stopPropagation(); galleryScroll("right"); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 z-10 bg-white/80 backdrop-blur-sm rounded-full p-2 shadow hover:bg-white transition"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>

            {/* Kiçik şəkillər */}
            {images.length > 1 && (
              <div ref={galleryRef} className="flex gap-2 overflow-x-auto pb-2">
                {images.map((img, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSelectedImageIndex(idx)}
                    className={`relative w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      idx === selectedImageIndex
                        ? "border-emerald-500 shadow-md"
                        : "border-slate-200 hover:border-emerald-300"
                    }`}
                  >
                    <Image
                      src={img.url ?? "/placeholder.jpg"}
                      alt={img.alt ?? ""}
                      fill
                      className="object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Sağ: Məhsul məlumatları ── */}
          <div className="space-y-6">
            {/* Ad + region */}
            <div>
              <h1 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">
                {product.name}
              </h1>
              {product.originRegion && (
                <p className="mt-2 flex items-center gap-1 text-sm text-slate-600">
                  <MapPin className="w-4 h-4 text-emerald-500" />
                  {product.originRegion}
                </p>
              )}
            </div>

            {/* Qiymət */}
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-black text-emerald-700">
                {formatCurrency(finalPrice, "AZN")}
              </span>
              {discountPercent > 0 && (
                <>
                  <span className="text-lg line-through text-slate-400">
                    {formatCurrency(displayPrice, "AZN")}
                  </span>
                  <span className="bg-red-100 text-red-600 px-2 py-0.5 rounded-full text-sm font-bold">
                    -{discountPercent}%
                  </span>
                </>
              )}
            </div>

            {/* Qısa təsvir */}
            {product.shortDescription && (
              <p className="text-slate-600 leading-relaxed">
                {product.shortDescription}
              </p>
            )}

            {/* Variant seçimi */}
            {product.variants && product.variants.length > 1 && (
              <div>
                <h3 className="text-sm font-semibold text-slate-700 mb-2">Variant seç:</h3>
                <div className="flex flex-wrap gap-2">
                  {product.variants.map((v) => (
                    <button
                      key={v.id}
                      onClick={() => handleVariantChange(v.id)}
                      className={`px-4 py-2 rounded-xl text-sm font-bold border-2 transition ${
                        v.id === selectedVariantId
                          ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                          : "border-slate-200 text-slate-600 hover:border-emerald-300"
                      }`}
                    >
                      {v.name || v.unit || "Variant"}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Stok vəziyyəti */}
            <div className="flex items-center gap-2">
              {isOutOfStock ? (
                <span className="flex items-center gap-1 text-red-600 font-semibold">
                  <AlertCircle className="w-4 h-4" /> Stokda yoxdur
                </span>
              ) : (
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="w-4 h-4" /> Stokda var ({activeVariant?.stock} ədəd)
                </span>
              )}
            </div>

            {/* Miqdar + Səbət */}
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2 bg-slate-100 rounded-full p-1">
                <button
                  onClick={() => handleQtyChange(-1)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="min-w-[2rem] text-center font-bold">{qty}</span>
                <button
                  onClick={() => handleQtyChange(1)}
                  className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>

              <Button
                onClick={handleAddToCart}
                disabled={isOutOfStock || addingToCart}
                className="flex-1 sm:flex-none bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-3 px-6 rounded-2xl shadow-lg"
              >
                {addingToCart ? (
                  <span className="animate-spin h-5 w-5 border-2 border-white border-t-transparent rounded-full" />
                ) : addedToCart ? (
                  <><CheckCircle2 className="w-5 h-5 mr-1" /> Əlavə edildi!</>
                ) : (
                  <><ShoppingCart className="w-5 h-5 mr-1" /> Səbətə at</>
                )}
              </Button>

              {/* Paylaş */}
              <div className="relative" ref={shareRef}>
                <button
                  onClick={() => setShowShareMenu(!showShareMenu)}
                  className="p-2 rounded-xl bg-slate-100 hover:bg-slate-200 transition"
                >
                  <Share2 className="w-5 h-5 text-slate-600" />
                </button>
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-48 bg-white rounded-2xl shadow-xl border p-2 z-50"
                    >
                      {/* sosial şəbəkələr siyahısı (əvvəlki kimi) */}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Təminat simgeleri */}
            <div className="grid grid-cols-2 gap-4 mt-8 pt-6 border-t border-slate-200">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Truck className="w-4 h-4 text-emerald-500" /> Pulsuz çatdırılma
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <ShieldCheck className="w-4 h-4 text-emerald-500" /> Təhlükəsiz ödəniş
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Leaf className="w-4 h-4 text-emerald-500" /> Organik sertifikatlı
              </div>
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <Star className="w-4 h-4 text-amber-400" /> Yüksək keyfiyyət
              </div>
            </div>
          </div>
        </div>

        {/* ── Ətraflı məlumat / rəylər bölməsi ── */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Təsvir */}
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Məhsul haqqında</h2>
            <div className="prose prose-slate max-w-none">
              {product.description ? (
                <div dangerouslySetInnerHTML={{ __html: product.description }} />
              ) : (
                <p className="text-slate-500">Ətraflı məlumat əlavə edilməyib.</p>
              )}
            </div>
          </div>

          {/* Rəylər */}
          <div className="space-y-6">
            <h2 className="text-2xl font-bold text-slate-900">Rəylər</h2>
            {product.reviews && product.reviews.length > 0 ? (
              <div className="space-y-4">
                {product.reviews.map((review) => (
                  <div key={review.id} className="bg-white p-4 rounded-2xl shadow-sm border">
                    <div className="flex items-center gap-2">
                      <div className="flex">
                        {Array.from({ length: 5 }).map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < review.rating ? "text-amber-400 fill-amber-400" : "text-slate-300"}`}
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-500">{review.name}</span>
                    </div>
                    <p className="mt-1 text-sm text-slate-700">{review.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500">Hələ rəy yoxdur.</p>
            )}
            <button
              onClick={() => setShowReviewForm(true)}
              className="text-sm font-semibold text-emerald-600 hover:underline"
            >
              Rəy yazın
            </button>
          </div>
        </div>
      </div>

      {/* ── Şəkil modalı ── */}
      <AnimatePresence>
        {imageModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4"
            onClick={() => setImageModalOpen(false)}
          >
            <button
              className="absolute top-4 right-4 text-white text-2xl"
              onClick={() => setImageModalOpen(false)}
            >
              <X className="w-8 h-8" />
            </button>
            <div className="relative w-full max-w-5xl aspect-square max-h-[90vh]">
              <Image
                src={currentImage?.url ?? "/placeholder.jpg"}
                alt={currentImage?.alt ?? product.name}
                fill
                className="object-contain"
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}