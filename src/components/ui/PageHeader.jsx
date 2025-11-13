import React from 'react';
import Button from './Button';

const PageHeader = ({
  title,
  subtitle,
  onBack,
  onClose,
  onCancel,
  backText = 'Quay lại',
  closeText = 'Đóng',
  cancelText = 'Hủy',
  showBack = false,
  showClose = false,
  showCancel = false,
  className = '',
  children,
  headerActions
}) => {
  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      window.history.back();
    }
  };

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else if (onCancel) {
      onCancel();
    }
  };

  return (
    <div className={`flex items-center justify-between mb-8 ${className}`}>
      <div className="flex-1">
        <div className="flex items-center">
          {showBack && (
            <Button
              variant="ghost"
              size="small"
              onClick={handleBack}
              icon={
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              }
              className="mr-4"
            >
              {backText}
            </Button>
          )}
          <div>
            <h1 className="text-2xl font-bold text-gray-800">{title}</h1>
            {subtitle && (
              <p className="text-gray-600 mt-1">{subtitle}</p>
            )}
          </div>
        </div>
        {children && (
          <div className="mt-4">
            {children}
          </div>
        )}
      </div>
      
      <div className="flex items-center space-x-2">
        {headerActions}
        {showCancel && (
          <Button
            variant="outline"
            size="medium"
            onClick={handleClose}
          >
            {cancelText}
          </Button>
        )}
        {showClose && !showCancel && (
          <Button
            variant="ghost"
            size="small"
            onClick={handleClose}
            icon={
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            }
          />
        )}
      </div>
    </div>
  );
};

export default PageHeader;
