import React, { useState, useRef, useEffect } from 'react';

const Select = ({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  disabled = false,
  size = 'medium',
  className = '',
  helperText,
  children,
  placeholder,
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const selectRef = useRef(null);
  const options = React.Children.toArray(children);

  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const baseSelectClasses = `
    appearance-none block w-full border rounded-md
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition-colors sm:text-sm
    ${sizeClasses[size]}
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}
    ${disabled && !value ? 'opacity-60' : ''}
    ${!value && placeholder ? 'text-gray-400' : 'text-gray-900'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const selectId = props.id || name;

  // Get display text for selected option
  const getDisplayText = () => {
    // If value is empty, show text of first option (usually "Tất cả...")
    if (!value || value === '') {
      const firstOption = options.find(option => option.props.value === '');
      if (firstOption) {
        return firstOption.props.children;
      }
      return placeholder || 'Chọn...';
    }
    const selectedOption = options.find(option => option.props.value === value);
    return selectedOption ? selectedOption.props.children : value;
  };

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleSelect = (optionValue) => {
    if (onChange) {
      const event = {
        target: {
          name,
          value: optionValue
        }
      };
      onChange(event);
    }
    setIsOpen(false);
  };

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={selectId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="mt-1 relative" ref={selectRef}>
        <button
          type="button"
          onClick={handleToggle}
          disabled={disabled}
          className={`
            ${baseSelectClasses}
            text-left cursor-pointer flex items-center justify-between
            ${isOpen ? 'ring-2 ring-blue-500 border-blue-500' : ''}
          `}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
        >
          <span className="block truncate">{getDisplayText()}</span>
          <span className="flex items-center pr-3 pointer-events-none">
            <svg 
              className={`h-5 w-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`}
              xmlns="http://www.w3.org/2000/svg" 
              viewBox="0 0 20 20" 
              fill="currentColor"
            >
              <path 
                fillRule="evenodd" 
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" 
                clipRule="evenodd" 
              />
            </svg>
          </span>
        </button>

        {isOpen && !disabled && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
            {options.map((option, index) => {
              const optionValue = option.props.value;
              const isSelected = value === optionValue;
              const isLast = index === options.length - 1;

              return (
                <button
                  key={optionValue || index}
                  type="button"
                  onClick={() => handleSelect(optionValue)}
                  className={`
                    w-full text-left px-3 py-2 text-sm
                    ${isSelected 
                      ? 'bg-blue-50 text-blue-900' 
                      : 'text-gray-900 hover:bg-gray-50'
                    }
                    ${!isLast ? 'border-b border-gray-200' : ''}
                    transition-colors
                  `}
                >
                  {option.props.children}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {error && (
        <p className="mt-1 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}

      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">
          {helperText}
        </p>
      )}
    </div>
  );
};

export default Select;
