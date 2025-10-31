// components/profil/TabNavigation.js - BOTTOM NAV MOBILE VERSION
import { useState, useEffect } from 'react'

export default function TabNavigation({ activeTab, setActiveTab, isMobile }) {
  const [isScrolled, setIsScrolled] = useState(false)
  
  const tabs = [
    { id: 'tentang', label: 'Tentang', icon: '🏛️' },
    { id: 'visi-misi', label: 'Visi', icon: '🎯' },
    { id: 'pegawai', label: 'Tim', icon: '👥' },
    { id: 'kontak', label: 'Kontak', icon: '📞' }
  ]

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (isMobile) {
    return (
      <>
        {/* Desktop-like tabs di atas (hidden di mobile) */}
        <div style={{
          display: 'none'
        }}>
          {/* Hidden desktop version */}
        </div>

        {/* Bottom Navigation untuk Mobile */}
        <div style={{
          display: 'flex',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #e2e8f0',
          padding: '0.5rem',
          zIndex: 1000,
          boxShadow: '0 -2px 20px rgba(0,0,0,0.1)',
          backdropFilter: 'blur(10px)'
        }}>
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id)
                window.scrollTo({ top: 0, behavior: 'smooth' })
              }}
              style={{
                flex: 1,
                padding: '0.75rem 0.5rem',
                backgroundColor: activeTab === tab.id ? '#4299e1' : 'transparent',
                color: activeTab === tab.id ? 'white' : '#4a5568',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontWeight: '600',
                transition: 'all 0.3s ease',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '0.25rem',
                fontSize: '0.65rem',
                minHeight: '50px'
              }}
            >
              <span style={{ fontSize: '1.1rem' }}>
                {tab.icon}
              </span>
              <span>
                {tab.label}
              </span>
            </button>
          ))}
        </div>

        {/* Spacer untuk bottom nav */}
        <div style={{
          height: '70px',
          display: isMobile ? 'block' : 'none'
        }} />
      </>
    )
  }

  // Desktop Version
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: '1rem',
      padding: '2rem',
      flexWrap: 'wrap',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: 0,
      zIndex: 100,
      backdropFilter: 'blur(10px)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: '1rem 1.5rem',
            backgroundColor: activeTab === tab.id ? '#4299e1' : 'white',
            color: activeTab === tab.id ? 'white' : '#4a5568',
            border: '1px solid #e2e8f0',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(66, 153, 225, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)',
            fontSize: '0.9rem',
            minWidth: '140px',
            justifyContent: 'center'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>
            {tab.icon}
          </span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
