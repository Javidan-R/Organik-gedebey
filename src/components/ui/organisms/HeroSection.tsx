"use client";

import React, { useRef, useState, useEffect, useMemo } from "react";
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
  ShoppingBag, ArrowRight, Clock, Award, Droplets,
 Heart, Sparkle, Play,
  Cherry, Milk, Egg, Wheat,
  MapPin, Users, Flame, Plus, ChevronLeft, ChevronRight, Check
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useApp } from "@/lib/store";
import { getFirstImageUrl, getProductBasePrice, formatCurrency } from "@/utils/product";
import { finalPrice } from "@/lib/calc";
import { Product } from "@/types/products";
import type { Product as ProductType } from "@/types/products";
import type { StorefrontConfig } from "@/lib/types"; // ⚠️ tipi idxal edin (əgər fərqli yerdədirsə, uyğunlaşdırın)

/* ══════════════════════════════════════════════════════════════════
   AUDIO ENGINE
══════════════════════════════════════════════════════════════════ */
const playOrganicSynth = (type: "drop" | "breeze" | "click" | "success") => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (type === "drop") {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "sine";
      osc.frequency.setValueAtTime(400, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.08, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.12);
      osc.start(); osc.stop(ctx.currentTime + 0.13);
    } else if (type === "breeze") {
      const bufferSize = ctx.sampleRate * 0.2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buffer;
      const filter = ctx.createBiquadFilter(); filter.type = "bandpass"; filter.frequency.value = 1000; filter.Q.value = 1.5;
      const gain = ctx.createGain(); gain.gain.setValueAtTime(0.04, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
      noise.connect(filter); filter.connect(gain); gain.connect(ctx.destination); noise.start();
    } else if (type === "click") {
      const osc = ctx.createOscillator(); const gain = ctx.createGain();
      osc.connect(gain); gain.connect(ctx.destination);
      osc.type = "triangle"; osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime); gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
      osc.start(); osc.stop(ctx.currentTime + 0.06);
    } else if (type === "success") {
      [523, 659, 784].forEach((freq, i) => {
        const osc = ctx.createOscillator(); const gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.type = "sine"; osc.frequency.value = freq;
        const t = ctx.currentTime + i * 0.1;
        gain.gain.setValueAtTime(0.06, t); gain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);
        osc.start(t); osc.stop(t + 0.21);
      });
    }
  } catch (_) { /* silent fail */ }
};

/* ══════════════════════════════════════════════════════════════════
   TƏHLÜKƏSİZ ŞƏKİL URL-I
══════════════════════════════════════════════════════════════════ */
const safeImageUrl = (url: string | undefined | null): string => {
  if (!url) return '/placeholder.jpg';
  try {
    new URL(url);
    return url;
  } catch {
    return url.startsWith('/') ? url : '/placeholder.jpg';
  }
};

/* ══════════════════════════════════════════════════════════════════
   EMOJI UTILITY (category.name istifadə)
══════════════════════════════════════════════════════════════════ */
const EMOJI_PATTERNS: Array<{ patterns: string[]; emoji: string; priority?: number }> = [
  { patterns: ["bal", "honey", "arı", "bee"], emoji: "🍯", priority: 10 },
  { patterns: ["süd", "milk", "kefir", "ayran"], emoji: "🥛", priority: 10 },
  { patterns: ["pendir", "cheese", "mozzarella"], emoji: "🧀", priority: 10 },
  { patterns: ["yağ", "butter", "kərə yağı"], emoji: "🧈", priority: 10 },
  { patterns: ["qatıq", "yogurt", "yoghurt"], emoji: "🥣", priority: 10 },
  { patterns: ["yumurta", "egg"], emoji: "🥚", priority: 10 },
  { patterns: ["alma", "apple"], emoji: "🍎", priority: 9 },
  { patterns: ["armud", "pear"], emoji: "🍐", priority: 9 },
  { patterns: ["nar", "pomegranate"], emoji: "🍎", priority: 9 },
  { patterns: ["üzüm", "grape"], emoji: "🍇", priority: 9 },
  { patterns: ["çiyələk", "strawberry"], emoji: "🍓", priority: 9 },
  { patterns: ["moruq", "raspberry"], emoji: "🍓", priority: 9 },
  { patterns: ["qarpız", "watermelon"], emoji: "🍉", priority: 9 },
  { patterns: ["şaftalı", "peach"], emoji: "🍑", priority: 9 },
  { patterns: ["albalı", "cherry"], emoji: "🍒", priority: 9 },
  { patterns: ["pomidor", "tomato"], emoji: "🍅", priority: 9 },
  { patterns: ["xiyar", "cucumber"], emoji: "🥒", priority: 9 },
  { patterns: ["kartof", "potato"], emoji: "🥔", priority: 9 },
  { patterns: ["soğan", "onion"], emoji: "🧅", priority: 9 },
  { patterns: ["sarımsaq", "garlic"], emoji: "🧄", priority: 9 },
  { patterns: ["bibər", "pepper"], emoji: "🫑", priority: 9 },
  { patterns: ["kələm", "cabbage"], emoji: "🥬", priority: 9 },
  { patterns: ["lobya", "bean"], emoji: "🫘", priority: 9 },
  { patterns: ["çörək", "bread", "un", "flour", "buğda", "wheat"], emoji: "🌾", priority: 8 },
  { patterns: ["meyvə", "fruit"], emoji: "🍎", priority: 5 },
  { patterns: ["tərəvəz", "vegetable"], emoji: "🥬", priority: 5 },
  { patterns: ["taxıl", "grain"], emoji: "🌾", priority: 5 },
];

const CATEGORY_FALLBACK: Record<string, string> = {
  meyvə: "🍎", tərəvəz: "🥬", süd: "🥛", bal: "🍯", taxıl: "🌾", default: "🥬",
};

