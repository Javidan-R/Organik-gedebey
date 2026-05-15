"use client";

import { Category } from "@/lib/types";
import { Product } from "@/types/products";
import { useScroll } from "framer-motion";
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

  const [currentTime, setCurrentTime] = useState<"morning" | "day" | "evening">("day");

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 10) setCurrentTime("morning");
    else if (hour >= 10 && hour < 17) setCurrentTime("day");
    else setCurrentTime("evening");
  }, []);

  const timeBasedGradient: Record<string, string> = {
    morning: "from-orange-50 via-yellow-50 to-green-50",
    day: "from-green-50 via-emerald-50 to-lime-50",
    evening: "from-amber-50 via-yellow-50 to-green-50",
  };

  return (
    <section
      ref={heroRef}
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${timeBasedGradient[currentTime]} shadow-lg md:rounded-3xl md:shadow-xl lg:rounded-[2rem]`}
    >
      {/* Mobil: alt-alta | Desktop: yanaşı */}
      <div className="relative flex flex-col md:grid md:grid-cols-2 md:gap-6 md:px-6 md:py-8 lg:grid-cols-[1.2fr,1fr] lg:gap-10 lg:px-10 lg:py-12">
        {/* SOL – Kontent */}
        <HeroContent scrollYProgress={scrollYProgress} />

        {/* Mobil ayırıcı */}
        <div className="mx-3 h-px bg-gradient-to-r from-transparent via-emerald-200 to-transparent md:hidden" />

        {/* SAĞ – Slayder */}
        <HeroSlider highlighted={highlighted} allProducts={allProducts} />
      </div>
    </section>
  );
}