// --- StatBox (ULTIMATE PREMIUM DİZAYN + TREND) ---

import { currency } from "@/helpers";
import { ArrowUp, ArrowDown } from "lucide-react";
import { memo } from "react";

const COLOR_MAP = {
  emerald: { bg: 'bg-emerald-600', text: 'text-emerald-700', lightBg: 'bg-emerald-50', shadow: 'shadow-emerald-200/50' },
  blue: { bg: 'bg-blue-600', text: 'text-blue-700', lightBg: 'bg-blue-50', shadow: 'shadow-blue-200/50' },
  slate: { bg: 'bg-slate-600', text: 'text-slate-700', lightBg: 'bg-slate-50', shadow: 'shadow-slate-200/50' },
  red: { bg: 'bg-red-600', text: 'text-red-700', lightBg: 'bg-red-50', shadow: 'shadow-red-200/50' },
  amber: { bg: 'bg-amber-600', text: 'text-amber-700', lightBg: 'bg-amber-50', shadow: 'shadow-amber-200/50' },
  purple: { bg: 'bg-purple-600', text: 'text-purple-700', lightBg: 'bg-purple-50', shadow: 'shadow-purple-200/50' },
};

interface UltimateStatCardProps {
    label: string;
    value: number | string;
    icon: React.ReactNode;
    color: keyof typeof COLOR_MAP;
    trend: { percentage: number; isPositive: boolean }; // Trend məlumatı
    isCurrency?: boolean;
    helperText?: string;
}

export const StatBox: React.FC<UltimateStatCardProps> = memo(({
  label,
  value,
  icon,
  color,
  trend,
  isCurrency = false,
  helperText,
}) => {
  const { bg, text, lightBg, shadow } = COLOR_MAP[color];

  // Valyutanı formatlaşdırmaq üçün (varsayırıq ki, currency funksiyası mövcuddur)
  const displayValue = isCurrency && typeof value === 'number' 
    ? (typeof currency === 'function' ? currency(value) : `${value.toFixed(2)} ₼`)
    : String(value);

  const trendColor = trend.isPositive ? 'text-emerald-500' : 'text-red-500';
  const TrendIcon = trend.isPositive ? ArrowUp : ArrowDown;

  return (
    <div
      className={`
        flex flex-col gap-1 rounded-2xl border p-5 shadow-2xl transition-all duration-300 
        ${lightBg} border-slate-200 hover:shadow-3xl ${shadow}
      `}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          {label}
        </span>
        {/* Vurğulanan İkon */}
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-lg ${bg}`}>
          {icon}
        </div>
      </div>
      
      {/* Əsas Dəyər */}
      <span className={`mt-2 text-3xl font-extrabold ${text}`}>
        {displayValue}
      </span>
      
      {/* Trend Məlumatı */}
      <div className={`mt-1 flex items-center gap-2 text-sm font-bold ${trendColor}`}>
        <TrendIcon className="h-4 w-4" />
        <span>{trend.percentage}%</span>
        <span className="text-xs font-medium text-slate-500">
            {trend.isPositive ? 'Yüksəliş' : 'Eniş'} (Keçən Ay)
        </span>
      </div>

      {/* Köməkçi Mətn */}
      {helperText && (
        <p className="mt-2 text-xs font-medium text-slate-500 border-t border-slate-100 pt-2">
          {helperText}
        </p>
      )}
    </div>
  );
});

StatBox.displayName = 'StatBox';
