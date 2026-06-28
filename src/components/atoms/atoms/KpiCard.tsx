'use client';

import React, { memo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp } from 'lucide-react'; // Sadəcə bir misal ikon

// ----------------------------------------------------
// KpiCard Props Type (Dəyişməyib)
// ----------------------------------------------------
type KpiCardProps = {
  /** İkon (məsələn: <Wallet className="w-5 h-5" />) */
  icon: React.ReactNode;
  /** Kartın Başlığı (Məsələn: 'Aylıq Dövriyyə') */
  label: string;
  /** Göstərici dəyəri (Məsələn: '12,450 ₼') */
  value: string | number;
  /** İkonun Fon Rəngi (Məsələn: 'bg-emerald-600') */
  color: string;
  /** Əlavə məlumat (optional) */
  description?: string;
  /** Dəyər hissəsi üçün xüsusi Tailwind class-ları (optional) */
  valueClassName?: string;
};

// ----------------------------------------------------
// Smart və Reusable KpiCard Component (RƏNGLİ DİZAYN)
// ----------------------------------------------------
export const KpiCard: React.FC<KpiCardProps> = memo(
  ({ icon, label, value, color, description, valueClassName }) => {
    
    // Məsələn: 'bg-emerald-600' rəngini 'text-emerald-600' şrift rənginə çevirir.
    // Bu, kartın rəngini təkrar istifadə etmək üçün istifadə edilir.
    const textColorClass = color.replace('bg-', 'text-');
      
    return (
      <motion.div
        // Animasiya: Daha güclü hover effekti
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ scale: 1.05 }} 
        transition={{ duration: 0.3, type: 'spring', stiffness: 220, damping: 18 }}
        
        // Əsas Dizayn: Yumşaq gradient fon, daha böyük künclər və kölgə
        className={`
          bg-linear-to-br from-white to-slate-50 p-6 rounded-2xl shadow-xl 
          border border-slate-200 
          flex flex-col justify-between cursor-pointer 
          transition-all duration-300 ease-in-out hover:shadow-2xl
        `}
      >
        
        {/* İkon və Başlıq Bloğu */}
        <div className="flex items-start justify-between gap-4 mb-4">
          {/* İkon Bloğu: Daha böyük (w-12 h-12 -> 3rem) və daha parlaq kölgə */}
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white ${color} shadow-lg shadow-gray-500/20`}>
            {icon}
          </div>
          
          {/* Başlıq */}
          <p className="text-sm font-bold uppercase tracking-widest text-gray-500 text-right">
            {label}
          </p>
        </div>
        
        {/* Dəyər Bloğu */}
        <div className="flex flex-col mt-2">
          {/* Dəyər (text-4xl -> 2.25rem) - Dinamik Rəng */}
          <p className={`text-4xl font-extrabold ${textColorClass} ${valueClassName ?? ''}`}>
            {value}
          </p>
        </div>

        {/* Description Bloğu (optional) */}
        {description && (
          <div className="mt-5 pt-3 border-t border-slate-100">
            <p className="text-xs text-slate-600 flex items-center gap-1 font-medium">
              {/* Trend İkonu da dinamik rəng alır */}
              <TrendingUp className={`w-3.5 h-3.5 ${textColorClass}`} />
              {description}
            </p>
          </div>
        )}
      </motion.div>
    );
  },
);

KpiCard.displayName = 'KpiCard';