export function getProductEmoji(product: ProductType): string {
  const name = product.name?.toLowerCase() ?? "";
  // category obyekt olduğu üçün .name ilə işləyirik
  const categoryName = product.category?.name?.toLowerCase() || "";
  const matches: { emoji: string; priority: number }[] = [];
  for (const rule of EMOJI_PATTERNS) {
    const priority = rule.priority ?? 10;
    for (const pattern of rule.patterns) {
      if (name.includes(pattern.toLowerCase())) {
        matches.push({ emoji: rule.emoji, priority });
        break;
      }
    }
  }
  if (matches.length > 0) {
    matches.sort((a, b) => b.priority - a.priority);
    return matches[0]?.emoji ?? "🥬";
  }
  for (const [catKey, emoji] of Object.entries(CATEGORY_FALLBACK)) {
    if (categoryName.includes(catKey)) return emoji;
  }
  return "🥬";
}

/* ══════════════════════════════════════════════════════════════════
   BENEFIT MAP
══════════════════════════════════════════════════════════════════ */
const BENEFIT_MAP: Record<string, string> = {
  "🍯": "Antioksidant zəngini", "🥛": "Kalsium mənbəyi", "🧀": "Probiotik zəngin",
  "🧈": "A,D,E vitaminləri", "🥣": "Bağırsaq dostu", "🥚": "Yüksək protein",
  "🍎": "Vitamin C deposu", "🍐": "Lif zəngin", "🍇": "Rezveratrol", "🍓": "Antioksidant",
  "🍑": "Beta-karoten", "🍒": "Dəmir mənbəyi", "🍉": "Likopin zəngin", "🍅": "A vitamini",
  "🥒": "Hidrasiya verən", "🥔": "Kalium mənbəyi", "🧅": "İmmunitet gücü",
  "🧄": "Antibakterial", "🫑": "Vitamin C", "🥬": "Folat zəngin", "🫘": "Bitki zülalı",
  "🌾": "Lifli tərkib", default: "Tam təbii",
};

function getBenefit(emoji: string): string {
  return BENEFIT_MAP[emoji] ?? BENEFIT_MAP.default;
}

/* ══════════════════════════════════════════════════════════════════
   TABLE ITEMS (vizual animasiyalı süfrə)
══════════════════════════════════════════════════════════════════ */
const TABLE_ITEMS = [
  { id: "honey",  name: "Gədəbəy Balı",   icon: "🍯", desc: "1500m yüksəklikdə saf süzmə bal",      benefit: "Antioksidant zəngini", x: "42%", y: "38%", delay: 0 },
  { id: "cheese", name: "Kənd Pendiri",    icon: "🧀", desc: "Tam yağlı dağ inəyi südündən",          benefit: "Kalsium mənbəyi",      x: "14%", y: "22%", delay: 0.4 },
  { id: "eggs",   name: "Kənd Yumurtası", icon: "🥚", desc: "Təbii yemlənmiş toyuqlardan günlük",    benefit: "Yüksək protein",       x: "18%", y: "60%", delay: 0.8 },
  { id: "apple",  name: "Söyüdlü Alması", icon: "🍎", desc: "Dərmansız, sulu və şirin dağ alması",   benefit: "Vitamin C deposu",     x: "66%", y: "18%", delay: 1.2 },
  { id: "wheat",  name: "Kürə Çörəyi",    icon: "🌾", desc: "Təbii maya ilə odun sobasında",         benefit: "Lifli tərkib",         x: "70%", y: "58%", delay: 1.6 },
  { id: "butter", name: "Nəhrə Yağı",     icon: "🧈", desc: "Gündəlik çalınan xalis kənd yağı",     benefit: "A, D, E vitaminləri",  x: "46%", y: "12%", delay: 2.0 },
  { id: "grape",  name: "Gədəbəy Üzümü", icon: "🍇", desc: "Dağ yamacında yetişən şirin üzüm",      benefit: "Rezveratrol zəngin",   x: "78%", y: "36%", delay: 2.4 },
  { id: "tomato", name: "Bağça Pomidoru", icon: "🍅", desc: "Gübrəsiz açıq havada yetişdirilir",     benefit: "Likopin zəngin",       x: "30%", y: "72%", delay: 2.8 },
  { id: "yogurt", name: "Ev Qatığı",      icon: "🥣", desc: "Gün ərzindəki sağlam kənd qatığı",     benefit: "Probiotik zəngin",     x: "60%", y: "74%", delay: 3.2 },
];

/* ══════════════════════════════════════════════════════════════════
   STEAM, BEES, DUST, MOUNTAIN, TIMELINE
══════════════════════════════════════════════════════════════════ */
const SteamParticle = ({ x, delay }: { x: string; delay: number }) => (
  <motion.div
    className="absolute pointer-events-none select-none"
    style={{ left: x, bottom: "100%" }}
    initial={{ opacity: 0, y: 0, scaleX: 1 }}
    animate={{ opacity: [0, 0.35, 0.2, 0], y: -28, scaleX: [1, 1.4, 0.8, 1.2] }}
    transition={{ duration: 2.2, delay, repeat: Infinity, ease: "easeOut" }}
  >
    <div className="w-1.5 h-4 bg-gradient-to-t from-white/40 to-transparent rounded-full blur-[2px]" />
  </motion.div>
);

const FlyingBee = ({ startX, startY, idx }: { startX: string; startY: string; idx: number }) => (
  <motion.div
    className="absolute z-30 pointer-events-none select-none text-xl"
    style={{ left: startX, top: startY }}
    animate={{
      x: [0, 40, -30, 60, -20, 0],
      y: [0, -25, 10, -40, 5, 0],
      rotate: [0, 15, -10, 20, -5, 0],
    }}
    transition={{ duration: 8 + idx * 2, repeat: Infinity, ease: "easeInOut", delay: idx * 1.5 }}
  >
    🐝
  </motion.div>
);

