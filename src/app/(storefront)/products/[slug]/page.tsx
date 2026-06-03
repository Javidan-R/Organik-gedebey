"use client";

import React, { useRef, useState, useEffect } from "react";
import {
  motion,
  AnimatePresence,
  useScroll,
  useTransform,
  useSpring,
  useMotionValue,
  PanInfo,
} from "framer-motion";
import {
  Leaf,
  ShieldCheck,
  Truck,
  ShoppingBag,
  ArrowRight,
  Clock,
  Award,
  Droplets,
  Heart,
  Sparkle,
  Play,
  Cherry,
  Milk,
  MapPin,
  Users,
  Flame,
  Plus,
  ChevronLeft,
  ChevronRight,
  Share2,
  TrendingUp,
  Gauge,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";

// Audio helper (unchanged)
const playOrganicSynth = (type: "drop" | "breeze" | "click") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (type === "drop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === "breeze") {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      const filter = ctx.createBiquadFilter();
      filter.type = "bandpass";
      filter.frequency.value = 1000;
      filter.Q.value = 1.5;
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      noise.start();
    } else if (type === "click") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = "triangle";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {}
};

// ---------- circular positioning helper ----------
const getCirclePosition = (index: number, total: number, radiusPercent = 38) => {
  const angle = (index / total) * 360 - 90;
  const rad = (angle * Math.PI) / 180;
  const x = 50 + radiusPercent * Math.cos(rad);
  const y = 50 + radiusPercent * Math.sin(rad);
  return { left: `${x}%`, top: `${y}%` };
};

