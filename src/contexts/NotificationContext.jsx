import React, { createContext, useContext, useState } from 'react';
import Notification from '../components/ui/Notification';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (type, message, duration = 5000) => {
    const id = Date.now() + Math.random();
    const notification = {
      id,
      type,
      message,
      duration,
      show: true
    };

    setNotifications(prev => [...prev, notification]);

    // Auto remove after duration
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }

    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const showSuccess = (message, duration) => addNotification('success', message, duration);
  const showError = (message, duration) => addNotification('error', message, duration);
  const showWarning = (message, duration) => addNotification('warning', message, duration);
  const showInfo = (message, duration) => addNotification('info', message, duration);

  const value = {
    showSuccess,
    showError,
    showWarning,
    showInfo,
    removeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
      {/* Render notifications in a container with high z-index to ensure they appear above modals */}
      <div style={{ position: 'fixed', top: '1rem', right: '1rem', zIndex: 9999, pointerEvents: 'none' }}>
        {notifications.map((notification, index) => (
          <div key={notification.id} style={{ pointerEvents: 'auto', marginTop: index > 0 ? '0.5rem' : 0 }}>
            <Notification
              {...notification}
              onClose={() => removeNotification(notification.id)}
            />
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};
