// components/profil/HeroProfil.js - OPTIMIZED
export default function HeroProfil({ isMobile }) {
  return (
    <section style={{
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      color: 'white',
      padding: isMobile ? '3rem 1rem' : '4rem 2rem',
      textAlign: 'center',
      position: 'relative',
      overflow: 'hidden'
    }}>
      <div style={{ 
        maxWidth: '800px', 
        margin: '0 auto',
        position: 'relative',
        zIndex: 2
      }}>
        <h1 style={{ 
          fontSize: isMobile ? '2rem' : '2.5rem',
          fontWeight: '800', 
          marginBottom: '1rem',
          lineHeight: '1.2',
          textShadow: '0 2px 4px rgba(0,0,0,0.3)'
        }}>
          Profil Layanan Koleksi Buku Langka
        </h1>
        <p style={{ 
          fontSize: isMobile ? '1rem' : '1.2rem',
          opacity: 0.95,
          lineHeight: '1.6',
          marginBottom: '0',
          fontWeight: '300'
        }}>
          Menjaga 85.000+ warisan literasi Nusantara untuk generasi mendatang
        </p>
      </div>
      
      {/* Background decoration */}
      <div style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'radial-gradient(circle at 30% 20%, rgba(255,255,255,0.1) 0%, transparent 50%)',
        zIndex: 1
      }} />
    </section>
  )
}
