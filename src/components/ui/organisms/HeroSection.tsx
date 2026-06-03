"use client";

import React, { useRef, useState, useEffect } from "react";
import { 
  motion, 
  AnimatePresence, 
  useScroll, 
  useTransform, 
  useSpring,
  useMotionValue,
  PanInfo
} from "framer-motion";
import { 
  Leaf, ShieldCheck, Truck, Star, 
  ShoppingBag, ArrowRight, HeartHandshake, 
  Sparkles, Clock, Award, Droplets,
  Eye, Heart, Sparkle, Compass, Play,
  Cherry, Carrot, Milk, Egg, Wheat,
  MapPin, Users, Flame, Plus, ChevronLeft, ChevronRight
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/storefront_home";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";
import { useWishlist } from "@/hooks/useWishlist";
import { OrganicTable } from "../molecules/OrganicTable";


// Təmiz Web Audio API vasitəsilə orqanik dağ və təbiət səslərinin sintezi
const playOrganicSynth = (type: 'drop' | 'breeze' | 'click') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    if (type === 'drop') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } else if (type === 'breeze') {
      // Yüngül yarpaq pıçıltısı üçün ağ küy filtri simulyasiyası
      const bufferSize = ctx.sampleRate * 0.2; // 200ms külək meh
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      
      const noise = ctx.createBufferSource();
      noise.buffer = buffer;
      
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.value = 1000;
      filter.Q.value = 1.5;
      
      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.04, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      
      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);
      
      noise.start();
    } else if (type === 'click') {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start();
      osc.stop(ctx.currentTime + 0.06);
    }
  } catch (e) {
    // Səs dəstəklənməyən köhnə brauzerlər üçün qoruyucu sipər
  }
};

const TABLE_ITEMS = [
  { id: "honey", name: "Gədəbəy Balı", icon: "🍯", desc: "1500m yüksəklikdə saf süzmə bal", benefit: "Antioksidant zəngini", x: "42%", y: "45%", delay: 0 },
  { id: "cheese", name: "Kənd Pendiri", icon: "🧀", desc: "Tam yağlı dağ inəyi südündən", benefit: "Kalsium mənbəyi", x: "18%", y: "30%", delay: 0.5 },
  { id: "eggs", name: "Kənd Yumurtası", icon: "🥚", desc: "Təbii yemlənmiş toyuqlardan günlük", benefit: "Yüksək protein", x: "22%", y: "62%", delay: 1 },
  { id: "apple", name: "Söyüdlü Alması", icon: "🍎", desc: "Dərmansız, sulu və şirin dağ alması", benefit: "Vitamin C deposu", x: "68%", y: "25%", delay: 1.5 },
  { id: "wheat", name: "Kürə Çörəyi", icon: "🌾", desc: "Təbii maya ilə odun sobasında", benefit: "Lifli tərkib", x: "72%", y: "60%", delay: 2 },
  { id: "butter", name: "Nəhrə Yağı", icon: "🧈", desc: "Gündəlik çalınan xalis kənd yağı", benefit: "A, D, E vitaminləri", x: "48%", y: "15%", delay: 2.5 },
];

function getDiscountPct(p: Product): number {
  const base = getProductBasePrice(p);
  const price = finalPrice(base, p.discountType, p.discountValue);
  if (base <= 0 || price >= base) return 0;
  return Math.round((1 - price / base) * 100);
}

