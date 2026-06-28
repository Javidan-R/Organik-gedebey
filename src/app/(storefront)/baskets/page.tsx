"use client";

import React, { useState, useMemo, useEffect } from "react";
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform,
  useMotionValue,
  useSpring,
} from "framer-motion";
import { 
  ShoppingCart, Leaf, Sparkles, Check, 
  Truck, ShieldCheck, Heart, 
  Sunrise, Gift,
  TrendingUp, Package, Eye,
  Mountain, Trees, Droplets, Wind, Phone, 
  ChevronDown, Star, Users, Award,
  Video, X
} from "lucide-react";
import { useApp } from "@/lib/store";
import { useBaskets, type Basket as APIBasket } from "@/hooks/useBaskets";
import { ProductGrade } from "@/types/products";

// 3D Tilt Hook
const use3DTilt = () => {
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const mouseXSpring = useSpring(x);
  const mouseYSpring = useSpring(y);
  const rotateX = useTransform(mouseYSpring, [-0.5, 0.5], ["12deg", "-12deg"]);
  const rotateY = useTransform(mouseXSpring, [-0.5, 0.5], ["-12deg", "12deg"]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const width = rect.width;
    const height = rect.height;
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const xPct = mouseX / width - 0.5;
    const yPct = mouseY / height - 0.5;
    x.set(xPct);
    y.set(yPct);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return { handleMouseMove, handleMouseLeave, rotateX, rotateY };
};

// Floating Background Icons
const FloatingIcon = ({ icon: Icon, delay, x, y }: any) => (
  <motion.div
    initial={{ y: 0, rotate: 0, opacity: 0 }}
    animate={{ 
      y: [0, -40, 0], 
      rotate: [0, 20, -20, 0],
      opacity: [0, 0.15, 0],
    }}
    transition={{ 
      duration: 10 + Math.random() * 5, 
      repeat: Infinity, 
      delay,
      ease: "easeInOut" 
    }}
    className="fixed pointer-events-none select-none z-0 text-emerald-200/40"
    style={{ left: x, top: y }}
  >
    <Icon className="w-16 h-16" />
  </motion.div>
);

// Live Viewer Counter
const LiveCounter = () => {
  const [count, setCount] = useState(12);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setCount(Math.floor(Math.random() * 15) + 12);
    const interval = setInterval(() => {
      setCount(prev => Math.max(8, Math.min(30, prev + Math.floor(Math.random() * 5) - 2)));
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  return (
    <motion.div
      animate={{ scale: [1, 1.05, 1] }}
      transition={{ duration: 2, repeat: Infinity }}
      className="inline-flex items-center gap-2 bg-gradient-to-r from-red-500 to-orange-500 text-white px-4 py-2.5 rounded-full text-xs font-bold shadow-lg"
    >
      <Eye className="w-4 h-4 animate-pulse" />
      <span suppressHydrationWarning>{mounted ? count : 12} nəfər indi baxır</span>
    </motion.div>
  );
};

// Premium Badge
const PremiumBadge = ({ text, icon: Icon, gradient }: any) => (
  <motion.div
    initial={{ scale: 0, rotate: -180 }}
    animate={{ scale: 1, rotate: 0 }}
    transition={{ type: "spring", stiffness: 200 }}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-white text-xs font-black shadow-lg ${gradient}`}
  >
    <Icon className="w-4 h-4" />
    {text}
  </motion.div>
);

// Enhanced Basket Card with Premium Interactions
const BasketCard3D = ({ item, onAdd }: { item: APIBasket; onAdd: (data: any) => void }) => {
  const [variant, setVariant] = useState<'econom' | 'standard' | 'premium'>("standard");
  const [qty, setQty] = useState(1);
  const [showDetails, setShowDetails] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [showVideo, setShowVideo] = useState(false);
  const { handleMouseMove, handleMouseLeave, rotateX, rotateY } = use3DTilt();

  const variantData = item.variants?.find(v => v.variant === variant) || item.variants?.[0];
  const price = (parseFloat(variantData?.price || '0')) * qty;
  const originalPrice = variantData?.originalPrice ? parseFloat(variantData.originalPrice) : null;
  const discount = originalPrice 
    ? Math.round(((originalPrice - parseFloat(variantData?.price || '0')) / originalPrice) * 100) 
    : item.discount || 0;

  const hasVideo = item.media?.some(m => m.type === "video") || false;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
        className="group relative"
      >
        <motion.div
          onMouseMove={handleMouseMove}
          onMouseLeave={handleMouseLeave}
          style={{ 
            transform: "perspective(1000px)",
            rotateX, 
            rotateY 
          }}
          className="relative bg-white rounded-[3rem] overflow-hidden shadow-2xl hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] transition-all duration-500"
        >
          {/* Enhanced Image Section */}
          <div className="relative h-96 overflow-hidden bg-gradient-to-br from-emerald-50 to-green-50">
            <motion.img
              animate={{ scale: isHovered ? 1.15 : 1 }}
              transition={{ duration: 0.7, ease: "easeOut" }}
              src={item.media?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E'}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            
            {/* Gradient Overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

            {/* Top Badges with Animation */}
            <div className="absolute top-6 left-6 flex flex-col gap-3">
              <AnimatePresence mode="popLayout">
                {item.bestseller && (
                  <motion.div
                    key={`bestseller-${item.id || item.name}`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                  >
                    <PremiumBadge text="BESTSELLER" icon={Award} gradient="bg-gradient-to-r from-amber-500 to-orange-500" />
                  </motion.div>
                )}
                {item.new && (
                  <motion.div
                    key={`new-${item.id || item.name}`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ delay: 0.1 }}
                  >
                    <PremiumBadge text="YENİ" icon={Sparkles} gradient="bg-gradient-to-r from-emerald-600 to-green-600" />
                  </motion.div>
                )}
                {item.trending && (
                  <motion.div
                    key={`trending-${item.id || item.name}`}
                    initial={{ x: -100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: -100, opacity: 0 }}
                    transition={{ delay: 0.2 }}
                  >
                    <PremiumBadge text="TREND" icon={TrendingUp} gradient="bg-gradient-to-r from-red-500 to-pink-500" />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Discount Badge with Pulse */}
            {discount > 0 && (
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute top-6 right-6 bg-gradient-to-br from-red-500 to-red-600 text-white w-20 h-20 rounded-full flex items-center justify-center shadow-2xl"
              >
                <div className="text-center">
                  <div className="text-2xl font-black leading-none">-{discount}%</div>
                  <div className="text-[10px] font-bold">ENDİRİM</div>
                </div>
              </motion.div>
            )}

            {/* Origin Badge with Enhanced Design */}
            {item.origin && (
              <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="absolute bottom-6 left-6 bg-gradient-to-r from-slate-900 to-slate-800 backdrop-blur-xl text-white px-5 py-3 rounded-2xl text-sm font-bold flex items-center gap-2 shadow-xl border border-white/10"
              >
                <Mountain className="w-4 h-4" />
                {item.origin}
              </motion.div>
            )}

            {/* Video Button */}
            {hasVideo && (
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowVideo(true)}
                className="absolute bottom-6 right-6 w-14 h-14 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:bg-white transition"
              >
                <Video className="w-6 h-6 text-emerald-600" />
              </motion.button>
            )}

            {/* Hover Quick Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: isHovered ? 1 : 0, y: isHovered ? 0 : 20 }}
              className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-3"
            >
              <button className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:bg-white transition">
                <Heart className="w-5 h-5 text-red-500" />
              </button>
              <button className="w-12 h-12 rounded-full bg-white/90 backdrop-blur-md flex items-center justify-center shadow-xl hover:bg-white transition">
                <Eye className="w-5 h-5 text-emerald-600" />
              </button>
            </motion.div>
          </div>

          {/* Enhanced Content Section */}
          <div className="p-10 space-y-6">
            {/* Title & Description */}
            <div>
              <motion.h3 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="text-4xl font-black text-slate-900 mb-3 leading-tight"
              >
                {item.name}
              </motion.h3>
              <p className="text-slate-600 text-base leading-relaxed">{item.tagline}</p>
            </div>

            {/* Freshness Indicator with Icon */}
            {item.freshness && (
              <motion.div 
                whileHover={{ x: 5 }}
                className="flex items-center gap-3 bg-gradient-to-r from-emerald-50 to-green-50 px-4 py-3 rounded-2xl border border-emerald-100"
              >
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Sunrise className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <div className="text-xs text-emerald-600 font-bold uppercase tracking-wide">Təravət</div>
                  <div className="text-sm font-bold text-emerald-800">{item.freshness}</div>
                </div>
              </motion.div>
            )}

            {/* Enhanced Variant Selector */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Paket Seçimi</div>
              <div className="grid grid-cols-3 gap-2 bg-slate-50 rounded-2xl p-2">
                {(item.variants || []).map(v => (
                  <motion.button
                    key={v.id}
                    onClick={() => { setVariant(v.variant); setQty(1); }}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className={`relative px-4 py-4 rounded-xl text-xs font-black uppercase transition-all ${
                      variant === v.variant 
                        ? "bg-gradient-to-br from-emerald-600 to-green-600 text-white shadow-xl shadow-emerald-200" 
                        : "bg-white text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {v.variant}
                    {variant === v.variant && (
                      <motion.div
                        layoutId="activeVariant"
                        className="absolute inset-0 border-2 border-emerald-400 rounded-xl"
                      />
                    )}
                  </motion.button>
                ))}
              </div>
            </div>

            {/* Contents Preview with Better Design */}
            <div className="space-y-3">
              <div className="text-xs font-black uppercase text-slate-400 tracking-wider">Tərkib</div>
              <div className="space-y-2">
                {variantData?.contents?.slice(0, 3).map((c, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-start gap-3 text-sm text-slate-700"
                  >
                    <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-emerald-600" />
                    </div>
                    <span className="flex-1">{c.content}</span>
                  </motion.div>
                ))}
                {(variantData?.contents?.length || 0) > 3 && (
                  <motion.button 
                    whileHover={{ x: 5 }}
                    onClick={() => setShowDetails(true)} 
                    className="text-emerald-600 text-sm font-bold flex items-center gap-2 mt-2 hover:text-emerald-700"
                  >
                    +{(variantData?.contents?.length || 0) - 3} daha çox məhsul
                    <ChevronDown className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* Price & Quantity Section with Enhanced Design */}
            <div className="flex items-end justify-between pt-6 border-t-2 border-slate-100">
              <div className="space-y-2">
                <div className="flex items-baseline gap-3">
                  <motion.span 
                    key={price}
                    initial={{ scale: 1.2, color: "#10b981" }}
                    animate={{ scale: 1, color: "#059669" }}
                    className="text-5xl font-black text-emerald-600"
                  >
                    {price}
                  </motion.span>
                  <span className="text-xl font-bold text-slate-400">AZN</span>
                </div>
                {variantData?.originalPrice && (
                  <div className="flex items-center gap-2">
                    <span className="text-base text-slate-400 line-through">
                      {parseFloat(variantData.originalPrice) * qty} AZN
                    </span>
                    <span className="text-xs font-black text-red-500 bg-red-50 px-2 py-1 rounded-full">
                      {discount}% qənaət
                    </span>
                  </div>
                )}
              </div>

              {/* Enhanced Quantity Selector */}
              <div className="flex items-center gap-3 bg-slate-50 rounded-2xl p-2">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty(q => Math.max(1, q - 1))}
                  className="w-12 h-12 rounded-xl bg-white shadow-md font-black text-xl hover:bg-slate-100 transition flex items-center justify-center"
                >
                  −
                </motion.button>
                <span className="font-black text-2xl w-10 text-center">{qty}</span>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setQty(q => q + 1)}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md font-black text-xl hover:shadow-lg transition flex items-center justify-center"
                >
                  +
                </motion.button>
              </div>
            </div>

            {/* Enhanced CTA Button */}
            <motion.button
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
              onClick={() =>
                onAdd({
                  id: `${item.id}-${variant}`,
                  name: `${item.name} (${variant})`,
                  price: parseFloat(variantData?.price || '0'),
                  quantity: qty,
                  image: item.media?.[0]?.url || 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="400" height="400"%3E%3Crect fill="%23f3f4f6" width="400" height="400"/%3E%3Ctext x="50%25" y="50%25" dominant-baseline="middle" text-anchor="middle" font-family="sans-serif" font-size="24" fill="%239ca3af"%3EŞəkil yoxdur%3C/text%3E%3C/svg%3E',
                  variant: variant, // Variant məlumatını da göndəririk
                })
              }
              className="w-full bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-600 bg-[length:200%_auto] hover:bg-right text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-xl hover:shadow-2xl transition-all duration-500 group"
            >
              <ShoppingCart className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Səbətə əlavə et
              <Sparkles className="w-5 h-5 group-hover:scale-125 transition-transform" />
            </motion.button>

            {/* Trust Indicators */}
            <div className="grid grid-cols-3 gap-3 pt-4">
              {[
                { icon: ShieldCheck, text: "100% təbii" },
                { icon: Truck, text: "Sürətli çatdırılma" },
                { icon: Gift, text: "Hədiyyə qablaşdırma" },
              ].map((item, i) => (
                <div key={i} className="flex flex-col items-center gap-2 p-3 bg-slate-50 rounded-xl">
                  <item.icon className="w-5 h-5 text-emerald-600" />
                  <span className="text-[10px] font-bold text-slate-600 text-center">{item.text}</span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>
      </motion.div>

      {/* Enhanced Details Modal */}
      <AnimatePresence>
        {showDetails && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetails(false)}
              className="fixed inset-0 bg-black/70 backdrop-blur-md z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 50 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            >
              <div className="bg-white rounded-[3rem] max-w-3xl w-full max-h-[85vh] overflow-y-auto p-12 relative shadow-2xl">
                <motion.button 
                  whileHover={{ scale: 1.1, rotate: 90 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowDetails(false)} 
                  className="absolute top-8 right-8 w-12 h-12 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition"
                >
                  <X className="w-6 h-6" />
                </motion.button>

                <div className="mb-8">
                  <h3 className="text-5xl font-black mb-4 bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">
                    {item.name}
                  </h3>
                  <p className="text-slate-600 text-lg leading-relaxed">{item.description}</p>
                </div>

                {item.nutrition && (
                  <div className="mb-8">
                    <h4 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-wider">Qida Dəyəri</h4>
                    <div className="grid grid-cols-2 gap-3">
                      {item.nutrition.map((n, i) => (
                        <motion.div 
                          key={i}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="bg-gradient-to-br from-emerald-50 to-green-50 px-5 py-3 rounded-xl text-sm font-bold text-emerald-700 border border-emerald-100"
                        >
                          {n}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-8">
                  <h4 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-wider">
                    Tam Tərkib ({variant} paket)
                  </h4>
                  <div className="space-y-3">
                    {variantData?.contents?.map((c, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-start gap-3 text-slate-700 bg-slate-50 p-4 rounded-xl"
                      >
                        <Check className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                        <span>{c.content}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {variantData?.extras && variantData.extras.length > 0 && (
                  <div>
                    <h4 className="text-sm font-black uppercase text-slate-400 mb-4 tracking-wider">Əlavə Bonuslar</h4>
                    <div className="space-y-3">
                      {variantData.extras.map((e, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-center gap-3 text-emerald-700 font-semibold bg-gradient-to-r from-emerald-50 to-green-50 p-4 rounded-xl border border-emerald-100"
                        >
                          <Sparkles className="w-5 h-5 flex-shrink-0" />
                          {e.extra}
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Video Modal */}
      <AnimatePresence>
        {showVideo && hasVideo && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowVideo(false)}
              className="fixed inset-0 bg-black/90 backdrop-blur-sm z-[80]"
            />
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="fixed inset-0 z-[90] flex items-center justify-center p-6"
            >
              <div className="relative max-w-4xl w-full">
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => setShowVideo(false)}
                  className="absolute -top-16 right-0 w-12 h-12 rounded-full bg-white flex items-center justify-center"
                >
                  <X className="w-6 h-6" />
                </motion.button>
                <video 
                  src={item.media?.find(m => m.type === "video")?.url} 
                  controls 
                  autoPlay
                  className="w-full rounded-3xl shadow-2xl"
                />
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

// Main Component
export default function PremiumBasketsPage() {
  const [filter, setFilter] = useState<string>("all");
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const { scrollYProgress } = useScroll();
  
  // Fetch baskets from API
  const { baskets, loading: basketsLoading } = useBaskets();
  
  // Zustand store-dan cart funksiyalarını alırıq
  const products = useApp((state) => state.products);
  const addToCartStore = useApp((state) => state.addToCart);
  
  const heroY = useTransform(scrollYProgress, [0, 0.3], [0, -80]);
  const heroOpacity = useTransform(scrollYProgress, [0, 0.2], [1, 0.3]);

  const filteredBaskets = useMemo(() => {
    if (!baskets || baskets.length === 0) return [];
    if (filter === "all") return baskets;
    if (filter === "trending") return baskets.filter(b => b.trending);
    if (filter === "new") return baskets.filter(b => b.new);
    if (filter === "bestseller") return baskets.filter(b => b.bestseller);
    return baskets.filter(b => b.type === filter);
  }, [baskets, filter]);

  // Basket məhsullarını store-a əlavə edən helper funksiya
  const handleAddToCart = (basketItem: { 
    id: string; 
    name: string; 
    price: number; 
    quantity: number; 
    image: string;
    variant: string;
  }) => {
    try {
      // 1. Basketi store-da mövcud məhsul kimi axtarırıq
      // Basket ID formatı: "basket-{type}-{variant}" məsələn: "basket-gence-standard"
      const productId = `basket-${basketItem.id}`;
      
      let existingProduct = products.find(p => p.id === productId);
      
      // 2. Əgər məhsul store-da yoxdursa, dinamik olaraq yaradırıq
      if (!existingProduct) {
        const basketData = baskets.find(b => basketItem.id.startsWith(b.id));
        if (!basketData) {
          throw new Error('Basket məlumatı tapılmadı');
        }

        // Yeni məhsul yaradırıq
        const newProduct = {
          id: productId,
          name: basketItem.name,
          slug: `basket-${basketItem.id.toLowerCase().replace(/\s+/g, '-')}`,
          description: basketData.description,
          shortDescription: basketData.description,
          price: basketItem.price,
          categoryId: 'baskets', // Xüsusi basket kateqoriyası
          images: [{ url: basketItem.image }],
          featured: basketData.bestseller || false,
          archived: false,
          tags: ['basket', 'gedebey', basketData.type],
          isNewArrival: false,
          isFeatured: basketData.bestseller || false,
          basePrice: basketItem.price,
          stock: 100,
          quantityStep: 1,
          isOrganic: true,
          isSeasonal: false,
          soldCount: 0,
          variants: [
            {
              label: basketItem.variant,
              id: `${productId}-${basketItem.variant}`,
              name: basketItem.variant,
              price: basketItem.price,
              costPrice: basketItem.price * 0.7,
              stock: 100, // Sonsuz stok
              sku: `BSK-${basketItem.id}-${basketItem.variant}`,
              grade: 'A' as ProductGrade,
              batchDate: new Date().toISOString(),
              minStock: 10,
              createdAt: new Date().toISOString(),
            }
          ],
          reviews: [],
          createdAt: new Date().toISOString(),
        };

        // Store-a məhsulu əlavə edirik
        useApp.getState().addProduct(newProduct);
        existingProduct = newProduct;
      }

      // 3. Variant ID-ni tapırıq
      if (!existingProduct) {
        throw new Error('Məhsul tapılmadı');
      }
      const variantId = existingProduct.variants?.find(
        v => v.name === basketItem.variant
      )?.id || existingProduct.variants?.[0]?.id;

      if (!variantId) {
        throw new Error('Variant tapılmadı');
      }

      // 4. Store-un addToCart funksiyasını çağırırıq
      addToCartStore(existingProduct.id, variantId, basketItem.quantity);

      // 5. Success toast göstəririk
      setToastMessage(`${basketItem.name} səbətə əlavə olundu! 🎉`);
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);

      // 6. Custom event trigger edirik (əgər başqa komponentlər dinləyirsə)
      window.dispatchEvent(new CustomEvent('cart-updated', { 
        detail: { 
          productId: existingProduct.id,
          variantId,
          quantity: basketItem.quantity,
          action: 'add' 
        } 
      }));
      
    } catch (error) {
      console.error('Səbətə əlavə edilərkən xəta:', error);
      setToastMessage('Xəta baş verdi, yenidən cəhd edin');
      setShowToast(true);
      setTimeout(() => setShowToast(false), 3000);
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-[#fafcf9] via-emerald-50/40 to-[#fafcf9] overflow-x-hidden">
      
      {/* Toast Notification */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={{ opacity: 0, y: -100, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -100, scale: 0.9 }}
            className="fixed top-6 right-6 z-[100] bg-gradient-to-r from-emerald-600 to-green-600 text-white px-8 py-4 rounded-2xl shadow-2xl flex items-center gap-3 border-2 border-white/20"
          >
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            >
              <Check className="w-6 h-6" />
            </motion.div>
            <span className="font-bold text-lg">{toastMessage}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Enhanced Floating Background */}
      <div className="hidden lg:block">
        <FloatingIcon icon={Mountain} delay={0} x="8%" y="15%" />
        <FloatingIcon icon={Trees} delay={2} x="88%" y="20%" />
        <FloatingIcon icon={Droplets} delay={1} x="15%" y="65%" />
        <FloatingIcon icon={Wind} delay={3} x="82%" y="75%" />
        <FloatingIcon icon={Leaf} delay={4} x="45%" y="12%" />
        <FloatingIcon icon={Sunrise} delay={5} x="92%" y="45%" />
      </div>

      {/* Premium Hero Section */}
      <motion.section 
        style={{ y: heroY, opacity: heroOpacity }} 
        className="relative py-32 px-6 text-center overflow-hidden"
      >
        {/* Animated gradient background */}
        <motion.div 
          animate={{
            background: [
              "radial-gradient(circle at 20% 50%, rgba(16, 185, 129, 0.1) 0%, transparent 50%)",
            ]
          }}
          transition={{ duration: 10, repeat: Infinity }}
          className="absolute inset-0 -z-10"
        />

        <div className="max-w-6xl mx-auto relative z-10">
          {/* Premium Badge with Animation */}
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ type: "spring", stiffness: 200 }}
            className="inline-flex items-center gap-3 bg-gradient-to-r from-emerald-100 via-green-50 to-emerald-100 text-emerald-700 px-8 py-3 rounded-full text-sm font-black mb-10 shadow-lg border border-emerald-200"
          >
            <Sparkles className="w-5 h-5 animate-pulse" />
            2200M YÜKSƏKLIKDƏN DAĞLARIN BƏRƏKƏTI
            <Mountain className="w-5 h-5" />
          </motion.div>
          
          {/* Main Heading with Enhanced Typography */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter leading-[0.85] mb-10"
          >
            Organik Gədəbəyin <br />
            <motion.span 
              animate={{ 
                backgroundPosition: ["0% 50%", "100% 50%", "0% 50%"],
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "linear" }}
              className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-600 via-green-500 via-emerald-400 to-emerald-600 bg-[length:200%_auto]"
            >
              xüsusi <br />
              səbətləri
            </motion.span>
          </motion.h1>
          
          {/* Enhanced Subtitle */}
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="text-2xl text-slate-600 max-w-3xl mx-auto mb-12 leading-relaxed font-medium"
          >
            Murovdağ silsiləsinin yüksək yaylaqlarından birbaşa sizə — <br />
            <span className="text-emerald-600 font-bold">heç bir qatqı və konservant olmadan</span>
          </motion.p>

          {/* Live Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            className="flex flex-wrap items-center justify-center gap-6"
          >
            <LiveCounter />
            
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 3, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg"
            >
              <Users className="w-4 h-4" />
              <span>500+ xoşbəxt müştəri</span>
            </motion.div>

            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white px-6 py-3 rounded-full text-sm font-bold shadow-lg"
            >
              <Award className="w-4 h-4" />
              <span>Premium keyfiyyət</span>
            </motion.div>
          </motion.div>
        </div>

        {/* Decorative Elements */}
        <motion.div
          animate={{ y: [0, -20, 0] }}
          transition={{ duration: 6, repeat: Infinity }}
          className="absolute left-10 top-20 w-20 h-20 rounded-full bg-emerald-200/30 blur-2xl"
        />
        <motion.div
          animate={{ y: [0, 20, 0] }}
          transition={{ duration: 8, repeat: Infinity }}
          className="absolute right-10 bottom-20 w-32 h-32 rounded-full bg-green-200/30 blur-3xl"
        />
      </motion.section>

      {/* Premium Trust Badges */}
      <div className="max-w-7xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[
            { 
              icon: ShieldCheck, 
              label: "100% Təbii", 
              desc: "Heç bir qatqı yoxdur", 
              gradient: "from-emerald-500 to-green-500",
              delay: 0 
            },
            { 
              icon: Truck, 
              label: "24 Saat", 
              desc: "Sürətli çatdırılma", 
              gradient: "from-blue-500 to-cyan-500",
              delay: 0.1 
            },
            { 
              icon: Mountain, 
              label: "2200m", 
              desc: "Yüksək dağlıq", 
              gradient: "from-purple-500 to-pink-500",
              delay: 0.2 
            },
            { 
              icon: Heart, 
              label: "Premium", 
              desc: "Əla keyfiyyət", 
              gradient: "from-red-500 to-orange-500",
              delay: 0.3 
            },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: item.delay }}
              whileHover={{ y: -8, scale: 1.02 }}
              className="relative group"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white to-slate-50 rounded-[2rem] shadow-xl group-hover:shadow-2xl transition-all" />
              <div className="relative bg-white/60 backdrop-blur-sm p-8 rounded-[2rem] border border-white">
                <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${item.gradient} flex items-center justify-center text-white mb-5 shadow-lg group-hover:scale-110 transition-transform`}>
                  <item.icon className="w-8 h-8" />
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">{item.label}</h3>
                <p className="text-sm text-slate-600 font-medium">{item.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Enhanced Filter Bar */}
      <div className="max-w-7xl mx-auto px-6 mb-20 sticky top-6 z-30">
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/90 backdrop-blur-2xl border border-gray-200/50 rounded-[3rem] p-3 shadow-2xl"
        >
          <div className="flex items-center gap-3 flex-wrap justify-center">
            {[
              { key: "all", label: "Hamısı", icon: Package, gradient: "from-slate-500 to-slate-600" },
              { key: "gence", label: "Səhər", icon: Sunrise, gradient: "from-amber-500 to-orange-500" },
              { key: "gedebey", label: "Gədəbəy", icon: Mountain, gradient: "from-emerald-600 to-green-600" },
              { key: "trending", label: "Trend", icon: TrendingUp, gradient: "from-red-500 to-pink-500" },
              { key: "bestseller", label: "Bestseller", icon: Award, gradient: "from-amber-600 to-yellow-500" },
              { key: "new", label: "Yeni", icon: Sparkles, gradient: "from-blue-500 to-cyan-500" },
            ].map(item => (
              <motion.button
                key={item.key}
                onClick={() => setFilter(item.key)}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className={`relative flex items-center gap-2 px-6 py-4 rounded-[2rem] text-sm font-bold transition-all overflow-hidden ${
                  filter === item.key 
                    ? "text-white shadow-xl" 
                    : "text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter === item.key && (
                  <motion.div
                    layoutId="activeFilter"
                    className={`absolute inset-0 bg-gradient-to-r ${item.gradient}`}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <item.icon className={`w-5 h-5 relative z-10 ${filter === item.key ? 'animate-pulse' : ''}`} />
                <span className="relative z-10">{item.label}</span>
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Products Grid with Enhanced Spacing */}
      <div className="max-w-7xl mx-auto px-6 pb-32">
        {basketsLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-16 h-16 border-4 border-emerald-200 border-t-emerald-600 rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-slate-500">Səbətlər yüklənir...</p>
            </div>
          </div>
        ) : (
          <motion.div 
            layout
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10"
          >
            <AnimatePresence mode="wait">
              {filteredBaskets.map((basket) => (
                <BasketCard3D 
                  key={basket.id} 
                  item={basket} 
                  onAdd={handleAddToCart} 
                />
              ))}
            </AnimatePresence>
          </motion.div>
        )}

        {/* Empty State */}
        {!basketsLoading && filteredBaskets.length === 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center py-20"
          >
            <Package className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-black text-slate-400 mb-2">Məhsul tapılmadı</h3>
            <p className="text-slate-500">Bu kateqoriyada hələ məhsul yoxdur</p>
          </motion.div>
        )}
      </div>

      {/* Premium CTA Section with Village Atmosphere */}
      <section className="relative bg-gradient-to-br from-slate-900 via-emerald-900 to-slate-900 py-32 overflow-hidden">
        {/* Animated Background Pattern */}
        <motion.div
          animate={{ 
            backgroundPosition: ["0% 0%", "100% 100%"],
          }}
          transition={{ duration: 20, repeat: Infinity, repeatType: "reverse" }}
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")",
            backgroundSize: "60px 60px",
          }}
        />

        <div className="max-w-5xl mx-auto text-center px-6 relative z-10">
          <motion.div 
            initial={{ scale: 0, rotate: -180 }} 
            whileInView={{ scale: 1, rotate: 0 }} 
            transition={{ type: "spring", stiffness: 200 }}
            viewport={{ once: true }}
            className="inline-block mb-8"
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-2xl">
              <Leaf className="w-12 h-12 text-white" />
            </div>
          </motion.div>
          
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-5xl md:text-7xl font-black text-white mb-8 leading-tight"
          >
            Xüsusi Sifarişlər <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-green-400">
              Sizin Üçün
            </span>
          </motion.h2>
          
          <motion.p 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed"
          >
            Hazır seçimlərimiz kifayət etmirsə, öz büdcənizə və zövqünüzə uyğun 
            <span className="text-emerald-400 font-bold"> xüsusi səbət </span>
            sifariş edə bilərsiniz. Kənd təravətini hiss edin! 🌾
          </motion.p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
            <motion.a
              href="tel:+994775878588"
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="group flex items-center gap-3 bg-gradient-to-r from-emerald-600 to-green-600 text-white px-10 py-5 rounded-[2rem] font-black text-base uppercase shadow-2xl hover:shadow-emerald-500/50 transition-all"
            >
              <Phone className="w-6 h-6 group-hover:rotate-12 transition-transform" />
              Zəng Et
              <motion.span
                animate={{ x: [0, 5, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
              >
                →
              </motion.span>
            </motion.a>
            
            <motion.button
              whileHover={{ scale: 1.05, y: -3 }}
              whileTap={{ scale: 0.95 }}
              className="flex items-center gap-3 border-2 border-white/30 text-white px-10 py-5 rounded-[2rem] font-black text-base uppercase hover:bg-white/10 hover:border-white/50 transition-all shadow-xl"
            >
              <Gift className="w-6 h-6" />
              Hədiyyə Səbəti
            </motion.button>
          </div>

          {/* Trust Micro-Indicators */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center gap-8 mt-12 text-slate-400 text-sm"
          >
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span>4.9/5 reytinq</span>
            </div>
            <div className="w-px h-4 bg-slate-600" />
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-400" />
              <span>500+ müştəri</span>
            </div>
            <div className="w-px h-4 bg-slate-600" />
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-green-400" />
              <span>Təhlükəsiz ödəniş</span>
            </div>
          </motion.div>
        </div>

        {/* Decorative Blur Elements */}
        <div className="absolute top-20 left-20 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-green-500/20 rounded-full blur-[120px]" />
      </section>

      {/* Social Proof Section */}
      <section className="py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h3 className="text-4xl font-black text-slate-900 mb-4">
              Müştərilərimiz nə deyir?
            </h3>
            <p className="text-slate-600">Real rəylər, real insanlar</p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { name: "Aynur H.", text: "Gədəbəy səbətini aldım və ailəmlə birlikdə çox bəyəndik. Hər şey təzə və dad əla idi!", rating: 5 },
              { name: "Rəşad M.", text: "Premium paket heyrətamizdir! Qonaqlarımıza təqdim etdim, hamı çox bəyəndi.", rating: 5 },
              { name: "Leyla S.", text: "Təbii məhsulları sevənlər üçün ideal. Çatdırılma da çox sürətli oldu.", rating: 5 },
            ].map((review, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -5 }}
                className="bg-white p-8 rounded-3xl shadow-lg border border-emerald-100"
              >
                <div className="flex gap-1 mb-4">
                  {[...Array(review.rating)].map((_, i) => (
                    <Star key={i} className="w-5 h-5 text-amber-400 fill-amber-400" />
                  ))}
                </div>
                <p className="text-slate-700 mb-4 leading-relaxed">"{review.text}"</p>
                <p className="text-sm font-bold text-emerald-600">— {review.name}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}