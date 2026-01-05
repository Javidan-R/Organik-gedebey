export default function ProgressBar({
  label,
  value,
}: {
  label: string;
  value: number;
}) {
  const safeVal = Math.max(0, Math.min(value, 100));

  return (
    <div className="space-y-1">
      <div className="flex justify-between text-[11px] text-slate-600">
        <span>{label}</span>
        <span className="font-semibold">
          {safeVal.toFixed(1)}%
        </span>
      </div>
      <div className="h-2 rounded-full bg-slate-100 overflow-hidden">
        <div
          className={`h-full rounded-full ${
            safeVal <= 40
              ? 'bg-emerald-500'
              : safeVal <= 60
              ? 'bg-amber-400'
              : 'bg-rose-500'
          }`}
          style={{ width: `${safeVal}%` }}
        />
      </div>
    </div>
  );
}