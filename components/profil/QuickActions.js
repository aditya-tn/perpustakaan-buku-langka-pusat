// components/profil/QuickActions.js - OPTIMIZED
import Link from 'next/link'

const ActionCard = ({ icon, title, description, link, onClick, isMobile }) => (
  <div style={{
    backgroundColor: 'white',
    padding: isMobile ? '1.5rem' : '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.08)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid #e2e8f0',
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'space-between'
  }}
  onClick={onClick}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-4px)'
    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.12)'
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)'
    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.08)'
  }}
  >
    <div>
      <div style={{ 
        fontSize: isMobile ? '2rem' : '2.5rem', 
        marginBottom: '1rem' 
      }}>
        {icon}
      </div>
      <h4 style={{ 
        color: '#2d3748',
        marginBottom: '0.75rem',
        fontWeight: '600',
        fontSize: isMobile ? '1rem' : '1.1rem',
        lineHeight: '1.3'
      }}>
        {title}
      </h4>
      <p style={{ 
        color: '#718096',
        margin: 0,
        lineHeight: '1.5',
        fontSize: isMobile ? '0.8rem' : '0.9rem'
      }}>
        {description}
      </p>
    </div>
  </div>
)

export default function QuickActions({ isMobile }) {
  return (
    <section style={{ 
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      backgroundColor: '#f8fafc',
      borderTop: '1px solid #e2e8f0'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h3 style={{ 
          textAlign: 'center',
          color: '#2d3748',
          marginBottom: isMobile ? '1.5rem' : '2rem',
          fontSize: isMobile ? '1.25rem' : '1.75rem',
          fontWeight: '700'
        }}>
          Akses Cepat Layanan
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: isMobile ? '1.5rem' : '2rem'
        }}>
          <Link href="/layanan" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="📚"
                title="Pesan Koleksi"
                description="Akses buku langka untuk keperluan penelitian dan studi"
                isMobile={isMobile}
              />
            </a>
          </Link>
          
          <Link href="/layanan" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="🕒"
                title="Ruang Baca Khusus"
                description="Pesan ruang baca khusus untuk penelitian intensif"
                isMobile={isMobile}
              />
            </a>
          </Link>
          
          <Link href="/koleksi" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="🔍"
                title="Jelajah Koleksi"
                description="Telusuri seluruh koleksi buku langka yang tersedia"
                isMobile={isMobile}
              />
            </a>
          </Link>
          
          <Link href="/kritik-saran" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="💬"
                title="Kritik & Saran" 
                description="Bantu kami meningkatkan kualitas layanan koleksi langka"
                isMobile={isMobile}
              />
            </a>
          </Link>
        </div>
      </div>
    </section>
  )
}
