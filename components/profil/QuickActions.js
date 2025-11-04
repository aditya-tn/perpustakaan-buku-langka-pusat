// components/profil/QuickActions.js - SUPER COMPACT MOBILE
import Link from 'next/link'

const ActionItem = ({ icon, title, link, isMobile }) => (
  <Link href={link} passHref legacyBehavior>
    <a style={{ 
      textDecoration: 'none',
      display: 'block'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '0.6rem 0.4rem' : '1rem 0.75rem',
        borderRadius: '8px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        height: isMobile ? '65px' : '80px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: isMobile ? '0.2rem' : '0.5rem'
      }}
      onMouseEnter={(e) => {
        if (!isMobile) {
          e.target.style.transform = 'translateY(-2px)'
          e.target.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.12)'
          e.target.style.borderColor = '#4299e1'
        }
      }}
      onMouseLeave={(e) => {
        if (!isMobile) {
          e.target.style.transform = 'translateY(0)'
          e.target.style.boxShadow = '0 2px 6px rgba(0,0,0,0.05)'
          e.target.style.borderColor = '#e2e8f0'
        }
      }}
      >
        <div style={{ 
          fontSize: isMobile ? '1.25rem' : '1.5rem',
          color: '#4299e1',
          lineHeight: '1'
        }}>
          {icon}
        </div>
        <span style={{ 
          color: '#2d3748',
          fontWeight: '600',
          fontSize: isMobile ? '0.65rem' : '0.75rem',
          lineHeight: '1.1',
          textAlign: 'center'
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
      padding: isMobile ? '1.25rem 0.75rem' : '2rem 2rem',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        width: '100%'
      }}>
        <h3 style={{ 
          textAlign: 'center',
          color: '#2d3748',
          marginBottom: isMobile ? '0.75rem' : '1.5rem',
          fontSize: isMobile ? '0.9rem' : '1.1rem',
          fontWeight: '600'
        }}>
          Layanan Cepat
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
          gap: isMobile ? '0.5rem' : '1rem',
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