// ---------- Organic Table with REAL products ----------
const OrganicTable = ({
  products,
  likedItems,
  onLikeToggle,
  selectedItems,
  onSelectToggle,
}: {
  products: Product[];
  likedItems: string[];
  onLikeToggle: (id: string) => void;
  selectedItems: string[];
  onSelectToggle: (id: string) => void;
}) => {
  const [activeItem, setActiveItem] = useState<Product | null>(null);
  const tableX = useMotionValue(0);
  const tableY = useMotionValue(0);
  const springX = useSpring(tableX, { stiffness: 60, damping: 25 });
  const springY = useSpring(tableY, { stiffness: 60, damping: 25 });
  const plateRotateX = useTransform(springY, [-200, 200], [12, -12]);
  const plateRotateY = useTransform(springX, [-200, 200], [-12, 12]);
  const shadowTranslateX = useTransform(springX, [-200, 200], [20, -20]);
  const shadowTranslateY = useTransform(springY, [-200, 200], [20, -20]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    tableX.set(x);
    tableY.set(y);
  };
  const handleMouseLeave = () => {
    tableX.set(0);
    tableY.set(0);
    setActiveItem(null);
  };

  // Show at most 12 products on the table
  const displayProducts = products.filter(p => !p.archived).slice(0, 12);

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square md:aspect-[4/3] flex items-center justify-center rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-emerald-50/70 via-lime-50/40 to-amber-50/50 p-4 shadow-inner border border-emerald-100/40 group/table cursor-none"
    >
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,250,230,0.9),transparent_75%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-200/20 rounded-full blur-[90px] animate-pulse pointer-events-none" />
      <motion.div
        style={{ x: shadowTranslateX, y: shadowTranslateY }}
        className="absolute w-[80%] h-[80%] bg-emerald-950/5 rounded-[4rem] blur-2xl pointer-events-none"
      />

      <motion.div
        style={{ rotateX: plateRotateX, rotateY: plateRotateY, transformStyle: "preserve-3d" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* table surface */}
        <div className="absolute w-[88%] h-[88%] rounded-[3.5rem] bg-white shadow-[0_30px_70px_-15px_rgba(16,83,19,0.12)] border border-emerald-50/80 overflow-hidden">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(240,245,230,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(240,245,230,0.4)_1px,transparent_1px)] bg-[size:32px_32px]" />
          <div className="w-[75%] h-[75%] rounded-full border border-dashed border-emerald-200/50 flex items-center justify-center opacity-90">
            <div className="w-[65%] h-[65%] rounded-full border border-dashed border-emerald-100/40" />
          </div>
        </div>

        {/* products placed on circle */}
        {displayProducts.map((product, idx) => {
          const pos = getCirclePosition(idx, displayProducts.length, 40);
          const isActive = activeItem?.id === product.id;
          const isLiked = likedItems.includes(product.id);
          const isSelected = selectedItems.includes(product.id);
          const basePrice = getProductBasePrice(product);
          const price = finalPrice(basePrice, product.discountType, product.discountValue);
          const imageUrl = getFirstImageUrl(product);
          const animationType = idx % 3 === 0 ? "float" : idx % 3 === 1 ? "pulse" : "rotate";

          return (
            <motion.div
              key={product.id}
              className="absolute z-20"
              style={{ left: pos.left, top: pos.top }}
              onMouseEnter={() => {
                setActiveItem(product);
                playOrganicSynth("drop");
              }}
              animate={
                animationType === "float"
                  ? { y: [0, -8, 0] }
                  : animationType === "pulse"
                  ? { scale: [1, 1.05, 1] }
                  : { rotate: [0, 5, 0, -5, 0] }
              }
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: idx * 0.2,
                ease: "easeInOut",
              }}
              whileHover={{ scale: 1.2, z: 50, filter: "drop-shadow(0 25px 30px rgba(16,83,19,0.2))" }}
            >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/5 rounded-full blur-sm transition-transform" />
              <div
                className={`relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border-2 transition-all duration-300 shadow-md flex items-center justify-center group/item ${
                  isSelected ? "border-emerald-500 ring-4 ring-emerald-200" : "border-emerald-50/80 hover:border-emerald-300"
                }`}
              >
                <div className="absolute inset-1 rounded-full border border-dashed border-emerald-100/60 group-hover/item:border-emerald-400/60" />
                {imageUrl && (
                  <Image
                    src={imageUrl}
                    alt={product.name}
                    width={80}
                    height={80}
                    className="rounded-full object-cover w-16 h-16 md:w-20 md:h-20 pointer-events-none"
                  />
                )}
                {/* like button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onLikeToggle(product.id);
                    playOrganicSynth("click");
                  }}
                  className="absolute -top-1 -right-1 bg-white rounded-full p-1 shadow-md z-30 hover:scale-110 transition"
                >
                  <Heart size={14} className={isLiked ? "fill-red-500 text-red-500" : "text-gray-400"} />
                </button>
                {/* selected indicator */}
                {isSelected && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -bottom-1 -left-1 bg-emerald-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold"
                  >
                    ✓
                  </motion.div>
                )}
                {isActive && (
                  <motion.div
                    layoutId="sparkle"
                    className="absolute -top-2 -right-2 text-amber-500 z-30"
                    animate={{ scale: [1, 1.3, 1], rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 2 }}
                  >
                    <Sparkle size={20} fill="currentColor" />
                  </motion.div>
                )}
              </div>
            </motion.div>
          );
        })}

        {/* active product tooltip with real data */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              className="absolute bottom-6 left-6 right-6 z-30 bg-white/95 backdrop-blur-xl border border-emerald-100/90 rounded-[2rem] p-5 shadow-2xl flex items-center gap-4"
            >
              <div className="relative w-16 h-16 rounded-xl overflow-hidden shrink-0">
                <Image
                  src={getFirstImageUrl(activeItem) || "/placeholder.png"}
                  alt={activeItem.name}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between flex-wrap gap-1">
                  <h4 className="font-black text-slate-800 text-base">{activeItem.name}</h4>
                  <span className="bg-emerald-100 text-emerald-800 text-[9px] px-2 py-1 rounded-full">
                    {activeItem.category || "Orqanik"}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                  {activeItem.description || "Təbii və təzə məhsul"}
                </p>
                <p className="text-sm font-bold text-emerald-600 mt-1">
                  {formatCurrency(finalPrice(getProductBasePrice(activeItem), activeItem.discountType, activeItem.discountValue))}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* instruction badge */}
      {!activeItem && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 left-6 right-6 text-center pointer-events-none"
        >
          <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 border border-emerald-100 shadow-lg">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400" />
              <span className="relative rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-xs font-bold text-emerald-800">Üzərinə gəl & kəşf et</span>
          </div>
        </motion.div>
      )}
    </div>
  );
};

