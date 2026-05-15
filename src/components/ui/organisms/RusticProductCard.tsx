/* eslint-disable react-hooks/rules-of-hooks */
"use client";

import { finalPrice } from "@/lib/store";
import { Product } from "@/types/products";
import {
  motion, AnimatePresence, useMotionValue, useTransform, useSpring
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";
import {
  Heart, Share2, Eye, ShoppingCart, Star, Leaf, Zap,
  Scale, BookmarkPlus, CheckCircle2, AlertTriangle, Info,
  MapPin, ChevronUp, ExternalLink, X
} from "lucide-react";
import { getProductBasePrice, getFirstImageUrl, formatCurrency } from "@/utils/storefront_home";
import { QuickViewModal } from "./QuickModal";

/* ================================================================ */
/*                         TYPES                                    */
/* ================================================================ */
interface ProductCardProps {
  product: Product;
  currency?: string;
  addToCart?: (id: string, variantId?: string, qty?: number) => void;
  onWishlistToggle?: (id: string) => void;
  onCompareToggle?: (id: string) => void;
  isInCompare?: boolean;
}

/* ================================================================ */
/*                    ANIMATION VARIANTS                            */
/* ================================================================ */

const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  visible: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring" as const, stiffness: 90, damping: 16 }
  },
};

/* ================================================================ */
/*                  SMALL SUB-COMPONENTS                           */
/* ================================================================ */

const StarRating: React.FC<{ rating: number; count?: number }> = ({ rating, count }) => {
  if (!rating) return null;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map(i => (
          <Star
            key={i}
            className={`w-3 h-3 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-slate-200 text-slate-200"}`}
          />
        ))}
      </div>
      <span className="text-[10px] text-slate-500 font-medium">
        {rating.toFixed(1)}{count ? ` (${count})` : ""}
      </span>
    </div>
  );
};

const StockBadge: React.FC<{ stock: number; unit: string }> = ({ stock, unit }) => {
  if (stock <= 0) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 text-[10px] font-semibold">
        <X className="w-3 h-3" /> Stok yoxdur
      </span>
    );
  }
  if (stock < 5) {
    return (
      <motion.span
        animate={{ scale: [1, 1.06, 1] }}
        transition={{ repeat: Infinity, duration: 1.4 }}
        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold"
      >
        <AlertTriangle className="w-3 h-3" /> Son {stock} {unit}!
      </motion.span>
    );
  }
  if (stock < 15) {
    return (
      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-semibold">
        <Zap className="w-3 h-3" /> Tez bitir
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
      <CheckCircle2 className="w-3 h-3" /> Stokda
    </span>
  );
};

/* ================================================================ */
/*                    MAIN CARD COMPONENT                          */
/* ================================================================ */

