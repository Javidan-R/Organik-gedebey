// src/components/atoms/checkbox-input.tsx
import { memo } from "react";

type CheckboxInputProps = {
  label: string;
  id?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
  description?: string;
  disabled?: boolean;
};

export const CheckboxInput = memo(
  ({
    label,
    id,
    checked,
    onChange,
    className = "",
    description,
    disabled = false,
  }: CheckboxInputProps) => {
    const inputId = id || label.replace(/\s/g, "-").toLowerCase();

    return (
      <div className={`flex items-start ${className}`}>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          id={inputId}
          disabled={disabled}
          className="w-5 h-5 text-emerald-600 border-gray-300 rounded-lg focus:ring-emerald-500 focus:ring-2 mt-1 cursor-pointer flex-shrink-0 disabled:opacity-60 disabled:cursor-not-allowed"
        />
        <div className="ml-3 text-sm">
          <label
            htmlFor={inputId}
            className={`font-medium text-slate-800 cursor-pointer select-auto ${
              disabled ? "opacity-60 cursor-not-allowed" : ""
            }`}
          >
            {label}
          </label>
          {description && (
            <p className="text-slate-500 mt-0.5 text-xs leading-relaxed select-auto">
              {description}
            </p>
          )}
        </div>
      </div>
    );
  }
);
CheckboxInput.displayName = "CheckboxInput";