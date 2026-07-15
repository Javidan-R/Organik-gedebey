// src/components/shop/QuickViewModal.tsx
'use client';

import { Product } from "@/lib/store";
import { formatCurrency } from "@/utils/product";
import { AnimatePresence, motion } from "framer-motion";
import {
  X, MapPin, CheckCircle2, ShoppingCart,
  Share2, MessageCircle, Send, Facebook, Twitter, Linkedin, Mail, Copy
} from "lucide-react";
import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import toast from "react-hot-toast";

type QuickViewProps = {
  open: boolean;
  onClose: () => void;
  product: Product; 
  imgUrl: string;
  discount: number;
  displayPrice: number;
  basePrice: number;
  currency: string;
  qty: number;
  isOut: boolean;
  addingToCart: boolean;
  addedToCart: boolean;
  selectedVariantIdx: number;
  setSelectedVariantIdx: (i: number) => void;
  handleQtyChange: (delta: number) => void;
  handleAddToCart: () => void;
};

export const QuickViewModal: React.FC<QuickViewProps> = ({
  open,
  onClose,
  product,
  imgUrl,
  discount,
  displayPrice,
  basePrice,
  currency,
  qty,
  isOut,
  addingToCart,
  addedToCart,
  selectedVariantIdx,
  setSelectedVariantIdx,
  handleQtyChange,
  handleAddToCart,
}) => {
  const [showShareMenu, setShowShareMenu] = useState(false);
  const shareRef = useRef<HTMLDivElement>(null);

  // Xarici kliklə bağlama
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (shareRef.current && !shareRef.current.contains(e.target as Node)) {
        setShowShareMenu(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Paylaşma funksiyası
  const handleShare = useCallback(async (platform: string) => {
    const productUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/products/${product.slug}`
      : '';
    const text = `🌿 *${product.name}*\n💰 ${formatCurrency(displayPrice, currency)}\n📍 Organik Gədəbəy\n\n🛒 ${productUrl}`;
    try {
      if (platform === 'native') await navigator.share({ title: product.name, text, url: productUrl });
      else if (platform === 'whatsapp') window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
      else if (platform === 'telegram') window.open(`https://t.me/share/url?url=${encodeURIComponent(productUrl)}&text=${encodeURIComponent(text)}`, '_blank');
      else if (platform === 'facebook') window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`, '_blank');
      else if (platform === 'twitter') window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(productUrl)}`, '_blank');
      else if (platform === 'linkedin') window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(productUrl)}`, '_blank');
      else if (platform === 'email') window.location.href = `mailto:?subject=${encodeURIComponent(product.name)}&body=${encodeURIComponent(text)}`;
      else if (platform === 'copy') { await navigator.clipboard?.writeText(`${text}\n\n${productUrl}`); toast.success('Link kopyalandı! 📋'); }
    } catch {}
    setShowShareMenu(false);
  }, [product, displayPrice, currency]);

  if (!product) return null;

  /* ============================= */
  /* 🔒 BODY SCROLL LOCK + ESC KEY */
  /* ============================= */
  useEffect(() => {
    if (!open) return;

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", handleEsc);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEsc);
    };
  }, [open, onClose]);

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* OVERLAY */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-md z-[200]"
          />

          {/* MODAL */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 60 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 60 }}
            transition={{ type: "spring", stiffness: 180, damping: 22 }}
            onClick={(e) => e.stopPropagation()}
            className="fixed inset-x-4 top-1/2 -translate-y-1/2 z-[201] max-w-lg mx-auto bg-white rounded-3xl shadow-2xl max-h-[90vh] flex flex-col overflow-y-auto overflow-x-visible"
          >
            {/* HEADER IMAGE */}
            <div className="relative h-56 bg-slate-50 shrink-0">
              <Image
                src={imgUrl}
                alt={product.name}
                fill
                className="object-contain p-4"
              />

              {discount > 0 && (
                <div className="absolute top-3 left-3 bg-red-500 text-white text-xs font-black px-2 py-1 rounded-full shadow">
                  -{discount}%
                </div>
              )}

              {/* Paylaş + Bağlama düymələri qrupu */}
              <div className="absolute top-3 right-3 flex gap-2 z-30" ref={shareRef}>
                {/* Paylaş düyməsi */}
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => { e.stopPropagation(); setShowShareMenu(!showShareMenu); }}
                  className="flex items-center gap-1 rounded-xl bg-white/90 backdrop-blur-md border border-white/50 px-2.5 py-1.5 sm:px-3 sm:py-2 text-[10px] sm:text-xs font-semibold text-slate-700 hover:bg-white transition-all shadow-lg"
                >
                  <Share2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 text-emerald-600" />
                  <span className="hidden sm:inline">Paylaş</span>
                </motion.button>

                {/* Bağlama düyməsi */}
                <button
                  onClick={onClose}
                  className="h-9 w-9 rounded-full bg-white shadow-md flex items-center justify-center hover:scale-105 transition"
                >
                  <X className="w-4 h-4" />
                </button>

                {/* Paylaşma menyusu */}
                <AnimatePresence>
                  {showShareMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute right-0 top-full mt-2 w-44 sm:w-52 rounded-2xl bg-white p-2 shadow-2xl border border-slate-100 z-50"
                    >
                      {[
                        { label: 'Paylaş', icon: Share2, platform: 'native', color: 'text-emerald-600' },
                        { label: 'WhatsApp', icon: MessageCircle, platform: 'whatsapp', color: 'text-[#25D366]' },
                        { label: 'Telegram', icon: Send, platform: 'telegram', color: 'text-[#0088cc]' },
                        { label: 'Facebook', icon: Facebook, platform: 'facebook', color: 'text-[#1877f2]' },
                        { label: 'X', icon: Twitter, platform: 'twitter', color: 'text-black' },
                        { label: 'LinkedIn', icon: Linkedin, platform: 'linkedin', color: 'text-[#0A66C2]' },
                        { label: 'Email', icon: Mail, platform: 'email', color: 'text-slate-600' },
                        { label: 'Kopyala', icon: Copy, platform: 'copy', color: 'text-slate-600' },
                      ].map((opt) => (
                        <button
                          key={opt.platform}
                          onClick={(e) => { e.stopPropagation(); handleShare(opt.platform); }}
                          className={`flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 transition ${opt.color}`}
                        >
                          <opt.icon className="h-4 w-4" /> {opt.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* CONTENT */}
            <div className="p-5 space-y-4">
              {/* Title + Region */}
              <div>
                <h3 className="text-lg font-black text-slate-800">{product.name}</h3>
                {product.originRegion && (
                  <p className="text-xs text-slate-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-3 h-3" /> {product.originRegion}
                  </p>
                )}
              </div>

              {/* Description */}
              {product.description && (
                <p className="text-xs text-slate-600 leading-relaxed">
                  {product.description}
                </p>
              )}

              {/* VARIANTS */}
              {(product.variants?.length ?? 0) > 1 && (
                <div className="space-y-2">
                  <p className="text-xs font-semibold text-slate-700">Variant seç:</p>
                  <div className="flex gap-2 flex-wrap">
                    {product.variants!.map((v, i) => {
                      const label = v.label ?? v.name ?? (v.weight ? `${v.weight}${v.unit ?? ""}` : "Variant");
                      return (
                        <motion.button
                          key={v.id || i}
                          whileTap={{ scale: 0.94 }}
                          onClick={() => setSelectedVariantIdx(i)}
                          className={`relative px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all flex items-center gap-1 max-w-[120px] ${
                            i === selectedVariantIdx
                              ? "border-emerald-500 bg-emerald-100 text-emerald-800 shadow-sm"
                              : "border-slate-200 text-slate-600 hover:border-emerald-300 hover:bg-emerald-50"
                          }`}
                        >
                          {i === selectedVariantIdx && (
                            <span className="absolute -top-1 -right-1 w-2 h-2 bg-emerald-500 rounded-full" />
                          )}
                          <span className="truncate">{label}</span>
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* PRICE + ACTION */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                <div>
                  <span className="text-xl font-black text-slate-900">
                    {formatCurrency(displayPrice, currency)}
                  </span>
                  {discount > 0 && (
                    <span className="text-xs line-through text-slate-400 ml-2">
                      {formatCurrency(basePrice, currency)}
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {/* Qty */}
                  <div className="flex items-center gap-1 bg-slate-100 rounded-full px-1 py-1">
                    <button
                      onClick={() => handleQtyChange(-1)}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold"
                    >
                      −
                    </button>
                    <span className="min-w-[1.5rem] text-center text-sm font-bold">{qty}</span>
                    <button
                      onClick={() => handleQtyChange(1)}
                      className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center text-slate-700 font-bold"
                    >
                      +
                    </button>
                  </div>

                  {/* Add to cart */}
                  {!isOut && (
                    <motion.button
                      whileTap={{ scale: 0.95 }}
                      onClick={handleAddToCart}
                      disabled={addingToCart}
                      className="px-4 py-2.5 rounded-2xl bg-emerald-600 text-white text-xs font-bold shadow-lg flex items-center gap-2 disabled:opacity-60"
                    >
                      {addingToCart ? (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 0.8 }}
                          className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                        />
                      ) : addedToCart ? (
                        <>
                          <CheckCircle2 className="w-4 h-4" /> Əlavə edildi!
                        </>
                      ) : (
                        <>
                          <ShoppingCart className="w-4 h-4" /> Səbətə at
                        </>
                      )}
                    </motion.button>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};