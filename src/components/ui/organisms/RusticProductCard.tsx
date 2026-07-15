// src/components/ui/organisms/RusticProductCard.tsx
"use client";

import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";
import {
  motion,
  useMotionValue,
  useTransform,
  useSpring,
} from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo, memo } from "react";
import {
  Eye,
  ShoppingCart,
  Leaf,
  BookmarkPlus,
  CheckCircle2,
  MapPin,
} from "lucide-react";
import { StockBadge } from "@/components/ui/molecules/StockBadge";
import {
  getProductBasePrice,
  getFirstImageUrl,
  formatCurrency,
} from "@/utils/product";
import { QuickViewModal } from "./QuickViewModal";

// ─── Types ────────────────────────────────────────────────────────
interface ProductCardProps {
  product: Product;
  currency?: string;
  addToCart?: (id: string, variantId?: string, qty?: number) => void;
  layout?: "grid" | "list";
}

// ─── Safe image URL ───────────────────────────────────────────────
function safeImageUrl(url: string | undefined | null): string {
  if (!url) return "/placeholder.jpg";
  if (url.startsWith("/")) return url;
  try {
    const parsed = new URL(url);
    if (parsed.protocol === "http:") parsed.protocol = "https:";
    return parsed.toString();
  } catch {
    return "/placeholder.jpg";
  }
}

// ─── Sub-komponentlər ────────────────────────────────────────────
const DiscountBadge = memo(function DiscountBadge({ discount }: { discount: number }) {
  if (discount <= 0) return null;
  return (
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
  );
});

const StatusBadges = memo(function StatusBadges({
  isOrganic,
  statusTags,
}: {
  isOrganic?: boolean;
  statusTags?: string[];
}) {
  return (
    <div className="absolute top-3 right-3 z-20 flex flex-col gap-1.5 items-end">
      {isOrganic && (
        <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-emerald-600/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
          <Leaf className="w-2.5 h-2.5" /> Organik
        </span>
      )}
      {statusTags?.includes("newArrival") && (
        <span className="px-2 py-1 rounded-full bg-amber-500/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
          ✨ Yeni
        </span>
      )}
      {statusTags?.includes("bestValue") && (
        <span className="px-2 py-1 rounded-full bg-purple-600/90 backdrop-blur-sm text-white text-[10px] font-bold shadow-lg">
          🔥 Trending
        </span>
      )}
    </div>
  );
});

const VariantStrip = memo(function VariantStrip({
  variants,
  selectedIdx,
  onSelect,
  discountType,
  discountValue,
  currency,
}: {
  variants: NonNullable<Product["variants"]>;
  selectedIdx: number;
  onSelect: (i: number) => void;
  discountType?: string | null;
  discountValue?: number | null;
  currency: string;
}) {
  if (variants.length <= 1) return null;
  return (
    <div className="flex gap-1.5 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-hide">
      {variants.map((v, i) => {
        const varBase = v.price ?? getProductBasePrice({ variants } as any);
        const varPrice = finalPrice(
          varBase,
          discountType as any,
          discountValue ?? undefined
        );
        const varDiscount =
          varBase > varPrice
            ? Math.round(((varBase - varPrice) / varBase) * 100)
            : 0;
        const varStock = v.stock ?? 0;
        const isSelected = i === selectedIdx;

        return (
          <button
            key={v.id}
            onClick={() => onSelect(i)}
            className={`shrink-0 flex items-center gap-1.5 px-2 py-1.5 rounded-xl border-2 transition-colors ${
              isSelected
                ? "border-emerald-500 bg-emerald-50 shadow-sm"
                : "border-slate-200 bg-white hover:border-emerald-300"
            }`}
          >
            <div className="text-left">
              <p
                className={`text-[11px] font-bold leading-tight ${
                  isSelected ? "text-emerald-700" : "text-slate-800"
                }`}
              >
                {v.name || v.unit || "Variant"}
              </p>
              <p className="text-[10px] text-slate-500">
                {formatCurrency(varPrice, currency)}
                {varDiscount > 0 && (
                  <span className="ml-1 text-red-500 font-bold">
                    -{varDiscount}%
                  </span>
                )}
              </p>
            </div>
            {varStock <= 0 ? (
              <span className="w-2 h-2 rounded-full bg-slate-300 shrink-0" />
            ) : varStock <= 5 ? (
              <span className="relative flex h-2 w-2 shrink-0">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500" />
              </span>
            ) : (
              <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
            )}
          </button>
        );
      })}
    </div>
  );
});

