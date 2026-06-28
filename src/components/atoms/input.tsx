"use client";

import {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  memo,
} from "react";

type InputType =
  | "text"
  | "number"
  | "email"
  | "password"
  | "url"
  | "date"
  | "search";

interface BaseProps {
  label?: string;
  name?: string;
  placeholder?: string;
  icon?: ReactNode;
  required?: boolean;
  helper?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  title?: string;
}

/*────────────────────────────────────
  UNIVERSAL CHANGE HANDLER (1 format)
────────────────────────────────────*/
export type InputChangeHandler = (
  value: string,
  event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
) => void;

/*────────────────────────────────────
  TEXT vs INPUT (Xəta burada düzəldildi)
────────────────────────────────────*/
// 1. Nativ atributlardan müdaxilə edən tipləri silirik.
type InputNativeAttrs = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "onChange" | "value" | "type"
>;
type TextareaNativeAttrs = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  "onChange" | "value"
>;

// 2. Yeni, təmizlənmiş tipləri istifadə edirik.
type InputOnlyProps = InputNativeAttrs & { rows?: undefined };
type TextareaOnlyProps = TextareaNativeAttrs & { rows: number };

export type InputProps = BaseProps &
  (InputOnlyProps | TextareaOnlyProps) & {
    // Bu xüsusiyyətlər artıq nativ tiplərdən gəlmir, yalnız buradan gəlir.
    value?: string | number;
    type?: InputType;
    onChange?: InputChangeHandler;
  };

/*────────────────────────────────────
  TAILWIND DESIGN SYSTEM (Dəyişməyib)
────────────────────────────────────*/
const TW = {
  base: "w-full rounded-xl border bg-white shadow-inner outline-none transition text-sm",
  padding: "px-3 py-2",
  normal: "border-gray-300 focus:border-emerald-500 focus:ring-emerald-300",
  error: "border-red-400 focus:border-red-400 focus:ring-red-300",
  disabled: "bg-gray-100 text-gray-500 cursor-not-allowed",
  readOnly: "bg-gray-50 text-gray-700 cursor-default",
  icon: "absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none",
  label: "text-xs font-semibold text-slate-700",
};

/*────────────────────────────────────
  COMPONENT (Dəyişməyib)
────────────────────────────────────*/
export const Input = memo(function InputComponent({
  label,
  name,
  value,
  onChange,
  placeholder,
  icon,
  required,
  helper,
  className = "",
  disabled,
  readOnly,
  error,
  title,
  rows,
  type = "text",
  ...rest
}: InputProps) {
  /* Proper typed handler */
  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    if (onChange) onChange(e.target.value, e);
  };

  const mergedClass =
    [
      TW.base,
      TW.padding,
      icon ? "pl-10" : "",
      disabled ? TW.disabled : "",
      readOnly ? TW.readOnly : "",
      error ? TW.error : TW.normal,
      className,
    ].join(" ");

  return (
    <div className="flex flex-col space-y-1">
      {label && (
        <label htmlFor={name} className={TW.label}>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}

      <div className="relative">
        {icon && <span className={TW.icon}>{icon}</span>}

        {rows ? (
          <textarea
            {...(rest as TextareaOnlyProps)}
            id={name}
            name={name}
            rows={rows}
            // value tipini string | number olaraq qəbul edir, lakin textarea yalnız string gözləyir.
            // Bu səbəbdən tip çevrilməsi (as string) əlavə edirik.
            value={value as string} 
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={handleChange}
            title={title}
            className={`${mergedClass} resize-y`}
          />
        ) : (
          <input
            {...(rest as InputOnlyProps)}
            id={name}
            name={name}
            type={type}
            value={value}
            disabled={disabled}
            readOnly={readOnly}
            placeholder={placeholder}
            onChange={handleChange}
            title={title}
            className={mergedClass}
          />
        )}
      </div>

      {helper && <p className="text-[11px] text-gray-500">{helper}</p>}
      {error && <p className="text-[11px] text-red-600">{error}</p>}
    </div>
  );
});