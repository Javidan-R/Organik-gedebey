
export default function StatBadge({
  icon,
  label,
  value,
  description,
  valueClassName,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  description?: string;
  valueClassName?: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-slate-50/70 p-3 flex flex-col gap-1">
      <div className="flex items-center justify-between text-[11px] text-slate-600">
        <span className="font-semibold">{label}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow text-slate-700">
          {icon}
        </span>
      </div>
      <div
        className={`text-sm font-bold text-slate-900 ${
          valueClassName ?? ''
        }`}
      >
        {value}
      </div>
      {description && (
        <p className="text-[11px] text-slate-500">{description}</p>
      )}
    </div>
  );
}