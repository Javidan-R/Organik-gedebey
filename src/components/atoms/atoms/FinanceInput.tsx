export default function FinanceInput({
  label,
  icon,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-semibold text-slate-600 block mb-1">
        {label}
      </label>
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-slate-400">
            {icon}
          </span>
        )}
        <input
          {...props}
          className={`w-full h-10 rounded-xl border border-slate-200 px-3 shadow-inner focus:border-emerald-400 outline-none text-sm ${
            icon ? 'pl-7' : ''
          }`}
        />
      </div>
    </div>
  );
}