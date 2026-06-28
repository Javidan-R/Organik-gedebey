import { ChevronDown } from "lucide-react";
import { ChangeEvent, memo } from "react";

// --- 3.3 Select --- 
type SelectProps = {
  label?: string;
  name?: string; // FIX: Əlavə edildi
  value: string | number;
  onChange: (e: ChangeEvent<HTMLSelectElement>) => void;
  options: { value: string | number; label: string }[];
  className?: string;
  icon?: React.ReactNode;
  required?: boolean;
};
export const Select = memo(({ label, name, value, onChange, options, className = '', icon, required }: SelectProps) => (
  <div className={`relative flex flex-col space-y-1 ${className}`}>
    {label && <label className="text-sm font-medium text-gray-700">{label}{required && <span className='text-red-500 ml-1'>*</span>}</label>}
    <div className="relative">
      {icon && <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none">{icon}</span>}
      <ChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 pointer-events-none w-4 h-4" />
      <select
        name={name} // FIX: Əlavə edildi
        value={value}
        onChange={onChange}
        required={required}
        className={`w-full p-3 border border-gray-300 rounded-xl appearance-none focus:border-emerald-500 focus:ring-emerald-500 transition bg-white text-gray-800 shadow-inner ${icon ? 'pl-10' : 'pl-3'}`}
      >
        {options.map(option => (
          <option key={option.value} value={option.value} className='text-gray-800'>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  </div>
));
Select.displayName = 'Select';
