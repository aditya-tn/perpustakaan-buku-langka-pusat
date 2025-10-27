// components/profil/TabNavigation.js
export default function TabNavigation({ activeTab, setActiveTab }) {
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
      gap: '1rem',
      padding: '2rem',
      flexWrap: 'wrap',
      backgroundColor: '#f7fafc',
      borderBottom: '1px solid #e2e8f0'
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
            boxShadow: activeTab === tab.id ? '0 4px 12px rgba(66, 153, 225, 0.3)' : '0 2px 4px rgba(0,0,0,0.1)'
          }}
        >
          <span style={{ fontSize: '1.1rem' }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </div>
  )
}
