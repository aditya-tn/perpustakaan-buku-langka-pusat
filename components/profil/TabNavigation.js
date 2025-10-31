// components/profil/TabNavigation.js - HYBRID VERSION
import { useState, useEffect } from 'react'

export default function TabNavigation({ activeTab, setActiveTab, isMobile }) {
  const [isVisible, setIsVisible] = useState(true)
  const [lastScrollY, setLastScrollY] = useState(0)

  const tabs = [
    { id: 'tentang', label: 'Tentang Kami', icon: '🏛️', shortLabel: 'Tentang' },
    { id: 'visi-misi', label: 'Visi & Misi', icon: '🎯', shortLabel: 'Visi' },
    { id: 'pegawai', label: 'Tim Kami', icon: '👥', shortLabel: 'Tim' },
    { id: 'kontak', label: 'Kontak & Jam', icon: '📞', shortLabel: 'Kontak' }
  ]

  // Handle scroll untuk hide/show navigation
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scroll down - hide nav
        setIsVisible(false)
      } else {
        // Scroll up - show nav
        setIsVisible(true)
      }
      
      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '0.3rem' : '1rem',
      padding: isMobile ? '0.8rem 0.5rem' : '2rem',
      flexWrap: 'nowrap',
      backgroundColor: 'rgba(248, 250, 252, 0.98)',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      transition: 'transform 0.3s ease, opacity 0.3s ease',
      transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      opacity: isVisible ? 1 : 0,
      boxShadow: '0 2px 20px rgba(0,0,0,0.08)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: isMobile ? '0.5rem 0.4rem' : '1rem 1.5rem',
            backgroundColor: activeTab === tab.id ? '#4299e1' : 'white',
            color: activeTab === tab.id ? 'white' : '#4a5568',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.3rem',
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(66, 153, 225, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            fontSize: isMobile ? '0.65rem' : '0.9rem',
            flex: 1,
            minWidth: 0,
            minHeight: isMobile ? '40px' : 'auto',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <span style={{ 
            fontSize: isMobile ? '0.8rem' : '1.1rem',
            flexShrink: 0
          }}>
            {tab.icon}
          </span>
          <span style={{
            display: isMobile ? 'none' : 'block'
          }}>
            {tab.label}
          </span>
          <span style={{
            display: isMobile ? 'block' : 'none'
          }}>
            {tab.shortLabel}
          </span>
        </button>
      ))}
    </div>
  )
}
