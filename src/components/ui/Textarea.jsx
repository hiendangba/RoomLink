import React from 'react';

const Textarea = ({
  label,
  name,
  value,
  onChange,
  placeholder,
  error,
  required = false,
  disabled = false,
  size = 'medium',
  className = '',
  helperText,
  rows = 4,
  maxLength,
  ...props
}) => {
  const sizeClasses = {
    small: 'px-2 py-1 text-sm',
    medium: 'px-3 py-2 text-sm',
    large: 'px-4 py-3 text-base'
  };

  const baseTextareaClasses = `
    appearance-none block w-full border rounded-md placeholder-gray-400
    focus:outline-none focus:ring-2 focus:ring-offset-0
    transition-colors sm:text-sm resize-none
    ${sizeClasses[size]}
    ${error 
      ? 'border-red-300 focus:border-red-500 focus:ring-red-500' 
      : 'border-gray-300 focus:border-blue-500 focus:ring-blue-500'
    }
    ${disabled ? 'bg-gray-100 cursor-not-allowed opacity-60' : 'bg-white'}
    ${className}
  `.trim().replace(/\s+/g, ' ');

  const textareaId = props.id || name;

  return (
    <div className="w-full">
      {label && (
        <label 
          htmlFor={textareaId} 
          className="block text-sm font-medium text-gray-700 mb-1"
        >
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div className="mt-1">
        <textarea
          id={textareaId}
          name={name}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          required={required}
          disabled={disabled}
          rows={rows}
          maxLength={maxLength}
          className={baseTextareaClasses}
          {...props}
        />
      </div>

      {maxLength && (
        <div className="text-right text-sm text-gray-500 mt-1">
          {value?.length || 0}/{maxLength} ký tự
        </div>
      )}

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

export default Textarea;

