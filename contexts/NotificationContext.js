// contexts/NotificationContext.js
import React, { createContext, useState, useContext } from 'react';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now() + Math.random();
    const newNotification = {
      id,
      ...notification,
      timestamp: new Date().toISOString()
    };
    
    setNotifications(prev => [...prev, newNotification]);
    
    // Auto remove setelah duration
    if (notification.duration) {
      setTimeout(() => {
        removeNotification(id);
      }, notification.duration);
    }
    
    return id;
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  return (
    <NotificationContext.Provider value={{
      notifications,
      addNotification,
      removeNotification,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

// Notification Container Component
const NotificationContainer = () => {
  const { notifications, removeNotification } = useContext(NotificationContext);

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      maxWidth: '400px'
    }}>
      {notifications.map(notification => (
        <NotificationItem 
          key={notification.id}
          notification={notification}
          onClose={() => removeNotification(notification.id)}
        />
      ))}
    </div>
  );
};

// Notification Item Component
const NotificationItem = ({ notification, onClose }) => {
  const { type, title, message, icon, action } = notification;

  const getStyles = () => {
    const baseStyles = {
      padding: '16px 20px',
      borderRadius: '12px',
      boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
      backdropFilter: 'blur(10px)',
      border: '1px solid rgba(255,255,255,0.2)',
      color: 'white',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '12px',
      minWidth: '300px',
      maxWidth: '400px',
      transform: 'translateX(100%)',
      animation: 'slideIn 0.5s ease-out forwards, fadeOut 0.5s ease-in 2.5s forwards',
      position: 'relative',
      overflow: 'hidden'
    };

    const typeStyles = {
      success: {
        background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)',
      },
      like: {
        background: 'linear-gradient(135deg, #ed64a6 0%, #d53f8c 100%)',
      },
      info: {
        background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)',
      },
      warning: {
        background: 'linear-gradient(135deg, #ed8936 0%, #dd6b20 100%)',
      },
      error: {
        background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)',
      }
    };

    return { ...baseStyles, ...typeStyles[type] };
  };

  return (
    <div style={getStyles()}>
      {/* Icon */}
      <div style={{ fontSize: '24px', flexShrink: 0 }}>
        {icon || getDefaultIcon(type)}
      </div>
      
      {/* Content */}
      <div style={{ flex: 1 }}>
        {title && (
          <div style={{ 
            fontWeight: '700', 
            fontSize: '16px',
            marginBottom: '4px',
            lineHeight: '1.3'
          }}>
            {title}
          </div>
        )}
        <div style={{ 
          fontSize: '14px',
          opacity: 0.9,
          lineHeight: '1.4'
        }}>
          {message}
        </div>
        
        {/* Action Button */}
        {action && (
          <button
            onClick={action.onClick}
            style={{
              marginTop: '8px',
              padding: '6px 12px',
              backgroundColor: 'rgba(255,255,255,0.2)',
              color: 'white',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: '600',
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.3)';
            }}
            onMouseLeave={(e) => {
              e.target.style.backgroundColor = 'rgba(255,255,255,0.2)';
            }}
          >
            {action.label}
          </button>
        )}
      </div>

      {/* Close Button */}
      <button
        onClick={onClose}
        style={{
          background: 'none',
          border: 'none',
          color: 'rgba(255,255,255,0.7)',
          fontSize: '18px',
          cursor: 'pointer',
          padding: '0',
          width: '24px',
          height: '24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          borderRadius: '4px',
          flexShrink: 0,
          transition: 'all 0.2s ease'
        }}
        onMouseEnter={(e) => {
          e.target.style.backgroundColor = 'rgba(255,255,255,0.1)';
          e.target.style.color = 'rgba(255,255,255,1)';
        }}
        onMouseLeave={(e) => {
          e.target.style.backgroundColor = 'transparent';
          e.target.style.color = 'rgba(255,255,255,0.7)';
        }}
      >
        ×
      </button>

      {/* Progress Bar */}
      <div style={{
        position: 'absolute',
        bottom: '0',
        left: '0',
        right: '0',
        height: '3px',
        backgroundColor: 'rgba(255,255,255,0.3)',
        transform: 'scaleX(1)',
        transformOrigin: 'left',
        animation: 'progress 3s linear forwards'
      }} />

      <style jsx>{`
        @keyframes slideIn {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        
        @keyframes fadeOut {
          from {
            transform: translateX(0);
            opacity: 1;
          }
          to {
            transform: translateX(100%);
            opacity: 0;
          }
        }
        
        @keyframes progress {
          from {
            transform: scaleX(1);
          }
          to {
            transform: scaleX(0);
          }
        }
      `}</style>
    </div>
  );
};

const getDefaultIcon = (type) => {
  const icons = {
    success: '✅',
    like: '❤️',
    info: 'ℹ️',
    warning: '⚠️',
    error: '❌'
  };
  return icons[type] || '💡';
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};
