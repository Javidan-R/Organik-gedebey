'use client';

import { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertTriangle, Trash2, X, ShieldAlert } from 'lucide-react';

interface DeleteConfirmToastProps {
  isOpen: boolean;
  productName: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmToast({
  isOpen,
  productName,
  onConfirm,
  onCancel,
}: DeleteConfirmToastProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Auto-focus cancel button for safety (so accidental Enter doesn't delete)
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => confirmRef.current?.focus(), 100);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    if (!isOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [isOpen, onCancel]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onCancel}
            className="fixed inset-0 z-[200] bg-black/40 backdrop-blur-[2px]"
          />

          {/* Toast / Dialog */}
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 16 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            role="alertdialog"
            aria-modal="true"
            aria-labelledby="delete-dialog-title"
            className="fixed left-1/2 top-1/2 z-[201] w-[calc(100vw-32px)] max-w-md -translate-x-1/2 -translate-y-1/2"
          >
            <div className="relative overflow-hidden rounded-3xl bg-white shadow-[0_32px_80px_rgba(0,0,0,0.22)] ring-1 ring-slate-900/8">
              {/* Top danger stripe */}
              <div className="h-1.5 w-full bg-gradient-to-r from-red-500 via-rose-500 to-red-600" />

              {/* Close button */}
              <button
                onClick={onCancel}
                className="absolute right-4 top-4 rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="px-6 pb-6 pt-5">
                {/* Icon */}
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-red-100">
                  <motion.div
                    animate={{ rotate: [0, -8, 8, -4, 4, 0] }}
                    transition={{ duration: 0.5, delay: 0.15 }}
                  >
                    <ShieldAlert className="h-7 w-7 text-red-600" />
                  </motion.div>
                </div>

                {/* Text */}
                <h2
                  id="delete-dialog-title"
                  className="mb-1.5 text-xl font-extrabold text-slate-900"
                >
                  Məhsulu sil?
                </h2>
                <p className="text-sm text-slate-500 leading-relaxed">
                  <span className="font-semibold text-slate-700">
                    "{productName}"
                  </span>{' '}
                  məhsulu silinəcək. Bu əməliyyat{' '}
                  <span className="font-bold text-red-600">geri qaytarıla bilməz</span>.
                </p>

                {/* Warning box */}
                <div className="mt-4 flex items-start gap-3 rounded-2xl bg-amber-50 border border-amber-200 px-4 py-3">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                  <p className="text-[12px] text-amber-800 leading-relaxed">
                    Məhsula aid bütün variantlar, şəkillər və statistika da silinəcək.
                    Əvəzinə <span className="font-bold">arxivləməyi</span> tövsiyə edirik.
                  </p>
                </div>

                {/* Buttons */}
                <div className="mt-5 flex flex-col-reverse gap-2.5 sm:flex-row">
                  <button
                    onClick={onCancel}
                    className="flex-1 rounded-2xl border-2 border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
                  >
                    Ləğv et
                  </button>

                  <motion.button
                    ref={confirmRef}
                    onClick={onConfirm}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.97 }}
                    className="flex flex-1 items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-red-600 to-rose-600 px-4 py-3 text-sm font-bold text-white shadow-lg shadow-red-500/30 hover:from-red-700 hover:to-rose-700 transition-all"
                  >
                    <Trash2 className="h-4 w-4" />
                    Bəli, sil
                  </motion.button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}