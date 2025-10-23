// components/Footer.js
export default function Footer({ isMobile }) {
  return (
    <footer style={{
      backgroundColor: '#2d3748',
      color: 'white',
      padding: isMobile ? '2rem 1rem' : '3rem 2rem',
      marginTop: '4rem'
    }}>
      <div style={{ 
        maxWidth: '1200px', 
        margin: '0 auto',
        textAlign: 'center'
      }}>
        <p style={{ margin: 0, fontSize: isMobile ? '0.9rem' : '1rem' }}>
          &copy; 2025 Layanan Koleksi Buku Langka - Perpustakaan Nasional RI
        </p>
        <p style={{ margin: '0.5rem 0 0 0', fontSize: isMobile ? '0.8rem' : '0.9rem', opacity: 0.7 }}>
          Melestarikan warisan literasi Indonesia untuk generasi mendatang
        </p>
        {/* Version Badge */}
        <div style={{
          marginTop: '1rem',
          display: 'inline-block',
          backgroundColor: '#4a5568',
          color: 'white',
          padding: '0.25rem 0.75rem',
          borderRadius: '12px',
          fontSize: isMobile ? '0.7rem' : '0.8rem',
          fontWeight: '500'
        }}>
          Beta v.01
        </div>
      </div>
    </footer>
  )
}