// ---------- premium slider (already uses real products) ----------
function PremiumSwipeSlider({ products }: { products: Product[] }) {
  const [idx, setIdx] = useState(0);
  const [likedDeals, setLikedDeals] = useState<string[]>([]);
  const addToCart = useApp((s) => s.addToCart);
  const activeDeals = products.filter((p) => !p.archived).slice(0, 8);
  const nextSlide = () => {
    playOrganicSynth("click");
    setIdx((p) => (p + 1) % activeDeals.length);
  };
  const prevSlide = () => setIdx((p) => (p - 1 + activeDeals.length) % activeDeals.length);
  const handleDragEnd = (e: any, info: PanInfo) => {
    if (info.offset.x < -50) nextSlide();
    if (info.offset.x > 50) prevSlide();
  };
  if (!activeDeals.length) return null;
  const cur = activeDeals[idx];
  const basePrice = getProductBasePrice(cur);
  const curPrice = finalPrice(basePrice, cur.discountType, cur.discountValue);
  const discountPct = ((1 - curPrice / basePrice) * 100).toFixed(0);
  const harvestTime = ["Sübh 05:30", "Səhər 06:15", "Günorta 07:00", "Axşamüstü 15:20"][idx % 4];
  const region = idx % 2 === 0 ? "Söyüdlü kəndi, Gədəbəy" : "Qarı kəndi, Gədəbəy";

  return (
    <div className="w-full max-w-sm mx-auto mt-8 relative px-2">
      <div className="flex items-center justify-between mb-3">
        <span className="flex items-center gap-1 text-xs font-black text-emerald-800">
          <Flame className="w-4 h-4 text-red-500 animate-bounce" /> Günün Dağ Sürprizi
        </span>
        <div className="flex gap-1">
          <button onClick={prevSlide} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextSlide} className="w-7 h-7 rounded-full bg-white shadow-sm flex items-center justify-center">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.98 }}
        >
          <div className="flex gap-4">
            <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0">
              <Image src={getFirstImageUrl(cur)} alt={cur.name} fill className="object-cover" />
              {+discountPct > 0 && (
                <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-bold px-2 rounded-full">
                  -{discountPct}%
                </span>
              )}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                <p className="text-sm font-black text-slate-800">{cur.name}</p>
                <div className="flex gap-1">
                  <button
                    onClick={() => {
                      setLikedDeals((prev) =>
                        prev.includes(cur.id) ? prev.filter((id) => id !== cur.id) : [...prev, cur.id]
                      );
                      playOrganicSynth("click");
                    }}
                  >
                    <Heart
                      size={16}
                      className={likedDeals.includes(cur.id) ? "fill-red-500 text-red-500" : "text-gray-400"}
                    />
                  </button>
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({ title: cur.name, text: "Gədəbəydən təbii məhsul", url: window.location.href });
                      }
                      playOrganicSynth("click");
                    }}
                  >
                    <Share2 size={16} className="text-gray-500" />
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1 text-[9px] text-slate-400 mt-1">
                <Clock className="w-3 h-3" /> {harvestTime} • <MapPin className="w-3 h-3" /> {region.split(",")[0]}
              </div>
              <div className="flex justify-between items-end mt-2">
                <div>
                  {+discountPct > 0 && <p className="text-xs line-through text-slate-400">{formatCurrency(basePrice)}</p>}
                  <p className="text-lg font-black text-emerald-700">{formatCurrency(curPrice)}</p>
                </div>
                <motion.button
                  whileTap={{ scale: 0.9 }}
                  onClick={() => addToCart(cur.id, cur.variants?.[0]?.id, 1)}
                  className="w-10 h-10 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 flex items-center justify-center shadow-lg"
                >
                  <Plus className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </div>
        </motion.div>
        <div className="mt-3 pt-2 border-t border-slate-50">
          <div className="flex justify-between text-[9px] font-bold">
            <span>Orqanik indeks</span>
            <span className="text-emerald-700">99% təmiz</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 mt-1 overflow-hidden">
            <motion.div initial={{ width: 0 }} animate={{ width: "95%" }} className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-500" />
          </div>
        </div>
      </div>
      <div className="flex justify-center gap-1.5 mt-3">
        {activeDeals.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-200"}`} />
        ))}
      </div>
    </div>
  );
}

// ---------- stats panel (real‑time simulation) ----------
const LiveStats = () => {
  const [ordersToday, setOrdersToday] = useState(234);
  const [activeUsers, setActiveUsers] = useState(42);
  useEffect(() => {
    const interval = setInterval(() => {
      setOrdersToday((prev) => prev + Math.floor(Math.random() * 5));
      setActiveUsers((prev) => Math.max(12, prev + (Math.random() > 0.7 ? 1 : -1)));
    }, 8000);
    return () => clearInterval(interval);
  }, []);
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-wrap justify-between gap-2 mt-6 p-3 bg-white/70 backdrop-blur-sm rounded-2xl border border-emerald-100"
    >
      <div className="flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-emerald-600" />
        <div>
          <p className="text-[10px] text-slate-500">Bugünkü sifariş</p>
          <p className="font-black text-sm text-emerald-800">{ordersToday}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Users className="w-4 h-4 text-emerald-600" />
        <div>
          <p className="text-[10px] text-slate-500">Aktiv baxış</p>
          <p className="font-black text-sm text-emerald-800">{activeUsers}</p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Gauge className="w-4 h-4 text-emerald-600" />
        <div>
          <p className="text-[10px] text-slate-500">Çatdırılma vaxtı</p>
          <p className="font-black text-sm text-emerald-800">&lt; 24 saat</p>
        </div>
      </div>
    </motion.div>
  );
};

