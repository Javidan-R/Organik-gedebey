import { CheckCircle2 } from "lucide-react";

// Kiçik “row checkbox” – sırf cədvəl üçün minimalist
interface RowCheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}
const RowCheckbox: React.FC<RowCheckboxProps> = ({
  checked,
  onChange,
  className,
}) => (
  <button
    type="button"
    onClick={() => onChange(!checked)}
    className={`flex items-center justify-center rounded border-[0.1rem] transition-all duration-150 
      ${checked ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 hover:border-slate-400'}
      w-[1.4rem] h-[1.4rem] ${className ?? ''}`}
    aria-pressed={checked}
  >
    {checked && <CheckCircle2 className="w-[0.9rem] h-[0.9rem] text-white" />}
  </button>
);
export default RowCheckbox;