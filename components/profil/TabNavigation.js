// components/profil/TabNavigation.js - OPTIMIZED
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
      gap: isMobile ? '0.5rem' : '1rem',
      padding: isMobile ? '1.5rem 1rem' : '2rem',
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
            padding: isMobile ? '0.75rem 1rem' : '1rem 1.5rem',
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
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(66, 153, 225, 0.3)' : '0 2px 4px rgba(0,0,0,0.05)',
            fontSize: isMobile ? '0.8rem' : '0.9rem',
            minWidth: isMobile ? 'auto' : '140px',
            justifyContent: 'center',
            flex: isMobile ? 1 : 'none'
          }}
        >
          <span style={{ fontSize: isMobile ? '1rem' : '1.1rem' }}>{tab.icon}</span>
          <span>{isMobile ? tab.label.split(' ')[0] : tab.label}</span>
        </button>
      ))}
    </div>
  )
}