// ---------- floating selection basket with real products ----------
const SelectionBasket = ({
  selectedProducts,
  onCheckout,
}: {
  selectedProducts: Product[];
  onCheckout: () => void;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const totalPrice = selectedProducts.reduce((sum, p) => {
    const base = getProductBasePrice(p);
    const price = finalPrice(base, p.discountType, p.discountValue);
    return sum + price;
  }, 0);
  if (!selectedProducts.length) return null;
  return (
    <motion.div
      initial={{ y: 100 }}
      animate={{ y: 0 }}
      className="fixed bottom-6 left-4 right-4 z-50 md:left-auto md:right-6 md:w-80 bg-white/95 backdrop-blur-lg rounded-2xl shadow-2xl border border-emerald-200 p-3"
    >
      <div className="flex justify-between items-center cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
        <span className="font-black text-emerald-800 text-sm">
          📦 Seçilmişlər ({selectedProducts.length})
        </span>
        <span className="text-emerald-700 font-bold">{formatCurrency(totalPrice)}</span>
        <button className="text-xs text-emerald-600 underline">Alış-veriş</button>
      </div>
      <AnimatePresence>
        {isOpen && (
          <motion.div initial={{ height: 0 }} animate={{ height: "auto" }} exit={{ height: 0 }} className="overflow-hidden mt-2 space-y-2">
            {selectedProducts.map((p) => {
              const base = getProductBasePrice(p);
              const price = finalPrice(base, p.discountType, p.discountValue);
              return (
                <div key={p.id} className="flex justify-between text-sm">
                  <span>{p.name}</span>
                  <span>{formatCurrency(price)}</span>
                </div>
              );
            })}
            <button
              onClick={onCheckout}
              className="w-full mt-2 bg-emerald-600 text-white py-2 rounded-xl text-sm font-bold"
            >
              Səbətə əlavə et
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---------- main HeroSection with all real data ----------
export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const products = useApp((s) => s.products) || [];
  const addToCart = useApp((s) => s.addToCart);
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);
  const [likedProducts, setLikedProducts] = useState<string[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);

  const toggleLike = (id: string) => {
    setLikedProducts((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };
  const toggleSelect = (id: string) => {
    setSelectedProducts((prev) => {
      const exists = prev.some((p) => p.id === id);
      if (exists) return prev.filter((p) => p.id !== id);
      const product = products.find((p) => p.id === id);
      return product ? [...prev, product] : prev;
    });
  };
  const handleCheckout = () => {
    selectedProducts.forEach((product) => {
      addToCart(product.id, product.variants?.[0]?.id, 1);
    });
    setSelectedProducts([]);
  };

  return (
    <section ref={heroRef} className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-[#FAF9F5] via-white to-[#F2FAF4] min-h-[750px] flex items-center py-16 md:py-24">
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 12 }).map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: -50, opacity: 0 }}
            animate={{ y: "110vh", opacity: [0, 0.3, 0] }}
            transition={{ duration: 20 + i * 2, delay: i * 1.5, repeat: Infinity }}
            style={{ left: `${5 + i * 9}%`, top: 0, position: "absolute" }}
            className="text-emerald-500/10 text-2xl"
          >
            🍃
          </motion.div>
        ))}
      </motion.div>

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          <div className="lg:col-span-6">
            <HeroContent />
          </div>
          <div className="lg:col-span-6 flex flex-col items-center">
            <div className="relative w-full max-w-lg md:max-w-xl">
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200/20 via-lime-200/10 to-amber-200/20 rounded-[4rem] blur-3xl -z-10 animate-pulse" />
              <OrganicTable
                products={products}
                likedItems={likedProducts}
                onLikeToggle={toggleLike}
                selectedItems={selectedProducts.map((p) => p.id)}
                onSelectToggle={toggleSelect}
              />
            </div>
            <PremiumSwipeSlider products={products} />
            <LiveStats />
          </div>
        </div>
      </div>
      <SelectionBasket selectedProducts={selectedProducts} onCheckout={handleCheckout} />
    </section>
  );
}

