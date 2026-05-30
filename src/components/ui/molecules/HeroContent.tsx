"use client";

/**
 * HeroContent — Premium editorial left panel.
 * Design: Ağ / Yaşıl / Sarı — Organic farm premium.
 * Creative "Organik Gədəbəy" heading with floating accents.
 * Stats removed. Flash-deal ready buttons.
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
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.07, delayChildren: 0.1 },
  },
};

const ITEM = {
  hidden: { opacity: 0, y: 18 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] },
  },
};

/* Floating leaf decoration */
function FloatingLeaf({
  delay,
  x,
  y,
  size,
  rotate,
}: {
  delay: number;
  x: string;
  y: string;
  size: number;
  rotate: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none select-none"
      style={{ left: x, top: y }}
      animate={{
        y: [0, -8, 0],
        rotate: [rotate, rotate + 10, rotate],
        opacity: [0.18, 0.32, 0.18],
      }}
      transition={{
        repeat: Infinity,
        duration: 3.5 + delay,
        ease: "easeInOut",
        delay,
      }}
    >
      <Leaf
        style={{ width: size, height: size }}
        className="text-emerald-400"
      />
    </motion.div>
  );
}

export default function HeroContent({ scrollYProgress }: HeroContentProps) {
  const y = useTransform(scrollYProgress, [0, 1], [0, 28]);
  const opacity = useTransform(scrollYProgress, [0, 0.6], [1, 0.6]);

  type TimeSlot = "morning" | "day" | "evening";
  const [time, setTime] = useState<TimeSlot>("day");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const h = new Date().getHours();
    if (h >= 5 && h < 10) setTime("morning");
    else if (h >= 10 && h < 17) setTime("day");
    else setTime("evening");
  }, []);

  const greetings: Record<TimeSlot, { emoji: string; text: string }> = {
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
      className="relative flex flex-col justify-center gap-4 px-4 pt-5 pb-3
        md:gap-5 md:px-0 md:pt-0 md:pb-0 overflow-hidden"
    >
      {/* ── DECORATIVE FLOATING LEAVES (desktop only) ── */}
      <div className="hidden md:block absolute inset-0 overflow-hidden pointer-events-none">
        <FloatingLeaf delay={0}   x="82%" y="12%" size={18} rotate={25}  />
        <FloatingLeaf delay={0.8} x="75%" y="55%" size={13} rotate={-15} />
        <FloatingLeaf delay={1.5} x="88%" y="72%" size={16} rotate={40}  />
        <FloatingLeaf delay={0.4} x="68%" y="30%" size={11} rotate={-30} />
      </div>

      {/* ── GREETING ── */}
      {mounted && (
        <motion.div variants={ITEM} className="flex items-center gap-2">
          <motion.span
            animate={{ rotate: [0, 10, -5, 0] }}
            transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
            className="text-xl"
          >
            {g.emoji}
          </motion.span>
          <span className="text-sm font-bold text-emerald-700">{g.text}</span>
        </motion.div>
      )}

      {/* ── TRUST BADGE ── */}
      <motion.div variants={ITEM}>
        <div className="inline-flex items-center gap-2
          bg-gradient-to-r from-emerald-600 to-emerald-700
          text-white rounded-full px-3.5 py-1.5 text-[11px] font-black
          shadow-lg shadow-emerald-600/25">
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

      {/* ── CREATIVE HEADING ── */}
      <motion.div variants={ITEM} className="space-y-2">
        {/* "Organik" — with sparkle */}
        <div className="flex items-center gap-2">
          <motion.span
            animate={{ scale: [1, 1.2, 1], rotate: [0, 15, 0] }}
            transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
            className="text-yellow-400"
          >
            <Sparkles className="w-5 h-5 md:w-6 md:h-6" />
          </motion.span>
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl
            font-black text-emerald-900 leading-[1] tracking-tight">
            Organik
          </h1>
        </div>

        {/* "Gədəbəy" — highlighted + underline */}
        <div className="relative inline-block">
          {/* Yellow marker highlight sweep */}
          <motion.div
            className="absolute inset-y-1 left-0 right-0 bg-yellow-300/40
              rounded-lg -mx-1 -rotate-1"
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.55, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          />
          <h2 className="relative z-10 text-3xl sm:text-4xl md:text-5xl lg:text-6xl
            font-black text-emerald-800 leading-[1.05] tracking-tight px-1">
            Gədəbəy
          </h2>
          {/* Dual animated underline */}
          <svg
            className="absolute -bottom-2 left-0 w-full"
            viewBox="0 0 200 10"
            fill="none"
            preserveAspectRatio="none"
          >
            <motion.path
              d="M2 7 C 50 3, 130 3, 198 7"
              stroke="#EAB308"
              strokeWidth="3.5"
              strokeLinecap="round"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.65, duration: 0.65, ease: "easeOut" }}
            />
            <motion.path
              d="M10 9 C 60 5, 140 5, 190 9"
              stroke="#84CC16"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeDasharray="4 3"
              fill="none"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ delay: 0.8, duration: 0.65, ease: "easeOut" }}
            />
          </svg>
        </div>

        <p className="text-sm md:text-base font-semibold text-emerald-600/90 mt-3">
          Kənd dadı · Təbii · Üzvi məhsullar
        </p>
      </motion.div>

      {/* ── DESCRIPTION ── */}
      <motion.p
        variants={ITEM}
        className="text-[13px] md:text-sm text-slate-600 leading-relaxed max-w-sm"
      >
        Kənd həyətindən birbaşa evinizə:{" "}
        <span className="font-bold text-slate-700">🍯 bal, 🧀 pendir, qaymaq,</span>{" "}
        🥬 təzə tərəvəz və 🍎 meyvələr. Tam organik, tam təbii.
      </motion.p>

      {/* ── FEATURE PILLS (desktop) ── */}
      <motion.div
        variants={ITEM}
        className="hidden md:flex flex-wrap gap-1.5"
      >
        {[
          { icon: <ShieldCheck className="w-3 h-3" />, text: "Sertifikatlı üzvi", color: "bg-yellow-50 border-yellow-200 text-amber-800" },
          { icon: <Truck className="w-3 h-3" />, text: "Eyni gün çatdırılma", color: "bg-emerald-50 border-emerald-200 text-emerald-800" },
          { icon: <HeartHandshake className="w-3 h-3" />, text: "Şəhid ailələrinə endirim", color: "bg-yellow-50 border-yellow-200 text-amber-800" },
        ].map((f) => (
          <span
            key={f.text}
            className={`flex items-center gap-1.5 text-[10px] font-bold
              border px-3 py-1.5 rounded-full ${f.color}`}
          >
            {f.icon}
            {f.text}
          </span>
        ))}
      </motion.div>

      {/* ── CTA BUTTONS ── */}
      <motion.div
        variants={ITEM}
        className="flex items-center gap-2.5 flex-wrap"
      >
        <Link
          href="/products"
          className="group inline-flex items-center gap-2
            bg-emerald-700 text-white font-black text-sm rounded-2xl
            px-5 py-3 shadow-xl shadow-emerald-700/20
            hover:bg-emerald-800 active:scale-95 transition-all"
        >
          <ShoppingBag className="w-4 h-4" />
          Məhsullar
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>

        <Link
          href="/fresh-today"
          className="inline-flex items-center gap-2
            bg-yellow-400 text-emerald-900 font-black text-sm rounded-2xl
            px-4 py-3 shadow-lg shadow-yellow-400/30
            hover:bg-yellow-300 active:scale-95 transition-all"
        >
          <motion.span
            animate={{ scale: [1, 1.15, 1] }}
            transition={{ repeat: Infinity, duration: 2 }}
          >
            <Zap className="w-4 h-4" />
          </motion.span>
          Bu Gün Gələnlər
        </Link>
      </motion.div>

      {/* ── MOBILE: feature row ── */}
      <motion.div
        variants={ITEM}
        className="flex items-center gap-3 text-[10px] text-emerald-800
          font-bold md:hidden"
      >
        <span className="flex items-center gap-1">
          <ShieldCheck className="w-3 h-3 text-emerald-500" /> Üzvi
        </span>
        <span className="w-px h-3 bg-emerald-200" />
        <span className="flex items-center gap-1">
          <Truck className="w-3 h-3 text-emerald-500" /> Sürətli
        </span>
        <span className="w-px h-3 bg-emerald-200" />
        <span className="flex items-center gap-1">
          <HeartHandshake className="w-3 h-3 text-yellow-500" /> Endirim
        </span>
      </motion.div>
    </motion.div>
  );
}