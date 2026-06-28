/**
 * Fresh Today - Toast Component
 * Simple toast notification for user feedback
 */

'use client';

import { memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface ToastProps {
  message: string;
  icon?: React.ReactNode;
  visible: boolean;
}

const Toast = memo(({ message, icon, visible }: ToastProps) => {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: -48, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -24, scale: 0.95 }}
          transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          className="fixed top-5 left-1/2 -translate-x-1/2 z-[999] flex items-center gap-2 bg-[#051F0A] text-[#B5E935] rounded-full px-5 py-2.5 text-xs font-bold shadow-2xl border border-[#B5E935]/20 backdrop-blur-xl whitespace-nowrap"
          role="alert"
          aria-live="polite"
        >
          {icon && <span className="text-sm">{icon}</span>}
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );
});

Toast.displayName = 'Toast';

export default Toast;
