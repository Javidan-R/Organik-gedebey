// src/components/admin/molecules/OrdersPageSkeleton.tsx
'use client';

import { motion } from 'framer-motion';

const shimmer =
  'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]';

const SkeletonBox = ({
  className = '',
  delay = 0,
}: {
  className?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    className={`relative overflow-hidden rounded-2xl bg-slate-200/80 ${shimmer} ${className}`}
  />
);

const SkeletonLine = ({
  width = '100%',
  height = '16px',
  delay = 0,
}: {
  width?: string;
  height?: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, x: -8 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ duration: 0.35, delay, ease: 'easeOut' }}
    className="relative overflow-hidden rounded-full bg-slate-200/70"
    style={{ width, height }}
  >
    <div className={`absolute inset-0 ${shimmer}`} />
  </motion.div>
);

export default function OrdersPageSkeleton() {
  return (
    <main className="space-y-8 p-4 md:p-8 bg-gradient-to-b from-emerald-50/60 via-white to-amber-50/50 min-h-screen">
      {/* ─── Header skeleton ─────────────────────────────────────────────── */}
      <motion.header
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex justify-between items-start flex-wrap gap-4">
          <div className="space-y-2">
            <SkeletonBox className="h-10 w-72 rounded-2xl" delay={0.05} />
            <SkeletonLine width="280px" height="14px" delay={0.1} />
          </div>
          <div className="flex items-center gap-3">
            <SkeletonBox className="h-9 w-24 rounded-xl" delay={0.15} />
            <SkeletonBox className="h-9 w-36 rounded-full" delay={0.2} />
          </div>
        </div>
      </motion.header>

      {/* ─── KPI cards skeleton ──────────────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox
            key={`kpi-top-${i}`}
            className="h-28 rounded-2xl"
            delay={0.12 + i * 0.06}
          />
        ))}
      </div>

      {/* Second row of KPI cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <SkeletonBox
            key={`kpi-bottom-${i}`}
            className="h-28 rounded-2xl"
            delay={0.18 + i * 0.06}
          />
        ))}
      </div>

      {/* ─── Filter bar skeleton ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.25 }}
        className="bg-white/80 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 flex flex-wrap gap-3 items-end"
      >
        <SkeletonBox className="h-10 w-48 rounded-xl" delay={0.28} />
        <SkeletonBox className="h-10 w-36 rounded-xl" delay={0.31} />
        <SkeletonBox className="h-10 w-28 rounded-xl" delay={0.34} />
        <SkeletonBox className="h-10 w-28 rounded-xl" delay={0.37} />
        <SkeletonBox className="h-10 w-24 rounded-xl" delay={0.4} />
        <SkeletonBox className="h-10 w-20 rounded-xl" delay={0.43} />
      </motion.div>

      {/* ─── Table skeleton – desktop ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, delay: 0.3 }}
        className="hidden md:block bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-3xl overflow-hidden shadow-xl shadow-slate-200/30"
      >
        {/* Table header */}
        <div className="grid grid-cols-12 gap-4 px-6 py-4 bg-slate-50/80 border-b border-slate-100">
          {Array.from({ length: 7 }).map((_, i) => (
            <SkeletonLine
              key={`th-${i}`}
              width={i === 0 ? '30px' : i === 6 ? '50px' : '60%'}
              height="12px"
              delay={0.33 + i * 0.02}
            />
          ))}
        </div>

        {/* Table rows */}
        <div className="divide-y divide-slate-100">
          {Array.from({ length: 8 }).map((_, rowIndex) => (
            <motion.div
              key={`row-${rowIndex}`}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.35 + rowIndex * 0.04 }}
              className="grid grid-cols-12 gap-4 px-6 py-4 items-center"
            >
              <SkeletonLine width="20px" height="20px" delay={0.36 + rowIndex * 0.04} />
              <SkeletonLine width="70px" height="14px" delay={0.37 + rowIndex * 0.04} />
              <div className="col-span-2">
                <SkeletonLine width="90%" height="14px" delay={0.38 + rowIndex * 0.04} />
                <SkeletonLine width="60%" height="10px" delay={0.39 + rowIndex * 0.04} />
              </div>
              <SkeletonLine width="40px" height="14px" delay={0.4 + rowIndex * 0.04} />
              <SkeletonLine width="60px" height="14px" delay={0.41 + rowIndex * 0.04} />
              <SkeletonBox className="h-7 w-24 rounded-full" delay={0.42 + rowIndex * 0.04} />
              <div className="col-span-2">
                <SkeletonLine width="80%" height="14px" delay={0.43 + rowIndex * 0.04} />
              </div>
              <SkeletonBox className="h-8 w-20 rounded-lg" delay={0.44 + rowIndex * 0.04} />
            </motion.div>
          ))}
        </div>

        {/* Pagination skeleton */}
        <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
          <SkeletonLine width="120px" height="14px" delay={0.7} />
          <div className="flex gap-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <SkeletonBox key={`page-${i}`} className="h-8 w-8 rounded-lg" delay={0.72 + i * 0.02} />
            ))}
          </div>
        </div>
      </motion.div>

      {/* ─── Mobile card list skeleton ───────────────────────────────────── */}
      <div className="md:hidden space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <motion.div
            key={`mobile-card-${i}`}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: 0.32 + i * 0.06 }}
            className="bg-white/90 backdrop-blur-sm border border-slate-200/60 rounded-2xl p-4 space-y-3"
          >
            <div className="flex items-center justify-between">
              <SkeletonLine width="80px" height="16px" />
              <SkeletonBox className="h-7 w-20 rounded-full" />
            </div>
            <div className="space-y-2">
              <SkeletonLine width="70%" height="14px" />
              <SkeletonLine width="50%" height="12px" />
            </div>
            <div className="flex items-center justify-between">
              <SkeletonLine width="50px" height="14px" />
              <SkeletonBox className="h-8 w-24 rounded-lg" />
            </div>
          </motion.div>
        ))}
      </div>

      {/* ─── Bottom state skeleton ──────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.6 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        className="text-center py-6"
      >
        <SkeletonLine width="200px" height="14px" delay={0.85} />
      </motion.div>

      {/* Inject shimmer keyframes via style tag */}
      <style jsx global>{`
        @keyframes shimmer {
          0% {
            background-position: -200% 0;
          }
          100% {
            background-position: 200% 0;
          }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </main>
  );
}