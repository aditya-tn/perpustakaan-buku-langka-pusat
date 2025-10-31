// components/profil/TabNavigation.js - FIXED MOBILE VERSION
import { useState, useEffect } from 'react'

export default function TabNavigation({ activeTab, setActiveTab, isMobile }) {
  const [isScrolled, setIsScrolled] = useState(false)
  
  const tabs = [
    { id: 'tentang', label: 'Tentang', icon: '🏛️', shortLabel: 'Tentang' },
    { id: 'visi-misi', label: 'Visi & Misi', icon: '🎯', shortLabel: 'Visi' },
    { id: 'pegawai', label: 'Tim Kami', icon: '👥', shortLabel: 'Tim' },
    { id: 'kontak', label: 'Kontak', icon: '📞', shortLabel: 'Kontak' }
  ]

  // Handle scroll untuk hide/show navigation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY
      setIsScrolled(scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '0.25rem' : '1rem',
      padding: isMobile ? '1rem 0.5rem' : '2rem',
      flexWrap: 'nowrap',
      backgroundColor: isScrolled ? 'rgba(248, 250, 252, 0.95)' : '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      transition: 'all 0.3s ease',
      boxShadow: isScrolled ? '0 2px 20px rgba(0,0,0,0.1)' : 'none'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: isMobile ? '0.6rem 0.5rem' : '1rem 1.5rem',
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
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(66, 153, 225, 0.3)' : '0 1px 3px rgba(0,0,0,0.1)',
            fontSize: isMobile ? '0.7rem' : '0.9rem',
            flex: 1,
            minWidth: 0,
            minHeight: isMobile ? '45px' : 'auto',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis'
          }}
        >
          <span style={{ 
            fontSize: isMobile ? '0.9rem' : '1.1rem',
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
            display: isMobile ? 'block' : 'none',
            fontSize: '0.65rem'
          }}>
            {tab.shortLabel}
          </span>
        </button>
      ))}
    </div>
  )
}
