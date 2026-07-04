"use client";

/**
 * HeroContent v5 — TÜnd panel üçün ağ/sarı rənglər
 */

import { motion, useTransform, MotionValue } from "framer-motion";
import {
  Leaf, ShoppingBag, ArrowRight, ShieldCheck, Truck,
  HeartHandshake, Sparkles, Zap,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

interface HeroContentProps {
  scrollYProgress: MotionValue<number>;
}
 
const CONTAINER = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08, delayChildren: 0.05 } },
};
const ITEM = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] as any } },
};

export default function HeroContent({ scrollYProgress }: HeroContentProps) {
  const y = useTransform(scrollYProgress, [0, 1], [0, 24]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.7]);

  type T = "morning" | "day" | "evening";
  const [time, setTime] = useState<T>("day");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = new Date().getHours();
    if (h >= 5 && h < 10) setTime("morning");
    else if (h >= 10 && h < 17) setTime("day");
    else setTime("evening");
  }, []);

  const greetings: Record<T, { emoji: string; text: string }> = {
    morning: { emoji: "🌅", text: "Sabahınız xeyir!" },
    day: { emoji: "☀️", text: "Günortanız xeyir!" },
    evening: { emoji: "🌙", text: "Axşamınız xeyir!" },
  };
  const g = greetings[time];

  return (
    <motion.div
      style={{ y, opacity }}
      variants={CONTAINER}
      initial="hidden"
      animate="visible"
      className="flex flex-col gap-4 md:gap-5"
    >
      {/* Greeting */}
      {mounted && (
        <motion.div variants={ITEM} className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 12, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4 }}
            className="text-xl"
          >{g.emoji}</motion.span>
          <span className="text-sm font-bold text-emerald-300">{g.text}</span>
        </motion.div>
      )}

      {/* Badge */}
      <motion.div variants={ITEM}>
        <div className="inline-flex items-center gap-2
          bg-emerald-500/20 border border-emerald-400/30
          text-emerald-200 rounded-full px-3.5 py-1.5 text-[11px] font-black
          backdrop-blur-sm">
          <motion.span
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
          >
            <Leaf className="w-3.5 h-3.5 text-yellow-300" />
          </motion.span>
          Gədəbəy · Gəncə · Ailə Təsərrüfatları
          <span className="text-yellow-300 text-[10px]">✦</span>
        </div>
      </motion.div>

      {/* Heading */}
      <motion.div variants={ITEM} className="space-y-1">
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 3 }}
          >
            <Sparkles className="w-5 h-5 md:w-7 md:h-7 text-yellow-400" />
          </motion.span>
          <h1 className="text-4xl sm:text-5xl md:text-5xl lg:text-6xl
            font-black text-white leading-[1] tracking-tight">
            Organik
          </h1>
        </div>

        <div className="relative inline-block">
          <motion.div
            className="absolute inset-y-1 left-0 right-0 bg-yellow-400/25
              rounded-lg -mx-1 -rotate-1"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.6, duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
          />
          <h2 className="relative z-10 text-4xl sm:text-5xl md:text-5xl lg:text-6xl
            font-black text-yellow-300 leading-[1.05] tracking-tight px-1">
            Gədəbəy
          </h2>
          <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 10"
            fill="none" preserveAspectRatio="none">
            <motion.path d="M2 7 C 50 3, 130 3, 198 7"
              stroke="#FDE047" strokeWidth="3.5" strokeLinecap="round" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.7, duration: 0.6, ease: "easeOut" }} />
            <motion.path d="M10 9 C 60 5, 140 5, 190 9"
              stroke="#84CC16" strokeWidth="1.5" strokeLinecap="round"
              strokeDasharray="4 3" fill="none"
              initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
              transition={{ delay: 0.85, duration: 0.6, ease: "easeOut" }} />
          </svg>
        </div>

        <p className="text-sm md:text-base font-semibold text-emerald-300/80 mt-3">
          Kənd dadı · Təbii · Üzvi məhsullar
        </p>
      </motion.div>

      {/* Description */}
      <motion.p variants={ITEM}
        className="text-[13px] md:text-sm text-slate-300 leading-relaxed max-w-sm">
        Kənd həyətindən birbaşa evinizə:{" "}
        <span className="font-bold text-white">🍯 bal, 🧀 pendir, qaymaq,</span>{" "}
        🥬 təzə tərəvəz və 🍎 meyvələr. Tam organik, tam təbii.
      </motion.p>

      {/* Feature pills (desktop) */}
      <motion.div variants={ITEM} className="hidden md:flex flex-wrap gap-1.5">
        {[
          { icon: <ShieldCheck className="w-3 h-3" />, text: "Sertifikatlı üzvi" },
          { icon: <Truck className="w-3 h-3" />, text: "Eyni gün çatdırılma" },
          { icon: <HeartHandshake className="w-3 h-3" />, text: "Şəhid ailələrinə endirim" },
        ].map(f => (
          <span key={f.text}
            className="flex items-center gap-1.5 text-[10px] font-bold
              bg-white/8 border border-white/12 text-emerald-200
              px-3 py-1.5 rounded-full">
            {f.icon} {f.text}
          </span>
        ))}
      </motion.div>

      {/* CTAs */}
      <motion.div variants={ITEM} className="flex items-center gap-2.5 flex-wrap">
        <Link href="/products"
          className="group inline-flex items-center gap-2
            bg-yellow-400 text-emerald-900 font-black text-sm rounded-2xl
            px-5 py-3 shadow-xl shadow-yellow-400/25
            hover:bg-yellow-300 active:scale-95 transition-all">
          <ShoppingBag className="w-4 h-4" />
          Məhsullar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link href="/fresh-today"
          className="inline-flex items-center gap-2
            bg-emerald-500/20 border border-emerald-400/30
            text-white font-black text-sm rounded-2xl
            px-4 py-3 hover:bg-emerald-500/30 active:scale-95 transition-all">
          <motion.span animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}>
            <Zap className="w-4 h-4 text-yellow-300" />
          </motion.span>
          Bu Gün Gələnlər
        </Link>
      </motion.div>

      {/* Mobile feature row */}
      <motion.div variants={ITEM}
        className="flex items-center gap-3 text-[10px] text-emerald-300
          font-bold md:hidden">
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-400" /> Üzvi
        </span>
        <span className="w-px h-3 bg-emerald-700" />
        <span className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-emerald-400" /> Sürətli
        </span>
        <span className="w-px h-3 bg-emerald-700" />
        <span className="flex items-center gap-1">
          <HeartHandshake className="w-3 h-3 text-yellow-400" /> Endirim
        </span>
      </motion.div>
    </motion.div>
  );
}