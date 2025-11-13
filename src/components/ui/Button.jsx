import React from 'react';

const Button = ({
  children,
  variant = 'primary',
  size = 'medium',
  disabled = false,
  loading = false,
  loadingText = 'Đang xử lý...',
  onClick,
  type = 'button',
  className = '',
  icon,
  iconPosition = 'left',
  fullWidth = false,
  ...props
}) => {
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const sizeClasses = {
    small: 'px-3 py-2 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  // Special sizing for icon-only buttons
  const getIconOnlySize = (size) => {
    const iconOnlySizes = {
      small: 'p-2', // 8px padding all around
      medium: 'p-2.5', // 10px padding all around  
      large: 'p-3' // 12px padding all around
    };
    return iconOnlySizes[size] || iconOnlySizes.medium;
  };

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-600 text-white hover:bg-gray-700 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-600 text-white hover:bg-yellow-700 focus:ring-yellow-500',
    outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500',
    ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 focus:ring-gray-500',
    link: 'bg-transparent text-blue-600 hover:text-blue-500 underline focus:ring-blue-500',
    file: 'border-2 border-dashed border-green-300 bg-green-50 text-green-700 hover:bg-green-100 hover:border-green-400 focus:ring-green-500'
  };

  const widthClass = fullWidth ? 'w-full' : '';

  // Determine if this is an icon-only button
  const isIconOnly = icon && !children;

  const buttonClasses = `
    ${baseClasses}
    ${isIconOnly ? getIconOnlySize(size) : sizeClasses[size]}
    ${variantClasses[variant]}
    ${widthClass}
    ${className}
  `.trim();

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <svg 
            className="animate-spin h-4 w-4 text-current" 
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
          {loadingText && <span className="ml-2">{loadingText}</span>}
        </>
      );
    }

    if (icon) {
      // If only icon without children, center the icon perfectly
      if (!children) {
        return (
          <span className="flex items-center justify-center">
            {icon}
          </span>
        );
      }

      // If icon with children, add appropriate spacing
      const iconElement = (
        <span className={iconPosition === 'left' ? 'mr-2' : 'ml-2'}>
          {icon}
        </span>
      );

      return (
        <>
          {iconPosition === 'left' && iconElement}
          {children}
          {iconPosition === 'right' && iconElement}
        </>
      );
    }

    return children;
  };

  return (
    <button
      type={type}
      className={buttonClasses}
      disabled={disabled || loading}
      onClick={onClick}
      {...props}
    >
      {renderContent()}
    </button>
  );
};

export default Button;
