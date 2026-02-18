"use client";

import {
  getProductBasePrice,
  getFirstImageUrl,
  formatCurrency,
} from "@/app/(storefront)/page";
import { finalPrice } from "@/lib/store";
import { Product } from "@/types/products";
import { motion, AnimatePresence, useMotionValue, useTransform, useSpring } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useState, useCallback, useMemo, useEffect, useRef } from "react";

// Type definitions
interface ProductCardProps {
  product?: Product;
  currency?: string;
  onAddToCart?: (product: Product, quantity: number) => void;
}

// Custom hook for intersection observer
const useInView = (threshold = 0.1) => {
  const [isInView, setIsInView] = useState(false);
  const [ref, setRef] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (!ref) return;
    const observer = new IntersectionObserver(
      ([entry]) => setIsInView(entry.isIntersecting),
      { threshold }
    );
    observer.observe(ref);
    return () => observer.disconnect();
  }, [ref, threshold]);

  return { ref: setRef, isInView };
};

// Animation variants with proper typing
const cardVariants = {
  hidden: { opacity: 0, y: 30, scale: 0.95 },
  visible: { 
    opacity: 1, 
    y: 0, 
    scale: 1,
    transition: { 
      type: "spring" as const, 
      stiffness: 100, 
      damping: 15,
      staggerChildren: 0.1
    }
  },
  hover: {
    y: -12,
    transition: { type: "spring" as const, stiffness: 300, damping: 20 }
  }
};

const imageVariants = {
  hover: { 
    scale: 1.05,
    transition: { type: "spring" as const, stiffness: 200, damping: 20 }
  }
};

const badgeVariants = {
  hidden: { opacity: 0, x: -20, scale: 0.8 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { type: "spring" as const, stiffness: 200 }
  },
  pulse: {
    scale: [1, 1.05, 1],
    transition: { repeat: Infinity, duration: 2, ease: "easeInOut" as const }
  }
};

const overlayVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.3 } }
};

const buttonVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
  tap: { scale: 0.95 }
};

