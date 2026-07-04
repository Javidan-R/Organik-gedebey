// src/components/atoms/Button.tsx
import React, { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { motion, type MotionProps } from 'framer-motion';

// ─── CVA Variantları ──────────────────────────────────────────────
const buttonVariants = cva(
  // Base styles
  'inline-flex items-center justify-center gap-2 rounded-xl text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 whitespace-nowrap select-none',
  {
    variants: {
      variant: {
        primary: 'bg-emerald-600 text-white hover:bg-emerald-700 focus:ring-emerald-500 shadow-md hover:shadow-lg active:scale-[0.98] dark:bg-emerald-500 dark:hover:bg-emerald-600',
        secondary: 'border border-gray-300 bg-white text-gray-800 hover:bg-gray-50 focus:ring-gray-300 shadow-sm dark:border-gray-600 dark:bg-gray-800 dark:text-gray-200 dark:hover:bg-gray-700',
        ghost: 'text-gray-600 hover:bg-gray-100 focus:ring-gray-300 dark:text-gray-400 dark:hover:bg-gray-800/50',
        danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md dark:bg-red-500 dark:hover:bg-red-600',
        soft: 'bg-gray-100 text-gray-700 hover:bg-gray-200 focus:ring-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700',
        success: 'bg-green-500 text-white hover:bg-green-600 focus:ring-green-400 shadow-md dark:bg-green-500 dark:hover:bg-green-600',
        outline: 'border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 focus:ring-emerald-500 dark:border-emerald-500 dark:text-emerald-400 dark:hover:bg-emerald-950/50',
        link: 'text-emerald-600 hover:underline focus:ring-emerald-500 dark:text-emerald-400',
      },
      size: {
        xs: 'px-2.5 py-1.5 text-xs min-h-[32px] gap-1.5',
        sm: 'px-3 py-2 text-sm min-h-[36px] gap-1.5',
        md: 'px-4 py-2.5 text-sm min-h-[40px] gap-2',
        lg: 'px-6 py-3 text-base min-h-[48px] gap-2.5',
        xl: 'px-8 py-4 text-lg min-h-[56px] gap-3',
        icon: 'h-10 w-10 p-0 min-h-[40px] min-w-[40px]',
      },
      rounded: {
        none: 'rounded-none',
        sm: 'rounded-lg',
        md: 'rounded-xl',
        lg: 'rounded-2xl',
        full: 'rounded-full',
      },
      fullWidth: {
        true: 'w-full',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
      rounded: 'md',
      fullWidth: false,
    },
  }
);

// ─── Tip Tərifləri ─────────────────────────────────────────────────
export interface ButtonProps
  extends Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'size'>,
    VariantProps<typeof buttonVariants> {
  children?: ReactNode;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
  loading?: boolean;
  loadingText?: string;
  spinner?: ReactNode;
  iconOnly?: boolean;
  asChild?: boolean;
  tooltip?: string;
  animation?: 'none' | 'scale' | 'pulse' | 'bounce' | 'fade';
  motion?: MotionProps;
  'data-testid'?: string;
}

// ─── Spinner Komponenti ─────────────────────────────────────────────
const Spinner = ({ className = '' }: { className?: string }) => (
  <svg
    className={['animate-spin h-4 w-4', className].filter(Boolean).join(' ')}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    aria-hidden="true"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    />
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    />
  </svg>
);

// ─── Əsas Button Komponenti ─────────────────────────────────────────
export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      children,
      className,
      variant,
      size,
      rounded,
      fullWidth,
      leftIcon,
      rightIcon,
      loading = false,
      loadingText,
      spinner,
      iconOnly = false,
      asChild = false,
      tooltip,
      animation = 'none',
      motion: motionProps,
      type = 'button',
      disabled = false,
      'data-testid': dataTestId,
      ...props
    },
    ref
  ) => {
    // ── Motion animation variants ──────────────────────────────────
    const getAnimationProps = (): MotionProps => {
      if (animation === 'none' || !motionProps) return {};

      const animations: Record<NonNullable<ButtonProps['animation']>, MotionProps> = {
        none: {},
        scale: {
          whileHover: { scale: 1.02 },
          whileTap: { scale: 0.97 },
          transition: { type: 'spring', stiffness: 400, damping: 17 },
        },
        pulse: {
          whileHover: { scale: 1.04 },
          whileTap: { scale: 0.96 },
          animate: loading ? { opacity: [1, 0.5, 1] } : {},
          transition: { repeat: Infinity, duration: 1.2 },
        },
        bounce: {
          whileHover: { y: -3 },
          whileTap: { y: 1 },
          transition: { type: 'spring', stiffness: 500, damping: 15 },
        },
        fade: {
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { duration: 0.2 },
        },
      };

      return { ...animations[animation], ...motionProps };
    };

    // ── Content ────────────────────────────────────────────────────
    const content = (() => {
      if (loading) {
        const spinnerElement = spinner || <Spinner />;
        const displayText = loadingText || children;
        return (
          <>
            {spinnerElement}
            {displayText}
          </>
        );
      }

      if (iconOnly) {
        return children;
      }

      return (
        <>
          {leftIcon}
          {children}
          {rightIcon}
        </>
      );
    })();

    // ── Class Names Generator ──────────────────────────────────────
    const combinedClasses = [
      buttonVariants({ variant, size, rounded, fullWidth }),
      'focus-visible:ring-4 focus-visible:ring-emerald-200 dark:focus-visible:ring-emerald-800/50',
      disabled ? 'cursor-not-allowed' : '',
      loading ? 'cursor-wait' : '',
      className // Kənardan gələn xüsusi klasslar
    ]
      .filter(Boolean) // undefined, null və ya boş stringləri təmizləyir
      .join(' '); // Aralarında boşluq qoyaraq tək stringə çevirir

    // ── Button Element ─────────────────────────────────────────────
    const buttonContent = (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={combinedClasses}
        data-testid={dataTestId}
        data-variant={variant}
        data-size={size}
        data-loading={loading}
        data-icon-only={iconOnly}
        data-full-width={fullWidth}
        title={tooltip}
        {...(iconOnly ? { 'aria-label': 'Button' } : {})}
        {...props}
      >
        {content}
      </button>
    );

    // ─── Motion wrapper ─────────────────────────────────────────────
    if (animation !== 'none' || motionProps) {
      const motionConfig = getAnimationProps();
      return (
        <motion.div {...motionConfig} style={{ display: 'inline-flex' }}>
          {buttonContent}
        </motion.div>
      );
    }

    return buttonContent;
  }
);

Button.displayName = 'Button';

export default Button;