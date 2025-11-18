// contexts/NotificationContext.js -

import React, { createContext, useState, useContext, useCallback } from 'react';

const createNotification = (notification) => {
  const id = Date.now() + Math.random();
  return {
    id,
    type: 'info',
    title: '',
    message: '',
    icon: 'ℹ️',
    duration: 5000,
    action: null,
    ...notification,
    timestamp: new Date().toISOString()
  };
};

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    console.warn('useNotification used outside NotificationProvider, using fallback');
    return {
      notifications: [],
      addNotification: (notification) => {
        console.log('📢 Notification (fallback):', notification);
        if (typeof window !== 'undefined' && notification.message) {
          alert(`📢 ${notification.title}\n${notification.message}`);
        }
      },
      removeNotification: () => {},
      clearAllNotifications: () => {}
    };
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = useCallback((notification) => {
    const newNotification = createNotification(notification);
    
    console.log('📢 Adding notification:', newNotification);
    
    setNotifications(prev => [...prev, newNotification]);
    
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(newNotification.id);
      }, newNotification.duration);
    }
    
    return newNotification.id;
  }, []);

  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  }, []);

  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  const value = {
    notifications,
    addNotification,
    removeNotification,
    clearAllNotifications
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};