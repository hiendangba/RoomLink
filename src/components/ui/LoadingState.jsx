import React from 'react';

/**
 * LoadingState - Component để hiển thị trạng thái loading, empty và content
 * @param {boolean} isLoading - Trạng thái loading
 * @param {ReactNode} children - Nội dung hiển thị khi không loading
 * @param {string} loadingText - Text hiển thị khi loading (để rỗng để không hiện text)
 * @param {string} size - Kích thước spinner: 'small' | 'medium' | 'large'
 * @param {string} className - Class name tùy chỉnh
 * @param {ReactNode} emptyState - Component hiển thị khi không có dữ liệu (nếu cần)
 * @param {boolean} isEmpty - Trạng thái empty
 * @param {boolean} fullScreen - Hiển thị full screen overlay
 */
const LoadingState = ({
  isLoading = false,
  children,
  loadingText = 'Đang tải...',
  size = 'medium',
  className = '',
  emptyState = null,
  isEmpty = false,
  fullScreen = false
}) => {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-8 w-8',
    large: 'h-12 w-12'
  };

  const spinner = (
    <div className={`flex items-center justify-center ${className}`}>
      <div className="flex flex-col items-center">
        <svg 
          className={`animate-spin ${sizeClasses[size]} text-blue-600`} 
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
        {loadingText && (
          <p className="mt-2 text-sm text-gray-600">{loadingText}</p>
        )}
      </div>
    </div>
  );

  if (isLoading) {
    if (fullScreen) {
      return (
        <div className="fixed inset-0 bg-white bg-opacity-75 flex items-center justify-center z-50">
          {spinner}
        </div>
      );
    }
    return (
      <div className={`flex items-center justify-center py-12 ${className}`}>
        {spinner}
      </div>
    );
  }

  if (isEmpty && emptyState) {
    return <div className={className}>{emptyState}</div>;
  }

  if (isEmpty && !emptyState) {
    return (
      <div className={`text-center py-12 text-gray-500 ${className}`}>
        <p>Không có dữ liệu để hiển thị.</p>
      </div>
    );
  }

  return <div className={className}>{children}</div>;
};

export default LoadingState;

