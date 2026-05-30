"use client";

/**
 * HeroSlider — Cinematic Premium Edition · v3
 *
 * Yeniliklər:
 * - Məhsul olmadıqda: 3 Gədəbəy dağ mənzərəsi SVG art slider
 * - Məhsul şəkli: tam görünür, daha böyük, daha estetik
 * - Seçilmiş məhsul kartı: aydın, miqyaslanmış, haşiyəli
 * - Desktop sağ panel: tam overflow-hidden, parallax-like image
 * - Daha yaxşı product thumbnail strip
 */

import { finalPrice } from "@/lib/calc";
import {
  getProductBasePrice,
  getFirstImageUrl,
  formatCurrency,
} from "@/utils/storefront_home";
import {
  Flame, Timer, Star, Zap, ArrowRight, Leaf,
  ShoppingBag, ChevronLeft, ChevronRight, MapPin,
  ShieldCheck, Truck, Sparkles, Clock, BadgePercent,
  TrendingUp, Eye, Heart, Minus, Plus, Users, Mountain,
  Wind, Droplets, Sun,
} from "lucide-react";
import Link from "next/link";
import {
  useRef, useState, useEffect, useMemo,
  useCallback,
} from "react";
import Image from "next/image";
import {
  motion, AnimatePresence, useMotionValue,
  useSpring,
} from "framer-motion";
import { Product } from "@/types/products";
import { useApp } from "@/lib/store";

/* ══════════════════════════════════════════════════════════════════
   HELPERS
══════════════════════════════════════════════════════════════════ */
function getDiscountPct(p: Product): number {
  const base = getProductBasePrice(p);
  const price = finalPrice(base, p.discountType, p.discountValue);
  if (base <= 0 || price >= base) return 0;
  return Math.round((1 - price / base) * 100);
}

function useCountdownParts() {
  const [parts, setParts] = useState({ h: "00", m: "00", s: "00" });
  useEffect(() => {
    const tick = () => {
      const now = new Date();
      const eod = new Date(now);
      eod.setHours(23, 59, 59, 999);
      const diff = Math.max(0, eod.getTime() - now.getTime());
      const h = String(Math.floor(diff / 3_600_000)).padStart(2, "0");
      const m = String(Math.floor((diff % 3_600_000) / 60_000)).padStart(2, "0");
      const s = String(Math.floor((diff % 60_000) / 1_000)).padStart(2, "0");
      setParts({ h, m, s });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);
  return parts;
}

function AnimatedPrice({ value }: { value: number }) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, { stiffness: 200, damping: 28 });
  const [display, setDisplay] = useState(value);
  useEffect(() => { mv.set(value); }, [value, mv]);
  useEffect(() => spring.on("change", (v) => setDisplay(Math.round(v * 100) / 100)), [spring]);
  return <>{formatCurrency(display)}</>;
}

function StockBar({ stock, max = 20 }: { stock: number; max?: number }) {
  const pct = Math.min(100, (stock / max) * 100);
  const color = pct <= 20 ? "bg-red-500" : pct <= 50 ? "bg-orange-400" : "bg-emerald-500";
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className={pct <= 20 ? "text-red-600" : "text-slate-500"}>
          {pct <= 20 ? `⚡ Son ${stock} ədəd qaldı!` : `Stok: ${stock} ədəd`}
        </span>
        <span className="text-slate-400">{Math.round(pct)}%</span>
      </div>
      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          className={`h-full rounded-full ${color}`}
        />
      </div>
    </div>
  );
}

function CountBox({ val, label }: { val: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <AnimatePresence mode="wait">
        <motion.div
          key={val}
          initial={{ y: -8, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 8, opacity: 0 }}
          transition={{ duration: 0.18 }}
          className="min-w-[34px] h-9 flex items-center justify-center
            bg-emerald-900 text-yellow-300 font-black text-base rounded-lg
            tabular-nums shadow-inner"
        >
          {val}
        </motion.div>
      </AnimatePresence>
      <span className="text-[8px] font-bold text-emerald-800 mt-0.5 uppercase tracking-wider">
        {label}
      </span>
    </div>
  );
}

