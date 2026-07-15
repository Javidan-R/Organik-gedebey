// src/components/atoms/textarea.tsx
"use client";

import { forwardRef, TextareaHTMLAttributes } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  helper?: string;
  containerClassName?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  (
    { label, error, helper, containerClassName, className, ...props },
    ref
  ) => {
    return (
      <div className={`flex flex-col space-y-1 ${containerClassName || ""}`}>
        {label && (
          <label
            htmlFor={props.id || props.name}
            className="text-sm font-medium text-slate-700"
          >
            {label}
            {props.required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <textarea
          ref={ref}
          className={[
            "w-full rounded-xl border bg-white px-3 py-2.5 text-sm outline-none transition text-slate-800 placeholder:text-slate-400",
            "focus:ring-2 focus:ring-emerald-300 focus:border-emerald-500",
            error
              ? "border-red-400 focus:border-red-400 focus:ring-red-300"
              : "border-slate-300",
            props.disabled && "bg-slate-50 text-slate-500 cursor-not-allowed",
            className,
          ]
            .filter(Boolean)
            .join(" ")}
          {...props}
        />
        {helper && <p className="text-xs text-slate-500">{helper}</p>}
        {error && <p className="text-xs text-red-600">{error}</p>}
      </div>
    );
  }
);
Textarea.displayName = "Textarea";