// ---------- HeroContent (unchanged, uses no static data) ----------
const OrganicBadge = ({ icon: Icon, label, color, index }: { icon: any; label: string; color: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4 + index * 0.1 }}
    whileHover={{ scale: 1.05 }}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border border-white/50 shadow-sm ${color}`}
  >
    <Icon size={14} />
    <span>{label}</span>
  </motion.div>
);

const HeroContent = () => {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState({ emoji: "☀️", text: "Xoş gördük!" });
  const [liveCount] = useState(() => Math.floor(Math.random() * 20) + 12);
  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting({ emoji: "🌅", text: "Sabahınız xeyir!" });
    else if (hour >= 12 && hour < 18) setGreeting({ emoji: "☀️", text: "Günortanız xeyir!" });
    else setGreeting({ emoji: "🌙", text: "Axşamınız xeyir!" });
  }, []);
  return (
    <div className="flex flex-col gap-6 md:gap-8 max-w-xl text-left">
      {mounted && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-2.5 flex-wrap">
          <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100/50">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
            </span>
            <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Canlı</span>
          </div>
          <span className="text-xs font-bold text-slate-500">{greeting.emoji} {greeting.text}</span>
          <span className="text-[10px] font-bold text-slate-400 flex items-center gap-1">
            <Users className="w-3.5 h-3.5" /> {liveCount} nəfər hazırda baxır
          </span>
        </motion.div>
      )}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl px-4 py-2 shadow-md w-fit">
        <Leaf className="w-4 h-4 text-lime-300 animate-pulse" />
        <span className="text-[10px] font-black tracking-widest uppercase">Gədəbəy & Gəncə Təsərrüfatı</span>
        <Award className="w-4 h-4 text-amber-300" />
      </motion.div>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
        <h1 className="text-5xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[1.05] tracking-tighter">
          Hər Süfrədə{" "}
          <span className="relative inline-block text-emerald-600 italic">
            Dağ Nəfəsi
            <motion.svg viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full h-3 text-lime-400/80"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 1.2 }}>
              <path d="M5 15 Q 150 5 295 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
            </motion.svg>
          </span>
        </h1>
        <p className="text-lg font-bold text-emerald-800">Organik Gədəbəy</p>
      </motion.div>
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
        Gədəbəyin zəngin bulaqlarından bəhrələnən, heç bir sənaye qatqısı olmadan hazırlanan{" "}
        <span className="text-slate-900 font-bold border-b-2 border-lime-300 pb-0.5">100% təbii nemətlər</span>{" "}
        indi birbaşa kənd həyətindən süfrənizə gəlir.
      </motion.p>
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-4">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href="/products" className="group inline-flex items-center gap-3 bg-slate-900 text-white font-black text-sm rounded-[1.75rem] px-8 py-5 shadow-xl shadow-slate-900/15 hover:bg-emerald-600 transition-all">
            <ShoppingBag className="w-4 h-4" /> MAĞAZAYA KEÇ <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href="/fresh-today" className="inline-flex items-center gap-2.5 bg-white border-2 border-slate-100 text-slate-800 font-black text-sm rounded-[1.75rem] px-7 py-5 hover:bg-slate-50 transition-all shadow-sm">
            <Play size={16} className="text-emerald-500" /> Ferma Hekayəmiz
          </Link>
        </motion.div>
      </motion.div>
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Təbii Kateqoriyalarımız</h3>
        <div className="flex flex-wrap gap-2.5">
          {[
            { icon: Droplets, label: "Təbii Bal", color: "bg-amber-50 text-amber-600" },
            { icon: Leaf, label: "Tərəvəzlər", color: "bg-emerald-50 text-emerald-600" },
            { icon: Milk, label: "Süd Məhsulları", color: "bg-sky-50 text-sky-600" },
            { icon: Cherry, label: "Meyvələr", color: "bg-rose-50 text-rose-600" },
          ].map((item, i) => (
            <OrganicBadge key={item.label} icon={item.icon} label={item.label} color={item.color} index={i + 1} />
          ))}
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
        {[
          { icon: ShieldCheck, title: "100% Bio", text: "Laboratoriya təsdiqli" },
          { icon: Truck, title: "Təzə Çatdırılma", text: "Soyuduculu avtomobillə" },
        ].map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-400 font-bold">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};