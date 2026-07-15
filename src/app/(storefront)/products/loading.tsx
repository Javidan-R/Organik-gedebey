// src/app/(storefront)/products/loading.tsx
"use client";

import { motion } from "framer-motion";
import { Leaf, Mountain } from "lucide-react";

export default function ProductsLoading() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gradient-to-br from-emerald-50 via-white to-amber-50/30">
      {/* Background Decorations */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <svg
          className="absolute bottom-0 left-0 w-full h-48 opacity-10"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          <path
            fill="#064e3b"
            fillOpacity="0.2"
            d="M0,192L48,176C96,160,192,128,288,138.7C384,149,480,203,576,213.3C672,224,768,192,864,176C960,160,1056,160,1152,170.7C1248,181,1344,203,1392,213.3L1440,224L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
          />
        </svg>
        <div className="absolute -top-32 -left-32 h-96 w-96 rounded-full bg-emerald-300/10 blur-3xl" />
        <div className="absolute -bottom-32 -right-32 h-96 w-96 rounded-full bg-amber-200/20 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto max-w-7xl px-4 py-8 md:px-6 md:py-12">
        {/* Header Banner Skeleton */}
        <div className="relative mb-10 overflow-hidden rounded-3xl bg-white/60 backdrop-blur-sm p-6 shadow-xl shadow-emerald-100/30 animate-pulse">
          <div className="absolute bottom-4 right-8 text-emerald-100/40">
            <Mountain className="h-24 w-24" strokeWidth={0.5} />
          </div>
          <div className="absolute left-6 top-6 rotate-12 text-emerald-100/40">
            <Leaf className="h-12 w-12" strokeWidth={0.5} />
          </div>

          <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div className="space-y-3">
              <div className="h-5 w-32 rounded-full bg-emerald-100" />
              <div className="h-10 w-72 rounded-2xl bg-slate-200" />
              <div className="h-4 w-96 rounded-xl bg-slate-100" />
              <div className="h-4 w-80 rounded-xl bg-slate-100" />
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {[...Array(4)].map((_, i) => (
                <div
                  key={i}
                  className="rounded-2xl px-4 py-3 text-center border border-slate-200 bg-white/50 space-y-2"
                >
                  <div className="h-7 w-16 rounded-xl bg-slate-200 mx-auto" />
                  <div className="h-3 w-12 rounded bg-slate-100 mx-auto" />
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Filter Skeleton */}
        <div className="mb-6 rounded-2xl border border-slate-200 bg-white/70 p-4 shadow-sm animate-pulse">
          <div className="flex flex-wrap gap-3">
            <div className="h-10 w-64 rounded-xl bg-slate-200" />
            <div className="h-10 w-36 rounded-xl bg-slate-100" />
            <div className="h-10 w-36 rounded-xl bg-slate-100" />
            <div className="h-10 w-36 rounded-xl bg-slate-100" />
            <div className="ml-auto h-10 w-28 rounded-xl bg-emerald-100" />
          </div>
        </div>

        {/* Product Grid Skeleton */}
        <div className="grid grid-cols-2 gap-2.5 sm:gap-3 md:grid-cols-3 lg:grid-cols-4 lg:gap-4">
          {[...Array(12)].map((_, i) => (
            <ProductCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCardSkeleton({ index }: { index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.04, duration: 0.4 }}
      className="rounded-3xl bg-white border border-slate-100 shadow-sm overflow-hidden"
    >
      {/* Image skeleton */}
      <div className="aspect-square bg-gradient-to-br from-slate-100 to-slate-200 animate-pulse relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_1.5s_infinite]" />
        {/* Organic badge placeholder */}
        <div className="absolute top-3 right-3 h-5 w-14 rounded-full bg-emerald-100/60" />
      </div>

      {/* Content skeleton */}
      <div className="p-4 space-y-3">
        {/* Name */}
        <div className="space-y-1.5">
          <div className="h-4 w-full rounded-lg bg-slate-200 animate-pulse" />
          <div className="h-4 w-3/4 rounded-lg bg-slate-100 animate-pulse" />
        </div>

        {/* Stock badge */}
        <div className="h-5 w-16 rounded-full bg-emerald-100 animate-pulse" />

        {/* Price row */}
        <div className="flex items-end justify-between pt-1">
          <div className="space-y-1">
            <div className="h-5 w-20 rounded-lg bg-slate-200 animate-pulse" />
            <div className="h-3 w-16 rounded bg-slate-100 animate-pulse" />
          </div>
          <div className="h-9 w-20 rounded-2xl bg-emerald-100 animate-pulse" />
        </div>
      </div>
    </motion.div>
  );
}