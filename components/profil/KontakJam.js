// components/profil/ContactCard.js - FIXED HIGHLIGHT ISSUE
import { useState } from 'react'

export default function ContactCard({ 
  icon, 
  title, 
  content, 
  subtitle, 
  link, 
  isMobile, 
  isHovered,
  onHoverChange 
}) {
  const [localHovered, setLocalHovered] = useState(false)

  const handleClick = () => {
    if (link) {
      window.open(link, '_blank')
    }
  }

  const handleMouseEnter = () => {
    setLocalHovered(true)
    if (onHoverChange) {
      onHoverChange(true)
    }
  }

  const handleMouseLeave = () => {
    setLocalHovered(false)
    if (onHoverChange) {
      onHoverChange(false)
    }
  }

  const isCardHovered = isHovered !== undefined ? isHovered : localHovered

  return (
    <div 
      style={{
        backgroundColor: 'white',
        padding: isMobile ? '1.5rem' : '2rem',
        borderRadius: '12px',
        boxShadow: isCardHovered 
          ? '0 8px 25px rgba(66, 153, 225, 0.15)' 
          : '0 4px 12px rgba(0,0,0,0.08)',
        textAlign: 'center',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        cursor: link ? 'pointer' : 'default',
        border: isCardHovered && link 
          ? '2px solid #4299e1' 
          : '1px solid #e2e8f0',
        transform: isCardHovered ? 'translateY(-4px)' : 'translateY(0)',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Hover background effect */}
      {isCardHovered && (
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'linear-gradient(135deg, #4299e108, #4299e102)',
          pointerEvents: 'none',
          borderRadius: '12px'
        }} />
      )}
      
      <div style={{ 
        fontSize: isMobile ? '2.5rem' : '3rem', 
        marginBottom: '1rem',
        transition: 'transform 0.3s ease',
        transform: isCardHovered ? 'scale(1.1)' : 'scale(1)'
      }}>
        {icon}
      </div>
      <h4 style={{ 
        color: '#2d3748',
        marginBottom: '0.5rem',
        fontWeight: '600',
        fontSize: isMobile ? '1rem' : '1.1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.25rem',
        transition: 'color 0.3s ease'
      }}>
        {title}
        {link && (
          <span style={{ 
            fontSize: '0.8rem', 
            color: '#4299e1',
            opacity: isCardHovered ? 1 : 0.7
          }}>
            ↗
          </span>
        )}
      </h4>
      <p style={{ 
        color: isCardHovered ? '#2b6cb0' : '#4299e1',
        fontWeight: '600',
        margin: '0 0 0.5rem 0',
        fontSize: isMobile ? '0.9rem' : '1rem',
        lineHeight: '1.3',
        wordBreak: 'break-word',
        transition: 'all 0.3s ease'
      }}>
        {content}
      </p>
      {subtitle && (
        <p style={{ 
          color: isCardHovered ? '#4a5568' : '#718096',
          margin: 0,
          fontSize: isMobile ? '0.75rem' : '0.8rem',
          lineHeight: '1.4',
          transition: 'color 0.3s ease'
        }}>
          {subtitle}
        </p>
      )}
    </div>
  )
}