const DustParticles = () => (
  <div className="absolute inset-0 pointer-events-none overflow-hidden z-0">
    {Array.from({ length: 18 }).map((_, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full"
        style={{
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          width: `${1 + Math.random() * 3}px`,
          height: `${1 + Math.random() * 3}px`,
          background: i % 3 === 0 ? "rgba(16,83,19,0.15)" : i % 3 === 1 ? "rgba(245,158,11,0.12)" : "rgba(99,102,241,0.08)",
        }}
        animate={{
          y: [0, -15, 8, -10, 0],
          x: [0, 8, -5, 12, 0],
          opacity: [0, 0.7, 0.4, 0.6, 0],
          scale: [0.8, 1.2, 0.9, 1.1, 0.8],
        }}
        transition={{ duration: 4 + i * 0.7, repeat: Infinity, delay: i * 0.4, ease: "easeInOut" }}
      />
    ))}
  </div>
);

const MountainBg = ({ scrollY }: { scrollY: any }) => {
  const y1 = useTransform(scrollY, [0, 1], ["0%", "8%"]);
  const y2 = useTransform(scrollY, [0, 1], ["0%", "14%"]);
  return (
    <motion.div style={{ y: y1 }} className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.04] z-0">
      <svg viewBox="0 0 1200 400" className="absolute bottom-0 w-full" preserveAspectRatio="none">
        <motion.path style={{ y: y2 }} d="M0,400 L0,250 L100,180 L250,220 L350,120 L500,200 L600,80 L750,180 L900,100 L1050,170 L1150,90 L1200,150 L1200,400 Z"
          fill="url(#mtn1)" />
        <path d="M0,400 L0,300 L150,240 L300,280 L450,200 L600,260 L750,190 L900,240 L1050,200 L1200,230 L1200,400 Z" fill="url(#mtn2)" />
        <defs>
          <linearGradient id="mtn1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#065f46" /><stop offset="100%" stopColor="#d1fae5" /></linearGradient>
          <linearGradient id="mtn2" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#10b981" /><stop offset="100%" stopColor="#a7f3d0" /></linearGradient>
        </defs>
      </svg>
    </motion.div>
  );
};

const TIMELINE = [
  { time: "05:30", label: "Arı yuvası", icon: "🐝", color: "amber" },
  { time: "06:15", label: "Sağım", icon: "🐄", color: "sky" },
  { time: "07:00", label: "Yığım", icon: "🌿", color: "emerald" },
  { time: "08:30", label: "Çeşidləmə", icon: "📦", color: "lime" },
  { time: "10:00", label: "Çatdırılma", icon: "🚚", color: "slate" },
];