function QtySelector({ qty, onMinus, onPlus, max }: {
  qty: number; onMinus: () => void; onPlus: () => void; max: number;
}) {
  return (
    <div className="flex items-center gap-0 bg-white border border-emerald-200
      rounded-xl overflow-hidden shadow-sm">
      <button onClick={onMinus} disabled={qty <= 1}
        className="w-9 h-9 flex items-center justify-center text-emerald-700
          hover:bg-emerald-50 disabled:opacity-40 transition-colors">
        <Minus className="w-3.5 h-3.5" />
      </button>
      <span className="min-w-[28px] text-center text-sm font-black text-emerald-900">{qty}</span>
      <button onClick={onPlus} disabled={qty >= max}
        className="w-9 h-9 flex items-center justify-center text-emerald-700
          hover:bg-emerald-50 disabled:opacity-40 transition-colors">
        <Plus className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

function SlideDots({ total, current, progress, onDotClick }: {
  total: number; current: number; progress: number; onDotClick: (i: number) => void;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }).map((_, i) => (
        <button key={i} onClick={() => onDotClick(i)}
          className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
            i === current ? "w-10 bg-emerald-100" : "w-1.5 bg-slate-200 hover:bg-slate-300"
          }`}>
          {i === current && (
            <motion.div
              className="absolute inset-y-0 left-0 bg-emerald-600 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ ease: "linear", duration: 0.05 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   GƏDƏBƏY LANDSCAPE ART — SVG Scenes
   Məhsul olmadıqda göstərilən gözəl dağ mənzərələri
══════════════════════════════════════════════════════════════════ */

/** Scene 1: Dağ zirvəsi + meşə */
const LandscapeMountain = () => (
  <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="lm-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#5BA3D4" />
        <stop offset="60%" stopColor="#A8D8EF" />
        <stop offset="100%" stopColor="#D4EFFF" />
      </linearGradient>
      <linearGradient id="lm-mfar" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#7BA7A0" />
        <stop offset="100%" stopColor="#4E8B82" />
      </linearGradient>
      <linearGradient id="lm-mmid" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#3D7A52" />
        <stop offset="100%" stopColor="#2A6140" />
      </linearGradient>
      <linearGradient id="lm-mfore" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1E5C35" />
        <stop offset="100%" stopColor="#0F3D22" />
      </linearGradient>
      <linearGradient id="lm-ground" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#4CAF70" />
        <stop offset="100%" stopColor="#2D7A48" />
      </linearGradient>
      <filter id="lm-blur">
        <feGaussianBlur stdDeviation="1.5" />
      </filter>
      <radialGradient id="lm-sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFF3A3" stopOpacity="1" />
        <stop offset="60%" stopColor="#FFE44D" stopOpacity="0.7" />
        <stop offset="100%" stopColor="#FFE44D" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Sky */}
    <rect fill="url(#lm-sky)" width="900" height="600" />
    {/* Sun glow */}
    <circle cx="680" cy="90" r="70" fill="url(#lm-sun)" opacity="0.7" />
    <circle cx="680" cy="90" r="28" fill="#FFF5B0" />
    {/* Clouds */}
    <ellipse cx="200" cy="80" rx="100" ry="32" fill="white" opacity="0.7" />
    <ellipse cx="250" cy="68" rx="70" ry="25" fill="white" opacity="0.8" />
    <ellipse cx="550" cy="100" rx="80" ry="26" fill="white" opacity="0.6" />
    <ellipse cx="600" cy="88" rx="55" ry="20" fill="white" opacity="0.7" />
    {/* Far mountains */}
    <path d="M0 340 L120 180 L230 290 L350 150 L470 260 L580 170 L700 280 L820 160 L900 240 L900 600 L0 600Z"
      fill="url(#lm-mfar)" filter="url(#lm-blur)" opacity="0.75" />
    {/* Snow caps far */}
    <path d="M350 150 L390 185 L340 192 L310 178Z" fill="white" opacity="0.7" />
    <path d="M580 170 L610 198 L565 205 L545 190Z" fill="white" opacity="0.6" />
    {/* Mid mountains */}
    <path d="M0 420 L80 280 L160 350 L260 220 L380 320 L460 240 L560 330 L660 250 L760 340 L860 260 L900 310 L900 600 L0 600Z"
      fill="url(#lm-mmid)" />
    {/* Foreground ridge */}
    <path d="M0 480 L100 370 L200 430 L320 360 L420 420 L530 355 L640 415 L750 370 L860 410 L900 385 L900 600 L0 600Z"
      fill="url(#lm-mfore)" />
    {/* Trees on ridge */}
    {[60, 120, 175, 230, 300, 360, 430, 490, 555, 615, 680, 740, 800, 855].map((x, i) => {
      const h = 28 + (i % 3) * 8;
      const y = 395 + (i % 4) * 7 - h;
      return (
        <g key={x}>
          <polygon points={`${x},${y} ${x - 10},${y + h} ${x + 10},${y + h}`}
            fill={i % 2 === 0 ? "#0D3B22" : "#164D2E"} />
          <polygon points={`${x},${y + 5} ${x - 7},${y + h - 5} ${x + 7},${y + h - 5}`}
            fill={i % 2 === 0 ? "#0F4528" : "#1A5C34"} />
        </g>
      );
    })}
    {/* Ground meadow */}
    <path d="M0 540 Q225 500 450 520 Q675 540 900 510 L900 600 L0 600Z"
      fill="url(#lm-ground)" />
    {/* Wildflowers */}
    {[80, 160, 250, 340, 430, 510, 600, 690, 780, 850].map((x, i) => (
      <circle key={x} cx={x + (i % 3) * 8} cy={545 + (i % 4) * 5}
        r="3" fill={i % 3 === 0 ? "#FFE44D" : i % 3 === 1 ? "#FF6B8A" : "#FFFFFF"} opacity="0.8" />
    ))}
    {/* River/stream */}
    <path d="M320 600 Q360 555 380 530 Q400 510 430 540 Q450 560 460 600"
      fill="none" stroke="#A8D8EF" strokeWidth="3" opacity="0.6" />
  </svg>
);

/** Scene 2: Üzümlük / bağ mənzərəsi */
const LandscapeOrchard = () => (
  <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="lo-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#E8F5E9" />
        <stop offset="100%" stopColor="#C8E6C9" />
      </linearGradient>
      <linearGradient id="lo-hill" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#66BB6A" />
        <stop offset="100%" stopColor="#388E3C" />
      </linearGradient>
      <linearGradient id="lo-field" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#A5D6A7" />
        <stop offset="100%" stopColor="#81C784" />
      </linearGradient>
      <radialGradient id="lo-glow" cx="50%" cy="30%" r="60%">
        <stop offset="0%" stopColor="#FFFDE7" stopOpacity="0.5" />
        <stop offset="100%" stopColor="#FFFDE7" stopOpacity="0" />
      </radialGradient>
    </defs>
    <rect fill="url(#lo-sky)" width="900" height="600" />
    <rect fill="url(#lo-glow)" width="900" height="600" />
    {/* Distant hills */}
    <path d="M0 300 Q200 200 450 260 Q650 220 900 280 L900 600 L0 600Z"
      fill="#81C784" opacity="0.5" />
    <path d="M0 380 Q150 300 300 350 Q500 300 700 360 Q800 380 900 350 L900 600 L0 600Z"
      fill="url(#lo-hill)" />
    {/* Orchard trees */}
    {[60, 150, 240, 330, 420, 510, 600, 690, 780, 860].map((x, i) => {
      const y = 340 + (i % 3) * 12;
      const r = 28 + (i % 2) * 8;
      const shade = i % 2 === 0 ? "#2E7D32" : "#388E3C";
      return (
        <g key={x}>
          <rect x={x - 3} y={y + r - 4} width="6" height={20} fill="#5D4037" />
          <circle cx={x} cy={y} r={r} fill={shade} />
          <circle cx={x - 8} cy={y - 5} r={r * 0.6} fill={i % 3 === 0 ? "#43A047" : "#2E7D32"} opacity="0.7" />
          {/* Fruits */}
          {i % 2 === 0 && [[-10, 5], [8, -8], [15, 10], [-5, 18]].map(([dx, dy], j) => (
            <circle key={j} cx={x + dx} cy={y + dy} r="4"
              fill={i % 3 === 0 ? "#FF7043" : "#E91E63"} opacity="0.85" />
          ))}
        </g>
      );
    })}
    {/* Ground */}
    <rect y="460" width="900" height="140" fill="url(#lo-field)" />
    {/* Rows / field lines */}
    {[0, 1, 2, 3, 4].map(row => (
      <path key={row}
        d={`M0 ${480 + row * 16} Q450 ${470 + row * 16} 900 ${480 + row * 16}`}
        fill="none" stroke="#66BB6A" strokeWidth="1.5" opacity="0.4" />
    ))}
    {/* Farmhouse */}
    <rect x="380" y="390" width="80" height="55" fill="#EFEBE9" />
    <polygon points="370,390 460,390 415,355" fill="#BF360C" />
    <rect x="398" y="415" width="16" height="30" fill="#6D4C41" />
    <rect x="388" y="400" width="14" height="12" rx="1" fill="#90CAF9" />
    <rect x="424" y="400" width="14" height="12" rx="1" fill="#90CAF9" />
    {/* Chimney smoke */}
    <path d="M420 352 C418 340, 422 328, 420 316" fill="none"
      stroke="white" strokeWidth="2" opacity="0.5" strokeLinecap="round" />
  </svg>
);

/** Scene 3: Çay + günbatımı mənzərəsi */
const LandscapeSunset = () => (
  <svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"
    className="w-full h-full" preserveAspectRatio="xMidYMid slice">
    <defs>
      <linearGradient id="ls-sky" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FF8F00" />
        <stop offset="35%" stopColor="#FFCA28" />
        <stop offset="70%" stopColor="#FFF59D" />
        <stop offset="100%" stopColor="#E8F5E9" />
      </linearGradient>
      <linearGradient id="ls-mtn" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#1B5E20" />
        <stop offset="100%" stopColor="#0A2E10" />
      </linearGradient>
      <linearGradient id="ls-water" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0%" stopColor="#FFE082" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#81D4FA" stopOpacity="0.6" />
        <stop offset="100%" stopColor="#4FC3F7" stopOpacity="0.9" />
      </linearGradient>
      <radialGradient id="ls-sun" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#FFFF00" />
        <stop offset="40%" stopColor="#FF8F00" stopOpacity="0.9" />
        <stop offset="100%" stopColor="#FF8F00" stopOpacity="0" />
      </radialGradient>
    </defs>
    {/* Sky */}
    <rect fill="url(#ls-sky)" width="900" height="600" />
    {/* Sun on horizon */}
    <circle cx="450" cy="310" r="80" fill="url(#ls-sun)" opacity="0.85" />
    <circle cx="450" cy="310" r="32" fill="#FFEE58" />
    {/* Sun rays */}
    {Array.from({ length: 12 }).map((_, i) => {
      const angle = (i * 30) * Math.PI / 180;
      const r1 = 38, r2 = 65;
      return (
        <line key={i}
          x1={450 + Math.cos(angle) * r1} y1={310 + Math.sin(angle) * r1}
          x2={450 + Math.cos(angle) * r2} y2={310 + Math.sin(angle) * r2}
          stroke="#FFD54F" strokeWidth="2.5" opacity="0.6" />
      );
    })}
    {/* Clouds silhouette */}
    <ellipse cx="180" cy="180" rx="120" ry="35" fill="#FF8F00" opacity="0.3" />
    <ellipse cx="730" cy="200" rx="100" ry="30" fill="#FF8F00" opacity="0.25" />
    {/* Mountains silhouette */}
    <path d="M0 380 L80 250 L180 320 L280 200 L380 290 L450 310 L520 290 L620 200 L720 320 L820 250 L900 310 L900 600 L0 600Z"
      fill="url(#ls-mtn)" />
    {/* Reflection water */}
    <path d="M200 490 Q450 460 700 490 L700 600 L200 600Z"
      fill="url(#ls-water)" />
    {/* Water shimmer lines */}
    {[0, 1, 2, 3, 4, 5].map(i => (
      <path key={i}
        d={`M${250 + i * 20} ${510 + i * 8} Q${450} ${500 + i * 8} ${650 - i * 20} ${510 + i * 8}`}
        fill="none" stroke="white" strokeWidth="1" opacity={0.15 + i * 0.05} />
    ))}
    {/* Foreground meadow */}
    <path d="M0 530 Q200 510 400 525 Q600 540 900 520 L900 600 L0 600Z"
      fill="#2E7D32" />
    {/* Trees silhouette left */}
    {[30, 80, 130].map((x, i) => (
      <g key={x}>
        <rect x={x - 3} y={470 - i * 10} width="6" height="60" fill="#1B5E20" />
        <ellipse cx={x} cy={470 - i * 10} rx={18 + i * 4} ry={25 + i * 5} fill="#1B5E20" />
      </g>
    ))}
    {/* Trees silhouette right */}
    {[770, 820, 870].map((x, i) => (
      <g key={x}>
        <rect x={x - 3} y={475 - i * 8} width="6" height="55" fill="#1B5E20" />
        <ellipse cx={x} cy={475 - i * 8} rx={16 + i * 3} ry={22 + i * 4} fill="#1B5E20" />
      </g>
    ))}
  </svg>
);

/* ══════════════════════════════════════════════════════════════════
   LANDSCAPE SLIDES DATA
══════════════════════════════════════════════════════════════════ */
const LANDSCAPE_SLIDES = [
  {
    id: "lm",
    Scene: LandscapeMountain,
    title: "Gədəbəy Dağları",
    subtitle: "Dəniz səviyyəsindən 2000m yüksəklikdə təmiz hava, saf su, ən dadlı məhsullar",
    badge: "⛰️ Dağ kəndi",
    badgeColor: "bg-emerald-800/80 text-white",
    stats: [
      { icon: <Mountain className="w-3.5 h-3.5" />, label: "2000m+ hündürlük" },
      { icon: <Droplets className="w-3.5 h-3.5" />, label: "Bulaq suyu" },
      { icon: <Wind className="w-3.5 h-3.5" />, label: "Təmiz hava" },
    ],
    cta: { href: "/category/gedebey", label: "Gədəbəy məhsulları" },
    gradient: "from-emerald-900/85 via-emerald-900/40 to-transparent",
  },
  {
    id: "lo",
    Scene: LandscapeOrchard,
    title: "Ailə Bağları",
    subtitle: "Nəsildən nəslə ötürülən ənənəvi becərmə üsulları ilə yetişdirilmiş meyvə və tərəvəzlər",
    badge: "🌱 Üzvi bağlar",
    badgeColor: "bg-lime-700/80 text-white",
    stats: [
      { icon: <Leaf className="w-3.5 h-3.5" />, label: "100% üzvi" },
      { icon: <ShieldCheck className="w-3.5 h-3.5" />, label: "Sertifikatlı" },
      { icon: <Heart className="w-3.5 h-3.5 fill-current" />, label: "Ailə təsərrüfatı" },
    ],
    cta: { href: "/products?tag=organic", label: "Üzvi məhsullar" },
    gradient: "from-lime-900/80 via-lime-900/35 to-transparent",
  },
  {
    id: "ls",
    Scene: LandscapeSunset,
    title: "Torpaqdan Süfrəyə",
    subtitle: "Hər gün sübh çağı dərilən, eyni gün evinizə çatan kənd dadı — tamamilə təbii",
    badge: "🌅 Günlük çatdırılma",
    badgeColor: "bg-amber-700/80 text-white",
    stats: [
      { icon: <Sun className="w-3.5 h-3.5" />, label: "Hər gün təzə" },
      { icon: <Truck className="w-3.5 h-3.5" />, label: "Eyni gün çatdırılma" },
      { icon: <Sparkles className="w-3.5 h-3.5" />, label: "Dadamlı həyat" },
    ],
    cta: { href: "/fresh-today", label: "Bu gün nə var?" },
    gradient: "from-amber-900/80 via-amber-900/35 to-transparent",
  },
];

/* ══════════════════════════════════════════════════════════════════
   LANDSCAPE SLIDER — məhsul olmadıqda göstərilir
══════════════════════════════════════════════════════════════════ */
const LANDSCAPE_DURATION = 6_000;

function LandscapeSlider() {
  const [idx, setIdx] = useState(0);
  const [direction, setDirection] = useState(1);
  const [progress, setProgress] = useState(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());
  const [paused, setPaused] = useState(false);

  const slides = LANDSCAPE_SLIDES;
  const cur = slides[idx];

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setProgress(0);
    startRef.current = Date.now();
    if (paused) return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min((elapsed / LANDSCAPE_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearTimer();
        setDirection(1);
        setIdx((c) => (c + 1) % slides.length);
      }
    }, 50);
  }, [paused, slides.length]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [idx, paused, startTimer]);

  const goTo = (i: number) => {
    setDirection(i > idx ? 1 : -1);
    setIdx(i);
  };

  const imgVariants = {
    enter: (d: number) => ({ x: d > 0 ? "6%" : "-6%", opacity: 0, scale: 1.06 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-6%" : "6%", opacity: 0, scale: 0.97 }),
  };

  const textVariants = {
    enter: (d: number) => ({ x: d > 0 ? 40 : -40, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -30 : 30, opacity: 0 }),
  };

  return (
    <div
      className="relative w-full select-none overflow-hidden rounded-2xl md:rounded-3xl
        shadow-[0_8px_40px_rgba(5,31,10,0.12)]"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Landscape images */}
      <div className="relative aspect-[4/3] md:aspect-auto md:min-h-[420px] lg:min-h-[480px] overflow-hidden">
        <AnimatePresence initial={false} custom={direction} mode="wait">
          <motion.div
            key={cur.id}
            custom={direction}
            variants={imgVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="absolute inset-0"
          >
            <cur.Scene />
            {/* Gradient overlay for text readability */}
            <div className={`absolute inset-0 bg-gradient-to-t ${cur.gradient}`} />
          </motion.div>
        </AnimatePresence>

        {/* Content overlay */}
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={`text-${cur.id}`}
            custom={direction}
            variants={textVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1], delay: 0.08 }}
            className="absolute inset-0 flex flex-col justify-end p-5 md:p-8 z-10"
          >
            {/* Badge */}
            <span className={`inline-flex items-center gap-1.5 self-start text-[11px] font-black
              px-3 py-1.5 rounded-full mb-3 backdrop-blur-sm ${cur.badgeColor}`}>
              {cur.badge}
            </span>

            {/* Title */}
            <h2 className="text-2xl md:text-3xl lg:text-4xl font-black text-white
              leading-tight mb-2 drop-shadow-lg">
              {cur.title}
            </h2>

            {/* Subtitle */}
            <p className="text-sm md:text-base text-white/85 leading-relaxed mb-4 max-w-md drop-shadow">
              {cur.subtitle}
            </p>

            {/* Stats row */}
            <div className="flex items-center gap-3 mb-4 flex-wrap">
              {cur.stats.map((s) => (
                <div key={s.label}
                  className="flex items-center gap-1.5 text-white text-[11px] font-bold
                    bg-white/15 backdrop-blur-sm rounded-full px-3 py-1.5">
                  {s.icon}
                  {s.label}
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="flex items-center gap-3">
              <Link
                href={cur.cta.href}
                className="inline-flex items-center gap-2 bg-yellow-400 text-emerald-900
                  font-black text-sm rounded-2xl px-5 py-3 hover:bg-yellow-300
                  active:scale-95 transition-all shadow-xl shadow-yellow-400/30"
              >
                <ShoppingBag className="w-4 h-4" />
                {cur.cta.label}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link
                href="/products"
                className="inline-flex items-center gap-1.5 text-white/90 font-bold text-sm
                  hover:text-white transition-colors"
              >
                Hamısı <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav arrows */}
        <button onClick={() => goTo((idx - 1 + slides.length) % slides.length)}
          className="absolute left-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full
            bg-white/20 backdrop-blur hover:bg-white/35 shadow-lg
            flex items-center justify-center active:scale-90 transition-all">
          <ChevronLeft className="w-4 h-4 text-white" />
        </button>
        <button onClick={() => goTo((idx + 1) % slides.length)}
          className="absolute right-3 top-1/2 -translate-y-1/2 z-20 w-9 h-9 rounded-full
            bg-white/20 backdrop-blur hover:bg-white/35 shadow-lg
            flex items-center justify-center active:scale-90 transition-all">
          <ChevronRight className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Bottom dots */}
      <div className="absolute bottom-5 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
        {slides.map((s, i) => (
          <button key={s.id} onClick={() => goTo(i)}
            className={`relative h-1.5 rounded-full overflow-hidden transition-all duration-300 ${
              i === idx ? "w-12 bg-white/40" : "w-2 bg-white/30 hover:bg-white/50"
            }`}>
            {i === idx && (
              <motion.div className="absolute inset-y-0 left-0 bg-white rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.05 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   MAIN SLIDER
══════════════════════════════════════════════════════════════════ */
interface HeroSliderProps {
  highlighted: Product | null;
  allProducts?: Product[];
}

const SLIDE_DURATION = 5_500;

export default function HeroSlider({ highlighted, allProducts = [] }: HeroSliderProps) {
  const addToCart = useApp((s) => s.addToCart);
  const countdown = useCountdownParts();

  const [idx, setIdx] = useState(0);
  const [paused, setPaused] = useState(false);
  const [progress, setProgress] = useState(0);
  const [direction, setDirection] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  const [qty, setQty] = useState(1);
  const [wishlist, setWishlist] = useState<Set<string>>(new Set());
  const [liveViewers] = useState(() => Math.floor(Math.random() * 12) + 4);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef(Date.now());

  const products = useMemo(() => {
    const arr = (allProducts ?? []).filter((p) => !p.archived);
    const discounted = arr
      .filter((p) => getDiscountPct(p) > 0)
      .sort((a, b) => getDiscountPct(b) - getDiscountPct(a))
      .slice(0, 6);
    if (discounted.length >= 2) return discounted;
    const fallback = arr.slice(0, 6);
    if (fallback.length > 0) return fallback;
    return highlighted ? [highlighted] : [];
  }, [allProducts, highlighted]);

  const cur = products[idx] ?? null;
  const basePrice = cur ? getProductBasePrice(cur) : 0;
  const price = cur ? finalPrice(basePrice, cur.discountType, cur.discountValue) : 0;
  const discount = cur ? getDiscountPct(cur) : 0;
  const stock = cur?.variants?.[0]?.stock ?? 0;
  const isLowStock = stock > 0 && stock <= 8;
  const isFlashDeal = discount >= 10;

  useEffect(() => { setQty(1); setImgLoaded(false); }, [idx]);

  const toggleWishlist = useCallback((id: string) => {
    setWishlist((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  }, []);

  const clearTimer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
  };

  const startTimer = useCallback(() => {
    clearTimer();
    setProgress(0);
    startRef.current = Date.now();
    if (paused || products.length <= 1) return;
    timerRef.current = setInterval(() => {
      const elapsed = Date.now() - startRef.current;
      const p = Math.min((elapsed / SLIDE_DURATION) * 100, 100);
      setProgress(p);
      if (p >= 100) {
        clearTimer();
        setDirection(1);
        setIdx((c) => (c + 1) % products.length);
      }
    }, 50);
  }, [paused, products.length]);

  useEffect(() => {
    startTimer();
    return clearTimer;
  }, [idx, paused, startTimer]);

  const go = (next: number, dir: number) => {
    setDirection(dir);
    setIdx(((next % products.length) + products.length) % products.length);
  };

  const goNext = () => go(idx + 1, 1);
  const goPrev = () => go(idx - 1, -1);
  const goTo = (i: number) => go(i, i > idx ? 1 : -1);

  const imgVariants = {
    enter: (d: number) => ({ x: d > 0 ? "6%" : "-6%", opacity: 0, scale: 1.06 }),
    center: { x: 0, opacity: 1, scale: 1 },
    exit: (d: number) => ({ x: d > 0 ? "-5%" : "5%", opacity: 0, scale: 0.97 }),
  };

  const infoVariants = {
    enter: (d: number) => ({ x: d > 0 ? 32 : -32, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -32 : 32, opacity: 0 }),
  };

  /* ─── Məhsul yoxdursa: Gədəbəy mənzərə slider ─── */
  if (products.length === 0) {
    return <LandscapeSlider />;
  }

  return (
    <div
      className="relative w-full select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      {/* Flash Deal Banner */}
      {isFlashDeal && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center justify-between gap-2 mb-3
            bg-gradient-to-r from-yellow-400 via-amber-400 to-yellow-300
            rounded-2xl px-4 py-2.5 shadow-lg shadow-yellow-400/30"
        >
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 bg-red-500 rounded-full px-2.5 py-1">
              <motion.span animate={{ scale: [1, 1.2, 1] }}
                transition={{ repeat: Infinity, duration: 0.8 }}>
                <Flame className="w-3 h-3 text-white" />
              </motion.span>
              <span className="text-[10px] font-black text-white tracking-wide">FLASH DEAL</span>
            </div>
            <span className="text-emerald-900 text-xs font-bold hidden sm:block">
              {products.filter((p) => getDiscountPct(p) > 0).length} məhsulda
              <span className="text-red-700 font-black"> -{discount}%</span> endirim
            </span>
          </div>
          <div className="flex items-end gap-1.5">
            <Clock className="w-3.5 h-3.5 text-emerald-800 mb-1 shrink-0" />
            <CountBox val={countdown.h} label="saat" />
            <span className="text-emerald-900 font-black text-base mb-2.5 leading-none">:</span>
            <CountBox val={countdown.m} label="dəq" />
            <span className="text-emerald-900 font-black text-base mb-2.5 leading-none">:</span>
            <CountBox val={countdown.s} label="san" />
          </div>
        </motion.div>
      )}

      {/* Main Card */}
      <div className="relative overflow-hidden rounded-2xl md:rounded-3xl
        bg-gradient-to-br from-[#FAFAF5] via-white to-[#F0FDF4]
        border border-emerald-100/80 shadow-[0_8px_40px_rgba(5,31,10,0.10)]">

        {/* ── MOBILE LAYOUT ── */}
        <div className="md:hidden">
          {/* Full-width product image — IMPROVED */}
          <div className="relative w-full aspect-[16/13] overflow-hidden bg-gradient-to-br
            from-emerald-50 via-white to-yellow-50">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={idx}
                custom={direction}
                variants={imgVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0"
              >
                {cur && (
                  <>
                    {!imgLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br
                        from-emerald-50 via-white to-yellow-50 animate-pulse" />
                    )}
                    <Image
                      key={cur.id}
                      src={getFirstImageUrl(cur)}
                      alt={cur.name}
                      fill
                      priority
                      className={`object-contain p-4 transition-opacity duration-500
                        ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                      sizes="100vw"
                      onLoad={() => setImgLoaded(true)}
                    />
                    {/* Soft bottom gradient */}
                    <div className="absolute inset-0 bg-gradient-to-t
                      from-slate-900/70 via-slate-900/20 to-transparent" />
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Top badges */}
            <div className="absolute top-3 left-3 flex flex-col gap-1.5 z-10">
              <motion.div key={`fresh-${idx}`}
                initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                transition={{ delay: 0.15 }}
                className="flex items-center gap-1 bg-white/95 backdrop-blur rounded-full
                  px-2.5 py-1 text-[10px] font-black text-emerald-800 shadow-lg">
                <Leaf className="w-3 h-3 text-emerald-600" /> TƏZƏ
              </motion.div>
              {discount > 0 && (
                <motion.div key={`disc-${idx}`}
                  initial={{ x: -16, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
                  transition={{ delay: 0.22 }}
                  className="flex items-center gap-1 bg-yellow-400 rounded-full
                    px-2.5 py-1 text-[10px] font-black text-emerald-900 shadow-lg">
                  <Zap className="w-3 h-3" /> -{discount}%
                </motion.div>
              )}
            </div>

            {/* Wishlist button */}
            {cur && (
              <motion.button whileTap={{ scale: 0.9 }}
                onClick={() => toggleWishlist(cur.id)}
                className="absolute top-3 right-3 z-10 w-9 h-9 rounded-full
                  bg-white/90 backdrop-blur shadow-lg
                  flex items-center justify-center transition-all">
                <Heart className={`w-4 h-4 transition-colors ${
                  wishlist.has(cur.id) ? "fill-red-500 text-red-500" : "text-slate-400"
                }`} />
              </motion.button>
            )}

            {/* Nav arrows */}
            {products.length > 1 && (
              <>
                <button onClick={goPrev}
                  className="absolute left-2 top-1/2 -translate-y-1/2 z-10
                    w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-lg
                    flex items-center justify-center active:scale-90 transition-all">
                  <ChevronLeft className="w-4 h-4 text-emerald-900" />
                </button>
                <button onClick={goNext}
                  className="absolute right-2 top-1/2 -translate-y-1/2 z-10
                    w-8 h-8 rounded-full bg-white/90 backdrop-blur shadow-lg
                    flex items-center justify-center active:scale-90 transition-all">
                  <ChevronRight className="w-4 h-4 text-emerald-900" />
                </button>
              </>
            )}

            {/* Bottom overlay */}
            <AnimatePresence mode="wait">
              {cur && (
                <motion.div
                  key={`overlay-${idx}`}
                  initial={{ y: 16, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -8, opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  className="absolute bottom-0 left-0 right-0 z-10 p-4"
                >
                  <div className="flex items-center gap-1.5 mb-1.5">
                    <MapPin className="w-3 h-3 text-yellow-300" />
                    <span className="text-yellow-300 text-[10px] font-black tracking-wide">
                      {cur.originRegion || "GƏDƏBƏY"}
                    </span>
                    <span className="ml-auto flex items-center gap-1
                      bg-white/10 backdrop-blur-sm rounded-full px-2 py-0.5">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full
                          rounded-full bg-yellow-300 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-yellow-300" />
                      </span>
                      <span className="text-white text-[9px] font-bold">{liveViewers} baxır</span>
                    </span>
                  </div>
                  <p className="text-white font-black text-xl leading-tight mb-2">{cur.name}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-baseline gap-2">
                      <span className="text-yellow-300 font-black text-2xl leading-none">
                        <AnimatedPrice value={price} />
                      </span>
                      {discount > 0 && (
                        <span className="text-white/50 text-sm line-through">
                          {formatCurrency(basePrice)}
                        </span>
                      )}
                    </div>
                    <Link
                      href={`/product/${cur.slug || cur.id}`}
                      className="flex items-center gap-1.5 bg-yellow-400 text-emerald-900
                        font-black text-xs rounded-xl px-3.5 py-2.5
                        active:scale-95 transition-all shadow-xl"
                    >
                      <Eye className="w-3.5 h-3.5" /> Bax
                    </Link>
                  </div>
                  {isLowStock && <div className="mt-2.5"><StockBar stock={stock} /></div>}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom CTA bar */}
          <div className="p-3 flex items-center justify-between gap-3
            border-t border-emerald-50 bg-white">
            <SlideDots total={products.length} current={idx} progress={progress} onDotClick={goTo} />
            {cur && (
              <div className="flex items-center gap-2">
                <QtySelector
                  qty={qty}
                  onMinus={() => setQty((q) => Math.max(1, q - 1))}
                  onPlus={() => setQty((q) => Math.min(stock || 99, q + 1))}
                  max={stock || 99}
                />
                <motion.button whileTap={{ scale: 0.95 }}
                  onClick={() => addToCart(cur.id, cur.variants?.[0]?.id, qty)}
                  className="flex items-center gap-1.5 bg-yellow-400 text-emerald-900
                    font-black text-xs rounded-xl px-4 py-2.5 shadow-lg
                    active:scale-95 transition-all shrink-0">
                  <ShoppingBag className="w-3.5 h-3.5" /> Səbət
                </motion.button>
              </div>
            )}
          </div>
        </div>

        {/* ── DESKTOP LAYOUT ── */}
        <div className="hidden md:grid md:grid-cols-[1fr,1.15fr] min-h-[400px] lg:min-h-[460px]">

          {/* LEFT — Info panel */}
          <div className="relative flex flex-col justify-between p-8 lg:p-10
            border-r border-emerald-50/80 overflow-hidden bg-white/80">

            {/* Decorative blobs */}
            <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full
              bg-yellow-300/15 blur-3xl pointer-events-none" />
            <div className="absolute -top-8 -right-8 w-36 h-36 rounded-full
              bg-emerald-100/50 blur-2xl pointer-events-none" />

            {/* Thumbnail strip — IMPROVED: açıq seçilmiş görünüş */}
            {products.length > 1 && (
              <div className="flex items-center gap-2 mb-6 overflow-x-auto scrollbar-hide pb-0.5">
                {products.map((p, i) => {
                  const active = i === idx;
                  return (
                    <motion.button
                      key={p.id}
                      whileHover={{ y: -2, scale: 1.04 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => goTo(i)}
                      className={`relative flex-shrink-0 rounded-xl overflow-hidden
                        transition-all duration-300 ${
                        active
                          ? "ring-3 ring-emerald-600 ring-offset-2 w-16 h-16 shadow-lg shadow-emerald-600/20"
                          : "w-11 h-11 opacity-55 hover:opacity-85 ring-1 ring-slate-100"
                      }`}
                    >
                      <Image
                        src={getFirstImageUrl(p)}
                        alt={p.name}
                        fill
                        className="object-cover"
                      />
                      {/* Active glow overlay */}
                      {active && (
                        <div className="absolute inset-0 bg-emerald-600/10" />
                      )}
                      {getDiscountPct(p) > 0 && (
                        <div className={`absolute bottom-0 left-0 right-0 text-center
                          text-[8px] font-black py-0.5 ${
                          active
                            ? "bg-yellow-400 text-emerald-900"
                            : "bg-yellow-400/80 text-emerald-900"
                        }`}>
                          -{getDiscountPct(p)}%
                        </div>
                      )}
                    </motion.button>
                  );
                })}
              </div>
            )}

            {/* Product info */}
            <AnimatePresence mode="wait" custom={direction}>
              {cur && (
                <motion.div
                  key={`info-${idx}`}
                  custom={direction}
                  variants={infoVariants}
                  initial="enter"
                  animate="center"
                  exit="exit"
                  transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
                  className="flex-1 flex flex-col justify-center relative z-10 space-y-4"
                >
                  {/* Origin + viewers */}
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="flex items-center gap-1.5 bg-yellow-100
                      text-amber-800 border border-yellow-200
                      text-[10px] font-black px-2.5 py-1 rounded-full">
                      <MapPin className="w-2.5 h-2.5" />
                      {cur.originRegion || "Gədəbəy"}
                    </span>
                    {cur.categoryId && (
                      <span className="text-[10px] font-bold text-emerald-800
                        bg-emerald-100 border border-emerald-200 px-2 py-1 rounded-full">
                        Ekoloji · Üzvi
                      </span>
                    )}
                    <span className="flex items-center gap-1 bg-white border border-slate-100
                      text-slate-500 text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                      <span className="relative flex h-1.5 w-1.5">
                        <span className="animate-ping absolute inline-flex h-full w-full
                          rounded-full bg-emerald-400 opacity-75" />
                        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
                      </span>
                      {liveViewers} nəfər baxır
                    </span>
                  </div>

                  {/* Name */}
                  <h2 className="text-2xl lg:text-3xl font-black text-emerald-900 leading-tight">
                    {cur.name}
                  </h2>

                  {/* Description */}
                  {cur.description && (
                    <p className="text-sm text-slate-500 leading-relaxed line-clamp-2">
                      {cur.description}
                    </p>
                  )}

                  {/* Stars */}
                  <div className="flex items-center gap-2">
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-3.5 h-3.5 ${
                          s <= 4 ? "fill-yellow-400 text-yellow-400" : "text-slate-200"
                        }`} />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-slate-700">4.8</span>
                    <span className="text-xs text-slate-400">
                      ({cur.reviews?.length ?? 124} rəy)
                    </span>
                  </div>

                  {/* Price */}
                  <div className="flex items-baseline gap-3">
                    <span className="text-3xl lg:text-4xl font-black text-emerald-900">
                      <AnimatedPrice value={price} />
                    </span>
                    {discount > 0 && (
                      <>
                        <span className="text-base text-slate-400 line-through">
                          {formatCurrency(basePrice)}
                        </span>
                        <span className="bg-yellow-100 text-amber-800 font-black text-xs
                          px-2 py-1 rounded-full border border-yellow-200">
                          {formatCurrency(basePrice - price)} qənaət
                        </span>
                      </>
                    )}
                  </div>

                  {/* Stock */}
                  {isLowStock && <StockBar stock={stock} />}

                  {/* Feature pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {[
                      { icon: <Leaf className="w-3 h-3" />, label: "Təbii üzvi", cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                      { icon: <ShieldCheck className="w-3 h-3" />, label: "Keyfiyyət zəmanəti", cls: "text-amber-800 bg-yellow-50 border-yellow-100" },
                      { icon: <Truck className="w-3 h-3" />, label: "Sürətli çatdırılma", cls: "text-emerald-700 bg-emerald-50 border-emerald-100" },
                    ].map((f) => (
                      <span key={f.label}
                        className={`flex items-center gap-1 text-[10px] font-bold
                          border px-2.5 py-1 rounded-full ${f.cls}`}>
                        {f.icon} {f.label}
                      </span>
                    ))}
                  </div>

                  {/* CTA row */}
                  <div className="space-y-3 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500 shrink-0">Miqdar:</span>
                      <QtySelector
                        qty={qty}
                        onMinus={() => setQty((q) => Math.max(1, q - 1))}
                        onPlus={() => setQty((q) => Math.min(stock || 99, q + 1))}
                        max={stock || 99}
                      />
                      <motion.button whileTap={{ scale: 0.9 }}
                        onClick={() => toggleWishlist(cur.id)}
                        className={`w-9 h-9 rounded-xl flex items-center justify-center
                          border transition-all ${
                          wishlist.has(cur.id)
                            ? "bg-red-50 border-red-200 text-red-500"
                            : "bg-white border-slate-200 text-slate-400 hover:border-red-200 hover:text-red-400"
                        }`}>
                        <Heart className={`w-4 h-4 ${wishlist.has(cur.id) ? "fill-red-500" : ""}`} />
                      </motion.button>
                    </div>

                    <div className="flex items-center gap-2.5">
                      <motion.button whileTap={{ scale: 0.93 }}
                        onClick={() => addToCart(cur.id, cur.variants?.[0]?.id, qty)}
                        className="flex items-center gap-2 bg-yellow-400 text-emerald-900
                          font-black text-sm rounded-2xl px-5 py-3
                          hover:bg-yellow-300 active:scale-95 transition-all
                          shadow-xl shadow-yellow-400/25">
                        <ShoppingBag className="w-4 h-4" />
                        Səbətə ({qty})
                      </motion.button>
                      <Link
                        href={`/product/${cur.slug || cur.id}`}
                        className="group flex items-center gap-2 bg-emerald-700 text-white
                          font-black text-sm rounded-2xl px-5 py-3
                          hover:bg-emerald-800 active:scale-95 transition-all shadow-xl
                          shadow-emerald-700/15">
                        <Eye className="w-4 h-4" />
                        Ətraflı bax
                        <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Bottom dots + counter */}
            <div className="flex items-center justify-between mt-6 relative z-10">
              <SlideDots
                total={products.length}
                current={idx}
                progress={progress}
                onDotClick={goTo}
              />
              <span className="text-[11px] font-bold text-slate-400">
                {idx + 1} / {products.length}
              </span>
            </div>
          </div>

          {/* RIGHT — Full-bleed image — IMPROVED */}
          <div className="relative overflow-hidden bg-gradient-to-br from-emerald-50 via-white to-yellow-50">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={`img-${idx}`}
                custom={direction}
                variants={imgVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
                className="absolute inset-0 flex items-center justify-center p-6"
              >
                {cur && (
                  <>
                    {!imgLoaded && (
                      <div className="absolute inset-0 bg-gradient-to-br
                        from-emerald-50 via-white to-yellow-50 animate-pulse" />
                    )}
                    {/* Product image — object-contain for proper proportions */}
                    <div className="relative w-full h-full">
                      <Image
                        key={cur.id}
                        src={getFirstImageUrl(cur)}
                        alt={cur.name}
                        fill
                        priority
                        className={`object-contain drop-shadow-2xl transition-opacity duration-500
                          ${imgLoaded ? "opacity-100" : "opacity-0"}`}
                        sizes="(min-width: 768px) 50vw, 0vw"
                        onLoad={() => setImgLoaded(true)}
                      />
                    </div>

                    {/* Discount badge */}
                    {discount > 0 && (
                      <motion.div
                        initial={{ scale: 0, rotate: -12 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 400, damping: 20, delay: 0.2 }}
                        className="absolute top-5 right-5 flex flex-col items-center
                          justify-center w-20 h-20 rounded-full
                          bg-gradient-to-br from-red-500 to-orange-500
                          shadow-2xl shadow-red-500/40 border-4 border-white z-10"
                      >
                        <span className="text-white font-black text-2xl leading-none">
                          -{discount}%
                        </span>
                        <span className="text-white/80 text-[9px] font-bold mt-0.5">ENDİRİM</span>
                      </motion.div>
                    )}

                    {/* Wishlist button */}
                    <motion.button
                      whileTap={{ scale: 0.9 }}
                      onClick={() => cur && toggleWishlist(cur.id)}
                      className={`absolute top-5 left-5 z-10 w-9 h-9 rounded-full
                        backdrop-blur shadow-lg flex items-center justify-center
                        transition-all ${
                        wishlist.has(cur.id)
                          ? "bg-red-50/95 border border-red-200"
                          : "bg-white/90 border border-white/60"
                      }`}
                    >
                      <Heart className={`w-4 h-4 transition-colors ${
                        wishlist.has(cur.id) ? "fill-red-500 text-red-500" : "text-slate-400"
                      }`} />
                    </motion.button>

                    {/* Bottom-left live indicator */}
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="absolute bottom-5 left-5 flex items-center gap-2
                        bg-white/95 backdrop-blur rounded-2xl px-3 py-2
                        border border-emerald-100 shadow-lg z-10"
                    >
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full
                          rounded-full bg-emerald-500 opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-600" />
                      </span>
                      <span className="text-emerald-800 text-[10px] font-black tracking-wide">
                        CANLIDA · {products.filter((p) => getDiscountPct(p) > 0).length > 0
                          ? `${products.filter((p) => getDiscountPct(p) > 0).length} ENDİRİM`
                          : "TƏZƏ MƏHSUL"}
                      </span>
                    </motion.div>
                  </>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Nav arrows */}
            {products.length > 1 && (
              <>
                <button onClick={goPrev}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10
                    w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-xl
                    flex items-center justify-center hover:scale-110
                    active:scale-90 transition-all">
                  <ChevronLeft className="w-4 h-4 text-emerald-900" />
                </button>
                <button onClick={goNext}
                  className="absolute right-3 top-1/2 -translate-y-1/2 z-10
                    w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-xl
                    flex items-center justify-center hover:scale-110
                    active:scale-90 transition-all">
                  <ChevronRight className="w-4 h-4 text-emerald-900" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Below slider: product strip (desktop) */}
      {products.length > 1 && (
        <div className="hidden md:flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-1">
          {products.map((p, i) => {
            const pDiscount = getDiscountPct(p);
            const pPrice = finalPrice(getProductBasePrice(p), p.discountType, p.discountValue);
            const active = i === idx;
            return (
              <motion.button
                key={p.id}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => goTo(i)}
                className={`flex items-center gap-2.5 shrink-0 rounded-xl p-2 pr-3
                  transition-all duration-300 border ${
                  active
                    ? "bg-emerald-700 border-emerald-700 shadow-lg shadow-emerald-700/20"
                    : "bg-white border-slate-100 hover:border-emerald-200"
                }`}
              >
                <div className={`relative w-9 h-9 rounded-lg overflow-hidden shrink-0
                  ${active ? "ring-2 ring-yellow-300 ring-offset-1 ring-offset-emerald-700" : ""}`}>
                  <Image src={getFirstImageUrl(p)} alt={p.name} fill className="object-cover" />
                </div>
                <div className="text-left">
                  <p className={`text-[11px] font-black truncate max-w-[90px] leading-tight
                    ${active ? "text-white" : "text-slate-800"}`}>
                    {p.name}
                  </p>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <span className={`text-[10px] font-bold
                      ${active ? "text-yellow-300" : "text-emerald-600"}`}>
                      {formatCurrency(pPrice)}
                    </span>
                    {pDiscount > 0 && (
                      <span className={`text-[9px] font-black px-1 rounded-full ${
                        active
                          ? "text-yellow-300 bg-yellow-300/15"
                          : "text-amber-700 bg-yellow-100"
                      }`}>
                        -{pDiscount}%
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            );
          })}
          <Link href="/products"
            className="flex items-center gap-1.5 shrink-0 text-xs font-bold
              text-slate-500 hover:text-emerald-700 transition-colors ml-1">
            Hamısı <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
}