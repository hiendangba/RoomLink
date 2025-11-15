import React, { useEffect } from 'react';
import Button from '../ui/Button';

const BaseModal = ({
  isOpen = false,
  onClose,
  title,
  children,
  size = 'medium',
  showCloseButton = true,
  closeOnOverlayClick = true,
  className = '',
  zIndex = 50
}) => {
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape' && isOpen) {
        onClose?.();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'max-w-md',
    medium: 'max-w-lg',
    large: 'max-w-2xl',
    xlarge: 'max-w-4xl',
    full: 'max-w-full mx-4'
  };

  const handleOverlayClick = (e) => {
    // Nếu click vào container (overlay), đóng modal
    // Modal content đã có stopPropagation nên click vào modal sẽ không trigger event này
    if (closeOnOverlayClick) {
      onClose?.();
    }
  };

  const handleModalClick = (e) => {
    // Ngăn click vào modal content lan ra overlay để không đóng modal
    e.stopPropagation();
  };

  return (
    <div 
      className="fixed inset-0 overflow-y-auto"
      style={{ zIndex }}
      onClick={handleOverlayClick}
    >
      <div className="flex items-center justify-center min-h-screen px-4 py-4">
        {/* Overlay */}
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
        />

        {/* Modal */}
        <div 
          className={`relative bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all ${sizeClasses[size]} w-full ${className}`}
          onClick={handleModalClick}
        >
          {/* Header */}
          {title && (
            <div className="bg-white px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-medium text-gray-900">
                  {title}
                </h3>
                {showCloseButton && (
                  <Button
                    variant="ghost"
                    size="small"
                    onClick={onClose}
                    icon={
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="bg-white px-6 py-4">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

// Modal Footer Component
export const ModalFooter = ({ children, className = '' }) => {
  return (
    <div className={`bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3 ${className}`}>
      {children}
    </div>
  );
};

// Modal Body Component
export const ModalBody = ({ children, className = '' }) => {
  return (
    <div className={`px-6 py-4 ${className}`}>
      {children}
    </div>
  );
};

export default BaseModal;

