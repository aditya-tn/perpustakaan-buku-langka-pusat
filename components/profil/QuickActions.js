// components/profil/QuickActions.js - MODERN COMPACT WITH LARGE ICONS
import Link from 'next/link'

const ActionItem = ({ icon, title, link, isMobile }) => (
  <Link href={link} passHref>
    <a style={{ 
      textDecoration: 'none',
      flex: 1
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid #f1f5f9',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: isMobile ? '0.5rem' : '0.75rem',
        minHeight: isMobile ? '70px' : '80px',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 8px 25px rgba(66, 153, 225, 0.15)'
        e.target.style.borderColor = '#4299e1'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'
        e.target.style.borderColor = '#f1f5f9'
      }}
      >
        <div style={{ 
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          color: '#4299e1',
          width: isMobile ? '40px' : '45px',
          height: isMobile ? '40px' : '45px',
          borderRadius: '50%',
          backgroundColor: '#ebf8ff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 0.3s ease'
        }}>
          {icon}
        </div>
        <span style={{ 
          color: '#2d3748',
          fontWeight: '600',
          fontSize: isMobile ? '0.7rem' : '0.75rem',
          lineHeight: '1.2'
        }}>
          {title}
        </span>
      </div>
    </a>
  </Link>
)

export default function QuickActions({ isMobile }) {
  const actions = [
    { icon: "📚", title: "Pesan Koleksi", link: "/layanan" },
    { icon: "🕒", title: "Ruang Baca", link: "/layanan" },
    { icon: "🔍", title: "Jelajah Koleksi", link: "/koleksi" },
    { icon: "💬", title: "Kritik & Saran", link: "/kritik-saran" }
  ]

  return (
    <section style={{ 
      padding: isMobile ? '1.5rem 1rem' : '2rem 2rem',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h3 style={{ 
          textAlign: 'center',
          color: '#2d3748',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          fontSize: isMobile ? '1rem' : '1.1rem',
          fontWeight: '600',
          letterSpacing: '-0.025em'
        }}>
          Layanan Cepat
        </h3>
        
        <div style={{
          display: 'flex',
          gap: isMobile ? '0.75rem' : '1rem',
          alignItems: 'stretch'
        }}>
          {actions.map((action, index) => (
            <ActionItem 
              key={index}
              icon={action.icon}
              title={action.title}
              link={action.link}
              isMobile={isMobile}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
