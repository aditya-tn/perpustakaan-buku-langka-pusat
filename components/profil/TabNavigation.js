// components/profil/TabNavigation.js - FIXED MOBILE
export default function TabNavigation({ activeTab, setActiveTab, isMobile }) {
  const tabs = [
    { id: 'tentang', label: 'Tentang Kami', icon: '🏛️' },
    { id: 'visi-misi', label: 'Visi & Misi', icon: '🎯' },
    { id: 'pegawai', label: 'Tim Kami', icon: '👥' },
    { id: 'kontak', label: 'Kontak & Jam', icon: '📞' }
  ]

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      gap: isMobile ? '0.25rem' : '1rem',
      padding: isMobile ? '1rem 0.5rem' : '2rem',
      flexWrap: 'wrap',
      backgroundColor: '#f8fafc',
      borderBottom: '1px solid #e2e8f0',
      position: 'sticky',
      top: isMobile ? '0' : '0',
      zIndex: 100,
      backdropFilter: 'blur(10px)',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          onClick={() => setActiveTab(tab.id)}
          style={{
            padding: isMobile ? '0.6rem 0.8rem' : '1rem 1.5rem',
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
            boxShadow: activeTab === tab.id ? '0 2px 8px rgba(66, 153, 225, 0.3)' : '0 1px 3px rgba(0,0,0,0.05)',
            fontSize: isMobile ? '0.7rem' : '0.9rem',
            minWidth: isMobile ? 'calc(50% - 0.5rem)' : '140px',
            justifyContent: 'center',
            flex: isMobile ? '1 1 calc(50% - 0.5rem)' : 'none',
            maxWidth: isMobile ? 'calc(50% - 0.5rem)' : 'none'
          }}
        >
          <span style={{ fontSize: isMobile ? '0.9rem' : '1.1rem' }}>{tab.icon}</span>
          <span style={{ 
            display: isMobile ? 'none' : 'inline',
            fontSize: isMobile ? '0.65rem' : '0.9rem'
          }}>
            {tab.label}
          </span>
          <span style={{ 
            display: isMobile ? 'inline' : 'none',
            fontSize: '0.65rem'
          }}>
            {tab.label.split(' ')[0]}
          </span>
        </button>
      ))}
    </div>
  )
}
