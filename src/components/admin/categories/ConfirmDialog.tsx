// src/components/admin/ConfirmDialog.tsx
// Tam, qısaldılmamış, production-ready

'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle, X } from 'lucide-react';
import { classNames } from '@/lib/utils/classnames';
import { Button } from '@/components/atoms/button';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description: string;
  mode: 'danger' | 'default';
  onClose: () => void;
  onConfirm: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  mode,
  onClose,
  onConfirm,
}: ConfirmDialogProps) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
          >
            <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-6">
              <div className="flex items-start gap-4">
                <div
                  className={classNames(
                    'w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0',
                    mode === 'danger' ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'
                  )}
                >
                  {mode === 'danger' ? (
                    <AlertCircle className="w-5 h-5" />
                  ) : (
                    <CheckCircle className="w-5 h-5" />
                  )}
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-slate-900">{title}</h3>
                  <p className="text-sm text-slate-500 mt-1">{description}</p>
                </div>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-slate-100 transition"
                >
                  <X className="w-4 h-4 text-slate-400" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-3 mt-6">
                <Button variant="ghost" size="sm" onClick={onClose}>
                  İmtina et
                </Button>
                <Button
                  variant={mode === 'danger' ? 'danger' : 'primary'}
                  size="sm"
                  onClick={onConfirm}
                >
                  Təsdiqlə
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}