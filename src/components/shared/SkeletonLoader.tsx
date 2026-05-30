import { motion } from "framer-motion";
import { FC } from "react";

// NEW: Skeleton Loader
export const SkeletonLoader: FC<{ count?: number }> = ({ count = 4 }) => (
  <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
    {[...Array(count)].map((_, i) => (
      <motion.div
        key={i}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: i * 0.1 }}
        className="rounded-2xl bg-white/60 p-4"
      >
        <div className="aspect-square w-full animate-pulse rounded-xl bg-linear-to-r from-slate-200 via-slate-100 to-slate-200 bg-size-[200%_100%] mb-3" 
          style={{ animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }}
        />
        <div className="h-4 animate-pulse rounded bg-slate-200 mb-2" />
        <div className="h-3 animate-pulse rounded bg-slate-200 w-2/3" />
      </motion.div>
    ))}
  </div>
)