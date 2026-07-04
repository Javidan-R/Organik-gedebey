// src/components/atoms/input.tsx
'use client';

import {
  ChangeEvent,
  InputHTMLAttributes,
  TextareaHTMLAttributes,
  ReactNode,
  memo,
  forwardRef,
} from 'react';

type InputType =
  | 'text'
  | 'number'
  | 'email'
  | 'password'
  | 'url'
  | 'date'
  | 'search'
  | 'tel';

interface BaseProps {
  label?: string;
  name?: string;
  placeholder?: string;
  icon?: ReactNode;
  iconPosition?: 'left' | 'right';
  prefix?: string;
  suffix?: ReactNode;
  required?: boolean;
  helper?: string;
  className?: string;
  disabled?: boolean;
  readOnly?: boolean;
  error?: string;
  title?: string;
  containerClassName?: string;
}

type InputNativeAttrs = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'onChange' | 'value' | 'type' | 'size'
>;
type TextareaNativeAttrs = Omit<
  TextareaHTMLAttributes<HTMLTextAreaElement>,
  'onChange' | 'value'
>;

export type InputProps = BaseProps &
  (InputNativeAttrs | TextareaNativeAttrs) & {
    value?: string | number;
    type?: InputType;
    rows?: number;
    onChange?: (value: string, event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  };

const TW = {
  base: 'w-full rounded-2xl border-2 bg-white text-slate-900 shadow-sm outline-none transition-all duration-200 text-base font-medium placeholder:text-slate-500',
  padding: 'px-4 py-3',
  paddingLeftIcon: 'pl-11',
  paddingRightIcon: 'pr-11',
  paddingLeftPrefix: 'pl-16',
  normal: 'border-slate-300 focus:border-emerald-500 focus:ring-4 focus:ring-emerald-200/70 hover:border-emerald-300',
  error: 'border-rose-400 focus:border-rose-500 focus:ring-rose-200/70 hover:border-rose-400',
  disabled: 'bg-slate-100 text-slate-500 cursor-not-allowed opacity-70',
  readOnly: 'bg-slate-50 text-slate-700 cursor-default',
  icon: 'absolute top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none',
  prefix:
    'absolute left-0 top-0 h-full flex items-center px-3 bg-slate-100 border-r border-slate-200 rounded-l-2xl text-sm font-medium text-slate-600',
  suffixButton: 'absolute right-1 top-1/2 -translate-y-1/2',
  label: 'text-sm font-semibold text-slate-700 mb-1.5 block',
};

export const Input = memo(
  forwardRef<HTMLInputElement | HTMLTextAreaElement, InputProps>(
    (
      {
        label,
        name,
        value,
        onChange,
        placeholder,
        icon,
        iconPosition = 'left',
        prefix,
        suffix,
        required,
        helper,
        className = '',
        containerClassName = '',
        disabled,
        readOnly,
        error,
        title,
        rows,
        type = 'text',
        ...rest
      },
      ref
    ) => {
      const handleChange = (
        e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
      ) => {
        onChange?.(e.target.value, e);
      };

      const hasIcon = !!icon;
      const hasPrefix = !!prefix;
      const paddingClass = hasIcon
        ? iconPosition === 'left'
          ? TW.paddingLeftIcon
          : TW.paddingRightIcon
        : hasPrefix
        ? TW.paddingLeftPrefix
        : '';

      const mergedClass = [
        TW.base,
        TW.padding,
        paddingClass,
        disabled ? TW.disabled : '',
        readOnly ? TW.readOnly : '',
        error ? TW.error : TW.normal,
        className,
      ]
        .filter(Boolean)
        .join(' ');

      const inputElement = rows ? (
        <textarea
          {...(rest as TextareaNativeAttrs)}
          ref={ref as any}
          id={name}
          name={name}
          rows={rows}
          value={value?.toString() ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={handleChange}
          title={title}
          className={`${mergedClass} resize-y`}
        />
      ) : (
        <input
          {...(rest as InputNativeAttrs)}
          ref={ref as any}
          id={name}
          name={name}
          type={type}
          value={value?.toString() ?? ''}
          disabled={disabled}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={handleChange}
          title={title}
          className={mergedClass}
        />
      );

      return (
        <div className={`flex flex-col space-y-1.5 ${containerClassName}`}>
          {label && (
            <label htmlFor={name} className={TW.label}>
              {label}
              {required && <span className="text-rose-500 ml-1">*</span>}
            </label>
          )}

          <div className="relative">
            {prefix && <div className={TW.prefix}>{prefix}</div>}

            {hasIcon && iconPosition === 'left' && (
              <span className={`${TW.icon} left-3`}>{icon}</span>
            )}

            {inputElement}

            {hasIcon && iconPosition === 'right' && (
              <span className={`${TW.icon} right-3`}>{icon}</span>
            )}

            {suffix && <div className={TW.suffixButton}>{suffix}</div>}
          </div>

          {helper && <p className="text-xs text-slate-500">{helper}</p>}
          {error && <p className="text-xs text-rose-600">{error}</p>}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';