// ─── Ana komponent ───────────────────────────────────────────────
export const RusticProductCard = memo(function RusticProductCard({
  product,
  currency = "AZN",
  addToCart,
  layout = "grid",
}: ProductCardProps) {
  if (!product) return null;

  // State-lar
  const [hovered, setHovered] = useState(false);
  const [addingToCart, setAddingToCart] = useState(false);
  const [addedToCart, setAddedToCart] = useState(false);
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [qty] = useState(1);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [quickViewOpen, setQuickViewOpen] = useState(false);

  // 3D tilt üçün
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(
    useTransform(mouseY, [-120, 120], [8, -8]),
    { stiffness: 120, damping: 18 }
  );
  const rotateY = useSpring(
    useTransform(mouseX, [-120, 120], [-8, 8]),
    { stiffness: 120, damping: 18 }
  );
  const glareX = useTransform(mouseX, [-120, 120], [0, 100]);
  const glareY = useTransform(mouseY, [-120, 120], [0, 100]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  // Dəyərlər
  const selectedVariant = product.variants?.[selectedVariantIdx];
  const basePrice = useMemo(
    () => selectedVariant?.price ?? getProductBasePrice(product),
    [selectedVariant, product]
  );
  const displayPrice = useMemo(
    () =>
      finalPrice(basePrice, product.discountType as any, product.discountValue ?? undefined),
    [basePrice, product]
  );
  const discount = useMemo(() => {
    if (basePrice <= displayPrice) return 0;
    return Math.round(((basePrice - displayPrice) / basePrice) * 100);
  }, [basePrice, displayPrice]);

  const rawImg = useMemo(() => getFirstImageUrl(product), [product]);
  const imgUrl = useMemo(() => safeImageUrl(rawImg), [rawImg]);

  const slug = product.slug || product.id;
  const totalStock = useMemo(
    () =>
      product.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ??
      product.stock ??
      0,
    [product]
  );
  const isOut = totalStock <= 0;
  const unit = selectedVariant?.unit ?? product.unit ?? "ədəd";

  // Handler-lər
  const handleMouseMove = useCallback(
    (e: React.MouseEvent<HTMLElement>) => {
      const rect = e.currentTarget.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left - rect.width / 2);
      mouseY.set(e.clientY - rect.top - rect.height / 2);
      glareOpacity.set(0.12);
    },
    [mouseX, mouseY, glareOpacity]
  );

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    glareOpacity.set(0);
    setHovered(false);
  }, [mouseX, mouseY, glareOpacity]);

  const handleAddToCart = useCallback(async () => {
    if (isOut || addingToCart) return;
    setAddingToCart(true);
    await new Promise((r) => setTimeout(r, 600));
    addToCart?.(product.id, selectedVariant?.id, qty);
    setAddingToCart(false);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  }, [isOut, addingToCart, addToCart, product.id, selectedVariant?.id, qty]);

  const handleOpenQuick = useCallback(() => setQuickViewOpen(true), []);
  const handleCloseQuick = useCallback(() => setQuickViewOpen(false), []);

  const handleImageLoad = useCallback(() => setImageLoaded(true), []);

  // ─── Ortaq şəkil bloku ──────────────────────────────────────
  const imageBlock = (
    <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-b from-slate-50 to-slate-100">
      {!imageLoaded && (
        <div className="absolute inset-0 bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200 animate-pulse" />
      )}
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
          onLoad={handleImageLoad}
        />
      </motion.div>

      <DiscountBadge discount={discount} />
      <StatusBadges isOrganic={product.isOrganic} statusTags={product.statusTags} />

      {/* Origin region hover-da */}
      {product.originRegion && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={hovered ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          className="absolute bottom-3 left-3 z-20 flex items-center gap-1 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full"
        >
          <MapPin className="w-3 h-3 text-white" />
          <span className="text-[10px] text-white font-semibold">
            {product.originRegion}
          </span>
        </motion.div>
      )}

      {/* Sürətli baxış düyməsi – hoverda şəkilin tam ortasında */}
      {hovered && (
        <div className="absolute inset-0 z-20 flex items-center justify-center">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              handleOpenQuick();
            }}
            className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-5 py-3 rounded-full shadow-lg text-sm font-bold text-slate-700 hover:bg-white transition-colors"
          >
            <Eye className="w-5 h-5" />
            Sürətli bax
          </button>
        </div>
      )}

      {/* Stok bitdikdə overlay */}
      {isOut && (
        <div className="absolute inset-0 z-20 bg-white/70 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-white rounded-2xl px-4 py-2 shadow-lg">
            <p className="text-sm font-bold text-slate-700">Stok yoxdur</p>
          </div>
        </div>
      )}
    </div>
  );

  // ─── Ortaq məhsul məlumatları ───────────────────────────────
  const productDetails = (
    <>
      <Link href={`/products/${slug}`}>
        <h3 className="text-sm font-bold text-slate-800 line-clamp-2 leading-snug hover:text-emerald-700 transition-colors">
          {product.name}
        </h3>
      </Link>

      {product.benefits?.[0] && (
        <p className="text-[11px] text-slate-500 line-clamp-1">
          {product.benefits[0]}
        </p>
      )}

      <VariantStrip
        variants={product.variants ?? []}
        selectedIdx={selectedVariantIdx}
        onSelect={setSelectedVariantIdx}
        discountType={product.discountType}
        discountValue={product.discountValue}
        currency={currency}
      />

      <StockBadge stock={totalStock} unit={unit} />
    </>
  );

  // ─── Qiymət + səbət düyməsi ─────────────────────────────────
  const priceAndCartRow = (
    <div className="flex items-end justify-between mt-1">
      <div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-base font-black text-slate-900 tracking-tight">
            {formatCurrency(displayPrice, currency)}
          </span>
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

      {!isOut ? (
        <button
          onClick={handleAddToCart}
          disabled={addingToCart}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-bold shadow-md transition-all disabled:opacity-60 active:scale-95 ${
            addedToCart
              ? "bg-emerald-100 text-emerald-700"
              : "bg-emerald-600 text-white hover:bg-emerald-700 shadow-emerald-600/30"
          }`}
        >
          {addingToCart ? (
            <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : addedToCart ? (
            <>
              <CheckCircle2 className="w-4 h-4" /> Əlavə!
            </>
          ) : (
            <>
              <ShoppingCart className="w-4 h-4" /> Səbətə
            </>
          )}
        </button>
      ) : (
        <button className="flex items-center gap-1.5 px-3 py-2 rounded-2xl text-xs font-semibold bg-slate-100 text-slate-500 cursor-default">
          <BookmarkPlus className="w-4 h-4" /> Xatırlat
        </button>
      )}
    </div>
  );

  // ─── List rejimi ─────────────────────────────────────────────
  if (layout === "list") {
    return (
      <>
        {quickViewOpen && (
          <QuickViewModal
            open={quickViewOpen}
            onClose={handleCloseQuick}
            product={product}
            imgUrl={imgUrl}
            discount={discount}
            displayPrice={displayPrice}
            basePrice={basePrice}
            currency={currency}
            qty={qty}
            isOut={isOut}
            addingToCart={addingToCart}
            addedToCart={addedToCart}
            selectedVariantIdx={selectedVariantIdx}
            setSelectedVariantIdx={setSelectedVariantIdx}
            handleQtyChange={() => {}}
            handleAddToCart={handleAddToCart as any}
          />
        )}

        <motion.article
          onMouseMove={handleMouseMove}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={handleMouseLeave}
          style={{
            rotateX,
            rotateY,
            transformStyle: "preserve-3d",
            transformPerspective: 1000,
          }}
          className="group relative flex flex-row items-stretch rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-shadow duration-500 overflow-hidden"
        >
          <motion.div
            style={{
              background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4), transparent 60%)`,
              opacity: glareOpacity,
            }}
            className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
          />

          <Link
            href={`/products/${slug}`}
            className="w-1/3 sm:w-1/4 relative overflow-hidden rounded-l-3xl shrink-0"
          >
            {imageBlock}
          </Link>

          <div className="flex flex-1 flex-col justify-between p-4">
            <div>{productDetails}</div>
            {priceAndCartRow}
            <button
              className="flex md:hidden items-center justify-center gap-1 text-[10px] text-slate-400 py-1 border-t border-slate-100 mt-2"
              onClick={handleOpenQuick}
            >
              <Eye className="w-3 h-3" /> Sürətli bax
            </button>
          </div>

          <motion.div
            animate={hovered ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400 rounded-b-3xl"
          />
        </motion.article>
      </>
    );
  }

  // ─── Grid rejimi ─────────────────────────────────────────────
  return (
    <>
      {quickViewOpen && (
        <QuickViewModal
          open={quickViewOpen}
          onClose={handleCloseQuick}
          product={product}
          imgUrl={imgUrl}
          discount={discount}
          displayPrice={displayPrice}
          basePrice={basePrice}
          currency={currency}
          qty={qty}
          isOut={isOut}
          addingToCart={addingToCart}
          addedToCart={addedToCart}
          selectedVariantIdx={selectedVariantIdx}
          setSelectedVariantIdx={setSelectedVariantIdx}
          handleQtyChange={() => {}}
          handleAddToCart={handleAddToCart as any}
        />
      )}

      <motion.article
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={handleMouseLeave}
        style={{
          rotateX,
          rotateY,
          transformStyle: "preserve-3d",
          transformPerspective: 1000,
        }}
        className="group relative rounded-3xl bg-white border border-slate-100 shadow-sm hover:shadow-2xl transition-shadow duration-500 overflow-hidden cursor-pointer"
      >
        <motion.div
          style={{
            background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4), transparent 60%)`,
            opacity: glareOpacity,
          }}
          className="absolute inset-0 z-10 pointer-events-none rounded-3xl"
        />

        <Link href={`/products/${slug}`} className="block">
          {imageBlock}
        </Link>

        <div className="p-4 flex flex-col gap-2" style={{ transform: "translateZ(16px)" }}>
          {productDetails}
          {priceAndCartRow}
          <button
            className="flex md:hidden items-center justify-center gap-1 text-[10px] text-slate-400 py-1 border-t border-slate-100 mt-1"
            onClick={handleOpenQuick}
          >
            <Eye className="w-3 h-3" /> Sürətli bax
          </button>
        </div>

        <motion.div
          animate={hovered ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="absolute bottom-0 inset-x-0 h-1 bg-gradient-to-r from-emerald-400 via-lime-400 to-amber-400 rounded-b-3xl"
        />
      </motion.article>
    </>
  );
});