// components/NotificationContainer.js - FIXED VERSION

import React from 'react';
import { useNotification } from '../contexts/NotificationContext';

const NotificationContainer = () => {
  const { notifications, removeNotification } = useNotification();

  const getNotificationStyle = (type) => {
    const baseStyle = {
      position: 'fixed',
      top: '20px',
      right: '20px',
      zIndex: 10000,
      minWidth: '300px',
      maxWidth: '400px',
      padding: '1rem',
      borderRadius: '8px',
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
      display: 'flex',
      alignItems: 'flex-start',
      gap: '0.75rem',
      transition: 'all 0.3s ease',
      animation: 'slideIn 0.3s ease-out'
    };

    const typeStyles = {
      success: {
        backgroundColor: '#f0fff4',
        border: '1px solid #9ae6b4',
        color: '#22543d'
      },
      error: {
        backgroundColor: '#fff5f5',
        border: '1px solid #fc8181',
        color: '#c53030'
      },
      warning: {
        backgroundColor: '#fffaf0',
        border: '1px solid #faf089',
        color: '#744210'
      },
      info: {
        backgroundColor: '#ebf8ff',
        border: '1px solid #90cdf4',
        color: '#2c5282' // 🆕 FIX: TAMBAH QUOTE YANG HILANG
      }
    };

    return { ...baseStyle, ...typeStyles[type] };
  };

  const getIcon = (type, customIcon) => {
    if (customIcon) return customIcon;
    
    const icons = {
      success: '✅',
      error: '❌',
      warning: '⚠️',
      info: 'ℹ️'
    };
    
    return icons[type] || 'ℹ️';
  };

  if (notifications.length === 0) {
    return null;
  }

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      right: 0,
      zIndex: 10000,
      padding: '20px',
      display: 'flex',
      flexDirection: 'column',
      gap: '10px',
      pointerEvents: 'none'
    }}>
      {notifications.map((notification, index) => (
        <div
          key={notification.id}
          style={{
            ...getNotificationStyle(notification.type),
            transform: `translateY(${index * 10}px)`,
            pointerEvents: 'all'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = `translateY(${index * 10}px) scale(1.02)`;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = `translateY(${index * 10}px) scale(1)`;
          }}
        >
          {/* Icon */}
          <div style={{
            fontSize: '1.25rem',
            flexShrink: 0,
            marginTop: '0.1rem'
          }}>
            {getIcon(notification.type, notification.icon)}
          </div>

          {/* Content */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Title */}
            {notification.title && (
              <div style={{
                fontWeight: '600',
                fontSize: '0.9rem',
                marginBottom: '0.25rem',
                lineHeight: '1.3'
              }}>
                {notification.title}
              </div>
            )}

            {/* Message */}
            {notification.message && (
              <div style={{
                fontSize: '0.8rem',
                lineHeight: '1.4',
                opacity: 0.9
              }}>
                {notification.message}
              </div>
            )}

            {/* Action Button */}
            {notification.action && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (notification.action.onClick) {
                    notification.action.onClick();
                  }
                  removeNotification(notification.id);
                }}
                style={{
                  marginTop: '0.5rem',
                  padding: '0.25rem 0.75rem',
                  backgroundColor: 'transparent',
                  border: '1px solid currentColor',
                  borderRadius: '4px',
                  fontSize: '0.7rem',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onMouseEnter={(e) => {
                  e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.target.style.backgroundColor = 'transparent';
                }}
              >
                {notification.action.label}
              </button>
            )}
          </div>

          {/* Close Button */}
          <button
            onClick={() => removeNotification(notification.id)}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.1rem',
              cursor: 'pointer',
              padding: '0',
              width: '24px',
              height: '24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: '4px',
              color: 'inherit',
              opacity: 0.7,
              flexShrink: 0
            }}
            onMouseEnter={(e) => {
              e.target.style.opacity = '1';
              e.target.style.backgroundColor = 'rgba(0, 0, 0, 0.1)';
            }}
            onMouseLeave={(e) => {
              e.target.style.opacity = '0.7';
              e.target.style.backgroundColor = 'transparent';
            }}
          >
            ×
          </button>
        </div>
      ))}

      {/* Global Styles */}
      <style jsx>{`
        @keyframes slideIn {
          from {
            opacity: 0;
            transform: translateX(100%);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }
        
        @keyframes slideOut {
          from {
            opacity: 1;
            transform: translateX(0);
          }
          to {
            opacity: 0;
            transform: translateX(100%);
          }
        }
      `}</style>
    </div>
  );
};

export default NotificationContainer;