const HarvestTimeline = () => {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setActiveStep(s => (s + 1) % TIMELINE.length), 1800);
    return () => clearInterval(id);
  }, []);

  const currentStep = TIMELINE[activeStep] ?? TIMELINE[0];

  return (
    <div className="mt-6 w-full bg-white/80 backdrop-blur-md rounded-2xl border border-emerald-100 p-3 shadow-md">
      <p className="text-[9px] font-black uppercase tracking-widest text-emerald-700 mb-2.5 flex items-center gap-1.5">
        <Clock className="w-3 h-3" /> Günün Yığım Xətti
      </p>
      <div className="flex items-center gap-0">
        {TIMELINE.map((step, i) => (
          <React.Fragment key={i}>
            <motion.div
              className="flex flex-col items-center gap-1 cursor-pointer"
              onClick={() => setActiveStep(i)}
              whileHover={{ scale: 1.08 }}
            >
              <motion.div
                animate={{ scale: activeStep === i ? 1.3 : 1, opacity: activeStep === i ? 1 : 0.45 }}
                className={`w-8 h-8 rounded-xl flex items-center justify-center text-base shadow-sm transition-all ${activeStep === i ? "bg-emerald-100 ring-2 ring-emerald-400 ring-offset-1" : "bg-slate-50"}`}
              >
                {step.icon}
              </motion.div>
              <span className={`text-[8px] font-black transition-colors ${activeStep === i ? "text-emerald-700" : "text-slate-400"}`}>{step.time}</span>
            </motion.div>
            {i < TIMELINE.length - 1 && (
              <motion.div
                className="flex-1 h-0.5 mx-0.5 rounded-full"
                animate={{ background: i < activeStep ? "#10b981" : "#e2e8f0" }}
              />
            )}
          </React.Fragment>
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.p key={activeStep} initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }}
          className="text-[9px] text-center text-slate-500 font-bold mt-2">
          {currentStep?.icon} {currentStep?.label} — {currentStep?.time}
        </motion.p>
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   DAY/NIGHT, WEATHER, LIVE BAR
══════════════════════════════════════════════════════════════════ */
const DayNightToggle = ({ isDark, onToggle }: { isDark: boolean; onToggle: () => void }) => (
  <motion.button
    onClick={onToggle}
    whileHover={{ scale: 1.1 }}
    whileTap={{ scale: 0.9 }}
    className={`relative w-14 h-7 rounded-full border transition-colors shadow-inner ${isDark ? "bg-slate-800 border-slate-700" : "bg-amber-100 border-amber-200"}`}
  >
    <motion.div
      animate={{ x: isDark ? 28 : 2 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      className={`absolute top-0.5 w-6 h-6 rounded-full flex items-center justify-center shadow-md text-sm ${isDark ? "bg-slate-900" : "bg-white"}`}
    >
      {isDark ? "🌙" : "☀️"}
    </motion.div>
  </motion.button>
);

const WeatherWidget = () => {
  const [tempC] = useState(18);
  const [humidity] = useState(72);
  return (
    <div className="flex items-center gap-2 bg-white/70 backdrop-blur-sm rounded-2xl px-3 py-2 border border-sky-100 shadow-sm">
      <span className="text-lg">⛅</span>
      <div>
        <p className="text-[10px] font-black text-slate-700">Gədəbəy, {tempC}°C</p>
        <p className="text-[8px] text-slate-400 font-bold">Rütubət {humidity}% · Yığım üçün ideal</p>
      </div>
    </div>
  );
};

const LiveActivityBar = () => {
  const [count] = useState(() => Math.floor(Math.random() * 20) + 12);
  const [orders] = useState(() => Math.floor(Math.random() * 8) + 3);
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <div className="inline-flex items-center gap-1.5 bg-emerald-50 px-3 py-1.5 rounded-full border border-emerald-100">
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
        </span>
        <span className="text-[10px] font-black text-emerald-700 uppercase tracking-wider">Canlı</span>
      </div>
      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
        <Users className="w-3.5 h-3.5 text-emerald-500" /> {count} nəfər baxır
      </span>
      <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
        <ShoppingBag className="w-3.5 h-3.5 text-amber-500" /> {orders} sifariş bu saat
      </span>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   ORGANIC TABLE
══════════════════════════════════════════════════════════════════ */
const OrganicTable = ({ isDark }: { isDark: boolean }) => {
  const [activeItem, setActiveItem] = useState<typeof TABLE_ITEMS[0] | null>(null);
  const [gyroX, setGyroX] = useState(0);
  const [gyroY, setGyroY] = useState(0);

  const tableX = useMotionValue(0);
  const tableY = useMotionValue(0);
  const springX = useSpring(tableX, { stiffness: 55, damping: 22 });
  const springY = useSpring(tableY, { stiffness: 55, damping: 22 });
  const plateRotateX = useTransform(springY, [-200, 200], [14, -14]);
  const plateRotateY = useTransform(springX, [-200, 200], [-14, 14]);
  const shadowTX = useTransform(springX, [-200, 200], [22, -22]);
  const shadowTY = useTransform(springY, [-200, 200], [22, -22]);

  useEffect(() => {
    const handler = (e: DeviceOrientationEvent) => {
      setGyroX((e.gamma || 0) * 1.2);
      setGyroY((e.beta || 0) * 0.8);
    };
    window.addEventListener("deviceorientation", handler, true);
    return () => window.removeEventListener("deviceorientation", handler, true);
  }, []);

  useEffect(() => {
    tableX.set(gyroX);
    tableY.set(gyroY);
  }, [gyroX, gyroY]);

  const handleMouseMove = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    tableX.set(e.clientX - rect.left - rect.width / 2);
    tableY.set(e.clientY - rect.top - rect.height / 2);
  };
  const handleMouseLeave = () => { tableX.set(0); tableY.set(0); setActiveItem(null); };

  return (
    <div
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full aspect-square md:aspect-[4/3] flex items-center justify-center rounded-[3.5rem] overflow-hidden p-4 shadow-inner border cursor-none transition-colors duration-700 ${isDark ? "bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 border-emerald-900/40" : "bg-gradient-to-br from-emerald-50/70 via-lime-50/40 to-amber-50/50 border-emerald-100/40"} group/table`}
    >
      <DustParticles />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(253,250,230,0.85),transparent_75%)] pointer-events-none" />
      <motion.div className="absolute top-1/4 left-1/3 w-80 h-80 rounded-full blur-[90px] animate-pulse pointer-events-none"
        style={{ background: isDark ? "rgba(16,83,50,0.35)" : "rgba(167,243,208,0.25)" }} />
      <FlyingBee startX="12%" startY="20%" idx={0} />
      <FlyingBee startX="75%" startY="35%" idx={1} />
      <FlyingBee startX="55%" startY="8%" idx={2} />
      <motion.div style={{ x: shadowTX, y: shadowTY }}
        className="absolute w-[80%] h-[80%] bg-emerald-950/5 rounded-[4rem] blur-2xl pointer-events-none" />
      <motion.div style={{ rotateX: plateRotateX, rotateY: plateRotateY, transformStyle: "preserve-3d" }}
        className="relative w-full h-full flex items-center justify-center">
        <div className={`absolute w-[88%] h-[88%] rounded-[3.5rem] border overflow-hidden flex items-center justify-center transition-colors duration-700 ${isDark ? "bg-slate-800/90 border-emerald-800/30 shadow-[0_30px_70px_-15px_rgba(0,0,0,0.4)]" : "bg-white shadow-[0_30px_70px_-15px_rgba(16,83,19,0.12)] border-emerald-50/80"}`}>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(240,245,230,0.4)_1px,transparent_1px),linear-gradient(to_bottom,rgba(240,245,230,0.4)_1px,transparent_1px)] bg-[size:32px_32px] opacity-50" />
          <div className="w-[75%] h-[75%] rounded-full border border-dashed border-emerald-200/50 flex items-center justify-center opacity-80">
            <div className="w-[65%] h-[65%] rounded-full border border-dashed border-emerald-100/40" />
          </div>
        </div>
        {TABLE_ITEMS.map((item) => {
          const isActive = activeItem?.id === item.id;
          const isHot = ["🍯", "🧈", "🥣", "🌾"].includes(item.icon);
          return (
            <motion.div
              key={item.id}
              className="absolute z-20"
              style={{ left: item.x, top: item.y }}
              onMouseEnter={() => { setActiveItem(item); playOrganicSynth("drop"); }}
              animate={{ y: [0, -6, 0], rotate: [0, item.delay % 2 === 0 ? 2 : -2, 0] }}
              transition={{ duration: 4 + item.delay * 0.5, repeat: Infinity, delay: item.delay, ease: "easeInOut" }}
              whileHover={{ scale: 1.3, z: 70, filter: "drop-shadow(0 25px 30px rgba(16,83,19,0.25))" }}
            >
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-10 h-3 bg-black/8 rounded-full blur-sm" />
              {isHot && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 w-8 flex justify-around">
                  <SteamParticle x="20%" delay={0} />
                  <SteamParticle x="50%" delay={0.4} />
                  <SteamParticle x="80%" delay={0.8} />
                </div>
              )}
              <div className={`relative w-16 h-16 md:w-20 md:h-20 rounded-full border flex items-center justify-center group/item transition-colors duration-300 hover:border-emerald-300 shadow-md ${isDark ? "bg-slate-700 border-slate-600" : "bg-white border-emerald-50/80"}`}>
                <div className="absolute inset-1 rounded-full border border-dashed border-emerald-100/60 group-hover/item:border-emerald-400/60 transition-colors" />
                <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white via-transparent to-emerald-50/20 opacity-0 group-hover/item:opacity-100 transition-opacity" />
                <span className="text-3xl md:text-4xl select-none drop-shadow-md z-10 transition-transform duration-300 group-hover/item:scale-110 group-hover/item:rotate-6">
                  {item.icon}
                </span>
                {isActive && (
                  <>
                    <motion.div layoutId="ring"
                      className="absolute inset-0 rounded-full border-2 border-emerald-400"
                      animate={{ scale: [1, 1.25, 1], opacity: [1, 0.3, 1] }}
                      transition={{ repeat: Infinity, duration: 1.5 }} />
                    <motion.div layoutId="sparkle"
                      className="absolute -top-1 -right-1 text-amber-500 z-30"
                      animate={{ scale: [1, 1.3, 1], rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 2 }}>
                      <Sparkle size={16} fill="currentColor" />
                    </motion.div>
                  </>
                )}
              </div>
            </motion.div>
          );
        })}
        <AnimatePresence>
          {activeItem && (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 15, scale: 0.9 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className={`absolute bottom-5 left-5 right-5 z-30 backdrop-blur-xl border rounded-[2rem] p-4 shadow-2xl flex items-center gap-3 transition-colors ${isDark ? "bg-slate-800/95 border-emerald-800/60" : "bg-white/95 border-emerald-100/90"}`}
              style={{ transformStyle: "preserve-3d", translateZ: 90 }}
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-inner shrink-0 border ${isDark ? "bg-slate-700 border-slate-600" : "bg-gradient-to-br from-emerald-50 to-lime-50 border-emerald-100"}`}>
                {activeItem.icon}
              </div>
              <div className="flex-1 text-left min-w-0">
                <div className="flex items-center justify-between gap-2 flex-wrap">
                  <h4 className={`font-black text-sm ${isDark ? "text-white" : "text-slate-800"}`}>{activeItem.name}</h4>
                  <span className="bg-emerald-100/80 text-emerald-800 font-extrabold text-[8px] px-2 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
                    {activeItem.benefit}
                  </span>
                </div>
                <p className={`text-xs font-medium mt-0.5 leading-snug ${isDark ? "text-slate-400" : "text-slate-500"}`}>{activeItem.desc}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
      <AnimatePresence>
        {!activeItem && (
          <motion.div
            initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="absolute bottom-5 left-5 right-5 z-10 text-center pointer-events-none"
          >
            <div className="inline-flex items-center gap-2 bg-white/90 backdrop-blur-md rounded-2xl px-4 py-2.5 border border-emerald-100 shadow-lg">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
              </span>
              <span className="text-xs font-bold text-emerald-800 tracking-tight">Məhsulların üzərinə gəlin</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   PREMIUM SWIPE SLIDER (regionlar və harvest times dinamik)
══════════════════════════════════════════════════════════════════ */
function PremiumSwipeSlider({ products, isDark, config }: { products: Product[]; isDark: boolean; config: StorefrontConfig }) {
  const [idx, setIdx] = useState(0);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const addToCart = useApp((s) => s.addToCart);
  const activeDeals = products.filter((p) => !p.archived).slice(0, 8);

  const nextSlide = () => { playOrganicSynth("click"); setIdx((p) => (p + 1) % activeDeals.length); };
  const prevSlide = () => { playOrganicSynth("click"); setIdx((p) => (p - 1 + activeDeals.length) % activeDeals.length); };
  const handleDragEnd = (_: any, info: PanInfo) => { if (info.offset.x < -50) nextSlide(); else if (info.offset.x > 50) prevSlide(); };

  if (!activeDeals.length) return null;
  const cur = activeDeals[idx];
  if (!cur) return null;

  const emoji = getProductEmoji(cur);
  const benefit = getBenefit(emoji);
  const curPrice = finalPrice(getProductBasePrice(cur), cur.discountType, cur.discountValue);
  const basePrice = getProductBasePrice(cur);
  const discountPct = Math.round(Math.max(0, (1 - curPrice / basePrice) * 100));

  const HARVEST_TIMES = config.heroHarvestTimes || ["Sübh 05:30", "Səhər 06:15", "Günorta 07:00", "Axşamüstü 14:00", "Sübh 04:45", "Səhər 07:30", "Günorta 08:00", "Axşam 16:00"];
  const REGIONS = config.heroRegions || ["Söyüdlü, Gədəbəy", "Qarı, Gədəbəy", "Şəmkir Dağları", "Gəncə Düzənliyi", "Kəpəz Yamacı", "Murovdağ", "Ağstafa", "Tovuz"];
  const harvestTime = HARVEST_TIMES[idx % HARVEST_TIMES.length];
  const region = REGIONS[idx % REGIONS.length];

  const handleAddToCart = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(cur.id, cur.variants?.[0]?.id, 1);
    playOrganicSynth("success");
    setAddedId(cur.id);
    setTimeout(() => setAddedId(null), 1800);
  };

  const toggleWishlist = (e: React.MouseEvent) => {
    e.stopPropagation();
    setWishlist((prev) => {
      const next = new Set(prev);
      next.has(cur.id) ? next.delete(cur.id) : next.add(cur.id);
      return next;
    });
    playOrganicSynth("drop");
  };

  return (
    <div className="w-full max-w-sm mx-auto mt-6 relative px-1">
      <div className="flex items-center justify-between mb-3 px-1">
        <span className="flex items-center gap-1.5 text-xs font-black text-emerald-800 uppercase tracking-wider">
          <Flame className="w-3.5 h-3.5 text-red-500 animate-bounce" /> {config?.heroSliderTitle || "Günün Dağ Sürprizi"}
        </span>
        <div className="flex gap-1">
          <button onClick={prevSlide} className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-700 shadow-sm transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={nextSlide} className="w-7 h-7 rounded-full bg-white border border-slate-100 flex items-center justify-center hover:bg-slate-50 text-slate-700 shadow-sm transition-colors">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key={idx}
          initial={{ opacity: 0, x: 30, scale: 0.97 }}
          animate={{ opacity: 1, x: 0, scale: 1 }}
          exit={{ opacity: 0, x: -30, scale: 0.97 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className={`relative overflow-hidden rounded-3xl border p-4 shadow-xl transition-colors ${isDark ? "bg-slate-800 border-emerald-900/50" : "bg-white border-emerald-100"}`}
        >
          {discountPct > 0 && (
            <div className="absolute top-0 left-0 bg-gradient-to-r from-red-500 to-orange-500 text-white text-[9px] font-black px-3 py-1 rounded-br-2xl shadow-sm">
              -{discountPct}% ENDİRİM
            </div>
          )}
          <motion.div
            drag="x"
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.25}
            onDragEnd={handleDragEnd}
            className="flex gap-4 cursor-grab active:cursor-grabbing"
            whileTap={{ scale: 0.98 }}
          >
            <div className="relative w-[90px] h-[90px] rounded-2xl overflow-hidden bg-slate-50 shrink-0 border border-slate-100 shadow-inner">
              <Image src={safeImageUrl(getFirstImageUrl(cur))} alt={cur.name} fill className="object-cover pointer-events-none" />
            </div>
            <div className="flex-1 min-w-0 flex flex-col justify-between text-left">
              <div>
                <p className={`text-sm font-black leading-snug truncate ${isDark ? "text-white" : "text-slate-800"}`}>{cur.name}</p>
                <div className="flex items-center gap-1.5 text-[9px] font-black text-slate-400 uppercase tracking-wider mt-1 flex-wrap">
                  <Clock className="w-3 h-3 text-emerald-500" /> <span>{harvestTime}</span>
                  <span className="w-1 h-1 rounded-full bg-slate-300" />
                  <MapPin className="w-3 h-3 text-lime-500" /> <span>{region}</span>
                </div>
                <span className="inline-block mt-1.5 bg-emerald-100 text-emerald-800 text-[8px] font-black px-2 py-0.5 rounded-full">
                  {emoji} {benefit}
                </span>
              </div>
              <div className="flex items-end justify-between mt-1.5">
                <div>
                  {discountPct > 0 && <p className="text-xs line-through text-slate-400 font-bold leading-none">{formatCurrency(basePrice)}</p>}
                  <p className="text-lg font-black text-emerald-700 leading-none">{formatCurrency(curPrice)}</p>
                </div>
                <div className="flex items-center gap-1.5">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.85 }}
                    onClick={toggleWishlist}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center border transition-colors ${wishlist.has(cur.id) ? "bg-red-50 border-red-200 text-red-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}
                  >
                    <Heart className="w-4 h-4" fill={wishlist.has(cur.id) ? "currentColor" : "none"} />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={handleAddToCart}
                    className={`w-9 h-9 rounded-2xl flex items-center justify-center shadow-lg transition-all ${addedId === cur.id ? "bg-emerald-500 shadow-emerald-400/30" : "bg-slate-900 hover:bg-emerald-600 hover:shadow-emerald-500/20"} text-white`}
                  >
                    <AnimatePresence mode="wait">
                      {addedId === cur.id
                        ? <motion.div key="check" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Check className="w-4 h-4" /></motion.div>
                        : <motion.div key="plus" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }}><Plus className="w-4 h-4" /></motion.div>
                      }
                    </AnimatePresence>
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
          <div className="mt-3 pt-3 border-t border-slate-50">
            <div className="flex items-center justify-between text-[9px] font-bold text-slate-500 mb-1">
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
        </motion.div>
      </AnimatePresence>
      <div className="flex justify-center gap-1.5 mt-3">
        {activeDeals.map((_, i) => (
          <button key={i} onClick={() => setIdx(i)}
            className={`h-1.5 rounded-full transition-all ${i === idx ? "w-6 bg-emerald-600" : "w-1.5 bg-slate-200"}`} />
        ))}
      </div>
      {config.heroTimelineEnabled !== false && <HarvestTimeline />}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   BADGE
══════════════════════════════════════════════════════════════════ */
const OrganicBadge = ({ icon: Icon, label, color, index }: { icon: any; label: string; color: string; index: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ delay: 0.4 + index * 0.1 }}
    whileHover={{ scale: 1.06 }}
    className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-black border border-white/50 shadow-sm cursor-default select-none ${color}`}
  >
    <Icon size={14} />
    <span>{label}</span>
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════
   HERO CONTENT — TAM DİNAMİK
══════════════════════════════════════════════════════════════════ */
const HeroContent = ({ isDark, onToggleDark, config }: { isDark: boolean; onToggleDark: () => void; config: StorefrontConfig }) => {
  const [mounted, setMounted] = useState(false);
  const [greeting, setGreeting] = useState({ emoji: "☀️", text: "Xoş gördük!" });

  useEffect(() => {
    setMounted(true);
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 12) setGreeting({ emoji: "🌅", text: "Sabahınız xeyir!" });
    else if (hour >= 12 && hour < 18) setGreeting({ emoji: "☀️", text: "Günortanız xeyir!" });
    else setGreeting({ emoji: "🌙", text: "Axşamınız xeyir!" });
  }, []);

  // Dinamik mətnlər
  const siteTitle = config.siteTitle || "Organik Gədəbəy";
  const heroTitle = config.heroTitle || "Hər Süfrədə Dağ Nəfəsi";
  const heroSubtitle = config.heroSubtitle || "Gədəbəyin zəngin bulaqlarından bəhrələnən, heç bir sənaye qatqısı olmadan hazırlanan";
  const heroSubtitleHighlight = config.heroSubtitleHighlight || "100% təbii nemətlər";
  const heroButtonText = config.heroButtonText || "MAĞAZAYA KEÇ";
  const heroButtonLink = config.heroButtonLink || "/products";
  const heroSecondaryText = config.heroSecondaryText || "Ferma Hekayəmiz";
  const heroSecondaryLink = config.heroSecondaryLink || "/fresh-today";
  const brandTagline = config.headerTopBar?.tagline || "Gədəbəy & Gəncə ailə təsərrüfatları";
  const trustBadges = config.trustBadges || [
    { icon: "🌿", title: "100% Bio", description: "Laboratoriya təsdiqli" },
    { icon: "🚚", title: "Təzə Çatdırılma", description: "Soyuduculu avtomobillə" },
    { icon: "🏆", title: "Mükafatlı", description: "Ən Yaxşı Kənd Məhsulu 2024" },
    { icon: "🔄", title: "Qaytarma Zəmanəti", description: "Razı deyilsinizsə, 100% geri" },
  ];

  // Başlığın iki hissəyə ayrılması
  const words = heroTitle.trim().split(/\s+/);
  let mainPart = "";
  let highlightPart = "";
  if (words.length >= 3) {
    mainPart = words.slice(0, -2).join(" ");
    highlightPart = words.slice(-2).join(" ");
  } else if (words.length === 2) {
    mainPart = words[0];
    highlightPart = words[1];
  } else {
    highlightPart = words[0] || "";
  }

  return (
    <div className="flex flex-col gap-6 md:gap-7 max-w-xl text-left">
      {/* Top row */}
      <div className="flex items-start justify-between gap-3 flex-wrap">
        {mounted && <LiveActivityBar />}
        <DayNightToggle isDark={isDark} onToggle={onToggleDark} />
      </div>
      {mounted && config.heroWeatherEnabled !== false && <WeatherWidget />}

      {/* Brand badge */}
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: "spring", stiffness: 200 }}
        className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white rounded-2xl px-4 py-2 shadow-md shadow-emerald-900/10 w-fit">
        <Leaf className="w-4 h-4 text-lime-300 animate-pulse" />
        <span className="text-[10px] font-black tracking-widest uppercase">{brandTagline}</span>
        <Award className="w-4 h-4 text-amber-300" />
      </motion.div>

      {/* Title */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="space-y-2">
        <h1 className={`text-5xl md:text-6xl lg:text-7xl font-black leading-[1.05] tracking-tighter ${isDark ? "text-white" : "text-slate-900"}`}>
          {mainPart}{" "}
          {highlightPart && (
            <span className="relative inline-block text-emerald-500 italic">
              {highlightPart}
              <motion.svg viewBox="0 0 300 20" className="absolute -bottom-2 left-0 w-full h-3 text-lime-400/80"
                initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ delay: 0.8, duration: 1.2 }}>
                <path d="M5 15 Q 150 5 295 15" fill="none" stroke="currentColor" strokeWidth="6" strokeLinecap="round" />
              </motion.svg>
            </span>
          )}
        </h1>
        <p className="text-lg font-bold text-emerald-600">{siteTitle}</p>
      </motion.div>

      {/* Body text */}
      <motion.p initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className={`text-base md:text-lg leading-relaxed font-medium ${isDark ? "text-slate-300" : "text-slate-600"}`}>
        {heroSubtitle}{" "}
        <span className={`font-bold border-b-2 border-lime-300 pb-0.5 ${isDark ? "text-white" : "text-slate-900"}`}>
          {heroSubtitleHighlight}
        </span>{" "}
        indi birbaşa kənd həyətindən süfrənizə gəlir.
      </motion.p>

      {/* CTA Buttons */}
      <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="flex flex-wrap items-center gap-4">
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href={heroButtonLink} className="group inline-flex items-center gap-3 bg-slate-900 text-white font-black text-sm rounded-[1.75rem] px-8 py-5 shadow-xl shadow-slate-900/15 hover:bg-emerald-600 hover:shadow-emerald-600/20 transition-all duration-300">
            <ShoppingBag className="w-4 h-4" /> {heroButtonText} <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
          </Link>
        </motion.div>
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
          <Link href={heroSecondaryLink} className="inline-flex items-center gap-2.5 bg-white border-2 border-slate-100 text-slate-800 font-black text-sm rounded-[1.75rem] px-7 py-5 hover:bg-slate-50 transition-all shadow-sm">
            <Play size={16} className="text-emerald-500" fill="currentColor" /> {heroSecondaryText}
          </Link>
        </motion.div>
      </motion.div>

      {/* Category badges */}
      <div className="space-y-3">
        <h3 className="text-xs font-black uppercase tracking-widest text-slate-400">Təbii Kateqoriyalarımız</h3>
        <div className="flex flex-wrap gap-2.5">
          {[
            { icon: Droplets, label: "Təbii Bal", color: "bg-amber-50 text-amber-600" },
            { icon: Leaf, label: "Tərəvəzlər", color: "bg-emerald-50 text-emerald-600" },
            { icon: Milk, label: "Süd Məhsulları", color: "bg-sky-50 text-sky-600" },
            { icon: Cherry, label: "Meyvələr", color: "bg-rose-50 text-rose-600" },
            { icon: Egg, label: "Yumurta", color: "bg-yellow-50 text-yellow-600" },
            { icon: Wheat, label: "Taxıl", color: "bg-lime-50 text-lime-700" },
          ].map((item, i) => (
            <OrganicBadge key={item.label} icon={item.icon} label={item.label} color={item.color} index={i + 1} />
          ))}
        </div>
      </div>

      {/* Trust badges */}
      <div className={`grid grid-cols-2 gap-4 pt-6 border-t ${isDark ? "border-slate-700" : "border-slate-100"}`}>
        {trustBadges.map((badge, i) => (
          <div key={i} className="flex gap-3 items-start">
            <div className="p-2.5 bg-emerald-50 rounded-2xl text-emerald-600 shrink-0">
              <span className="text-xl">{badge.icon}</span>
            </div>
            <div>
              <p className={`text-sm font-black ${isDark ? "text-white" : "text-slate-800"}`}>{badge.title}</p>
              <p className="text-xs text-slate-400 font-bold leading-none mt-0.5">{badge.description}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ══════════════════════════════════════════════════════════════════
   FLOATING LEAVES
══════════════════════════════════════════════════════════════════ */
const FloatingLeaves = ({ backgroundY }: { backgroundY: any }) => (
  <motion.div style={{ y: backgroundY }} className="absolute inset-0 overflow-hidden pointer-events-none z-1">
    {Array.from({ length: 10 }).map((_, i) => (
      <motion.div
        key={i}
        initial={{ y: -60, opacity: 0, rotate: 0 }}
        animate={{ y: "110vh", opacity: [0, 0.35, 0.2, 0], rotate: [0, 90, 180, 270, 360] }}
        transition={{ duration: 14 + i * 3, delay: i * 1.8, repeat: Infinity, ease: "linear" }}
        style={{ position: "absolute", left: `${8 + i * 9}%`, top: 0, zIndex: 1 }}
        className="text-emerald-500/10 text-3xl select-none"
      >
        {["🍃", "🌿", "🍀", "🌱"][i % 4]}
      </motion.div>
    ))}
  </motion.div>
);

/* ══════════════════════════════════════════════════════════════════
   MAIN HERO SECTION
══════════════════════════════════════════════════════════════════ */
export function HeroSection() {
  const heroRef = useRef<HTMLDivElement>(null);
  const products = useApp((s) => s.products) || [];
  const storefrontConfig = useApp((s) => s.storefrontConfig);
  const [isDark, setIsDark] = useState(false);

  const { scrollYProgress } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const backgroundY = useTransform(scrollYProgress, [0, 1], ["0%", "15%"]);

  // Default config fallback
  const config = useMemo(() => storefrontConfig || {
    heroTableEnabled: true,
    heroSliderEnabled: true,
    heroTimelineEnabled: true,
    heroLiveActivityEnabled: true,
    heroWeatherEnabled: true,
    heroTitle: "Hər Süfrədə Dağ Nəfəsi",
    heroSubtitle: "Gədəbəyin zəngin bulaqlarından bəhrələnən, heç bir sənaye qatqısı olmadan hazırlanan",
    heroSubtitleHighlight: "100% təbii nemətlər",
    heroButtonText: "MAĞAZAYA KEÇ",
    heroButtonLink: "/products",
    heroSecondaryText: "Ferma Hekayəmiz",
    heroSecondaryLink: "/fresh-today",
    siteTitle: "Organik Gədəbəy",
    headerTopBar: { tagline: "Gədəbəy & Gəncə ailə təsərrüfatları", location: "", hours: "" },
    trustBadges: [
      { icon: "🌿", title: "100% Bio", description: "Laboratoriya təsdiqli" },
      { icon: "🚚", title: "Təzə Çatdırılma", description: "Soyuduculu avtomobillə" },
      { icon: "🏆", title: "Mükafatlı", description: "Ən Yaxşı Kənd Məhsulu 2024" },
      { icon: "🔄", title: "Qaytarma Zəmanəti", description: "Razı deyilsinizsə, 100% geri" },
    ],
  } as StorefrontConfig, [storefrontConfig]);

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden rounded-[3.5rem] min-h-[750px] flex items-center py-16 md:py-24 transition-colors duration-700 ${isDark
        ? "bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950"
        : "bg-gradient-to-br from-[#FAF9F5] via-white to-[#F2FAF4]"
      }`}
    >
      <MountainBg scrollY={scrollYProgress} />
      <FloatingLeaves backgroundY={backgroundY} />
      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          <div className="lg:col-span-6 z-20">
            <HeroContent isDark={isDark} onToggleDark={() => setIsDark((d) => !d)} config={config} />
          </div>
          <div className="lg:col-span-6 flex flex-col items-center z-10 w-full">
            {config.heroTableEnabled !== false && (
              <div className="relative w-full max-w-lg md:max-w-xl">
                <div className="absolute -inset-4 bg-gradient-to-br from-emerald-200/20 via-lime-200/10 to-amber-200/20 rounded-[4rem] blur-3xl -z-10 animate-pulse pointer-events-none" />
                <OrganicTable isDark={isDark} />
              </div>
            )}
            {config.heroSliderEnabled !== false && <PremiumSwipeSlider products={products} isDark={isDark} config={config} />}
          </div>
        </div>
      </div>
    </section>
  );
}