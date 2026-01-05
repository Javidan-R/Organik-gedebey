// Köməkçi Stat Komponenti (Bunu mövcud olduğu yerdə saxlaya və ya yuxarı çəkə bilərsiniz)
export default function ScenarioStat({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white px-3 py-2 shadow-sm flex flex-col justify-between h-full">
      <div className="text-[11px] text-slate-500">{label}</div>
      <div className={`text-base font-bold ${color || 'text-slate-900'}`}>
        {value}
      </div>
    </div>
  );
}