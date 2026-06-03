'use client';

import { motion } from 'framer-motion';
import { FC, useMemo } from 'react';

export type Season = 'spring' | 'summer' | 'autumn' | 'winter';

export interface SeasonConfig {
  emoji: string;
  label: string;
  description: string;
  gradientFrom: string;
  gradientTo: string;
  borderColor: string;
}

export interface SeasonBannerProps {
  /** İstəyə bağlı olaraq mövsümü kənardan təyin etmək (əgər verilməzsə, avtomatik) */
  season?: Season;
  /** Mövsüm konfiqurasiyalarını override etmək üçün map */
  configMap?: Partial<Record<Season, Partial<SeasonConfig>>>;
  /** Banner-a klik hadisəsi */
  onClick?: () => void;
}

const DEFAULT_CONFIG: Record<Season, SeasonConfig> = {
  spring: {
    emoji: '🌸',
    label: 'Bahar məhsulları gəldi!',
    description: 'Təzə yığılmış sebzə və meyvələr',
    gradientFrom: 'from-pink-50',
    gradientTo: 'to-rose-50',
    borderColor: 'border-rose-200',
  },
  summer: {
    emoji: '☀️',
    label: 'Yay təravəti',
    description: 'Sərinlədici təbii içkilər & meyvələr',
    gradientFrom: 'from-amber-50',
    gradientTo: 'to-orange-50',
    borderColor: 'border-orange-200',
  },
  autumn: {
    emoji: '🍂',
    label: 'Payız bolluğu',
    description: 'Bal, alma, heyva & qaymaq',
    gradientFrom: 'from-orange-50',
    gradientTo: 'to-amber-50',
    borderColor: 'border-amber-200',
  },
  winter: {
    emoji: '❄️',
    label: 'Qış ləzzətləri',
    description: 'İsti tutan ev məhsulları',
    gradientFrom: 'from-blue-50',
    gradientTo: 'to-indigo-50',
    borderColor: 'border-blue-200',
  },
};

export const SeasonBanner: FC<SeasonBannerProps> = ({ season: forcedSeason, configMap, onClick }) => {
  const season = useMemo(() => {
    if (forcedSeason) return forcedSeason;
    const month = new Date().getMonth();
    if (month >= 2 && month <= 4) return 'spring';
    if (month >= 5 && month <= 7) return 'summer';
    if (month >= 8 && month <= 10) return 'autumn';
    return 'winter';
  }, [forcedSeason]);

  const config = useMemo(() => {
    const base = DEFAULT_CONFIG[season];
    const overrides = configMap?.[season] || {};
    return { ...base, ...overrides };
  }, [season, configMap]);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.3 }}
      onClick={onClick}
      className={`flex cursor-pointer items-center gap-3 rounded-2xl border bg-gradient-to-r ${config.gradientFrom} ${config.gradientTo} ${config.borderColor} px-4 py-3 shadow-sm transition-all hover:shadow-md`}
    >
      <motion.span
        animate={{ rotate: [0, 10, -10, 0] }}
        transition={{ repeat: Infinity, duration: 3, repeatDelay: 1 }}
        className="text-2xl shrink-0"
      >
        {config.emoji}
      </motion.span>
      <div>
        <p className="text-xs font-black text-slate-800">{config.label}</p>
        <p className="text-[11px] text-slate-500">{config.description}</p>
      </div>
    </motion.div>
  );
};