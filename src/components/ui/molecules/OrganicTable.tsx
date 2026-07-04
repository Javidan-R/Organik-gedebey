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
  Leaf, ShieldCheck, Truck,
  ShoppingBag, ArrowRight, Clock, Award, Droplets,
 Sparkle, Play, Milk,
  MapPin, Users, Flame, Plus, ChevronLeft, ChevronRight,
  Cherry
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/product";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";

 
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


const OrganicTable = () => {
  const [activeItem, setActiveItem] = useState<typeof TABLE_ITEMS[0] | null>(null);
  
  // Real-time kursor koordinatları
  const tableX = useMotionValue(0);
  const tableY = useMotionValue(0);
  
  // Düzgün və hamar fiziki yayınma animasiyası
  const springX = useSpring(tableX, { stiffness: 60, damping: 25 });
  const springY = useSpring(tableY, { stiffness: 60, damping: 25 });
  
  // Müxtəlif qatların fərqli dərəcədə əyilməsi (3D Parallaks)
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

  return (
    <div 
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className="relative w-full aspect-square md:aspect-[4/3] flex items-center justify-center rounded-[3.5rem] overflow-hidden bg-gradient-to-br from-emerald-50/70 via-lime-50/40 to-amber-50/50 p-4 shadow-inner border border-emerald-100/40 group/table cursor-none"
    >
      {/* Şəffaf və parıldayan süfrə arxa fonu */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,250,230,0.9),transparent_75%)] pointer-events-none" />
      <div className="absolute top-1/4 left-1/3 w-80 h-80 bg-emerald-200/20 rounded-full blur-[90px] animate-pulse pointer-events-none" />
      
      {/* 3D hərəkətli real-vaxt kölgə seli */}
      <motion.div 
        style={{ x: shadowTranslateX, y: shadowTranslateY }}
        className="absolute w-[80%] h-[80%] bg-emerald-950/5 rounded-[4rem] blur-2xl pointer-events-none"
      />

      {/* Kürevi Süfrə Səthi */}
      <motion.div
        style={{ rotateX: plateRotateX, rotateY: plateRotateY, transformStyle: "preserve-3d" }}
        className="relative w-full h-full flex items-center justify-center"
      >
        {/* Taxta Kənd Süfrəsi Dizaynı */}
        <div className="absolute w-[88%] h-[88%] rounded-[3.5rem] bg-white shadow-[0_30px_70px_-15px_rgba(16,83,19,0.12)] border border-emerald-50/80 overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(240,245,230,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(240,245,230,0.4)_1px,transparent_1px)] bg-[size:32px_32px]" />
          
          {/* Süfrənin Naxışlı Halosu */}
          <div className="w-[75%] h-[75%] rounded-full border border-dashed border-emerald-200/50 flex items-center justify-center opacity-90">
            <div className="w-[65%] h-[65%] rounded-full border border-dashed border-emerald-100/40" />
          </div>
        </div>

        {/* Süfrənin üzərindəki məhsullar */}
        {TABLE_ITEMS.map((item) => {
          const isActive = activeItem?.id === item.id;
          return (
            <motion.div
              key={item.id}
              className="absolute z-20"
              style={{ left: item.x, top: item.y }}
              onMouseEnter={() => {
                setActiveItem(item);
                playOrganicSynth('drop');
              }}
              // Məhsulun yerində sakitcə dalğalanması (Idle Animation)
              animate={{
                y: [0, -5, 0],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                delay: item.delay,
                ease: "easeInOut"
              }}
              whileHover={{ 
                scale: 1.25, 
                z: 60,
                filter: "drop-shadow(0 25px 30px rgba(16,83,19,0.2))"
              }}
            >
              {/* Zərif alt kölgə */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-12 h-3 bg-black/5 rounded-full blur-sm transition-transform group-hover/table:scale-90" />

              {/* Məhsul Qabı və İşığı */}
              <div className="relative w-20 h-20 md:w-24 md:h-24 rounded-full bg-white border border-emerald-50/80 shadow-md flex items-center justify-center group/item transition-colors duration-300 hover:border-emerald-300">
                <div className="absolute inset-1 rounded-full border border-dashed border-emerald-100/60 group-hover/item:border-emerald-400/60 transition-colors" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-transparent to-emerald-50/20 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                
                {/* Emoji İkon */}
                <span className="text-4xl md:text-5xl select-none drop-shadow-md z-10 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-6">
                  {item.icon}
                </span>

                {/* Aktiv Məhsul Parıltısı */}
                {isActive && (
                  <motion.div 
                    layoutId="sparkle" 
                    className="absolute -top-1.5 -right-1.5 text-amber-500 z-30"
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


        {/* Zəngin Tooltip detalları */}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="absolute bottom-6 left-6 right-6 z-30 bg-white/95 backdrop-blur-xl border border-emerald-100/90 rounded-[2rem] p-5 shadow-2xl flex items-center gap-4"
              style={{ transformStyle: "preserve-3d", translateZ: 80 }}
            >
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-50 to-lime-50 border border-emerald-100 flex items-center justify-center text-3xl shadow-inner shrink-0">
                {activeItem.icon}
              </div>
              <div className="flex-1 text-left">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className="font-black text-slate-800 text-base">{activeItem.name}</h4>
                  <span className="bg-emerald-100/80 text-emerald-800 font-extrabold text-[9px] px-2.5 py-1 rounded-full uppercase tracking-wider shadow-sm">
                    {activeItem.benefit}
                  </span>
                </div>
                <p className="text-xs text-slate-500 font-medium mt-1 leading-relaxed">
                  {activeItem.desc}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Təlimat paneli */}
      <AnimatePresence>
        {!activeItem && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }} 
            animate={{ opacity: 1, y: 0 }} 
            exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-6 left-6 right-6 z-10 text-center"
          >
            <div className="inline-flex items-center gap-2.5 bg-white/90 backdrop-blur-md rounded-2xl px-5 py-3 border border-emerald-100 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-800 tracking-tight">
                Məhsulların üzərinə gələrək onların faydalarını kəşf edin
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};



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
