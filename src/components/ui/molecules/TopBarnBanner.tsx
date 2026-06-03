'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import { useLocalStorage } from '@/hooks/useLocalStorage';

export interface Offer {
  id: string;
  emoji: string;
  prefix: string;
  highlight: string;
  suffix?: string;
  badge?: string;
}

export interface TopBarnBannerProps {
  offers?: Offer[];
  intervalMs?: number;
  storageKey?: string;
  onDismiss?: () => void;
  onOfferChange?: (index: number) => void;
}

const DEFAULT_OFFERS: Offer[] = [
  { id: 'delivery', emoji: '🐄', prefix: 'Bakı metrosu ətrafı', highlight: '30 AZN üzəri sifarişə pulsuz çatdırılma' },
  { id: 'first-order', emoji: '🎁', prefix: 'İlk sifarişinizə', highlight: '10% endirim – kupon: ORGANIC10', badge: 'YENİ' },
  { id: 'weekly', emoji: '🚀', prefix: 'Bu həftə ver,', highlight: 'növbəti həftə çatdırılma garantisi' },
  { id: 'vip', emoji: '⭐', prefix: 'VIP üzvlər', highlight: '15% əlavə endirim qazanır', suffix: 'müştəri xalına görə', badge: 'VIP' },
];

export function TopBarnBanner({
  offers = DEFAULT_OFFERS,
  intervalMs = 4500,
  storageKey = 'og-banner-dismissed',
  onDismiss,
  onOfferChange,
}: TopBarnBannerProps) {
  const [dismissed, setDismissed] = useLocalStorage(storageKey, false);
  const [idx, setIdx] = useState(0);

  const currentOffer = offers[idx];

  useEffect(() => {
    if (offers.length <= 1 || dismissed) return;
    const id = setInterval(() => {
      setIdx((prev) => (prev + 1) % offers.length);
    }, intervalMs);
    return () => clearInterval(id);
  }, [offers.length, intervalMs, dismissed]);

  useEffect(() => {
    onOfferChange?.(idx);
  }, [idx, onOfferChange]);

  const handleDismiss = useCallback(() => {
    setDismissed(true);
    onDismiss?.();
  }, [setDismissed, onDismiss]);

  if (dismissed || !currentOffer) return null;

  return (
    <motion.section
      initial={{ opacity: 0, y: -14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: 'easeOut' }}
      className="relative overflow-hidden rounded-3xl border border-amber-200 bg-gradient-to-r from-[#fffbea] via-[#fffdf5] to-[#fdf6e3] shadow-[0_6px_28px_rgba(180,120,30,0.14)]"
    >
      <motion.div
        animate={{ x: ['-100%', '200%'] }}
        transition={{ repeat: Infinity, duration: 3, ease: 'linear', repeatDelay: 2 }}
        className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-transparent via-white/40 to-transparent skew-x-12 pointer-events-none"
      />

      <div className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="flex items-center gap-3 flex-1 overflow-hidden">
          <motion.span
            key={currentOffer.id}
            initial={{ scale: 0, rotate: -20 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="text-2xl shrink-0"
          >
            {currentOffer.emoji}
          </motion.span>

          <div className="flex-1 overflow-hidden h-6">
            <AnimatePresence mode="wait">
              <motion.p
                key={currentOffer.id}
                initial={{ y: 22, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: -22, opacity: 0 }}
                transition={{ duration: 0.35 }}
                className="text-[11px] text-[#5b3d12] whitespace-nowrap truncate"
              >
                {currentOffer.prefix}{' '}
                <span className="font-black text-[#8c5a16]">{currentOffer.highlight}</span>
                {currentOffer.suffix && ` ${currentOffer.suffix}`}
                {currentOffer.badge && (
                  <span className="ml-2 px-1.5 py-0.5 rounded-full bg-amber-600 text-white text-[9px] font-black">
                    {currentOffer.badge}
                  </span>
                )}
              </motion.p>
            </AnimatePresence>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {offers.length > 1 && (
            <div className="flex gap-1 items-center">
              {offers.map((_, i) => (
                <motion.button
                  key={i}
                  onClick={() => setIdx(i)}
                  animate={{ scale: i === idx ? 1 : 0.8 }}
                  className={`h-1.5 rounded-full transition-all ${
                    i === idx ? 'w-4 bg-amber-600' : 'w-1.5 bg-amber-300'
                  }`}
                  aria-label={`${i + 1}. təklif`}
                />
              ))}
            </div>
          )}
          <button
            onClick={handleDismiss}
            className="text-amber-400 hover:text-amber-700 transition-colors"
            aria-label="Bağla"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </motion.section>
  );
}