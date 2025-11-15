import React from 'react';

const InfoBox = ({ 
  type = 'info', // 'info', 'warning', 'success', 'error'
  title,
  children,
  messages = [],
  className = ''
}) => {
  const typeStyles = {
    info: {
      bg: 'bg-blue-50',
      border: 'border-blue-200',
      icon: 'text-blue-600',
      title: 'text-blue-800',
      text: 'text-blue-700'
    },
    warning: {
      bg: 'bg-yellow-50',
      border: 'border-yellow-200',
      icon: 'text-yellow-600',
      title: 'text-yellow-800',
      text: 'text-yellow-700'
    },
    success: {
      bg: 'bg-green-50',
      border: 'border-green-200',
      icon: 'text-green-600',
      title: 'text-green-800',
      text: 'text-green-700'
    },
    error: {
      bg: 'bg-red-50',
      border: 'border-red-200',
      icon: 'text-red-600',
      title: 'text-red-800',
      text: 'text-red-700'
    }
  };

  const styles = typeStyles[type] || typeStyles.info;

  const iconPaths = {
    info: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    warning: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    ),
    success: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
    ),
    error: (
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
    )
  };

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 ${className}`}>
      <div className="flex items-start">
        <svg className={`w-5 h-5 ${styles.icon} mr-3 mt-0.5 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {iconPaths[type]}
        </svg>
        <div className="flex-1">
          {title && (
            <p className={`text-sm font-medium ${styles.title}`}>{title}</p>
          )}
          {children && (
            <div className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
              {children}
            </div>
          )}
          {!children && messages.length > 0 && (
            <div className={`text-sm ${styles.text} ${title ? 'mt-1' : ''}`}>
              {messages.map((message, index) => (
                <p key={index} className={index > 0 ? 'mt-1' : ''}>
                  {message}
                </p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default InfoBox;

