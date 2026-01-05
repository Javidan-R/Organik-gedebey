import { memo } from "react";

// --- 3.5 Checkbox Input ---
type CheckboxInputProps = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
    className?: string;
    description?: string;
};
export const CheckboxInput = memo(({ label, checked, onChange, className = '', description }: CheckboxInputProps) => (
    <div className={`flex items-start ${className}`}>
        <input
            type="checkbox"
            checked={checked}
            onChange={(e) => onChange(e.target.checked)}
            id={label.replace(/\s/g, '-').toLowerCase()}
            className="w-5 h-5 text-emerald-600 border-gray-300 rounded-lg focus:ring-emerald-500 mt-1 cursor-pointer flex-shrink-0"
        />
        <div className="ml-3 text-sm">
            <label htmlFor={label.replace(/\s/g, '-').toLowerCase()} className="font-medium text-gray-700 cursor-pointer select-none">{label}</label>
            {description && <p className="text-gray-500 mt-0.5">{description}</p>}
        </div>
    </div>
));
CheckboxInput.displayName = 'CheckboxInput';

