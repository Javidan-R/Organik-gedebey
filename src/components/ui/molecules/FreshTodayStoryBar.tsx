// components/ui/molecules/FreshTodayStoryBar.tsx
"use client";

import { useMemo, useRef } from "react";
import { motion } from "framer-motion";
import { Leaf, ArrowRight, Sparkles } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useApp } from "@/lib/store";
import { getFirstImageUrl } from "@/utils/storefront_home";

interface Props {
  onOpenStory: (index: number) => void;
}

export function FreshTodayStoryBar({ onOpenStory }: Props) {
  const products = useApp((s) => s.products);
  const scrollRef = useRef<HTMLDivElement>(null);

  const freshProducts = useMemo(() => {
    if (!products) return [];
    const now = Date.now();
    const twoDaysAgo = now - 48 * 60 * 60 * 1000;
    return products
      .filter((p) => {
        if (p.archived) return false;
        const isNew = p.isNewArrival || p.statusTags?.includes("new");
        const createdAt = p.createdAt ? new Date(p.createdAt).getTime() : 0;
        return isNew || createdAt > twoDaysAgo;
      })
      .sort(
        (a, b) =>
          (b.createdAt ? new Date(b.createdAt).getTime() : 0) -
          (a.createdAt ? new Date(a.createdAt).getTime() : 0)
      )
      .slice(0, 10);
  }, [products]);

  if (!freshProducts.length) return null;

  return (
    <div className="space-y-3">
      {/* Başlıq sırası */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-emerald-700" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900">Bu Gün Gələnlər</h3>
            <p className="text-[10px] text-emerald-600 font-medium">
              {freshProducts.length} təzə məhsul
            </p>
          </div>
        </div>
        <Link
          href="/fresh-today"
          className="flex items-center gap-1 text-xs font-bold text-emerald-700 hover:text-emerald-800"
        >
          Hamısı <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* Hekayə paneli – düzbucaqlı kartlar */}
      <div className="relative">
        <div
          ref={scrollRef}
          className="flex gap-3 overflow-x-auto scrollbar-hide px-1 py-2 snap-x"
        >
          {freshProducts.map((p, idx) => {
            const img = getFirstImageUrl(p) || "/hero-basket.png";
            return (
              <button
                key={p.id}
                onClick={() => onOpenStory(idx)}
                className="flex flex-col items-center gap-1.5 shrink-0 snap-start group"
              >
                {/* Hekayə çərçivəsi – gradient border, yumşaq künclər */}
                <div className="relative p-[2px] rounded-2xl bg-gradient-to-tr from-yellow-400 via-red-500 to-purple-600">
                  <div className="relative w-[80px] h-[120px] rounded-2xl border-[3px] border-white overflow-hidden bg-slate-100 shadow-md">
                    <Image
                      src={img}
                      alt={p.name}
                      fill
                      className="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                    {/* Təzə işarəsi birinciyə */}
                    {idx === 0 && (
                      <div className="absolute bottom-1 left-1/2 -translate-x-1/2 bg-emerald-500 text-white rounded-full px-2 py-0.5 text-[9px] font-bold shadow whitespace-nowrap">
                        <Sparkles className="w-2.5 h-2.5 inline mr-0.5" />
                        TƏZƏ
                      </div>
                    )}
                  </div>
                </div>
                <span className="text-[10px] font-semibold text-slate-700 text-center max-w-[80px] line-clamp-1">
                  {p.name.split(" ")[0]}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}