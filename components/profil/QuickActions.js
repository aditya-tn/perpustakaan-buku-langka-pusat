// components/profil/QuickActions.js - COMPACT HORIZONTAL VERSION
import Link from 'next/link'

const ActionItem = ({ icon, title, description, link, isMobile }) => (
  <Link href={link} passHref>
    <a style={{ 
      textDecoration: 'none',
      flex: 1,
      minWidth: isMobile ? '120px' : '150px'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: isMobile ? '0.75rem 0.5rem' : '1rem 0.75rem',
        borderRadius: '8px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
        transition: 'all 0.3s ease',
        cursor: 'pointer',
        border: '1px solid #e2e8f0',
        textAlign: 'center',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '0.5rem'
      }}
      onMouseEnter={(e) => {
        e.target.style.transform = 'translateY(-2px)'
        e.target.style.boxShadow = '0 4px 12px rgba(66, 153, 225, 0.15)'
        e.target.style.borderColor = '#4299e1'
      }}
      onMouseLeave={(e) => {
        e.target.style.transform = 'translateY(0)'
        e.target.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
        e.target.style.borderColor = '#e2e8f0'
      }}
      >
        <div style={{ 
          fontSize: isMobile ? '1.5rem' : '1.75rem',
          color: '#4299e1'
        }}>
          {icon}
        </div>
        <div>
          <h4 style={{ 
            color: '#2d3748',
            margin: '0 0 0.25rem 0',
            fontWeight: '600',
            fontSize: isMobile ? '0.75rem' : '0.8rem',
            lineHeight: '1.2'
          }}>
            {title}
          </h4>
          <p style={{ 
            color: '#718096',
            margin: 0,
            lineHeight: '1.3',
            fontSize: isMobile ? '0.65rem' : '0.7rem',
            display: isMobile ? 'none' : 'block'
          }}>
            {description}
          </p>
        </div>
      </div>
    </a>
  </Link>
)

export default function QuickActions({ isMobile }) {
  const actions = [
    {
      icon: "📚",
      title: "Pesan Koleksi",
      description: "Akses buku langka untuk penelitian",
      link: "/layanan"
    },
    {
      icon: "🕒", 
      title: "Ruang Baca",
      description: "Pesan ruang baca khusus",
      link: "/layanan"
    },
    {
      icon: "🔍",
      title: "Jelajah Koleksi", 
      description: "Telusuri koleksi buku langka",
      link: "/koleksi"
    },
    {
      icon: "💬",
      title: "Kritik & Saran",
      description: "Bantu kami meningkatkan layanan", 
      link: "/kritik-saran"
    }
  ]

  return (
    <section style={{ 
      padding: isMobile ? '1.5rem 1rem' : '2rem 2rem',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h3 style={{ 
          textAlign: 'center',
          color: '#2d3748',
          marginBottom: isMobile ? '1rem' : '1.5rem',
          fontSize: isMobile ? '1rem' : '1.25rem',
          fontWeight: '600'
        }}>
          Akses Cepat Layanan
        </h3>
        
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: isMobile ? '0.5rem' : '1rem',
          alignItems: 'stretch',
          flexWrap: 'wrap'
        }}>
          {actions.map((action, index) => (
            <ActionItem 
              key={index}
              icon={action.icon}
              title={action.title}
              description={action.description}
              link={action.link}
              isMobile={isMobile}
            />
          ))}
        </div>

        {/* Mobile description */}
        {isMobile && (
          <p style={{
            textAlign: 'center',
            color: '#718096',
            fontSize: '0.7rem',
            marginTop: '0.75rem',
            lineHeight: '1.4'
          }}>
            Akses layanan pesan koleksi, ruang baca, jelajah koleksi, dan berikan masukan
          </p>
        )}
      </div>
    </section>
  )
}
