"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Search, X } from "lucide-react";
import Link from "next/link";
import { POPULAR_SEARCHES } from "@/const/navigation";

type SearchOverlayProps = {
  open: boolean;
  onClose: () => void;
};
 
export function SearchOverlay({ open, onClose }: SearchOverlayProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-sm flex items-start justify-center pt-24 px-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: -20, opacity: 0, scale: 0.96 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: -20, opacity: 0, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-4">
              <Search className="w-5 h-5 text-emerald-600" />
              <input
                autoFocus
                type="text"
                placeholder="Məhsul, kateqoriya, açar söz..."
                className="flex-1 text-base outline-none text-gray-800 placeholder:text-gray-400"
              />
              <button
                onClick={onClose}
                className="p-1.5 rounded-full bg-gray-100 hover:bg-gray-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wider mb-2">
                Populyar axtarışlar
              </p>
              {POPULAR_SEARCHES.map((term) => (
                <Link
                  key={term}
                  href={`/products?q=${encodeURIComponent(term)}`}
                  onClick={onClose}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-emerald-50 text-sm text-gray-700 transition"
                >
                  <Search className="w-3.5 h-3.5 text-gray-400" />
                  {term}
                </Link>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}