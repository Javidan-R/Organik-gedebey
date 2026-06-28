// Summary card

type SummaryCardProps = {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  highlight?: boolean;
};

function SummaryCard({ label, value, icon, highlight }: SummaryCardProps) {
  return (
    <div
      className={`flex items-center gap-3 rounded-2xl border px-3 py-2 shadow-sm ${
        highlight
          ? 'border-red-200 bg-red-50 text-red-800'
          : 'border-emerald-100 bg-white text-gray-800'
      }`}
    >
      <div
        className={`flex h-8 w-8 items-center justify-center rounded-xl ${
          highlight ? 'bg-red-100 text-red-600' : 'bg-emerald-50 text-emerald-700'
        }`}
      >
        {icon}
      </div>
      <div className="min-w-0">
        <p className="truncate text-[11px] text-gray-500">{label}</p>
        <p className="truncate text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

export default SummaryCard;