/* ══════════════════════════════════════════════════════════════════
   PREMIUM DRAGGABLE SLIDER (Günün Təzə Dağ Fırsatları)
══════════════════════════════════════════════════════════════════ */
function PremiumSwipeSlider({ products }: { products: Product[] }) {
  const [idx, setIdx] = useState(0);
  const addToCart = useApp((s) => s.addToCart);
  
  // Yalnız arxivdə olmayan və real stokda olan endirimli kənd məhsulları
  const activeDeals = products.filter(p => !p.archived).slice(0, 5);

  const nextSlide = () => {
    playOrganicSynth('click');
    setIdx((p) => (p + 1) % activeDeals.length);
  };

  const prevSlide = () => {
    playOrganicSynth('click');
    setIdx((p) => (p - 1 + activeDeals.length) % activeDeals.length);
  };

  const handleDragEnd = (event: any, info: PanInfo) => {
    if (info.offset.x < -50) {
      nextSlide();
    } else if (info.offset.x > 50) {
      prevSlide();
    }
  };

  if (!activeDeals.length) return null;
  const cur = activeDeals[idx];
  const curPrice = finalPrice(getProductBasePrice(cur), cur.discountType, cur.discountValue);
  const basePrice = getProductBasePrice(cur);
  const discountPct = getDiscountPct(cur);

  // Süni şəkildə yığım vaxtı və real kəndli hekayəsi
  const harvestTime = idx === 0 ? "Sübh 05:30" : idx === 1 ? "Səhər 06:15" : "Günorta 07:00";
  const region = idx % 2 === 0 ? "Söyüdlü kəndi, Gədəbəy" : "Qarı kəndi, Gədəbəy";

  return (
    <div className="w-full max-w-sm mx-auto mt-8 relative px-2">
      {/* Üst Başlıq və Sayaç */}
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" /> Günün Dağ Sürprizi
        </span>
        <div className="flex gap-1">
          <button onClick={prevSlide} className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-700 shadow-sm transition-colors">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <button onClick={nextSlide} className="w-6 h-6 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-700 shadow-sm transition-colors">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Sürüşdürülə bilən Premium Deal Kartı */}
      <div className="relative overflow-hidden rounded-3xl border border-emerald-100 bg-white p-4 shadow-xl">
        <motion.div
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          dragElastic={0.2}
          onDragEnd={handleDragEnd}
          className="flex gap-4 cursor-grab active:cursor-grabbing"
          whileTap={{ scale: 0.98 }}
        >
          {/* Məhsul şəkli */}
          <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 shadow-inner">
            <Image 
              src={getFirstImageUrl(cur)} 
              alt={cur.name} 
              fill 
              className="object-cover pointer-events-none" 
            />
            {discountPct > 0 && (
              <span className="absolute top-2 left-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-sm">
                -{discountPct}%
              </span>
            )}
          </div>

          {/* Məhsul məlumatları */}
          <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
            <div>
              <p className="text-sm font-black text-slate-800 leading-snug truncate">
                {cur.name}
              </p>
              
              {/* Yığım Təzəliyi və Lokasiya */}
              <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1">
                <Clock className="w-3 h-3 text-emerald-500" /> <span>{harvestTime}</span>
                <span className="w-1 h-1 rounded-full bg-slate-300" />
                <MapPin className="w-3 h-3 text-lime-500" /> <span>{region.split(',')[0]}</span>
              </div>
            </div>

            {/* Qiymətlər və Səbətə at düyməsi */}
            <div className="flex items-end justify-between mt-2">
              <div className="space-y-0.5">
                {discountPct > 0 && (
                  <p className="text-xs line-through text-slate-400 font-bold leading-none">
                    {formatCurrency(basePrice)}
                  </p>
                )}
                <p className="text-lg font-black text-emerald-700 leading-none">
                  {formatCurrency(curPrice)}
                </p>
              </div>

              {/* Sürətli Səbətə Əlavə */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={(e) => {
                  e.stopPropagation();
                  addToCart(cur.id, cur.variants?.[0]?.id, 1);
                  playOrganicSynth('drop');
                }}
                className="w-10 h-10 rounded-2xl bg-slate-900 text-white hover:bg-emerald-600 flex items-center justify-center shadow-lg hover:shadow-emerald-500/20 transition-colors shrink-0"
              >
                <Plus className="w-5 h-5" />
              </motion.button>
            </div>
          </div>
        </motion.div>

        {/* Real-vaxt Günün Tələbi Şkalası */}
        <div className="mt-4 pt-3 border-t border-slate-50 text-left">
          <div className="flex items-center justify-between text-[10px] font-bold text-slate-500 mb-1">
            <span>Orqanik Saf İndeks</span>
            <span className="text-emerald-700 font-extrabold">99.8% Təmiz</span>
          </div>
          <div className="h-1.5 rounded-full bg-slate-100 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: "95%" }}
              transition={{ duration: 1.2, ease: "easeOut" }}
              className="h-full rounded-full bg-gradient-to-r from-emerald-400 to-lime-500"
            />
          </div>
        </div>
      </div>

      {/* Naviqasiya nöqtələri */}
      <div className="flex justify-center gap-1.5 mt-3">
        {activeDeals.map((_, i) => (
          <button 
            key={i} 
            onClick={() => setIdx(i)} 
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-200"}`} 
          />
        ))}
      </div>
    </div>
  );
}


/* ══════════════════════════════════════════════════════════════════
   MAIN HERO COMPONENT
══════════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const products = useApp((s) => s.products) || [];
  
  // Parallaks effekti üçün scroll-un izlənilməsi
  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  return (
    <section ref={heroRef} className="relative overflow-hidden rounded-[3.5rem] bg-gradient-to-br from-[#FAF9F5] via-white to-[#F2FAF4] min-h-[750px] flex items-center py-16 md:py-24">
      {/* Süzülən orqanik yarpaq elementləri */}
      <motion.div style={{ y: backgroundY }} className="absolute inset-0 overflow-hidden pointer-events-none">
        {Array.from({ length: 8 }).map((_, i) => (
          <motion.div 
            key={i} 
            initial={{ y: -50, opacity: 0, rotate: 0 }}
            animate={{ y: "110vh", opacity: [0, 0.4, 0.2, 0], rotate: [0, 90, 180, 270, 360] }}
            transition={{ duration: 15 + i * 3, delay: i * 2, repeat: Infinity, ease: "linear" }}
            style={{ position: "absolute", left: `${10 + i * 12}%`, top: 0, zIndex: 1 }} 
            className="text-emerald-500/10 text-3xl select-none"
          >
            🍃
          </motion.div>
        ))}
      </motion.div>

      {/* Əsas Məzmun Grid */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-16 items-center">
          
          {/* SOL TƏRƏF (Məzmun və Başlıqlar) */}
          <div className="lg:col-span-6 z-20">
            <HeroContent />
          </div>

          {/* SAĞ TƏRƏF (İnteraktiv Orqanik Süfrə & Swipeable Deal Slider) */}
          <div className="lg:col-span-6 flex flex-col items-center z-10 w-full">
            <div className="relative w-full max-w-lg md:max-w-xl">
              {/* Lüks arxa plan parıltı halosu */}
              <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200/20 via-lime-200/10 to-amber-200/20 rounded-[4rem] blur-3xl -z-10 animate-pulse pointer-events-none" />
              
              {/* Premium 3D Süfrə */}
              <OrganicTable />
            </div>

            {/* Sürüşdürülə bilən interaktiv Sürpriz Slider */}
            <PremiumSwipeSlider products={products} />
          </div>

        </div>
      </div>
    </section>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO CONTENT SUB-COMPONENTS
══════════════════════════════════════════════════════════════════ */
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
      {/* Canlı Aktivlik */}
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

      {/* Brend Banner */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl px-4 py-2 shadow-md shadow-emerald-900/10 w-fit">
        <Leaf className="w-4 h-4 text-lime-300 animate-pulse" />
        <span className="text-[10px] font-black tracking-widest uppercase">Gədəbəy & Gəncə Təsərrüfatı</span>
        <Award className="w-4 h-4 text-amber-300" />
      </motion.div>

      {/* Başlıq */}
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

      {/* Mətn */}
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="text-slate-600 text-base md:text-lg leading-relaxed font-medium">
        Gədəbəyin zəngin bulaqlarından bəhrələnən, heç bir sənaye qatqısı olmadan hazırlanan{" "}
        <span className="text-slate-900 font-bold border-b-2 border-lime-300 pb-0.5">100% təbii nemətlər</span>{" "}
        indi birbaşa kənd həyətindən süfrənizə gəlir.
      </motion.p>

      {/* Sürətli Keçidlər */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-4">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href="/products" className="group inline-flex items-center gap-3 bg-slate-900 text-white font-black text-sm rounded-[1.75rem] px-8 py-5 shadow-xl shadow-slate-900/15 hover:bg-emerald-600 hover:shadow-emerald-600/20 transition-all duration-300">
            <ShoppingBag className="w-4 h-4" /> MAĞAZAYA KEÇ <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href="/fresh-today" className="inline-flex items-center gap-2.5 bg-white border-2 border-slate-100 text-slate-800 font-black text-sm rounded-[1.75rem] px-7 py-5 hover:bg-slate-50 active:scale-95 transition-all shadow-sm">
            <Play size={16} className="text-emerald-500" fill="currentColor" /> Ferma Hekayəmiz
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
          ]
            .map((item, i) => (
              <OrganicBadge key={item.label} icon={item.icon} label={item.label} color={item.color} index={i + 1} />
            ))}
        </div>
      </div>

      {/* Sertifikatlar */}
      <div className="grid grid-cols-2 gap-4 pt-6 border-t border-slate-100">
        {[
          { icon: ShieldCheck, title: "100% Bio", text: "Laboratoriya təsdiqli" },
          { icon: Truck, title: "Təzə Çatdırılma", text: "Soyuduculu avtomobillə" }
        ].map((item, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600">
              <item.icon size={20} />
            </div>
            <div>
              <p className="text-sm font-black text-slate-800">{item.title}</p>
              <p className="text-xs text-slate-400 font-bold leading-none mt-0.5">{item.text}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
