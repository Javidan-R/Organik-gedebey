// src/components/admin/dashboard/DashboardSkeleton.tsx
'use client';

import { motion } from 'framer-motion';

const shimmer =
  'animate-shimmer bg-gradient-to-r from-transparent via-white/10 to-transparent bg-[length:200%_100%]';

const Box = ({ className = '', delay = 0 }: { className?: string; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.4, delay, ease: 'easeOut' }}
    className={`relative overflow-hidden rounded-2xl bg-slate-200/80 ${shimmer} ${className}`}
  />
);

const Line = ({
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

export default function DashboardSkeleton() {
  return (
    <div className="space-y-6 p-4 md:p-8">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-2">
          <Box className="h-10 w-64 rounded-2xl" delay={0.05} />
          <Line width="280px" height="14px" delay={0.1} />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <Box key={i} className="h-10 w-20 rounded-xl" delay={0.12 + i * 0.04} />
          ))}
        </div>
      </div>

      {/* KPI cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {Array.from({ length: 10 }).map((_, i) => (
          <Box key={i} className="h-28 rounded-2xl" delay={0.15 + i * 0.03} />
        ))}
      </div>

      {/* Charts area */}
      <div className="grid lg:grid-cols-3 gap-6">
        <Box className="h-80 rounded-2xl" delay={0.3} />
        <Box className="h-80 rounded-2xl" delay={0.35} />
        <Box className="h-80 rounded-2xl" delay={0.4} />
      </div>

      {/* Tables */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Box className="h-96 rounded-2xl" delay={0.45} />
        <Box className="h-96 rounded-2xl" delay={0.5} />
      </div>

      <style jsx global>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          animation: shimmer 2s infinite linear;
        }
      `}</style>
    </div>
  );
}