"use client";

import { useApp, useHasHydrated } from "@/lib/store";
import { motion } from "framer-motion";
import { Sprout, ArrowRight, Sparkles, Search } from "lucide-react";
import Link from "next/link";
import Image from "next/image";
import { useMemo, useState } from "react";
import { getCategoryMeta } from "@/lib/category-metadata";

export default function CategoriesPage() {
  const hasHydrated = useHasHydrated();
  const categories = useApp((state) => state.categories);
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!categories) return [];
    return categories
      .filter((c) => !c.archived)
      .filter((c) => !search || c.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => (b._count?.products ?? 0) - (a._count?.products ?? 0));
  }, [categories, search]);

  if (!hasHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFD]">
        <div className="w-16 h-16 rounded-full border-4 border-emerald-100 border-t-emerald-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f3f9e7] via-white to-[#eef7ea]">
      {/* Header */}
      <section className="relative pt-24 pb-16 px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-bold mb-6">
            <Sprout className="w-3.5 h-3.5" />
            {filtered.length} kateqoriya
          </span>
          <h1 className="text-4xl md:text-6xl font-black text-emerald-950 tracking-tight">
            Bütün Kateqoriyalar
          </h1>
          <p className="mt-4 text-emerald-700/70 text-lg">
            Gədəbəyin təbii məhsullarını kateqoriyalara görə kəşf edin
          </p>

          {/* Search */}
          <div className="mt-8 max-w-md mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-400" />
            <input
              type="text"
              placeholder="Kateqoriya axtar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-2xl border-2 border-emerald-100 bg-white/80 backdrop-blur-sm focus:border-emerald-400 focus:ring-4 focus:ring-emerald-50 outline-none transition-all text-sm"
            />
          </div>
        </motion.div>
      </section>

      {/* Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-24">
        {filtered.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3 sm:gap-4">
            {filtered.map((cat, i) => {
              const meta = getCategoryMeta(cat.name);
              const Icon = meta.icon;
              const count = cat._count?.products ?? 0;

              return (
                <motion.div
                  key={cat.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                >
                  <Link
                    href={`/category/${cat.slug}`}
                    className="group relative flex flex-col items-center text-center p-5 sm:p-6 rounded-2xl bg-white/80 backdrop-blur-sm border border-emerald-100/60 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-500/5 transition-all duration-300 h-full"
                  >
                    {/* İkon */}
                    <div className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-2xl ${meta.bg} flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300`}>
                      {cat.image ? (
                        <Image src={cat.image} alt={cat.name} fill className="object-cover rounded-2xl p-1.5" />
                      ) : (
                        <Icon className={`w-7 h-7 sm:w-8 sm:h-8 ${meta.color}`} strokeWidth={1.8} />
                      )}
                      {meta.badge && (
                        <span className="absolute -top-1.5 -right-1.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white text-[8px] font-bold px-1.5 py-0.5 rounded-full shadow-md">
                          {meta.badge}
                        </span>
                      )}
                    </div>

                    {/* Ad */}
                    <h3 className="text-sm sm:text-base font-bold text-emerald-900 line-clamp-2 mb-1 group-hover:text-emerald-700 transition-colors">
                      {cat.name}
                    </h3>

                    {/* Say */}
                    <p className="text-xs text-emerald-600/60 mt-auto">
                      {count} məhsul
                    </p>

                    {/* Hover arrow */}
                    <ArrowRight className="absolute bottom-4 right-4 w-4 h-4 text-emerald-400 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all" />
                  </Link>
                </motion.div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20">
            <Search className="w-12 h-12 text-emerald-200 mx-auto mb-4" />
            <p className="text-emerald-700 font-medium">Kateqoriya tapılmadı</p>
          </div>
        )}
      </section>
    </div>
  );
}