export function RusticProductCard({
  product,
  currency,
  onAddToCart,
}: ProductCardProps) {
  // State management
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedQuantity, setSelectedQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [notificationMessage, setNotificationMessage] = useState("");
  const [imageLoaded, setImageLoaded] = useState(false);

  // Mobile-specific states
  const [showMobileActions, setShowMobileActions] = useState(false);
  const [touchStartY, setTouchStartY] = useState(0);
  const [swipeDirection, setSwipeDirection] = useState<'up' | 'down' | null>(null);

  // Ref for card element
  const cardElementRef = useRef<HTMLElement>(null);

  // Enhanced 3D tilt motion values with spring physics
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Smooth spring-based rotation for depth effect
  const rotateX = useSpring(useTransform(mouseY, [-150, 150], [12, -12]), {
    stiffness: 150,
    damping: 20
  });
  const rotateY = useSpring(useTransform(mouseX, [-150, 150], [-12, 12]), {
    stiffness: 150,
    damping: 20
  });

  // Parallax depth transforms for inner elements
  const translateZ = useSpring(useTransform(mouseX, [-150, 150], [0, 20]), {
    stiffness: 200,
    damping: 25
  });
  const imageScale = useSpring(1, { stiffness: 300, damping: 30 });

  // Glare/shine effect position
  const glareX = useTransform(mouseX, [-150, 150], [0, 100]);
  const glareY = useTransform(mouseY, [-150, 150], [0, 100]);
  const glareOpacity = useSpring(0, { stiffness: 200, damping: 30 });

  // Intersection observer
  const { ref: cardRef, isInView } = useInView(0.2);

  // Computed values
  const base = useMemo(() => getProductBasePrice(product), [product]);
  const price = useMemo(
    () => finalPrice(base, product.discountType, product.discountValue),
    [base, product.discountType, product.discountValue]
  );
  const img = useMemo(() => getFirstImageUrl(product), [product]);
  const slug = product.slug || product.id;

  const totalStock = useMemo(
    () =>
      product.variants?.reduce((s, v) => s + (v.stock ?? 0), 0) ??
      product.stock ??
      0,
    [product.variants, product.stock]
  );

  const isOut = totalStock <= 0;
  const isLowStock = totalStock > 0 && totalStock < 10;
  const isCriticalStock = totalStock > 0 && totalStock < 5;

  const primaryVariant = product.variants?.[0];
  const unit = primaryVariant?.unit ?? product.unit ?? "ədəd";

  const discountPercentage = useMemo(() => {
    if (base > price) {
      return Math.round(((base - price) / base) * 100);
    }
    return 0;
  }, [base, price]);

  const isOrganic = product.organic;
  const isVillage = product.originRegion?.toLowerCase().includes("gədəbəy");

  // Enhanced 3D mouse move handler
  const handleMouseMove = useCallback((e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const x = e.clientX - centerX;
    const y = e.clientY - centerY;

    mouseX.set(x);
    mouseY.set(y);
    imageScale.set(1.02);
    glareOpacity.set(0.15);
  }, [mouseX, mouseY, imageScale, glareOpacity]);

  const handleMouseEnter = useCallback(() => {
    setShowQuickActions(true);
    imageScale.set(1.02);
    glareOpacity.set(0.1);
  }, [imageScale, glareOpacity]);

  const handleMouseLeave = useCallback(() => {
    mouseX.set(0);
    mouseY.set(0);
    imageScale.set(1);
    glareOpacity.set(0);
    setShowQuickActions(false);
  }, [mouseX, mouseY, imageScale, glareOpacity]);

  // Mobile touch handlers
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchStartY(e.touches[0].clientY);
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    const currentY = e.touches[0].clientY;
    const diff = touchStartY - currentY;

    if (Math.abs(diff) > 30) {
      setSwipeDirection(diff > 0 ? 'up' : 'down');
    }
  }, [touchStartY]);

  const handleTouchEnd = useCallback(() => {
    if (swipeDirection === 'up') {
      setShowMobileActions(true);
    } else if (swipeDirection === 'down') {
      setShowMobileActions(false);
    }
    setSwipeDirection(null);
  }, [swipeDirection]);

  // Long press for mobile quick view
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleLongPressStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowMobileActions(true);
      // Haptic feedback if available
      if (navigator.vibrate) {
        navigator.vibrate(50);
      }
    }, 500);
  }, []);

  const handleLongPressEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
    }
  }, []);

  // Share functionality
  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/products/${slug}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: `${product.name} - ${formatCurrency(price, currency)}`,
          url: shareUrl,
        });
      } catch {
        // User cancelled or error
      }
    } else {
      await navigator.clipboard.writeText(shareUrl);
      showNotificationToast("Link kopyalandı!");
    }
  }, [product.name, price, currency, slug]);

  // Add to Cart functionality
  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOut) return;

    setIsAddingToCart(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 500));
      onAddToCart?.(product, selectedQuantity);
      showNotificationToast(`${selectedQuantity} ${unit} səbətə əlavə edildi`);
      // Haptic feedback for mobile
      if (navigator.vibrate) {
        navigator.vibrate([50, 30, 50]);
      }
    } finally {
      setIsAddingToCart(false);
    }
  }, [product, selectedQuantity, unit, isOut, onAddToCart]);

  // Mobile quantity adjustment with gesture
  const handleMobileQuantityChange = useCallback((delta: number) => {
    setSelectedQuantity(prev => {
      const newQty = prev + delta;
      if (newQty < 1) return 1;
      if (newQty > totalStock) return totalStock;
      // Haptic feedback
      if (navigator.vibrate) {
        navigator.vibrate(20);
      }
      return newQty;
    });
  }, [totalStock]);

  // Notification toast
  const showNotificationToast = useCallback((message: string) => {
    setNotificationMessage(message);
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 2500);
  }, []);

  // Keyboard accessibility
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      setShowQuickActions(prev => !prev);
    }
  }, []);

  // Stock alert subscription
  const handleStockAlert = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    showNotificationToast("Stok bildirişinə abunə oldunuz");
  }, [showNotificationToast]);

  return (
    <>
      <motion.article
        ref={(node) => {
          cardRef(node);
          (cardElementRef as React.MutableRefObject<HTMLElement | null>).current = node;
        }}
        variants={cardVariants}
        initial="hidden"
        animate={isInView ? "visible" : "hidden"}
        whileHover="hover"
        onMouseEnter={handleMouseEnter}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        onTouchStart={(e) => {
          handleTouchStart(e);
          handleLongPressStart();
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={() => {
          handleTouchEnd();
          handleLongPressEnd();
        }}
        onKeyDown={handleKeyDown}
        tabIndex={0}
        role="article"
        aria-label={`${product.name} - ${formatCurrency(price, currency)}`}
        style={{ 
          rotateX, 
          rotateY, 
          transformStyle: "preserve-3d",
          perspective: 1000
        }}
        className="
          relative flex flex-col overflow-hidden
          rounded-3xl bg-white/95 backdrop-blur-sm
          border border-neutral-100/60
          shadow-[0_8px_30px_rgba(0,0,0,0.08)]
          transition-shadow duration-500
          hover:shadow-[0_35px_70px_rgba(16,185,129,0.2)]
          focus:outline-none focus:ring-4 focus:ring-emerald-500/30
          cursor-pointer group
        "
      >
        {/* 3D Depth Shadow Layer */}
        <motion.div
          className="absolute -inset-1 bg-linear-to-br from-emerald-500/20 to-amber-500/20 rounded-3xl blur-xl -z-10"
          style={{
            opacity: glareOpacity,
            transform: "translateZ(-50px)"
          }}
        />

        {/* Notification Toast */}
        <AnimatePresence>
          {showNotification && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.9 }}
              className="absolute top-4 left-1/2 -translate-x-1/2 z-50 
                bg-emerald-600 text-white px-4 py-2 rounded-full 
                text-sm font-medium shadow-lg whitespace-nowrap"
            >
              {notificationMessage}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Discount Badge - Top Right */}
        {discountPercentage > 0 && (
          <motion.div
            variants={badgeVariants}
            initial="hidden"
            animate="visible"
            style={{ transform: "translateZ(30px)" }}
            className="absolute top-3 right-3 z-30"
          >
            <span className="
              bg-linear-to-r from-red-500 to-rose-600
              text-white text-xs font-bold
              px-3 py-1.5 rounded-full
              shadow-lg shadow-red-500/30
            ">
              -{discountPercentage}%
            </span>
          </motion.div>
        )}

        {/* IMAGE SECTION */}
        <Link
          href={`/products/${slug}`}
          className="relative w-full overflow-hidden rounded-t-3xl"
        >
          <motion.div
            variants={imageVariants}
            style={{ 
              scale: imageScale,
              transformStyle: "preserve-3d"
            }}
            className="relative w-full aspect-4/5 md:aspect-square overflow-hidden"
          >
            {/* Skeleton loader */}
            {!imageLoaded && (
              <div className="absolute inset-0 bg-linear-to-br from-gray-100 to-gray-200 animate-pulse" />
            )}

            {/* Parallax Image Container */}
            <motion.div
              style={{
                z: translateZ,
                transformStyle: "preserve-3d"
              }}
              className="absolute inset-0"
            >
              <Image
                src={img}
                alt={product.name}
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                quality={90}
                priority={false}
                onLoad={() => setImageLoaded(true)}
                className={`
                  object-cover transition-all duration-700 ease-out
                  ${imageLoaded ? "opacity-100" : "opacity-0"}
                  group-hover:brightness-105
                `}
              />
            </motion.div>

            {/* Dynamic Glare/Shine Effect */}
            <motion.div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255,255,255,0.4) 0%, transparent 50%)`,
                opacity: glareOpacity
              }}
            />

            {/* Gradient Overlay */}
            <div className="
              absolute inset-0 
              bg-linear-to-t from-black/40 via-transparent to-transparent
              opacity-0 group-hover:opacity-100
              transition-opacity duration-500
            " />

            {/* Sold Out Overlay */}
            <AnimatePresence>
              {isOut && (
                <motion.div
                  variants={overlayVariants}
                  initial="hidden"
                  animate="visible"
                  exit="hidden"
                  className="absolute inset-0 bg-black/50 backdrop-blur-sm 
                    flex flex-col items-center justify-center z-10 gap-3"
                >
                  <motion.span
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-white text-lg font-bold px-5 py-2.5 
                      bg-red-600/90 rounded-full shadow-2xl"
                  >
                    ❌ Stok Tükəndi
                  </motion.span>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={handleStockAlert}
                    className="text-white/90 text-sm underline hover:text-white"
                  >
                    🔔 Stok olduqda xəbər ver
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Desktop Quick Actions - Only Share Button */}
            <AnimatePresence>
              {showQuickActions && !isOut && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 hidden md:flex items-center justify-center z-20"
                >
                  {/* Share */}
                  <motion.button
                    variants={buttonVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ scale: 1.15, y: -4, rotateZ: 5 }}
                    whileTap="tap"
                    onClick={handleShare}
                    style={{ transform: "translateZ(40px)" }}
                    className="w-14 h-14 rounded-full bg-white/95 shadow-2xl
                      flex items-center justify-center text-gray-700
                      hover:bg-violet-500 hover:text-white transition-colors
                      border-2 border-white/50"
                    aria-label="Paylaş"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                        d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Marketing Badges */}
            <motion.div
              className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5 z-20"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              style={{ transform: "translateZ(25px)" }}
            >
              {isOrganic && (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="px-2.5 py-1 text-xs rounded-full 
                    bg-linear-to-r from-green-500 to-emerald-600 
                    text-white font-bold shadow-lg shadow-green-500/30"
                >
                  🌿 Orqanik
                </motion.span>
              )}
              {isVillage && (
                <motion.span
                  whileHover={{ scale: 1.05 }}
                  className="px-2.5 py-1 text-xs rounded-full 
                    bg-linear-to-r from-amber-600 to-amber-700 
                    text-white font-semibold shadow-lg"
                >
                  ⛰️ Gədəbəy
                </motion.span>
              )}
              {isCriticalStock && !isOut && (
                <motion.span
                  animate={{ scale: [1, 1.08, 1], opacity: [1, 0.8, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="px-2.5 py-1 text-xs rounded-full 
                    bg-linear-to-r from-red-500 to-rose-600 
                    text-white font-bold shadow-lg shadow-red-500/30"
                >
                  🔥 Son {totalStock} {unit}!
                </motion.span>
              )}
              {isLowStock && !isCriticalStock && !isOut && (
                <motion.span
                  className="px-2.5 py-1 text-xs rounded-full 
                    bg-linear-to-r from-orange-500 to-amber-500 
                    text-white font-semibold shadow-lg"
                >
                  ⚡ Az qaldı
                </motion.span>
              )}
            </motion.div>

            {/* Decorative gradient overlay */}
            <motion.div
              animate={{ 
                backgroundPosition: ["0% 0%", "100% 100%", "0% 0%"],
              }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-0 bg-linear-to-tr from-emerald-500/5 via-transparent to-amber-500/5 
                pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
              style={{ backgroundSize: "200% 200%" }}
            />
          </motion.div>
        </Link>

        {/* Mobile Actions Panel - Swipe Up to Reveal */}
        <AnimatePresence>
          {showMobileActions && (
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="absolute bottom-0 left-0 right-0 md:hidden z-40
                bg-white/95 backdrop-blur-md rounded-t-3xl
                border-t border-gray-200 shadow-2xl p-4"
            >
              {/* Drag indicator */}
              <div className="flex justify-center mb-3">
                <div className="w-10 h-1 bg-gray-300 rounded-full" />
              </div>

              {/* Quantity Selector */}
              {!isOut && (
                <div className="flex items-center justify-center gap-4 mb-4">
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMobileQuantityChange(-1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
                      text-gray-700 font-bold text-xl active:bg-gray-200"
                  >
                    −
                  </motion.button>
                  <span className="text-xl font-bold text-gray-800 min-w-[3rem] text-center">
                    {selectedQuantity} {unit}
                  </span>
                  <motion.button
                    whileTap={{ scale: 0.9 }}
                    onClick={() => handleMobileQuantityChange(1)}
                    className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center
                      text-gray-700 font-bold text-xl active:bg-gray-200"
                  >
                    +
                  </motion.button>
                </div>
              )}

              {/* Mobile Action Buttons */}
              <div className="flex gap-3">
                {/* Add to Cart - Full Width on Mobile */}
                {!isOut && (
                  <motion.button
                    whileTap={{ scale: 0.98 }}
                    onClick={handleAddToCart}
                    disabled={isAddingToCart}
                    className="flex-1 py-3.5 rounded-2xl bg-emerald-600 
                      text-white font-bold text-sm
                      shadow-lg shadow-emerald-500/30
                      active:bg-emerald-700 transition-colors
                      disabled:opacity-60 flex items-center justify-center gap-2"
                  >
                    {isAddingToCart ? (
                      <>
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                          className="w-5 h-5 border-2 border-white border-t-transparent rounded-full"
                        />
                        Əlavə edilir…
                      </>
                    ) : (
                      <>
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                            d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                        Səbətə at
                      </>
                    )}
                  </motion.button>
                )}

                {/* Share Button */}
                <motion.button
                  whileTap={{ scale: 0.95 }}
                  onClick={handleShare}
                  className="w-14 h-14 rounded-2xl bg-violet-100 
                    flex items-center justify-center text-violet-600
                    active:bg-violet-200 transition-colors"
                  aria-label="Paylaş"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} 
                      d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                  </svg>
                </motion.button>
              </div>

              {/* Close hint */}
              <p className="text-center text-xs text-gray-400 mt-3">
                Aşağı sürüşdürün və ya bağlamaq üçün toxunun
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Mobile Swipe Indicator */}
        <motion.div 
          className="absolute bottom-2 left-1/2 -translate-x-1/2 md:hidden z-30"
          initial={{ opacity: 0 }}
          animate={{ opacity: showMobileActions ? 0 : 0.6 }}
        >
          <motion.div
            animate={{ y: [0, -5, 0] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            className="flex flex-col items-center"
          >
            <svg className="w-5 h-5 text-white drop-shadow-lg" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
            </svg>
          </motion.div>
        </motion.div>

        {/* CONTENT SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          style={{ transform: "translateZ(20px)" }}
          className="p-4 md:p-5 flex flex-col gap-3"
        >
          {/* Product Name */}
          <Link href={`/products/${slug}`}>
            <motion.h3
              whileHover={{ color: "#059669" }}
              className="text-sm md:text-base font-bold text-gray-800 
                leading-snug line-clamp-2 transition-colors duration-300"
            >
              {product.name}
            </motion.h3>
          </Link>


         

          {/* PRICE + UNIT */}
          <div className="flex items-end justify-between mt-1">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-lg font-black text-gray-900 tracking-tight">
                  {formatCurrency(price, currency)}
                </span>

                {discountPercentage > 0 && (
                  <span className="text-xs line-through text-gray-400 font-medium">
                    {formatCurrency(base, currency)}
                  </span>
                )}
              </div>

              <span className="text-[10px] uppercase tracking-wider text-gray-400">
                {unit} üçün qiymət
              </span>
            </div>

            {/* Inline Add to Cart (desktop UX boost) */}
            {!isOut && (
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleAddToCart}
                disabled={isAddingToCart}
                className="
                  hidden sm:flex items-center gap-2
                  rounded-full bg-emerald-600 px-4 py-2
                  text-xs font-bold text-white
                  shadow-lg shadow-emerald-500/30
                  hover:bg-emerald-700 transition-colors
                  disabled:opacity-60
                "
              >
                {isAddingToCart ? "Əlavə edilir…" : "Səbətə at"}
              </motion.button>
            )}
          </div>
        </motion.div>
      </motion.article>
    </>
  );
}
            
