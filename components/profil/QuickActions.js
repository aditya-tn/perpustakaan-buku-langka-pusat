// components/profil/QuickActions.js
import Link from 'next/link'

const ActionCard = ({ icon, title, description, link, onClick }) => (
  <div style={{
    backgroundColor: 'white',
    padding: '2rem',
    borderRadius: '12px',
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'all 0.3s ease',
    cursor: 'pointer',
    border: '1px solid #e2e8f0'
  }}
  onClick={onClick}
  onMouseEnter={(e) => {
    e.target.style.transform = 'translateY(-4px)'
    e.target.style.boxShadow = '0 8px 25px rgba(0,0,0,0.15)'
  }}
  onMouseLeave={(e) => {
    e.target.style.transform = 'translateY(0)'
    e.target.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)'
  }}
  >
    <div style={{ fontSize: '2.5rem', marginBottom: '1rem' }}>
      {icon}
    </div>
    <h4 style={{ 
      color: '#2d3748',
      marginBottom: '0.75rem',
      fontWeight: '600'
    }}>
      {title}
    </h4>
    <p style={{ 
      color: '#718096',
      margin: 0,
      lineHeight: '1.5'
    }}>
      {description}
    </p>
  </div>
)

export default function QuickActions() {
  return (
    <section style={{ 
      padding: '3rem 2rem',
      backgroundColor: '#f7fafc',
      borderTop: '1px solid #e2e8f0'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        <h3 style={{ 
          textAlign: 'center',
          color: '#2d3748',
          marginBottom: '2rem',
          fontSize: '1.75rem',
          fontWeight: '700'
        }}>
          Akses Cepat Layanan
        </h3>
        
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: '2rem'
        }}>
          <Link href="/layanan/pemesanan" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="📚"
                title="Pesan Koleksi"
                description="Akses buku langka untuk keperluan penelitian dan studi"
              />
            </a>
          </Link>
          
          <Link href="/kritik-saran" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="💬"
                title="Kritik & Saran" 
                description="Bantu kami meningkatkan kualitas layanan koleksi langka"
              />
            </a>
          </Link>
          
          <Link href="/koleksi" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="🔍"
                title="Jelajah Koleksi"
                description="Telusuri seluruh koleksi buku langka yang tersedia"
              />
            </a>
          </Link>
          
          <Link href="/layanan/ruang-baca" passHref>
            <a style={{ textDecoration: 'none' }}>
              <ActionCard 
                icon="🕒"
                title="Ruang Baca Khusus"
                description="Pesan ruang baca khusus untuk penelitian intensif"
              />
            </a>
          </Link>
        </div>
      </div>
    </section>
  )
}
