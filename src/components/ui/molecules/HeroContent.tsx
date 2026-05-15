"use client";

import { motion } from "framer-motion";
import { Leaf, ShoppingBag, ArrowRight, ShieldCheck, Truck, HeartHandshake, Sparkles } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useScroll, useTransform } from "framer-motion";

interface HeroContentProps {
  scrollYProgress: any;
}

export default function HeroContent({ scrollYProgress }: HeroContentProps) {
  const textY = useTransform(scrollYProgress, [0, 1], [0, 30]);

  const [currentTime, setCurrentTime] = useState<"morning" | "day" | "evening">("day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) setCurrentTime("morning");
    else if (hour >= 10 && hour < 17) setCurrentTime("day");
    else setCurrentTime("evening");
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.06, delayChildren: 0.05 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 15 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  const timeGreeting = {
    morning: "Sabahınız xeyir! 🌅",
    day: "Günortanız xeyir! ☀️",
    evening: "Axşamınız xeyir! 🌙",
  };

  return (
    <motion.div
      style={{ y: textY }}
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="flex flex-col justify-center gap-2.5 px-3 pt-4 pb-0 md:gap-5 md:px-0 md:pt-0 md:pb-0"
    >
      {/* Salam */}
      <motion.p
        variants={itemVariants}
        className="text-[11px] font-medium text-emerald-700/80 md:text-sm"
      >
        {timeGreeting[currentTime]}
      </motion.p>

      {/* Badge */}
      <motion.div
        variants={itemVariants}
        className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-[9px] font-semibold text-emerald-800 shadow-sm backdrop-blur-sm md:px-4 md:py-1.5 md:text-xs"
      >
        <Leaf className="h-3 w-3 text-emerald-600 md:h-4 md:w-4" />
        <span className="hidden sm:inline">
          Gədəbəy & Gəncə ailə təsərrüfatları
        </span>
        <span className="sm:hidden">Gədəbəy təbii məhsulları</span>
      </motion.div>

      {/* Başlıq */}
      <motion.h1
        variants={itemVariants}
        className="text-lg font-extrabold leading-tight text-emerald-900 sm:text-3xl md:text-4xl lg:text-5xl"
      >
        <span className="block">Organik Gədəbəy</span>
        <span className="mt-0.5 block text-[0.75em] font-semibold text-emerald-700 sm:mt-2">
          təbii kənd məhsulları və ev dadı
        </span>
      </motion.h1>

      {/* Təsvir */}
      <motion.p
        variants={itemVariants}
        className="text-[11px] leading-relaxed text-emerald-800/80 sm:text-base"
      >
        Kənd həyətindən birbaşa evinizə: 🍯 bal, 🧀 pendir, qaymaq, 🥬 təzə tərəvəz və 🍎 meyvələr.
        <span className="mt-0.5 block font-medium text-emerald-700">
          Tam təbii organik kənd dadı 🌿
        </span>
      </motion.p>

      {/* Düymələr */}
      <motion.div variants={itemVariants} className="flex items-center gap-2 pt-1 sm:flex-row sm:gap-3 sm:pt-2">
        <Link
          href="/products"
          className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-green-600 px-4 py-2.5 text-[11px] font-semibold text-white shadow-lg transition-all hover:-translate-y-0.5 hover:shadow-xl active:translate-y-0 sm:px-5 sm:py-3 sm:text-sm md:px-6 md:text-base"
        >
          <ShoppingBag className="h-3.5 w-3.5 md:h-4 md:w-4" />
          Məhsullar
          <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1 md:h-4 md:w-4" />
        </Link>
        <Link
          href="/category/gedebey"
          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white/90 px-4 py-2.5 text-[11px] font-semibold text-emerald-700 shadow-md backdrop-blur-sm transition hover:bg-white hover:shadow-lg sm:px-5 sm:py-3 sm:text-sm md:text-base"
        >
          ⛰️ Gədəbəy
        </Link>
      </motion.div>

      {/* Özəlliklər – Mobil */}
      <motion.div
        variants={itemVariants}
        className="flex items-center gap-2.5 text-[10px] text-emerald-700 md:hidden"
      >
        <span className="flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Təzə
        </span>
        <span className="flex items-center gap-1">
          <Truck className="h-3 w-3" /> Sürətli
        </span>
        <span className="flex items-center gap-1">
          <HeartHandshake className="h-3 w-3" /> Endirim
        </span>
      </motion.div>

      {/* Özəlliklər – Desktop */}
      <motion.div variants={containerVariants} className="mt-2 hidden flex-wrap gap-2 md:flex">
        {[
          { icon: ShieldCheck, text: "Təzə yığım" },
          { icon: Truck, text: "Sürətli çatdırılma" },
          { icon: HeartHandshake, text: "Şəhid/qazi ailələrinə endirim" },
        ].map((item, i) => (
          <motion.span
            key={i}
            variants={itemVariants}
            className="inline-flex items-center gap-1.5 rounded-full bg-white/90 px-3 py-1.5 text-xs font-medium text-emerald-700 shadow-sm backdrop-blur-sm"
          >
            <item.icon className="h-3.5 w-3.5 text-emerald-600" />
            <span>{item.text}</span>
          </motion.span>
        ))}
      </motion.div>
    </motion.div>
  );
}