"use client";

/**
 * HeroSection — Premium wrapper
 * Organic luxury gradient bg + time-aware coloring
 * Houses HeroContent (left) + HeroSlider (right)
 */

import { Category } from "@/lib/types";
import { Product } from "@/types/products";
import { useScroll, motion } from "framer-motion";
import { useRef, useState, useEffect } from "react";
import HeroContent from "../molecules/HeroContent";
import HeroSlider from "../molecules/HeroSlider";

interface HeroSectionProps {
  featuredCats: Category[];
  highlighted: Product | null;
  allProducts?: Product[];
}

export function HeroSection({ highlighted, allProducts = [] }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });

  type TimeSlot = "morning" | "day" | "evening";
  const [time, setTime] = useState<TimeSlot>("day");

  useEffect(() => {
    const h = new Date().getHours();
    if (h >= 5 && h < 10) setTime("morning");
    else if (h >= 10 && h < 17) setTime("day");
    else setTime("evening");
  }, []);

  /* Time-based bg gradients — warm/cool/neutral */
  const gradients: Record<TimeSlot, string> = {
    morning: "from-[#FFF9F0] via-[#F0F9F0] to-[#FAFFF5]",
    day:     "from-[#F5FFF5] via-[#FAFAF5] to-[#F0F9F0]",
    evening: "from-[#FFF8F0] via-[#F5F9F0] to-[#FAFAF5]",
  };

  /* Decorative blob colors */
  const blobs: Record<TimeSlot, { a: string; b: string }> = {
    morning: { a: "bg-amber-200/40",  b: "bg-emerald-200/30" },
    day:     { a: "bg-lime-200/40",   b: "bg-emerald-200/30" },
    evening: { a: "bg-orange-200/30", b: "bg-emerald-200/30" },
  };

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden rounded-2xl md:rounded-3xl lg:rounded-[28px]
        bg-gradient-to-br ${gradients[time]}
        shadow-[0_4px_32px_rgba(5,31,10,0.08)]`}
    >
      {/* ── DECORATIVE BLOBS ── */}
      <div className="absolute pointer-events-none inset-0 overflow-hidden">
        {/* Top-left */}
        <div className={`absolute -top-20 -left-20 w-64 h-64 rounded-full
          ${blobs[time].a} blur-3xl opacity-60`} />
        {/* Bottom-right */}
        <div className={`absolute -bottom-16 -right-16 w-56 h-56 rounded-full
          ${blobs[time].b} blur-3xl opacity-50`} />
        {/* Center subtle */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
          w-96 h-48 rounded-full bg-white/40 blur-3xl" />

        {/* Noise texture overlay for organic feel */}
        <div className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
            backgroundSize: "128px 128px",
          }}
        />
      </div>

      {/* ── GRID LAYOUT ── */}
      <div className="relative z-10">
        {/* Mobile: stacked */}
        <div className="flex flex-col gap-0 md:hidden">
          <div className="pt-4 pb-2">
            <HeroContent scrollYProgress={scrollYProgress} />
          </div>
          {/* Divider */}
          <div className="mx-4 h-px bg-gradient-to-r from-transparent via-emerald-200/60 to-transparent" />
          <div className="py-3 px-1">
            <HeroSlider highlighted={highlighted} allProducts={allProducts} />
          </div>
        </div>

        {/* Desktop: side-by-side */}
        <div className="hidden md:grid md:grid-cols-[1fr,1.15fr] md:gap-4
          md:px-6 md:py-8 lg:grid-cols-[1fr,1.3fr] lg:gap-6 lg:px-10 lg:py-12">
          <HeroContent scrollYProgress={scrollYProgress} />
          <HeroSlider highlighted={highlighted} allProducts={allProducts} />
        </div>
      </div>
    </section>
  );
}