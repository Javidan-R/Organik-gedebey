import { currency } from "@/helpers";



export function FinanceChannelCard({
  label,
  value,
  icon,
  bg,
}: {
  label: string;
  value: number;
  icon: React.ReactNode;
  bg: string;
}) {


  return (
    <div
      className={`rounded-xl ${bg} border border-white/60 px-3 py-2 flex flex-col gap-1`}
    >
      <div className="flex items-center justify-between text-[11px] text-slate-700">
        <span className="font-semibold">{label}</span>
        <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white shadow text-slate-700">
          {icon}
        </span>
      </div>
      <div className="text-xs font-bold text-emerald-800">
        {currency(value)}
      </div>
    </div>
  );
}
