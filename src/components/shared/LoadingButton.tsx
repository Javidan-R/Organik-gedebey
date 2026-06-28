
type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

type LoadingButtonProps = {
  children: React.ReactNode;
  onClick: () => void;
  isLoading?: boolean;
  disabled?: boolean;
  variant?: ButtonVariant;
};

function LoadingButton({
  children,
  onClick,
  isLoading = false,
  disabled,
  variant = 'primary',
}: LoadingButtonProps) {
  const base =
    'inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold shadow-md transition active:scale-[0.97]';

  let colors = '';
  switch (variant) {
    case 'secondary':
      colors =
        'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50';
      break;
    case 'danger':
      colors = 'bg-red-600 text-white hover:bg-red-700';
      break;
    case 'ghost':
      colors =
        'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent';
      break;
    default:
      colors = 'bg-emerald-600 text-white hover:bg-emerald-700';
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={isLoading || disabled}
      className={`${base} ${colors} ${
        disabled || isLoading ? 'opacity-70 cursor-not-allowed' : ''
      }`}
    >
      {isLoading && (
        <svg
          className="h-4 w-4 animate-spin"
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
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.37 0 1 4.37 1 10h3z"
          />
        </svg>
      )}
      <span>{children}</span>
    </button>
  );
}

export default LoadingButton;