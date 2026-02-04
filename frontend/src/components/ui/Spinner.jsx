import clsx from 'clsx';

const sizes = {
  xs: 'h-3 w-3',
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
  xl: 'h-12 w-12',
};

const colors = {
  primary: 'text-blue-600',
  secondary: 'text-gray-600',
  white: 'text-white',
  current: 'text-current',
};

const Spinner = ({
  size = 'md',
  color = 'primary',
  className,
  label = 'Loading...',
  showLabel = false,
  center = false,
}) => {
  const spinner = (
    <div
      className={clsx(
        center && 'flex flex-col items-center justify-center',
        className
      )}
      role="status"
      aria-label={label}
    >
      <svg
        className={clsx('animate-spin', sizes[size], colors[color])}
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
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
      {showLabel && (
        <span
          className={clsx(
            'mt-2 text-sm',
            colors[color]
          )}
        >
          {label}
        </span>
      )}
      <span className="sr-only">{label}</span>
    </div>
  );

  return spinner;
};

// Full page loading overlay
Spinner.Overlay = ({ label = 'Loading...', show = true }) => {
  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
      <Spinner size="xl" showLabel label={label} center />
    </div>
  );
};

// Inline loading state
Spinner.Inline = ({ size = 'sm', className }) => (
  <span className={clsx('inline-flex items-center', className)}>
    <Spinner size={size} color="current" />
  </span>
);

export default Spinner;
