import clsx from 'clsx';

const Card = ({
  children,
  className,
  padding = 'md',
  shadow = 'md',
  rounded = 'lg',
  hoverable = false,
  bordered = true,
  onClick,
  ...props
}) => {
  const paddingClasses = {
    none: '',
    sm: 'p-3',
    md: 'p-4',
    lg: 'p-6',
    xl: 'p-8',
  };

  const shadowClasses = {
    none: '',
    sm: 'shadow-sm',
    md: 'shadow-md',
    lg: 'shadow-lg',
    xl: 'shadow-xl',
  };

  const roundedClasses = {
    none: '',
    sm: 'rounded-sm',
    md: 'rounded-md',
    lg: 'rounded-lg',
    xl: 'rounded-xl',
    '2xl': 'rounded-2xl',
  };

  const Component = onClick ? 'button' : 'div';

  return (
    <Component
      className={clsx(
        'bg-white',
        paddingClasses[padding],
        shadowClasses[shadow],
        roundedClasses[rounded],
        bordered && 'border border-gray-200',
        hoverable && 'transition-all duration-200 hover:shadow-lg hover:-translate-y-0.5',
        onClick && 'cursor-pointer focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2',
        className
      )}
      onClick={onClick}
      {...props}
    >
      {children}
    </Component>
  );
};

// Card Header subcomponent
Card.Header = ({ children, className, ...props }) => (
  <div
    className={clsx('border-b border-gray-200 pb-4 mb-4', className)}
    {...props}
  >
    {children}
  </div>
);

// Card Title subcomponent
Card.Title = ({ children, className, ...props }) => (
  <h3
    className={clsx('text-lg font-semibold text-gray-900', className)}
    {...props}
  >
    {children}
  </h3>
);

// Card Description subcomponent
Card.Description = ({ children, className, ...props }) => (
  <p
    className={clsx('text-sm text-gray-500 mt-1', className)}
    {...props}
  >
    {children}
  </p>
);

// Card Body subcomponent
Card.Body = ({ children, className, ...props }) => (
  <div className={clsx('', className)} {...props}>
    {children}
  </div>
);

// Card Footer subcomponent
Card.Footer = ({ children, className, ...props }) => (
  <div
    className={clsx('border-t border-gray-200 pt-4 mt-4', className)}
    {...props}
  >
    {children}
  </div>
);

// Card Image subcomponent
Card.Image = ({ src, alt, className, aspectRatio = '16/9', ...props }) => (
  <div
    className={clsx('overflow-hidden -mx-4 -mt-4 mb-4 first:-mt-4', className)}
    style={{ aspectRatio }}
  >
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      {...props}
    />
  </div>
);

export default Card;
