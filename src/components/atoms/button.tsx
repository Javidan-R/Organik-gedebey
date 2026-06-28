import { memo } from "react";

// --- 3.1 Button --- 
type ButtonProps = {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'soft' | 'success';
  className?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  title?: string;
};
export const Button = memo(({ children, onClick, variant = 'primary', className = '', type = 'button', disabled = false, title }: ButtonProps) => {
  const base =
    'inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold transition focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-h-[40px]';
  const map: Record<NonNullable<ButtonProps['variant']>, string> = {
    primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg',
    secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-gray-300 shadow-sm',
    ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md',
    soft: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300',
    success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 shadow-md',
  };
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      title={title}
      className={`${base} ${map[variant]} ${className}`}
    >
      {children}
    </button>
  );
});
Button.displayName = 'Button';

