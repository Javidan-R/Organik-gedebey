import { RangeStats } from "@/app/admin/finance/page";
import { currency } from "@/helpers";

export function FinanceRangeCard({
  title,
  icon,
  stats,
  accent,
}: {
  title: string;
  icon: React.ReactNode;
  stats: RangeStats;
  accent: 'emerald' | 'sky' | 'amber';
}) {


  const colors: Record<
    typeof accent,
    { bg: string; chip: string; border: string }
  > = {
    emerald: {
      bg: 'from-emerald-50 to-white',
      chip: 'bg-emerald-50 text-emerald-700',
      border: 'border-emerald-100',
    },
    sky: {
      bg: 'from-sky-50 to-white',
      chip: 'bg-sky-50 text-sky-700',
      border: 'border-sky-100',
    },
    amber: {
      bg: 'from-amber-50 to-white',
      chip: 'bg-amber-50 text-amber-700',
      border: 'border-amber-100',
    },
  };

  const cls = colors[accent];

  return (
    <div
      className={`rounded-2xl border ${cls.border} bg-linear-to-br ${cls.bg} p-4 shadow-sm`}
    >
      <div className="flex justify-between items-center mb-3">
        <div className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white shadow">
            {icon}
          </span>
          {title}
        </div>
        <span
          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${cls.chip}`}
        >
          Marja: {stats.margin.toFixed(1)}%
        </span>
      </div>

      <dl className="text-xs text-slate-600 space-y-1">
        <div className="flex justify-between">
          <dt>Gəlir</dt>
          <dd className="font-semibold text-emerald-700">
            {currency(stats.income)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Xərc</dt>
          <dd className="font-semibold text-amber-700">
            {currency(stats.exp)}
          </dd>
        </div>
        <div className="flex justify-between">
          <dt>Mənfəət</dt>
          <dd
            className={`font-bold ${
              stats.profit >= 0
                ? 'text-emerald-700'
                : 'text-rose-700'
            }`}
          >
            {currency(stats.profit)}
          </dd>
        </div>
      </dl>
    </div>
  );
}

