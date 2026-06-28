
export  default function FinanceSelect({
  label,
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1">
        {label}
      </label>
      <select
        {...props}
        className="w-full h-10 rounded-xl border border-slate-200 px-3 shadow-inner focus:border-emerald-400 outline-none text-sm"
      >
        {children}
      </select>
    </div>
  );
}