export function RusticProductCard({
  product,
  currency = "AZN",
  addToCart,
  onCompareToggle,
  isInCompare = false,
}: ProductCardProps) {
  /* ---- guard ---- */
  if (!product) return null;

  /* ---- state ---- */
  const [hovered, setHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [qty, setQty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  /* ---- sync prop ---- */

  /* ---- 3D tilt ---- */
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-120, 120], [8, -8]), { stiffness: 120, damping: 18 });
  const rotateY = useSpring(useTransform(mouseX, [-120, 120], [-8, 8]), { stiffness: 120, damping: 18 });
  const glareX = useTransform(mouseX, [-120, 120], [0, 100]);
  const glareY = useTransform(mouseY, [-120, 120], [0, 100]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  /* ---- derived values ---- */
  const selectedVariant = product.variants?.[selectedVariantIdx];
  const basePrice = useMemo(() => selectedVariant?.price ?? getProductBasePrice(product), [selectedVariant, product]);
  const displayPrice = useMemo(() => finalPrice(basePrice, product.discountType, product.discountValue), [basePrice, product]);
  const discount = useMemo(() => {
    if (basePrice <= displayPrice) return 0;
    return Math.round(((basePrice - displayPrice) / basePrice) * 100);
  }, [basePrice, displayPrice]);

  const imgUrl = useMemo(() => getFirstImageUrl(product), [product]);
  const slug = product.slug || product.id;
  const totalStock = useMemo(() =>
    product.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ?? product.stock ?? 0,
    [product]
  );
  const isOut = totalStock <= 0;
  const unit = selectedVariant?.unit ?? product.unit ?? "ədəd";
  const avgRating = useMemo(() => {
    if (!product.reviews?.length) return 0;
    return product.reviews.reduce((s, r) => s + (r.rating ?? 0), 0) / product.reviews.length;
  }, [product.reviews]);

  /* ---- handlers ---- */
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    mouseX.set(e.clientX - rect.left - rect.width / 2);
    mouseY.set(e.clientY - rect.top - rect.height / 2);
    glareOpacity.set(0.12);
  }, [mouseX, mouseY, glareOpacity]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0); mouseY.set(0); glareOpacity.set(0);
    setHovered(false);
  }, [mouseX, mouseY, glareOpacity]);

  const handleAddToCart = useCallback(async () => {
    if (isOut || addingToCart) return;
    setAddingToCart(true);
    await new Promise(r => setTimeout(r, 600));
    addToCart?.(product.id, selectedVariant?.id, qty);
    setAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [isOut, addingToCart, addToCart, product.id, selectedVariant?.id, qty]);

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    const url = `${typeof window !== "undefined" ? window.location.origin : ""}/products/${slug}`;
    if (navigator.share) {
      await navigator.share({ title: product.name, url }).catch(() => {});
    } else {
      await navigator.clipboard?.writeText(url).catch(() => {});
    }
  }, [slug, product.name]);

  const handleCompare = useCallback((e: React.MouseEvent) => {
    e.preventDefault(); e.stopPropagation();
    onCompareToggle?.(product.id);
  }, [onCompareToggle, product.id]);

  const handleQtyChange = useCallback((delta: number) => {
    setQty(prev => Math.max(1, Math.min(prev + delta, totalStock || 99)));
  }, [totalStock]);

  /* ================================================================ */
  /*                    QUICK VIEW MODAL                             */
  /* ================================================================ */
 

  /* ================================================================ */
  /*                       RENDER                                    */
  /* ================================================================ */
  return (
    <>
      <QuickViewModal
  open={quickViewOpen}
  onClose={() => setQuickViewOpen(false)}
  product={product}
  imgUrl={imgUrl}
  discount={discount}
  displayPrice={displayPrice}
  basePrice={basePrice}
  currency={currency}
  avgRating={avgRating}
  qty={qty}
  isOut={isOut}
  addingToCart={addingToCart}
  addedToCart={addedToCart}
  selectedVariantIdx={selectedVariantIdx}
  setSelectedVariantIdx={setSelectedVariantIdx}
  handleQtyChange={handleQtyChange}
  handleAddToCart={handleAddToCart}
/>

      <motion.article
        variants={cardVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{ rotateX, rotateY, transformStyle: "preserve-3d", transformPerspective: 1000 }}
        className="group relative rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-shadow duration-500 overflow-hidden cursor-pointer"
      >
        {/* Glare overlay */}
        <motion.div
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4), transparent 60%)`,
            opacity: glareOpacity,
          }}
          className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
        />

        {/* ── IMAGE AREA ── */}
        <Link href={`/products/${slug}`} onClick={() => setShowDetails(false)}>
          <div className="relative aspect-square overflow-hidden rounded-t-3xl bg-gradient-to-b from-slate-50 to-slate-100">
            {/* Shimmer while loading */}
            <AnimatePresence>
              {!imageLoaded && (
                <motion.div
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse"
                />
              )}
            </AnimatePresence>

            <motion.div
              animate={hovered ? { scale: 1.06 } : { scale: 1 }}
              transition={{ type: "spring", stiffness: 200, damping: 20 }}
              className="absolute inset-0"
            >
              <Image
                src={imgUrl}
                alt={product.name}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                onLoad={() => setImageLoaded(true)}
              />
            </motion.div>

            {/* Discount badge */}
            {discount > 0 && (
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", delay: 0.1 }}
                className="absolute top-3 left-3 z-20"
              >
                <div className="relative flex items-center justify-center w-12 h-12">
                  <div className="absolute inset-0 bg-red-500 rounded-full" />
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
                    className="absolute inset-0 border-2 border-dashed border-red-300/60 rounded-full"
                  />
                  <span className="relative text-white text-xs font-black">-{discount}%</span>
                </div>
              </motion.div>
            )}

            {/* Status badges row */}
            <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
              {product.organic && (
                <motion.span
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg"
                >
                  <Leaf className="w-2.5 h-2.5" /> Organik
                </motion.span>
              )}
              {product.statusTags?.includes('newArrival') && (
                <span className="px-2 py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
                  ✨ Yeni
                </span>
              )}
                       {product.statusTags?.includes('bestValue') && (
            <span className="px-2 py-1 rounded-full bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
              🔥 Trending
                </span>
              )}
            </div>

            {/* Origin region pin */}
            {product.originRegion && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full"
              >
                <MapPin className="w-3 h-3 text-white" />
                <span className="text-[10px] text-white font-semibold">{product.originRegion}</span>
              </motion.div>
            )}

            {/* Action buttons overlay */}
            <AnimatePresence>
              {hovered && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 z-20 bg-gradient-to-t from-black/50 via-transparent to-transparent flex items-end p-3"
                >
                  <div className="flex gap-2 w-full">
                    {/* Quick View */}
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0 }}
                      whileHover={{ scale: 1.08 }}
                             whileTap={{ scale: 0.94 }}
onClick={(e) => {
  e.preventDefault();
  e.stopPropagation(); // 🔥 mütləq
  setQuickViewOpen(true);
}}
                      className="flex-1 flex items-center justify-center gap-1.5 bg-white/95 text-slate-800 text-[11px] font-bold py-2.5 rounded-2xl shadow-lg hover:bg-white transition-colors"
                    >
                      <Eye className="w-4 h-4" /> Sürətli bax
                    </motion.button>

                   
                    {/* Share */}
                    <motion.button
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.08 }}
                      whileHover={{ scale: 1.12 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={handleShare}
                      className="h-10 w-10 rounded-2xl flex items-center justify-center bg-white/95 text-slate-600 hover:bg-white shadow-lg transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                    </motion.button>

                    {/* Compare */}
                    {onCompareToggle && (
                      <motion.button
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.11 }}
                        whileHover={{ scale: 1.12 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={handleCompare}
                        className={`h-10 w-10 rounded-2xl flex items-center justify-center shadow-lg transition-colors ${
                          isInCompare ? "bg-emerald-500 text-white" : "bg-white/95 text-slate-600 hover:bg-white"
                        }`}
                      >
                        <Scale className="w-4 h-4" />
                      </motion.button>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Out of stock overlay */}
            {isOut && (
              <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
                <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
                  <p className="text-sm font-bold text-slate-700">Stok yoxdur</p>
                </div>
              </div>
            )}
          </div>
        </Link>

        {/* ── CONTENT AREA ── */}
        <div className="p-4 flex flex-col gap-2.5" style={{ transform: "translateZ(16px)" }}>
          
          {/* Rating */}
          {avgRating > 0 && <StarRating rating={avgRating} count={product.reviews?.length} />}

          {/* Name */}
          <Link href={`/products/${slug}`}>
            <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-emerald-700 transition-colors duration-200">
              {product.name}
            </h3>
          </Link>

          {/* Short benefit */}
          {product.benefits?.[0] && (
            <p className="text-[11px] text-slate-500 line-clamp-1">{product.benefits[0]}</p>
          )}

          {/* Variants (if multiple) */}
          {(product.variants?.length ?? 0) > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {product.variants!.slice(0, 4).map((v, i) => (
                <motion.button
                  key={v.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedVariantIdx(i)}
                  className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border transition-all ${
                    i === selectedVariantIdx
                      ? "border-emerald-500 bg-emerald-50 text-emerald-700"
                      : "border-slate-200 text-slate-500 hover:border-emerald-300"
                  }`}
                >
                  {v.label ?? `${v.weight ?? ""}${v.unit ?? ""}`}
                </motion.button>
              ))}
            </div>
          )}

          {/* Stock */}
          <StockBadge stock={totalStock} unit={unit} />

          {/* Price row */}
          <div className="flex items-end justify-between mt-1">
            <div>
              <div className="flex items-baseline gap-2">
                <motion.span
                  key={displayPrice}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-base font-black text-slate-900 tracking-tight"
                >
                  {formatCurrency(displayPrice, currency)}
                </motion.span>
                {discount > 0 && (
                  <span className="text-xs line-through text-slate-400">
                    {formatCurrency(basePrice, currency)}
                  </span>
                )}
              </div>
              <span className="text-[10px] text-slate-400 uppercase tracking-wider">
                {unit} üçün qiymət
              </span>
            </div>

            {/* Add to cart button */}
            {!isOut ? (
              <motion.button
                whileHover={{ scale: 1.05, y: -1 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={addingToCart}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold shadow-md transition-all disabled:opacity-60 ${
                  addedToCart
                    ? "bg-emerald-100 text-emerald-700"
                    : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30"
                }`}
              >
                {addingToCart ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                    className="w-4 h-4 border-2 border-white border-t-transparent rounded-full"
                  />
                ) : addedToCart ? (
                  <><CheckCircle2 className="w-4 h-4" /> Əlavə!</>
                ) : (
                  <><ShoppingCart className="w-4 h-4" /> Səbətə</>
                )}
              </motion.button>
            ) : (
              <motion.button
                whileHover={{ scale: 1.02 }}
                className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-500"
              >
                <BookmarkPlus className="w-4 h-4" /> Xatırlat
              </motion.button>
            )}
          </div>

          {/* Mobile tap area for quick actions */}
          <motion.button
            className="flex md:hidden items-center justify-center gap-1 text-[10px] text-slate-400 py-1 border-t border-slate-100 mt-1"
            onClick={() => setQuickViewOpen(true)}
          >
            <Eye className="w-3 h-3" /> Sürətli bax
          </motion.button>
        </div>

        {/* Ambient bottom glow on hover */}
        <motion.div
          animate={hovered ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400 rounded-b-3xl"
        />
      </motion.article>
    </>
  );
}
